import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  RotateCcw,
  Star,
  XCircle,
} from 'lucide-react';
import { LESSONS, getLessonById, getLessonUnlockStates } from '../core/lessons';
import { evaluateLessonPass } from '../core/typingEngine';
import { findKeyByEvent, FINGER_META, type KeyDefinition } from '../core/keyboardLayout';
import { soundEngine } from '../core/soundEngine';
import { useAppStore } from '../store/useAppStore';
import { TypingWorkspace, type TypingCompletePayload } from '../components/TypingWorkspace';
import { VirtualKeyboard } from '../components/VirtualKeyboard';
import { HandDiagram } from '../components/HandDiagram';

export const LessonDetailPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { lessonProgress, preferences, recordLessonAttempt } = useAppStore();

  const lesson = lessonId ? getLessonById(lessonId) : undefined;
  const unlockStates = getLessonUnlockStates(lessonProgress);

  const [sessionKey, setSessionKey] = useState(0);
  const [completionResult, setCompletionResult] = useState<{
    wpm: number;
    rawWpm: number;
    accuracy: number;
    stars: number;
    passed: boolean;
  } | null>(null);

  // Exploratory state for Lesson 1
  const [pressedCodes, setPressedCodes] = useState<Set<string>>(() => new Set());
  const [exploredKeys, setExploredKeys] = useState<Set<string>>(() => new Set());
  const [lastExploredKey, setLastExploredKey] = useState<KeyDefinition | null>(null);

  useEffect(() => {
    setCompletionResult(null);
    setSessionKey((k) => k + 1);
  }, [lessonId]);

  useEffect(() => {
    if (!lesson?.isExploratory) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const keyDef = findKeyByEvent(e.code, e.key);
      if (keyDef) {
        if (e.key === ' ') e.preventDefault();
        setPressedCodes((prev) => new Set(prev).add(keyDef.id));
        setExploredKeys((prev) => new Set(prev).add(keyDef.id));
        setLastExploredKey(keyDef);
        soundEngine.playKeyClick(preferences.soundEnabled, true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const keyDef = findKeyByEvent(e.code, e.key);
      if (keyDef) {
        setPressedCodes((prev) => {
          const next = new Set(prev);
          next.delete(keyDef.id);
          return next;
        });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [lesson?.isExploratory, preferences.soundEnabled]);

  if (!lesson) {
    return (
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Lesson not found</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          The requested lesson does not exist in the KeyFlow curriculum.
        </p>
        <Link
          to="/learn"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white"
        >
          Back to Curriculum
        </Link>
      </div>
    );
  }

  const isLocked = unlockStates[lesson.id] === 'locked';
  if (isLocked) {
    return (
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Lesson {lesson.sequenceNumber}: {lesson.title} is locked
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Pass the previous lesson to unlock this step in your learning path.
        </p>
        <Link
          to="/learn"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-semibold text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Learning Path</span>
        </Link>
      </div>
    );
  }

  const nextLesson = LESSONS.find((l) => l.sequenceNumber === lesson.sequenceNumber + 1);

  const handleLessonComplete = async (payload: TypingCompletePayload) => {
    const { passed, stars } = evaluateLessonPass(
      payload.metrics.accuracy,
      lesson.requiredAccuracy,
      lesson.isExploratory
    );

    setCompletionResult({
      wpm: payload.metrics.netWpm,
      rawWpm: payload.metrics.rawWpm,
      accuracy: payload.metrics.accuracy,
      stars,
      passed,
    });

    if (passed && typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      confetti({ particleCount: 55, spread: 60, origin: { y: 0.7 } });
    }

    await recordLessonAttempt({
      lessonId: lesson.id,
      accuracy: payload.metrics.accuracy,
      wpm: payload.metrics.netWpm,
      stars,
      completed: passed,
      durationSeconds: Math.max(1, payload.metrics.elapsedSeconds),
      rawWpm: payload.metrics.rawWpm,
      correctCharacters: payload.metrics.correctChars,
      incorrectCharacters: payload.state.incorrectKeystrokes,
      correctedCharacters: payload.metrics.correctedMistakes,
      keyStats: payload.state.keyStats,
    });
  };

  const handleCompleteExploratory = async () => {
    soundEngine.playSuccessChime(preferences.soundEnabled);
    setCompletionResult({
      wpm: 0,
      rawWpm: 0,
      accuracy: 100,
      stars: 3,
      passed: true,
    });
    await recordLessonAttempt({
      lessonId: lesson.id,
      accuracy: 100,
      wpm: 0,
      stars: 3,
      completed: true,
      durationSeconds: 15,
      rawWpm: 0,
      correctCharacters: Math.max(8, exploredKeys.size),
      incorrectCharacters: 0,
      correctedCharacters: 0,
      keyStats: {},
    });
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/learn"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Curriculum</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
            Lesson {lesson.sequenceNumber}: {lesson.title}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">{lesson.description}</p>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2.5 text-xs text-[var(--text-secondary)] space-y-0.5">
          <div>
            Target:{' '}
            <strong className="text-[var(--text-primary)]">
              {lesson.isExploratory ? 'Explore freely (no timer)' : `${lesson.requiredAccuracy}% accuracy to pass`}
            </strong>
          </div>
          <div>Keys: {lesson.coveredKeys.join(' · ')}</div>
        </div>
      </div>

      {/* Technique Tip */}
      <div className="flex items-start gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--text-secondary)]">
        <Lightbulb className="w-4 h-4 text-[var(--accent-primary)] shrink-0 mt-0.5" />
        <span>{lesson.tip}</span>
      </div>

      {/* Completion Summary Card */}
      {completionResult && (
        <div
          data-testid="lesson-completion-card"
          className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {completionResult.passed ? (
                <CheckCircle2 className="w-8 h-8 text-[var(--status-success)] shrink-0" />
              ) : (
                <XCircle className="w-8 h-8 text-[var(--status-error)] shrink-0" />
              )}
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  {completionResult.passed
                    ? 'Lesson Completed!'
                    : `Keep Practicing — Need ${lesson.requiredAccuracy}% to Pass`}
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  {completionResult.passed
                    ? nextLesson
                      ? `Lesson ${nextLesson.sequenceNumber} (${nextLesson.title}) is now unlocked.`
                      : 'You completed the entire 10-lesson curriculum!'
                    : 'Focus on accuracy first, then retry the lesson.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5" aria-label={`Earned ${completionResult.stars} stars`}>
              {[1, 2, 3].map((n) => (
                <Star
                  key={n}
                  className={`w-6 h-6 ${
                    completionResult.stars >= n
                      ? 'text-[var(--status-warning)] fill-[var(--status-warning)]'
                      : 'text-[var(--border-subtle)]'
                  }`}
                />
              ))}
            </div>
          </div>

          {!lesson.isExploratory && (
            <div className="grid grid-cols-3 gap-4 tabular-nums">
              <div className="rounded-xl bg-[var(--bg-canvas)] p-4">
                <div className="text-xs text-[var(--text-secondary)]">Net WPM</div>
                <div className="text-2xl font-bold font-mono-typing text-[var(--accent-primary)]">
                  {completionResult.wpm}
                </div>
              </div>
              <div className="rounded-xl bg-[var(--bg-canvas)] p-4">
                <div className="text-xs text-[var(--text-secondary)]">Accuracy</div>
                <div className="text-2xl font-bold font-mono-typing text-[var(--text-primary)]">
                  {completionResult.accuracy}%
                </div>
              </div>
              <div className="rounded-xl bg-[var(--bg-canvas)] p-4">
                <div className="text-xs text-[var(--text-secondary)]">Stars Earned</div>
                <div className="text-2xl font-bold font-mono-typing text-[var(--text-primary)]">
                  {completionResult.stars} / 3
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setCompletionResult(null);
                setSessionKey((k) => k + 1);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]/60"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry Lesson</span>
            </button>

            {completionResult.passed && nextLesson && (
              <button
                type="button"
                onClick={() => navigate(`/learn/${nextLesson.id}`)}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95"
              >
                <span>Next Lesson: {nextLesson.title}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <Link
              to="/learn"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <span>All Lessons</span>
            </Link>
          </div>
        </div>
      )}

      {/* Lesson 1 Exploratory Mode vs Standard Typing Exercise */}
      {lesson.isExploratory && !completionResult ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  Interactive Finger Discovery
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  Press any key on your physical keyboard (or click keys below) to see which finger is responsible for it. No timer, no penalties.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCompleteExploratory}
                data-testid="complete-lesson-1"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95 whitespace-nowrap"
              >
                <span>Complete Lesson 1</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center rounded-xl bg-[var(--bg-canvas)] p-4">
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-[var(--text-secondary)]">
                  Keys explored: {exploredKeys.size}
                </div>
                {lastExploredKey ? (
                  <div className="space-y-1">
                    <div className="text-2xl font-bold font-mono-typing text-[var(--text-primary)]">
                      Key: {lastExploredKey.label}
                    </div>
                    <div
                      className="text-sm font-semibold"
                      style={{ color: FINGER_META[lastExploredKey.finger].colorHex }}
                    >
                      Use {FINGER_META[lastExploredKey.finger].label}
                      {lastExploredKey.isHomeRow ? ' (Home Row Anchor)' : ''}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-[var(--text-secondary)]">
                    Place your left fingers on A S D F and right fingers on J K L ; then press any key.
                  </div>
                )}
              </div>
              <HandDiagram activeFinger={lastExploredKey?.finger ?? null} />
            </div>

            <VirtualKeyboard
              mode="lesson"
              activePressedCodes={pressedCodes}
              highlightedKeys={lesson.coveredKeys}
              onKeySelect={(k) => {
                setLastExploredKey(k);
                setExploredKeys((prev) => new Set(prev).add(k.id));
                soundEngine.playKeyClick(preferences.soundEnabled, true);
                setPressedCodes(new Set([k.id]));
                window.setTimeout(() => setPressedCodes(new Set()), 150);
              }}
            />
          </div>
        </div>
      ) : (
        !completionResult && (
          <TypingWorkspace
            key={sessionKey}
            text={lesson.content}
            mode="lesson"
            highlightedKeys={lesson.coveredKeys}
            showHandDiagram
            onComplete={handleLessonComplete}
          />
        )
      )}
    </div>
  );
};
