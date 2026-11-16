import React, { useCallback, useEffect, useState } from 'react';
import { Flag, Pause, Play, RotateCcw } from 'lucide-react';
import { RACE_PASSAGES } from './gameWords';
import { computeTypingMetrics, createTypingState, processTypingInput, type TypingState } from '../../core/typingEngine';
import { soundEngine } from '../../core/soundEngine';
import { useAppStore } from '../../store/useAppStore';

interface GameProps {
  bestScore: number;
  autostart?: boolean;
  onFinish: (result: { score: number; accuracy: number; wpm: number; level: number }) => void;
  onExit: () => void;
}

type Status = 'title' | 'playing' | 'paused' | 'gameover';

export const TypingRaceGame: React.FC<GameProps> = ({ bestScore, autostart = false, onFinish, onExit }) => {
  const { preferences } = useAppStore();
  const [status, setStatus] = useState<Status>(autostart ? 'playing' : 'title');
  const [passageIdx, setPassageIdx] = useState(0);
  const [typingState, setTypingState] = useState<TypingState>(() =>
    createTypingState(RACE_PASSAGES[0])
  );
  const [nowMs, setNowMs] = useState(() => performance.now());

  useEffect(() => {
    document.body.dataset.state = status;
    return () => {
      delete document.body.dataset.state;
    };
  }, [status]);

  const startNewGame = useCallback(() => {
    const nextIdx = (passageIdx + 1) % RACE_PASSAGES.length;
    setPassageIdx(nextIdx);
    setTypingState(createTypingState(RACE_PASSAGES[nextIdx]));
    setNowMs(performance.now());
    setStatus('playing');
  }, [passageIdx]);

  useEffect(() => {
    if (status !== 'playing' || typingState.startedAtMs === null) return;
    const id = window.setInterval(() => setNowMs(performance.now()), 120);
    return () => window.clearInterval(id);
  }, [status, typingState.startedAtMs]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (status === 'title' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        startNewGame();
        return;
      }
      if (status === 'playing' && e.key === 'Escape') {
        e.preventDefault();
        setStatus('paused');
        return;
      }
      if (status === 'paused' && e.key === 'Escape') {
        e.preventDefault();
        setStatus('playing');
        return;
      }
      if (status !== 'playing') return;
      if (e.key === ' ' || e.key === 'Backspace') e.preventDefault();
      if (e.key !== 'Backspace' && e.key.length !== 1) return;

      const t = performance.now();
      const expected = typingState.entries[typingState.cursor]?.expected;
      const next = processTypingInput(typingState, e.key, t);
      if (e.key !== 'Backspace' && expected !== undefined) {
        soundEngine.playKeyClick(preferences.soundEnabled, e.key === expected);
      }
      setTypingState(next);
      setNowMs(t);

      if (next.isCompleted) {
        const finalM = computeTypingMetrics(next, t);
        const finalScore = Math.round(finalM.netWpm * (finalM.accuracy / 100) * 10);
        setStatus('gameover');
        soundEngine.playSuccessChime(preferences.soundEnabled);
        onFinish({
          score: finalScore,
          accuracy: finalM.accuracy,
          wpm: finalM.netWpm,
          level: 1,
        });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [status, typingState, preferences.soundEnabled, startNewGame, onFinish]);

  const metrics = computeTypingMetrics(typingState, nowMs);

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div className="flex items-center gap-2.5">
          <Flag className="w-5 h-5 text-[var(--accent-primary)]" />
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Typing Race (Solo Time Trial)</h2>
        </div>
        <div className="flex flex-wrap items-center gap-5 text-sm tabular-nums">
          <span>Speed: <strong className="font-mono-typing text-[var(--accent-primary)]">{metrics.netWpm} WPM</strong></span>
          <span>Accuracy: <strong className="font-mono-typing">{metrics.accuracy}%</strong></span>
          <span>Progress: <strong className="font-mono-typing">{metrics.progressPercent}%</strong></span>
          {status === 'playing' && (
            <button
              type="button"
              onClick={() => setStatus('paused')}
              className="rounded-lg border border-[var(--border-subtle)] px-2.5 py-1 text-xs font-medium"
            >
              <Pause className="w-3.5 h-3.5 inline mr-1" />
              Pause
            </button>
          )}
          <button
            type="button"
            onClick={onExit}
            className="rounded-lg border border-[var(--border-subtle)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]"
          >
            All Games
          </button>
        </div>
      </div>

      {status === 'title' && (
        <div className="py-12 text-center space-y-4 max-w-md mx-auto">
          <h3 className="text-2xl font-extrabold">Typing Race</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Drive your vehicle across the finish line by typing the track passage accurately. Best score: {bestScore}.
          </p>
          <button
            type="button"
            data-start="true"
            onClick={startNewGame}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-6 py-3 text-sm font-semibold text-white"
          >
            <Play className="w-4 h-4" />
            <span>Start Race</span>
          </button>
        </div>
      )}

      {status === 'playing' && (
        <div className="space-y-6">
          {/* Race Track */}
          <div className="relative h-20 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-4 flex items-center overflow-hidden">
            <div className="w-full h-1 border-b-2 border-dashed border-[var(--border-subtle)]" />
            <div
              className="absolute transition-[left] duration-150 ease-out"
              style={{ left: `calc(${Math.min(90, metrics.progressPercent * 0.88)}% + 12px)` }}
            >
              <svg width="46" height="24" viewBox="0 0 46 24" fill="none" aria-label="Player race vehicle">
                <rect x="2" y="7" width="38" height="11" rx="5" fill="#6558F5" />
                <path d="M12 7L18 2H30L35 7H12Z" fill="#8D83FF" />
                <circle cx="11" cy="19" r="4" fill="#171923" stroke="#E8EAF2" strokeWidth="1.5" />
                <circle cx="33" cy="19" r="4" fill="#171923" stroke="#E8EAF2" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="absolute right-4 top-2 bottom-2 w-1.5 rounded-full bg-[var(--accent-secondary)]" />
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-5 font-mono-typing text-lg leading-relaxed">
            {typingState.entries.map((entry, idx) => {
              let cls = 'text-[var(--text-secondary)]/65';
              if (entry.status === 'correct') cls = 'text-[var(--status-success)]';
              else if (entry.status === 'corrected') cls = 'text-amber-500';
              else if (entry.status === 'incorrect') cls = 'text-[var(--status-error)] bg-rose-500/15';
              else if (entry.status === 'current') cls = 'text-[var(--text-primary)] underline decoration-[var(--accent-primary)] decoration-2 underline-offset-4';
              return (
                <span key={idx} className={cls}>
                  {entry.expected}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {status === 'paused' && (
        <div className="py-12 text-center space-y-4">
          <h3 className="text-xl font-bold">Race Paused</h3>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setStatus('playing')}
              className="rounded-xl bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Resume
            </button>
            <button
              type="button"
              onClick={startNewGame}
              className="rounded-xl border border-[var(--border-subtle)] px-5 py-2.5 text-sm font-semibold"
            >
              Restart
            </button>
          </div>
        </div>
      )}

      {status === 'gameover' && (
        <div className="py-10 text-center space-y-5" data-testid="game-over-screen">
          <h3 className="text-2xl font-extrabold">Checkered Flag!</h3>
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto tabular-nums">
            <div className="rounded-xl bg-[var(--bg-canvas)] p-3">
              <div className="text-xs text-[var(--text-secondary)]">Speed</div>
              <div className="text-2xl font-bold font-mono-typing text-[var(--accent-primary)]">{metrics.netWpm} WPM</div>
            </div>
            <div className="rounded-xl bg-[var(--bg-canvas)] p-3">
              <div className="text-xs text-[var(--text-secondary)]">Accuracy</div>
              <div className="text-2xl font-bold font-mono-typing">{metrics.accuracy}%</div>
            </div>
            <div className="rounded-xl bg-[var(--bg-canvas)] p-3">
              <div className="text-xs text-[var(--text-secondary)]">Time</div>
              <div className="text-2xl font-bold font-mono-typing">{Math.round(metrics.elapsedSeconds)}s</div>
            </div>
          </div>
          <button
            type="button"
            data-start="true"
            onClick={startNewGame}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-6 py-3 text-sm font-semibold text-white"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Race Again</span>
          </button>
        </div>
      )}
    </div>
  );
};
