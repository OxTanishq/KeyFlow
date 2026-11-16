import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateLessonStars,
  calculateWpmMetrics,
  computeTypingMetrics,
  createTypingState,
  evaluateLessonPass,
  getActiveElapsedSeconds,
  pauseTypingState,
  processTypingInput,
  resumeTypingState,
} from './typingEngine';
import { getTargetKeyGuide } from './keyboardLayout';
import {
  LESSONS,
  getLessonUnlockStates,
  mergeLessonProgress,
  type LessonProgressRecord,
} from './lessons';
import { generatePracticeText, sanitizeCustomText } from './practiceGenerator';
import { calculateStreakDays, computeProgressSummary, getTopMistypedKeys } from './analytics';

test('typing engine tracks correct, incorrect, backspace, and corrected states deterministically', () => {
  let state = createTypingState('ask');
  assert.equal(state.entries[0].status, 'current');
  assert.equal(state.entries[1].status, 'untyped');

  // First key 'a' at t=1000ms
  state = processTypingInput(state, 'a', 1000);
  assert.equal(state.entries[0].status, 'correct');
  assert.equal(state.entries[1].status, 'current');
  assert.equal(state.startedAtMs, 1000);

  // Mistype 'x' instead of 's' at t=1500ms
  state = processTypingInput(state, 'x', 1500);
  assert.equal(state.entries[1].status, 'incorrect');
  assert.equal(state.entries[1].hadError, true);
  assert.equal(state.keyStats['s'].errors, 1);

  // Backspace at t=1800ms
  state = processTypingInput(state, 'Backspace', 1800);
  assert.equal(state.cursor, 1);
  assert.equal(state.entries[1].status, 'current');

  // Re-type 's' accurately -> marks 'corrected'
  state = processTypingInput(state, 's', 2100);
  assert.equal(state.entries[1].status, 'corrected');
  assert.equal(state.correctedCount, 1);

  // Complete word with 'k' at t=3000ms
  state = processTypingInput(state, 'k', 3000);
  assert.equal(state.isCompleted, true);
  assert.equal(state.completedAtMs, 3000);
  assert.equal(state.totalKeystrokes, 4);
  assert.equal(state.correctKeystrokes, 3);

  const metrics = computeTypingMetrics(state, 3000);
  assert.equal(metrics.accuracy, 75);
  assert.equal(metrics.uncorrectedErrors, 0);
  assert.equal(metrics.correctedMistakes, 1);
});

test('typing engine guards WPM against division by zero and <1.5s spikes, and accounts for pauses', () => {
  const early = calculateWpmMetrics({
    totalKeystrokes: 5,
    correctKeystrokes: 5,
    uncorrectedErrors: 0,
    correctedMistakes: 0,
    elapsedSeconds: 0.4,
  });
  assert.equal(early.rawWpm, 0);
  assert.equal(early.netWpm, 0);

  // 300 keystrokes in 60 seconds = 60 raw WPM, 5 uncorrected errors = 55 net WPM
  const steady = calculateWpmMetrics({
    totalKeystrokes: 300,
    correctKeystrokes: 295,
    uncorrectedErrors: 5,
    correctedMistakes: 0,
    elapsedSeconds: 60,
  });
  assert.equal(steady.rawWpm, 60);
  assert.equal(steady.netWpm, 55);
  assert.equal(steady.accuracy, 98.3);

  // Pause & resume timing check
  let s = createTypingState('ab');
  s = processTypingInput(s, 'a', 1000);
  s = pauseTypingState(s, 3000); // 2s active
  s = resumeTypingState(s, 13000); // paused for 10s
  const elapsed = getActiveElapsedSeconds(s, 15000); // +2s active
  assert.equal(elapsed, 4);
});

test('opposite-hand Shift rule maps left-hand capitals to ShiftRight and right-hand capitals to ShiftLeft', () => {
  const capA = getTargetKeyGuide('A');
  assert.ok(capA);
  assert.equal(capA.needsShift, true);
  assert.equal(capA.shiftKeyId, 'ShiftRight');
  assert.equal(capA.finger.id, 'left-pinky');

  const capJ = getTargetKeyGuide('J');
  assert.ok(capJ);
  assert.equal(capJ.needsShift, true);
  assert.equal(capJ.shiftKeyId, 'ShiftLeft');
  assert.equal(capJ.finger.id, 'right-index');
});

test('star rating and lesson unlocking rules obey curriculum specification', () => {
  assert.equal(calculateLessonStars(69.9), 0);
  assert.equal(calculateLessonStars(70), 1);
  assert.equal(calculateLessonStars(84.9), 1);
  assert.equal(calculateLessonStars(85), 2);
  assert.equal(calculateLessonStars(94.9), 2);
  assert.equal(calculateLessonStars(95), 3);

  // Passing and stars evaluated independently
  const failAt80 = evaluateLessonPass(80, 85, false);
  assert.equal(failAt80.passed, false);
  assert.equal(failAt80.stars, 1);

  const l1 = evaluateLessonPass(0, 0, true);
  assert.equal(l1.passed, true);
  assert.equal(l1.stars, 3);

  const states0 = getLessonUnlockStates({});
  assert.equal(states0[LESSONS[0].id], 'available');
  assert.equal(states0[LESSONS[1].id], 'locked');

  const states1 = getLessonUnlockStates({
    'meet-the-keyboard': {
      lessonId: 'meet-the-keyboard',
      bestAccuracy: 100,
      bestWpm: 20,
      stars: 3,
      completed: true,
      attempts: 1,
      updatedAt: '2026-11-16T00:00:00.000Z',
    },
  });
  assert.equal(states1['meet-the-keyboard'], 'completed');
  assert.equal(states1['home-row'], 'available');
  assert.equal(states1['left-hand'], 'locked');
});

test('guest progress merge preserves best stars, accuracy, WPM, and completion without overwriting', () => {
  const local: Record<string, LessonProgressRecord> = {
    'home-row': {
      lessonId: 'home-row',
      bestAccuracy: 96,
      bestWpm: 42,
      stars: 3,
      completed: true,
      attempts: 2,
      updatedAt: '2026-11-16T02:00:00.000Z',
    },
  };
  const remote: Record<string, LessonProgressRecord> = {
    'home-row': {
      lessonId: 'home-row',
      bestAccuracy: 88,
      bestWpm: 48,
      stars: 2,
      completed: true,
      attempts: 3,
      updatedAt: '2026-11-16T01:00:00.000Z',
    },
  };

  const merged = mergeLessonProgress(local, remote);
  assert.equal(merged['home-row'].bestAccuracy, 96);
  assert.equal(merged['home-row'].bestWpm, 48);
  assert.equal(merged['home-row'].stars, 3);
  assert.equal(merged['home-row'].attempts, 3);
});

test('weak-key practice emphasizes targeted mistyped keys and sanitizes custom text', () => {
  const text = generatePracticeText({
    category: 'weak-keys',
    wordCount: 20,
    difficulty: 'intermediate',
    weakKeys: ['z', 'q'],
    seed: 42,
  });
  const words = text.split(' ');
  assert.equal(words.length, 20);
  const containsTarget = words.filter((w) => w.includes('z') || w.includes('q')).length;
  assert.ok(containsTarget >= 15);

  const cleaned = sanitizeCustomText('  hello\x00   world \n  <script>  ');
  assert.equal(cleaned, 'hello world <script>');
});

test('analytics computes streaks, top mistyped keys, and summary totals accurately', () => {
  const ref = new Date('2026-11-16T12:00:00Z');
  const streak = calculateStreakDays(
    ['2026-11-16T10:00:00Z', '2026-11-15T18:00:00Z', '2026-11-14T08:00:00Z'],
    ref
  );
  assert.equal(streak, 3);

  const topKeys = getTopMistypedKeys({
    q: { keyIdentifier: 'q', attempts: 10, errors: 4, updatedAt: '2026-11-16T00:00:00Z' },
    a: { keyIdentifier: 'a', attempts: 100, errors: 2, updatedAt: '2026-11-16T00:00:00Z' },
  });
  assert.equal(topKeys[0].key, 'Q');
  assert.equal(topKeys[0].errorRate, 40);

  const summary = computeProgressSummary(
    [
      {
        id: '1',
        mode: 'test',
        category: '60s',
        durationSeconds: 60,
        rawWpm: 65,
        netWpm: 62,
        accuracy: 96,
        correctCharacters: 300,
        incorrectCharacters: 12,
        correctedCharacters: 2,
        completedAt: '2026-11-16T10:00:00Z',
      },
    ],
    {}
  );
  assert.equal(summary.bestWpm, 62);
  assert.equal(summary.totalTestsTaken, 1);
  assert.equal(summary.totalPracticeSeconds, 60);
});
