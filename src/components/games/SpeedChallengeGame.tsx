import React, { useCallback, useEffect, useState } from 'react';
import { Flame, Pause, Play, RotateCcw } from 'lucide-react';
import { pickWordForLevel } from './gameWords';
import { soundEngine } from '../../core/soundEngine';
import { useAppStore } from '../../store/useAppStore';

interface GameProps {
  bestScore: number;
  autostart?: boolean;
  onFinish: (result: { score: number; accuracy: number; wpm: number; level: number }) => void;
  onExit: () => void;
}

type Status = 'title' | 'playing' | 'paused' | 'gameover';

export const SpeedChallengeGame: React.FC<GameProps> = ({ bestScore, autostart = false, onFinish, onExit }) => {
  const { preferences } = useAppStore();
  const [status, setStatus] = useState<Status>(autostart ? 'playing' : 'title');
  const [queue, setQueue] = useState<string[]>(() => [
    pickWordForLevel(2),
    pickWordForLevel(2),
    pickWordForLevel(2),
    pickWordForLevel(3),
  ]);
  const [typed, setTyped] = useState('');
  const [timeLeft, setTimeLeft] = useState(45);
  const [score, setScore] = useState(0);
  const [wordsDone, setWordsDone] = useState(0);
  const [hits, setHits] = useState(0);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    document.body.dataset.state = status;
    return () => {
      delete document.body.dataset.state;
    };
  }, [status]);

  const startNewGame = useCallback(() => {
    setQueue([
      pickWordForLevel(2),
      pickWordForLevel(2),
      pickWordForLevel(2),
      pickWordForLevel(3),
    ]);
    setTyped('');
    setTimeLeft(45);
    setScore(0);
    setWordsDone(0);
    setHits(0);
    setAttempts(0);
    setStatus('playing');
  }, []);

  useEffect(() => {
    if (status !== 'playing') return;
    const id = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setStatus('gameover');
          const acc = attempts > 0 ? Math.round((hits / attempts) * 1000) / 10 : 100;
          const wpm = Math.round((hits / 5) / (45 / 60));
          onFinish({ score, accuracy: acc, wpm, level: Math.max(1, Math.floor(wordsDone / 10) + 1) });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [status, score, hits, attempts, wordsDone, onFinish]);

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
      if (e.key === ' ') {
        e.preventDefault();
        return;
      }
      if (e.key.length !== 1) return;
      e.preventDefault();

      const currentWord = queue[0];
      setAttempts((a) => a + 1);
      if (e.key === currentWord[typed.length]) {
        soundEngine.playKeyClick(preferences.soundEnabled, true);
        setHits((h) => h + 1);
        const nextTyped = typed + e.key;
        if (nextTyped === currentWord) {
          const nextDone = wordsDone + 1;
          setWordsDone(nextDone);
          setScore((s) => s + currentWord.length * 15);
          setTyped('');
          setQueue((prev) => [...prev.slice(1), pickWordForLevel(Math.floor(nextDone / 8) + 2)]);
        } else {
          setTyped(nextTyped);
        }
      } else {
        soundEngine.playKeyClick(preferences.soundEnabled, false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [status, queue, typed, wordsDone, preferences.soundEnabled, startNewGame]);

  const accuracy = attempts > 0 ? Math.round((hits / attempts) * 100) : 100;
  const activeWord = queue[0] ?? '';

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div className="flex items-center gap-2.5">
          <Flame className="w-5 h-5 text-[var(--accent-primary)]" />
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Speed Challenge</h2>
        </div>
        <div className="flex flex-wrap items-center gap-5 text-sm tabular-nums">
          <span>Score: <strong className="font-mono-typing text-[var(--accent-primary)]" data-testid="game-score">{score}</strong></span>
          <span>Words: <strong className="font-mono-typing">{wordsDone}</strong></span>
          <span>Time: <strong className="font-mono-typing">{timeLeft}s</strong></span>
          <span>Accuracy: <strong className="font-mono-typing">{accuracy}%</strong></span>
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
          <h3 className="text-2xl font-extrabold">45-Second Speed Challenge</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Clear as many words as possible in 45 seconds without losing accuracy. Best score: {bestScore}.
          </p>
          <button
            type="button"
            data-start="true"
            onClick={startNewGame}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-6 py-3 text-sm font-semibold text-white"
          >
            <Play className="w-4 h-4" />
            <span>Start Sprint</span>
          </button>
        </div>
      )}

      {status === 'playing' && (
        <div className="py-10 flex flex-col items-center space-y-6">
          <div className="font-mono-typing text-4xl sm:text-5xl font-bold tracking-wider">
            <span className="text-[var(--status-success)]">{typed}</span>
            <span className="text-[var(--text-primary)] underline decoration-[var(--accent-primary)] decoration-2 underline-offset-8">
              {activeWord[typed.length] ?? ''}
            </span>
            <span className="text-[var(--text-secondary)]/60">
              {activeWord.slice(typed.length + 1)}
            </span>
          </div>

          <div className="flex items-center gap-3 text-sm font-mono-typing text-[var(--text-secondary)]">
            <span>Next:</span>
            {queue.slice(1).map((w, i) => (
              <span
                key={`${w}-${i}`}
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-1"
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      )}

      {status === 'paused' && (
        <div className="py-12 text-center space-y-4">
          <h3 className="text-xl font-bold">Sprint Paused</h3>
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
          <h3 className="text-2xl font-extrabold">Time&apos;s Up!</h3>
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto tabular-nums">
            <div className="rounded-xl bg-[var(--bg-canvas)] p-3">
              <div className="text-xs text-[var(--text-secondary)]">Score</div>
              <div className="text-2xl font-bold font-mono-typing text-[var(--accent-primary)]">{score}</div>
            </div>
            <div className="rounded-xl bg-[var(--bg-canvas)] p-3">
              <div className="text-xs text-[var(--text-secondary)]">Words Cleared</div>
              <div className="text-2xl font-bold font-mono-typing">{wordsDone}</div>
            </div>
            <div className="rounded-xl bg-[var(--bg-canvas)] p-3">
              <div className="text-xs text-[var(--text-secondary)]">Accuracy</div>
              <div className="text-2xl font-bold font-mono-typing">{accuracy}%</div>
            </div>
          </div>
          <button
            type="button"
            data-start="true"
            onClick={startNewGame}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-6 py-3 text-sm font-semibold text-white"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>
        </div>
      )}
    </div>
  );
};
