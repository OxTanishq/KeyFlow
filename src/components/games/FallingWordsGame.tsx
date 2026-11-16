import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, Pause, Play, RotateCcw } from 'lucide-react';
import { pickWordForLevel } from './gameWords';
import { soundEngine } from '../../core/soundEngine';
import { useAppStore } from '../../store/useAppStore';

interface FallingWord {
  id: number;
  text: string;
  xPercent: number;
  yPercent: number;
  speedPctPerSec: number;
}

interface GameProps {
  bestScore: number;
  autostart?: boolean;
  onFinish: (result: { score: number; accuracy: number; wpm: number; level: number }) => void;
  onExit: () => void;
}

type Status = 'title' | 'playing' | 'paused' | 'gameover';

export const FallingWordsGame: React.FC<GameProps> = ({ bestScore, autostart = false, onFinish, onExit }) => {
  const { preferences } = useAppStore();
  const [status, setStatus] = useState<Status>(autostart ? 'playing' : 'title');
  const [words, setWords] = useState<FallingWord[]>([]);
  const [activeWordId, setActiveWordId] = useState<number | null>(null);
  const [typedPrefix, setTypedPrefix] = useState('');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(5);
  const [hits, setHits] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const wordsRef = useRef(words);
  wordsRef.current = words;
  const activeIdRef = useRef(activeWordId);
  activeIdRef.current = activeWordId;
  const typedRef = useRef(typedPrefix);
  typedRef.current = typedPrefix;
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const levelRef = useRef(level);
  levelRef.current = level;
  const livesRef = useRef(lives);
  livesRef.current = lives;
  const hitsRef = useRef(hits);
  hitsRef.current = hits;
  const attemptsRef = useRef(attempts);
  attemptsRef.current = attempts;
  const clearedCountRef = useRef(0);
  const nextIdRef = useRef(1);
  const spawnTimerRef = useRef(0);
  const startMsRef = useRef(Date.now());

  useEffect(() => {
    document.body.dataset.state = status;
    return () => {
      delete document.body.dataset.state;
    };
  }, [status]);

  const spawnWord = useCallback((lvl: number): FallingWord => {
    const id = nextIdRef.current++;
    return {
      id,
      text: pickWordForLevel(lvl),
      xPercent: 10 + Math.random() * 72,
      yPercent: 2,
      speedPctPerSec: 6.5 + (lvl - 1) * 1.4,
    };
  }, []);

  const triggerGameOver = useCallback(() => {
    setStatus('gameover');
    const acc =
      attemptsRef.current > 0
        ? Math.round((hitsRef.current / attemptsRef.current) * 1000) / 10
        : 100;
    const mins = Math.max(0.05, (Date.now() - startMsRef.current) / 60000);
    const wpm = Math.round(hitsRef.current / 5 / mins);
    onFinish({
      score: scoreRef.current,
      accuracy: acc,
      wpm,
      level: levelRef.current,
    });
  }, [onFinish]);

  const startNewGame = useCallback(() => {
    const initial = [spawnWord(1)];
    setWords(initial);
    setActiveWordId(null);
    setTypedPrefix('');
    setScore(0);
    setLevel(1);
    setLives(5);
    setHits(0);
    setAttempts(0);
    clearedCountRef.current = 0;
    spawnTimerRef.current = 0;
    startMsRef.current = Date.now();
    setStatus('playing');
  }, [spawnWord]);

  // Spawn initial word if autostarted
  useEffect(() => {
    if (autostart && words.length === 0 && status === 'playing') {
      setWords([spawnWord(1)]);
    }
  }, [autostart, words.length, status, spawnWord]);

  // Animation loop
  useEffect(() => {
    if (status !== 'playing') return;
    let rafId = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      spawnTimerRef.current += dt;
      const spawnInterval = Math.max(1.2, 2.8 - (levelRef.current - 1) * 0.22);

      let updated = wordsRef.current.map((w) => ({
        ...w,
        yPercent: w.yPercent + w.speedPctPerSec * dt,
      }));

      const missed = updated.filter((w) => w.yPercent >= 90);
      if (missed.length > 0) {
        updated = updated.filter((w) => w.yPercent < 90);
        if (missed.some((m) => m.id === activeIdRef.current)) {
          setActiveWordId(null);
          setTypedPrefix('');
        }
        const remainingLives = Math.max(0, livesRef.current - missed.length);
        setLives(remainingLives);
        if (remainingLives <= 0) {
          setWords(updated);
          triggerGameOver();
          return;
        }
      }

      if (spawnTimerRef.current >= spawnInterval && updated.length < 7) {
        spawnTimerRef.current = 0;
        updated.push(spawnWord(levelRef.current));
      }

      setWords(updated);
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [status, spawnWord, triggerGameOver]);

  // Keyboard matching
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

      setAttempts((a) => a + 1);

      let targetWord = wordsRef.current.find((w) => w.id === activeIdRef.current) ?? null;
      let prefix = typedRef.current;

      if (!targetWord) {
        // Lock onto lowest word starting with typed key
        const candidates = wordsRef.current
          .filter((w) => w.text.startsWith(e.key))
          .sort((a, b) => b.yPercent - a.yPercent);
        if (candidates.length === 0) {
          soundEngine.playKeyClick(preferences.soundEnabled, false);
          return;
        }
        targetWord = candidates[0];
        prefix = '';
      }

      const expected = targetWord.text[prefix.length];
      if (e.key === expected) {
        soundEngine.playKeyClick(preferences.soundEnabled, true);
        setHits((h) => h + 1);
        const nextPrefix = prefix + e.key;
        if (nextPrefix === targetWord.text) {
          // Cleared word
          const clearedId = targetWord.id;
          setWords((prev) => prev.filter((w) => w.id !== clearedId));
          setActiveWordId(null);
          setTypedPrefix('');
          clearedCountRef.current += 1;
          const nextLvl = Math.floor(clearedCountRef.current / 7) + 1;
          setLevel(nextLvl);
          setScore((s) => s + 50 + targetWord!.text.length * 10);
        } else {
          setActiveWordId(targetWord.id);
          setTypedPrefix(nextPrefix);
        }
      } else {
        soundEngine.playKeyClick(preferences.soundEnabled, false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [status, preferences.soundEnabled, startNewGame]);

  const accuracy = attempts > 0 ? Math.round((hits / attempts) * 100) : 100;

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div className="flex items-center gap-2.5">
          <ArrowDown className="w-5 h-5 text-[var(--accent-secondary)]" />
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Falling Words</h2>
        </div>
        <div className="flex flex-wrap items-center gap-5 text-sm tabular-nums">
          <span>Score: <strong className="font-mono-typing text-[var(--accent-primary)]" data-testid="game-score">{score}</strong></span>
          <span>Level: <strong className="font-mono-typing">{level}</strong></span>
          <span>Accuracy: <strong className="font-mono-typing">{accuracy}%</strong></span>
          <span>Lives: <strong className="font-mono-typing">{lives}/5</strong></span>
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
          <h3 className="text-2xl font-extrabold text-[var(--text-primary)]">Falling Words</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Words descend from above. Type any word completely before it reaches the bottom line. Best score: {bestScore}.
          </p>
          <button
            type="button"
            data-start="true"
            onClick={startNewGame}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-6 py-3 text-sm font-semibold text-white"
          >
            <Play className="w-4 h-4" />
            <span>Start Game</span>
          </button>
        </div>
      )}

      {status === 'playing' && (
        <div className="relative h-80 w-full overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)]">
          {words.map((w) => {
            const isLocked = w.id === activeWordId;
            return (
              <div
                key={w.id}
                style={{
                  left: `${w.xPercent}%`,
                  top: `${w.yPercent}%`,
                }}
                className={`absolute rounded-lg border px-3 py-1 font-mono-typing text-sm font-bold transition-colors ${
                  isLocked
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/15 text-[var(--text-primary)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)]'
                }`}
              >
                {isLocked ? (
                  <>
                    <span className="text-[var(--status-success)]">{typedPrefix}</span>
                    <span>{w.text.slice(typedPrefix.length)}</span>
                  </>
                ) : (
                  w.text
                )}
              </div>
            );
          })}
          <div className="absolute bottom-0 inset-x-0 h-1 bg-[var(--status-error)]/40" />
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
          <h3 className="text-2xl font-extrabold">Game Over</h3>
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto tabular-nums">
            <div className="rounded-xl bg-[var(--bg-canvas)] p-3">
              <div className="text-xs text-[var(--text-secondary)]">Score</div>
              <div className="text-2xl font-bold font-mono-typing text-[var(--accent-primary)]">{score}</div>
            </div>
            <div className="rounded-xl bg-[var(--bg-canvas)] p-3">
              <div className="text-xs text-[var(--text-secondary)]">Level</div>
              <div className="text-2xl font-bold font-mono-typing">{level}</div>
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
