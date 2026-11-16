import { normalizeKeyStatisticId } from './keyboardLayout';

export type CharStatus = 'untyped' | 'current' | 'correct' | 'incorrect' | 'corrected';

export interface CharEntry {
  expected: string;
  typed: string | null;
  hadError: boolean;
  status: CharStatus;
}

export interface KeyErrorStat {
  attempts: number;
  errors: number;
}

export interface TypingState {
  targetText: string;
  entries: CharEntry[];
  cursor: number;
  totalKeystrokes: number;
  correctKeystrokes: number;
  incorrectKeystrokes: number;
  correctedCount: number;
  startedAtMs: number | null;
  pausedAccumulatedMs: number;
  pauseStartedAtMs: number | null;
  completedAtMs: number | null;
  isCompleted: boolean;
  keyStats: Record<string, KeyErrorStat>;
}

export interface TypingMetrics {
  elapsedSeconds: number;
  rawWpm: number;
  netWpm: number;
  accuracy: number;
  progressPercent: number;
  correctChars: number;
  uncorrectedErrors: number;
  correctedMistakes: number;
  totalAttempted: number;
}

/**
 * Minimum elapsed active seconds before WPM is stabilized.
 * Prevents artificially inflated WPM spikes during the first 1.5 seconds.
 */
export const MIN_ELAPSED_FOR_WPM_SECONDS = 1.5;

export function createTypingState(targetText: string): TypingState {
  const entries: CharEntry[] = Array.from(targetText).map((ch, idx) => ({
    expected: ch,
    typed: null,
    hadError: false,
    status: idx === 0 ? 'current' : 'untyped',
  }));

  return {
    targetText,
    entries,
    cursor: 0,
    totalKeystrokes: 0,
    correctKeystrokes: 0,
    incorrectKeystrokes: 0,
    correctedCount: 0,
    startedAtMs: null,
    pausedAccumulatedMs: 0,
    pauseStartedAtMs: null,
    completedAtMs: null,
    isCompleted: targetText.length === 0,
    keyStats: {},
  };
}

export function pauseTypingState(state: TypingState, nowMs: number): TypingState {
  if (state.startedAtMs === null || state.isCompleted || state.pauseStartedAtMs !== null) {
    return state;
  }
  return {
    ...state,
    pauseStartedAtMs: nowMs,
  };
}

export function resumeTypingState(state: TypingState, nowMs: number): TypingState {
  if (state.pauseStartedAtMs === null) {
    return state;
  }
  const pausedDelta = Math.max(0, nowMs - state.pauseStartedAtMs);
  return {
    ...state,
    pausedAccumulatedMs: state.pausedAccumulatedMs + pausedDelta,
    pauseStartedAtMs: null,
  };
}

export function processTypingInput(
  state: TypingState,
  key: string,
  nowMs: number
): TypingState {
  if (state.isCompleted) {
    return state;
  }

  // Resume automatically if user types while paused
  const activeState = state.pauseStartedAtMs !== null ? resumeTypingState(state, nowMs) : state;

  if (key === 'Backspace') {
    if (activeState.cursor === 0) {
      return activeState;
    }
    const prevIdx = activeState.cursor - 1;
    const nextEntries = activeState.entries.slice();
    if (activeState.cursor < nextEntries.length) {
      nextEntries[activeState.cursor] = {
        ...nextEntries[activeState.cursor],
        status: 'untyped',
      };
    }
    nextEntries[prevIdx] = {
      ...nextEntries[prevIdx],
      typed: null,
      status: 'current',
    };
    return {
      ...activeState,
      entries: nextEntries,
      cursor: prevIdx,
    };
  }

  // Only single printable characters
  if (key.length !== 1) {
    return activeState;
  }

  const idx = activeState.cursor;
  if (idx >= activeState.entries.length) {
    return activeState;
  }

  const startedAtMs = activeState.startedAtMs ?? nowMs;
  const targetEntry = activeState.entries[idx];
  const isCorrect = key === targetEntry.expected;
  const nextEntries = activeState.entries.slice();

  let status: CharStatus;
  let correctedDelta = 0;
  if (isCorrect) {
    if (targetEntry.hadError) {
      status = 'corrected';
      correctedDelta = 1;
    } else {
      status = 'correct';
    }
  } else {
    status = 'incorrect';
  }

  nextEntries[idx] = {
    ...targetEntry,
    typed: key,
    hadError: targetEntry.hadError || !isCorrect,
    status,
  };

  const nextCursor = idx + 1;
  const isCompleted = nextCursor >= nextEntries.length;

  if (!isCompleted) {
    nextEntries[nextCursor] = {
      ...nextEntries[nextCursor],
      status: 'current',
    };
  }

  const statKey = normalizeKeyStatisticId(targetEntry.expected);
  const existingStat = activeState.keyStats[statKey] ?? { attempts: 0, errors: 0 };
  const nextKeyStats = {
    ...activeState.keyStats,
    [statKey]: {
      attempts: existingStat.attempts + 1,
      errors: existingStat.errors + (isCorrect ? 0 : 1),
    },
  };

  return {
    ...activeState,
    entries: nextEntries,
    cursor: nextCursor,
    totalKeystrokes: activeState.totalKeystrokes + 1,
    correctKeystrokes: activeState.correctKeystrokes + (isCorrect ? 1 : 0),
    incorrectKeystrokes: activeState.incorrectKeystrokes + (isCorrect ? 0 : 1),
    correctedCount: activeState.correctedCount + correctedDelta,
    startedAtMs,
    completedAtMs: isCompleted ? nowMs : null,
    isCompleted,
    keyStats: nextKeyStats,
  };
}

export function getActiveElapsedSeconds(state: TypingState, nowMs: number): number {
  if (state.startedAtMs === null) {
    return 0;
  }
  const endMs = state.completedAtMs ?? (state.pauseStartedAtMs ?? nowMs);
  const activeMs = Math.max(0, endMs - state.startedAtMs - state.pausedAccumulatedMs);
  return activeMs / 1000;
}

/**
 * Documented WPM & Accuracy Formulas:
 * - Raw WPM = (totalKeystrokes / 5) / elapsedMinutes
 * - Net WPM = max(0, Raw WPM - (uncorrectedErrors / elapsedMinutes))
 * - Accuracy = (correctKeystrokes / totalKeystrokes) * 100
 * Guarded against division by zero and early <1.5s spikes.
 */
export function calculateWpmMetrics(params: {
  totalKeystrokes: number;
  correctKeystrokes: number;
  uncorrectedErrors: number;
  correctedMistakes: number;
  elapsedSeconds: number;
  cursor?: number;
  targetLength?: number;
}): TypingMetrics {
  const {
    totalKeystrokes,
    correctKeystrokes,
    uncorrectedErrors,
    correctedMistakes,
    elapsedSeconds,
    cursor = 0,
    targetLength = 0,
  } = params;

  const accuracy =
    totalKeystrokes > 0
      ? Math.round((correctKeystrokes / totalKeystrokes) * 1000) / 10
      : 100;

  const progressPercent =
    targetLength > 0 ? Math.min(100, Math.round((cursor / targetLength) * 100)) : 0;

  if (totalKeystrokes === 0 || elapsedSeconds < MIN_ELAPSED_FOR_WPM_SECONDS) {
    return {
      elapsedSeconds: Math.round(elapsedSeconds * 10) / 10,
      rawWpm: 0,
      netWpm: 0,
      accuracy,
      progressPercent,
      correctChars: correctKeystrokes,
      uncorrectedErrors,
      correctedMistakes,
      totalAttempted: totalKeystrokes,
    };
  }

  const elapsedMinutes = elapsedSeconds / 60;
  const rawWpm = Math.round((totalKeystrokes / 5) / elapsedMinutes);
  const netWpm = Math.max(0, Math.round(rawWpm - uncorrectedErrors / elapsedMinutes));

  return {
    elapsedSeconds: Math.round(elapsedSeconds * 10) / 10,
    rawWpm,
    netWpm,
    accuracy,
    progressPercent,
    correctChars: correctKeystrokes,
    uncorrectedErrors,
    correctedMistakes,
    totalAttempted: totalKeystrokes,
  };
}

export function computeTypingMetrics(state: TypingState, nowMs: number): TypingMetrics {
  const elapsedSeconds = getActiveElapsedSeconds(state, nowMs);
  const uncorrectedErrors = state.entries.filter(
    (e) => e.status === 'incorrect'
  ).length;

  return calculateWpmMetrics({
    totalKeystrokes: state.totalKeystrokes,
    correctKeystrokes: state.correctKeystrokes,
    uncorrectedErrors,
    correctedMistakes: state.correctedCount,
    elapsedSeconds,
    cursor: state.cursor,
    targetLength: state.targetText.length,
  });
}

export function calculateLessonStars(accuracy: number, isExploratory = false): number {
  if (isExploratory) return 3;
  if (accuracy >= 95) return 3;
  if (accuracy >= 85) return 2;
  if (accuracy >= 70) return 1;
  return 0;
}

export function evaluateLessonPass(
  accuracy: number,
  requiredAccuracy: number,
  isExploratory = false
): { passed: boolean; stars: number } {
  const stars = calculateLessonStars(accuracy, isExploratory);
  if (isExploratory) {
    return { passed: true, stars };
  }
  return {
    passed: accuracy >= requiredAccuracy,
    stars,
  };
}
