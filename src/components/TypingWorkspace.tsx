import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Volume2, VolumeX, Keyboard as KeyboardIcon } from 'lucide-react';
import {
  computeTypingMetrics,
  createTypingState,
  pauseTypingState,
  processTypingInput,
  resumeTypingState,
  type TypingMetrics,
  type TypingState,
} from '../core/typingEngine';
import { findKeyByEvent, getTargetKeyGuide } from '../core/keyboardLayout';
import { soundEngine } from '../core/soundEngine';
import { useAppStore } from '../store/useAppStore';
import { VirtualKeyboard } from './VirtualKeyboard';
import { HandDiagram } from './HandDiagram';

export interface TypingCompletePayload {
  metrics: TypingMetrics;
  state: TypingState;
  timeline: Array<{ second: number; wpm: number; accuracy: number }>;
}

interface TypingWorkspaceProps {
  text: string;
  mode: 'lesson' | 'practice' | 'test';
  timeLimitSeconds?: number | null; // null = untimed (finish by typing entire passage)
  highlightedKeys?: string[];
  showKeyboardDefault?: boolean;
  showHandDiagram?: boolean;
  onComplete: (payload: TypingCompletePayload) => void;
  onRestart?: () => void;
  headerSlot?: React.ReactNode;
}

export const TypingWorkspace: React.FC<TypingWorkspaceProps> = ({
  text,
  mode,
  timeLimitSeconds = null,
  highlightedKeys = [],
  showKeyboardDefault = true,
  showHandDiagram = false,
  onComplete,
  onRestart,
  headerSlot,
}) => {
  const { preferences, updatePreferences } = useAppStore();
  const [typingState, setTypingState] = useState<TypingState>(() => createTypingState(text));
  const [isPaused, setIsPaused] = useState(false);
  const [activeCodes, setActiveCodes] = useState<Set<string>>(() => new Set());
  const [tickNow, setTickNow] = useState(() => performance.now());
  const [showKeyboard, setShowKeyboard] = useState(showKeyboardDefault && preferences.showKeyboard);

  const stateRef = useRef(typingState);
  stateRef.current = typingState;

  const completedCalledRef = useRef(false);
  const isComposingRef = useRef(false);
  const timelineRef = useRef<Array<{ second: number; wpm: number; accuracy: number }>>([]);
  const lastRecordedSecondRef = useRef(0);
  const activeCharRef = useRef<HTMLSpanElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const passageScrollRef = useRef<HTMLDivElement | null>(null);

  // Reset cleanly whenever target text changes
  useEffect(() => {
    const fresh = createTypingState(text);
    setTypingState(fresh);
    stateRef.current = fresh;
    setIsPaused(false);
    completedCalledRef.current = false;
    timelineRef.current = [];
    lastRecordedSecondRef.current = 0;
    setTickNow(performance.now());
  }, [text]);

  const metrics = useMemo(() => computeTypingMetrics(typingState, tickNow), [typingState, tickNow]);

  const remainingSeconds =
    timeLimitSeconds !== null
      ? Math.max(0, Math.ceil(timeLimitSeconds - metrics.elapsedSeconds))
      : null;

  const finalizeSession = useCallback(
    (finalState: TypingState, nowMs: number) => {
      if (completedCalledRef.current) return;
      completedCalledRef.current = true;
      const finalMetrics = computeTypingMetrics(finalState, nowMs);
      soundEngine.playSuccessChime(preferences.soundEnabled);
      onComplete({
        metrics: finalMetrics,
        state: finalState,
        timeline: timelineRef.current,
      });
    },
    [onComplete, preferences.soundEnabled]
  );

  // Timer tick while actively typing
  useEffect(() => {
    if (typingState.startedAtMs === null || typingState.isCompleted || isPaused) {
      return;
    }

    const interval = window.setInterval(() => {
      const now = performance.now();
      setTickNow(now);
      const currentMetrics = computeTypingMetrics(stateRef.current, now);
      const wholeSec = Math.floor(currentMetrics.elapsedSeconds);
      if (wholeSec > lastRecordedSecondRef.current && wholeSec >= 1) {
        lastRecordedSecondRef.current = wholeSec;
        timelineRef.current.push({
          second: wholeSec,
          wpm: currentMetrics.netWpm,
          accuracy: currentMetrics.accuracy,
        });
      }

      if (
        timeLimitSeconds !== null &&
        currentMetrics.elapsedSeconds >= timeLimitSeconds &&
        !completedCalledRef.current
      ) {
        const finalized: TypingState = {
          ...stateRef.current,
          isCompleted: true,
          completedAtMs: now,
        };
        setTypingState(finalized);
        stateRef.current = finalized;
        finalizeSession(finalized, now);
      }
    }, 100);

    return () => window.clearInterval(interval);
  }, [typingState.startedAtMs, typingState.isCompleted, isPaused, timeLimitSeconds, finalizeSession]);

  // Pause clock automatically when browser tab becomes hidden so inactive time never inflates elapsed duration
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && stateRef.current.startedAtMs !== null && !stateRef.current.isCompleted) {
        const now = performance.now();
        const paused = pauseTypingState(stateRef.current, now);
        setTypingState(paused);
        stateRef.current = paused;
        setIsPaused(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Auto-scroll active character line cleanly without half-clipped lines
  useEffect(() => {
    const el = activeCharRef.current;
    const scroller = passageScrollRef.current;
    if (!el || !scroller) return;
    const targetTop = Math.max(0, el.offsetTop - 48);
    if (Math.abs(scroller.scrollTop - targetTop) >= 24) {
      scroller.scrollTo({ top: targetTop, behavior: 'smooth' });
    }
  }, [typingState.cursor]);

  const handleTogglePause = useCallback(() => {
    const now = performance.now();
    if (isPaused) {
      const resumed = resumeTypingState(stateRef.current, now);
      setTypingState(resumed);
      stateRef.current = resumed;
      setIsPaused(false);
      setTickNow(now);
    } else if (stateRef.current.startedAtMs !== null && !stateRef.current.isCompleted) {
      const paused = pauseTypingState(stateRef.current, now);
      setTypingState(paused);
      stateRef.current = paused;
      setIsPaused(true);
      setTickNow(now);
    }
  }, [isPaused]);

  const handleRestart = useCallback(() => {
    const fresh = createTypingState(text);
    setTypingState(fresh);
    stateRef.current = fresh;
    setIsPaused(false);
    completedCalledRef.current = false;
    timelineRef.current = [];
    lastRecordedSecondRef.current = 0;
    setTickNow(performance.now());
    if (passageScrollRef.current) {
      passageScrollRef.current.scrollTop = 0;
    }
    onRestart?.();
  }, [text, onRestart]);

  // Global physical keyboard listener when workspace is active
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isComposingRef.current) return;
      // Ignore keyboard shortcuts with Ctrl/Meta/Alt
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Ignore if typing inside an unrelated input/textarea (like custom text editor)
      const activeTag = (document.activeElement as HTMLElement | null)?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') {
        return;
      }

      if (e.key === 'Escape') {
        if (stateRef.current.startedAtMs !== null && !stateRef.current.isCompleted) {
          e.preventDefault();
          handleTogglePause();
        }
        return;
      }

      const keyDef = findKeyByEvent(e.code, e.key);
      if (keyDef) {
        setActiveCodes((prev) => {
          const next = new Set(prev);
          next.add(keyDef.id);
          return next;
        });
      }

      if (e.key === ' ' || e.key === 'Backspace') {
        e.preventDefault();
      }

      if (e.key !== 'Backspace' && e.key.length !== 1) {
        return;
      }

      if (stateRef.current.isCompleted) return;
      if (isPaused) {
        setIsPaused(false);
      }

      const now = performance.now();
      const prevCursor = stateRef.current.cursor;
      const expectedChar = stateRef.current.entries[prevCursor]?.expected;
      const nextState = processTypingInput(stateRef.current, e.key, now);

      if (e.key !== 'Backspace' && expectedChar !== undefined) {
        soundEngine.playKeyClick(preferences.soundEnabled, e.key === expectedChar);
      } else if (e.key === 'Backspace') {
        soundEngine.playKeyClick(preferences.soundEnabled, true);
      }

      setTypingState(nextState);
      stateRef.current = nextState;
      setTickNow(now);

      if (nextState.isCompleted) {
        finalizeSession(nextState, now);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keyDef = findKeyByEvent(e.code, e.key);
      if (keyDef) {
        setActiveCodes((prev) => {
          if (!prev.has(keyDef.id)) return prev;
          const next = new Set(prev);
          next.delete(keyDef.id);
          return next;
        });
      }
    };

    const handleBlur = () => {
      setActiveCodes(new Set());
    };

    const handleCompositionStart = () => {
      isComposingRef.current = true;
    };
    const handleCompositionEnd = () => {
      isComposingRef.current = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('compositionstart', handleCompositionStart);
    window.addEventListener('compositionend', handleCompositionEnd);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('compositionstart', handleCompositionStart);
      window.removeEventListener('compositionend', handleCompositionEnd);
    };
  }, [isPaused, preferences.soundEnabled, finalizeSession, handleTogglePause]);

  // Group entries into word tokens (plus trailing spaces) so words never break mid-word across lines
  const tokenGroups = useMemo(() => {
    const groups: Array<{
      kind: 'word' | 'space';
      items: Array<{ entry: (typeof typingState.entries)[number]; idx: number }>;
    }> = [];
    let currentWord: Array<{ entry: (typeof typingState.entries)[number]; idx: number }> = [];

    typingState.entries.forEach((entry, idx) => {
      if (entry.expected === ' ') {
        if (currentWord.length > 0) {
          groups.push({ kind: 'word', items: currentWord });
          currentWord = [];
        }
        groups.push({ kind: 'space', items: [{ entry, idx }] });
      } else {
        currentWord.push({ entry, idx });
      }
    });
    if (currentWord.length > 0) {
      groups.push({ kind: 'word', items: currentWord });
    }
    return groups;
  }, [typingState.entries]);

  const currentTargetChar = typingState.entries[typingState.cursor]?.expected ?? null;
  const targetGuide = currentTargetChar ? getTargetKeyGuide(currentTargetChar) : null;

  const renderChar = (entry: (typeof typingState.entries)[number], idx: number) => {
    const isCurrent = entry.status === 'current';
    let charClasses = 'text-[var(--text-secondary)]/65';

    if (entry.status === 'correct') {
      charClasses = 'text-[var(--status-success)]';
    } else if (entry.status === 'corrected') {
      charClasses =
        'text-amber-600 dark:text-amber-400 underline decoration-amber-500/60 underline-offset-4';
    } else if (entry.status === 'incorrect') {
      charClasses = preferences.highlightErrors
        ? 'text-[var(--status-error)] bg-rose-500/15 rounded-xs underline decoration-[var(--status-error)] decoration-2 underline-offset-4'
        : 'text-[var(--status-error)] underline decoration-2 underline-offset-4';
    } else if (isCurrent) {
      charClasses = 'text-[var(--text-primary)] bg-[var(--accent-primary)]/12 rounded-xs';
    }

    const isSpace = entry.expected === ' ';

    return (
      <span
        key={idx}
        ref={isCurrent ? activeCharRef : undefined}
        className={`relative ${isSpace ? 'inline px-[2px]' : 'inline-block px-[1px]'} ${charClasses}`}
      >
        {isCurrent && (
          <span
            aria-hidden="true"
            className="typing-caret absolute left-0 top-1 bottom-1 w-[2px] rounded-full bg-[var(--accent-primary)]"
          />
        )}
        {isSpace ? ' ' : entry.expected}
      </span>
    );
  };

  return (
    <div ref={containerRef} className="space-y-5" data-testid="typing-workspace">
      {headerSlot}

      {/* Telemetry & Controls Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 py-3.5">
        <div className="flex flex-wrap items-center gap-6 tabular-nums">
          <div>
            <div className="text-xs font-medium text-[var(--text-secondary)]">Net WPM</div>
            <div className="text-2xl font-bold font-mono-typing text-[var(--accent-primary)]" data-testid="live-wpm">
              {metrics.netWpm}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-[var(--text-secondary)]">Accuracy</div>
            <div className="text-2xl font-bold font-mono-typing text-[var(--text-primary)]" data-testid="live-accuracy">
              {metrics.accuracy}%
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-[var(--text-secondary)]">Mistakes</div>
            <div className="text-2xl font-bold font-mono-typing text-[var(--text-primary)]" data-testid="live-mistakes">
              {typingState.incorrectKeystrokes}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-[var(--text-secondary)]">
              {remainingSeconds !== null ? 'Time Left' : 'Elapsed'}
            </div>
            <div className="text-2xl font-bold font-mono-typing text-[var(--text-primary)]">
              {remainingSeconds !== null
                ? `${remainingSeconds}s`
                : `${Math.floor(metrics.elapsedSeconds)}s`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => updatePreferences({ soundEnabled: !preferences.soundEnabled })}
            aria-label={preferences.soundEnabled ? 'Mute typing sounds' : 'Enable typing sounds'}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)]/60 whitespace-nowrap"
          >
            {preferences.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{preferences.soundEnabled ? 'Sound On' : 'Muted'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowKeyboard((s) => !s)}
            aria-label={showKeyboard ? 'Hide virtual keyboard' : 'Show virtual keyboard'}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)]/60 whitespace-nowrap"
          >
            <KeyboardIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{showKeyboard ? 'Hide Keys' : 'Show Keys'}</span>
          </button>

          {typingState.startedAtMs !== null && !typingState.isCompleted && (
            <button
              type="button"
              onClick={handleTogglePause}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)]/60 whitespace-nowrap"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRestart}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)]/60 whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full rounded-full bg-[var(--bg-elevated)] overflow-hidden">
        <div
          className="h-full bg-[var(--accent-primary)] transition-[width] duration-150 ease-out"
          style={{ width: `${metrics.progressPercent}%` }}
        />
      </div>

      {/* Main Typing Passage Box */}
      <div
        className="relative rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8"
        aria-live="off"
      >
        {isPaused && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-[var(--bg-surface)]/92 backdrop-blur-xs">
            <p className="text-lg font-semibold text-[var(--text-primary)] mb-2">Session Paused</p>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Press Escape or start typing to resume right where you left off.
            </p>
            <button
              type="button"
              onClick={handleTogglePause}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
            >
              <Play className="w-4 h-4" />
              Resume Typing
            </button>
          </div>
        )}

        <div
          ref={passageScrollRef}
          className="relative max-h-[144px] overflow-y-auto pr-2 font-mono-typing text-xl sm:text-2xl leading-[48px] tracking-wide whitespace-pre-wrap select-none"
        >
          {tokenGroups.map((group, gIdx) =>
            group.kind === 'word' ? (
              <span key={`w-${gIdx}`} className="inline-block whitespace-nowrap">
                {group.items.map(({ entry, idx }) => renderChar(entry, idx))}
              </span>
            ) : (
              <React.Fragment key={`s-${gIdx}`}>
                {group.items.map(({ entry, idx }) => renderChar(entry, idx))}
              </React.Fragment>
            )
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-3 text-xs text-[var(--text-secondary)]">
          <span>
            {typingState.startedAtMs === null
              ? 'Start typing on your physical keyboard — timer begins on your first keystroke.'
              : `${typingState.cursor} of ${typingState.entries.length} characters`}
          </span>
          {targetGuide && (
            <span>
              Next key:{' '}
              <strong className="font-mono-typing text-[var(--text-primary)]">
                {currentTargetChar === ' ' ? 'Space' : currentTargetChar}
              </strong>{' '}
              · {targetGuide.finger.label}
              {targetGuide.needsShift && targetGuide.shiftFinger
                ? ` + ${targetGuide.shiftFinger.label} (Shift)`
                : ''}
            </span>
          )}
        </div>
      </div>

      {/* Virtual Keyboard + Optional Hand Diagram */}
      {showKeyboard && (
        <div className="space-y-4">
          {showHandDiagram && (
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-3 px-4">
              <HandDiagram
                activeFinger={targetGuide?.finger.id ?? null}
                secondaryFinger={targetGuide?.shiftFinger?.id ?? null}
              />
            </div>
          )}
          <VirtualKeyboard
            mode={mode === 'lesson' ? 'lesson' : 'interactive'}
            activePressedCodes={activeCodes}
            targetChar={currentTargetChar}
            highlightedKeys={highlightedKeys}
          />
        </div>
      )}
    </div>
  );
};
