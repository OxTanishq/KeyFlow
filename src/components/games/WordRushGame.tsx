import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Zap } from 'lucide-react';
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

export const WordRushGame: React.FC<GameProps> = ({ bestScore, autostart = false, onFinish, onExit }) => {
  const { preferences } = useAppStore();
  const [status, setStatus] = useState<Status>(autostart ? 'playing' : 'title');
  const [word, setWord] = useState(() => pickWordForLevel(1));
  const [typed, setTyped] = useState('');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [wordsCleared, setWordsCleared] = useState(0);
  const [hits, setHits] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [timeRemainingMs, setTimeRemainingMs] = useState(6500);
  const [maxTimeMs, setMaxTimeMs] = useState(6500);
  const startedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    document.body.dataset.state = status;
    return () => {
      delete document.body.dataset.state;
    };
  }, [status]);

  const startNewGame = useCallback(() => {
    setWord(pickWordForLevel(1));
    setTyped('');
    setScore(0);
    setCombo(0);
    setLevel(1);
    setLives(3);
    setWordsCleared(0);
    setHits(0);
    setAttempts(0);
    setMaxTimeMs(6500);
    setTimeRemainingMs(6500);
    startedAtRef.current = Date.now();
    setStatus('playing');
  }, []);

  const endGame = useCallback(
    (finalScore: number, finalHits: number, finalAttempts: number, finalLevel: number) => {
      setStatus('gameover');
      const acc = finalAttempts > 0 ? Math.round((finalHits / finalAttempts) * 1000) / 10 : 100;
      const mins = Math.max(0.05, (Date.now() - startedAtRef.current) / 60000);
      const wpm = Math.round(finalHits / 5 / mins);
      onFinish({ score: finalScore, accuracy: acc, wpm, level: finalLevel });
    },
    [onFinish]
  );

  // Countdown fuse tick
  useEffect(() => {
    if (status !== 'playing') return;
    let last = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      setTimeRemainingMs((prev) => {
        const next = prev - dt;
        if (next <= 0) {
          setLives((lv) => {
            const nextLives = lv - 1;
            if (nextLives <= 0) {
              endGame(score, hits, attempts, level);
              return 0;
            }
            const nextLimit = Math.max(2600, 6500 - (level - 1) * 450);
            setCombo(0);
            setTyped('');
            setWord(pickWordForLevel(level));
            setMaxTimeMs(nextLimit);
            setTimeRemainingMs(nextLimit);
            return nextLives;
          });
          return maxTimeMs;
        }
        return next;
      });
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [status, level, score, hits, attempts, maxTimeMs, endGame]);

  // Keyboard listener
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

      const expected = word[typed.length];
      setAttempts((a) => a + 1);
      if (e.key === expected) {
        soundEngine.playKeyClick(preferences.soundEnabled, true);
        const nextTyped = typed + e.key;
        setHits((h) => h + 1);

        if (nextTyped === word) {
          const nextCleared = wordsCleared + 1;
          const nextLevel = Math.floor(nextCleared / 6) + 1;
          const nextCombo = combo + 1;
          const gained = 100 + nextCombo * 15 + level * 20;
          setScore((s) => s + gained);
          setCombo(nextCombo);
          setWordsCleared(nextCleared);
          setLevel(nextLevel);
          const nextLimit = Math.max(2600, 6500 - (nextLevel - 1) * 450);
          setMaxTimeMs(nextLimit);
          setTimeRemainingMs(nextLimit);
          setTyped('');
          setWord(pickWordForLevel(nextLevel));
        } else {
          setTyped(nextTyped);
        }
      } else {
        soundEngine.playKeyClick(preferences.soundEnabled, false);
        setCombo(0);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [status, word, typed, combo, level, wordsCleared, preferences.soundEnabled, startNewGame]);

  const accuracy = attempts > 0 ? Math.round((hits / attempts) * 100) : 100;
  const fusePct = Math.max(0, Math.min(100, (timeRemainingMs / maxTimeMs) * 100));

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div className="flex items-center gap-2.5">
          <Zap className="w-5 h-5 text-[var(--accent-primary)]" />
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Word Rush</h2>
        </div>
        <div className="flex flex-wrap items-center gap-5 text-sm tabular-nums">
          <span>Score: <strong className="font-mono-typing text-[var(--accent-primary)]" data-testid="game-score">{score}</strong></span>
          <span>Combo: <strong className="font-mono-typing">{combo}x</strong></span>
          <span>Level: <strong className="font-mono-typing">{level}</strong></span>
          <span>Accuracy: <strong className="font-mono-typing">{accuracy}%</strong></span>
          <span>Lives: <strong className="font-mono-typing">{lives}/3</strong></span>
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
            className="rounded-lg border border-[var(--border-subtle)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            All Games
          </button>
        </div>
      </div>

      {status === 'title' && (
        <div className="py-12 text-center space-y-4 max-w-md mx-auto">
          <h3 className="text-2xl font-extrabold text-[var(--text-primary)]">Word Rush</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Type each appearing word before its timer bar empties. Consecutive accurate words build your combo multiplier. Best score: {bestScore}.
          </p>
          <button
            type="button"
            data-start="true"
            onClick={startNewGame}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-6 py-3 text-sm font-semibold text-white hover:opacity-95"
          >
            <Play className="w-4 h-4" />
            <span>Start Game</span>
          </button>
        </div>
      )}

      {status === 'playing' && (
        <div className="py-10 flex flex-col items-center justify-center space-y-6">
          <div className="w-full max-w-md h-2 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
            <div
              className={`h-full transition-colors ${
                fusePct > 35 ? 'bg-[var(--accent-primary)]' : 'bg-[var(--status-error)]'
              }`}
              style={{ width: `${fusePct}%` }}
            />
          </div>

          <div
            className="font-mono-typing text-4xl sm:text-5xl font-bold tracking-wider select-none"
            data-testid="word-rush-target"
          >
            <span className="text-[var(--status-success)]">{typed}</span>
            <span className="text-[var(--text-primary)] underline decoration-[var(--accent-primary)] decoration-2 underline-offset-8">
              {word[typed.length] ?? ''}
            </span>
            <span className="text-[var(--text-secondary)]/60">
              {word.slice(typed.length + 1)}
            </span>
          </div>

          <p className="text-xs text-[var(--text-secondary)]">
            Type the highlighted letters directly · Press Escape to pause
          </p>
        </div>
      )}

      {status === 'paused' && (
        <div className="py-12 text-center space-y-4">
          <h3 className="text-xl font-bold">Game Paused</h3>
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
          <h3 className="text-2xl font-extrabold text-[var(--text-primary)]">Round Complete</h3>
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto tabular-nums">
            <div className="rounded-xl bg-[var(--bg-canvas)] p-3">
              <div className="text-xs text-[var(--text-secondary)]">Final Score</div>
              <div className="text-2xl font-bold font-mono-typing text-[var(--accent-primary)]">{score}</div>
            </div>
            <div className="rounded-xl bg-[var(--bg-canvas)] p-3">
              <div className="text-xs text-[var(--text-secondary)]">Words</div>
              <div className="text-2xl font-bold font-mono-typing">{wordsCleared}</div>
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
