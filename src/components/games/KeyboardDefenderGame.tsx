import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Shield } from 'lucide-react';
import { pickWordForLevel } from './gameWords';
import { soundEngine } from '../../core/soundEngine';
import { useAppStore } from '../../store/useAppStore';

interface DroneTarget {
  id: number;
  word: string;
  angleRad: number;
  distancePct: number; // 46 down to 8 (shield center)
  speedPctPerSec: number;
}

interface GameProps {
  bestScore: number;
  autostart?: boolean;
  onFinish: (result: { score: number; accuracy: number; wpm: number; level: number }) => void;
  onExit: () => void;
}

type Status = 'title' | 'playing' | 'paused' | 'gameover';

export const KeyboardDefenderGame: React.FC<GameProps> = ({ bestScore, autostart = false, onFinish, onExit }) => {
  const { preferences } = useAppStore();
  const [status, setStatus] = useState<Status>(autostart ? 'playing' : 'title');
  const [targets, setTargets] = useState<DroneTarget[]>([]);
  const [lockedId, setLockedId] = useState<number | null>(null);
  const [typedPrefix, setTypedPrefix] = useState('');
  const [score, setScore] = useState(0);
  const [shield, setShield] = useState(5);
  const [wave, setWave] = useState(1);
  const [hits, setHits] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const targetsRef = useRef(targets);
  targetsRef.current = targets;
  const lockedRef = useRef(lockedId);
  lockedRef.current = lockedId;
  const typedRef = useRef(typedPrefix);
  typedRef.current = typedPrefix;
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const shieldRef = useRef(shield);
  shieldRef.current = shield;
  const waveRef = useRef(wave);
  waveRef.current = wave;
  const hitsRef = useRef(hits);
  hitsRef.current = hits;
  const attemptsRef = useRef(attempts);
  attemptsRef.current = attempts;
  const clearedRef = useRef(0);
  const nextIdRef = useRef(1);
  const spawnAccumRef = useRef(0);
  const startMsRef = useRef(Date.now());

  useEffect(() => {
    document.body.dataset.state = status;
    return () => {
      delete document.body.dataset.state;
    };
  }, [status]);

  const spawnTarget = useCallback((lvl: number): DroneTarget => {
    const id = nextIdRef.current++;
    const angleDeg = -155 + Math.random() * 130; // Upper arc toward central shield
    return {
      id,
      word: pickWordForLevel(lvl),
      angleRad: (angleDeg * Math.PI) / 180,
      distancePct: 45,
      speedPctPerSec: 4.5 + (lvl - 1) * 0.85,
    };
  }, []);

  const endGame = useCallback(() => {
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
      level: waveRef.current,
    });
  }, [onFinish]);

  const startNewGame = useCallback(() => {
    setTargets([spawnTarget(1)]);
    setLockedId(null);
    setTypedPrefix('');
    setScore(0);
    setShield(5);
    setWave(1);
    setHits(0);
    setAttempts(0);
    clearedRef.current = 0;
    spawnAccumRef.current = 0;
    startMsRef.current = Date.now();
    setStatus('playing');
  }, [spawnTarget]);

  useEffect(() => {
    if (autostart && targets.length === 0 && status === 'playing') {
      setTargets([spawnTarget(1)]);
    }
  }, [autostart, targets.length, status, spawnTarget]);

  useEffect(() => {
    if (status !== 'playing') return;
    let rafId = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      spawnAccumRef.current += dt;
      const interval = Math.max(1.3, 2.9 - (waveRef.current - 1) * 0.2);

      let next = targetsRef.current.map((t) => ({
        ...t,
        distancePct: t.distancePct - t.speedPctPerSec * dt,
      }));

      const breached = next.filter((t) => t.distancePct <= 8);
      if (breached.length > 0) {
        next = next.filter((t) => t.distancePct > 8);
        if (breached.some((b) => b.id === lockedRef.current)) {
          setLockedId(null);
          setTypedPrefix('');
        }
        const remaining = Math.max(0, shieldRef.current - breached.length);
        setShield(remaining);
        if (remaining <= 0) {
          setTargets(next);
          endGame();
          return;
        }
      }

      if (spawnAccumRef.current >= interval && next.length < 6) {
        spawnAccumRef.current = 0;
        next.push(spawnTarget(waveRef.current));
      }

      setTargets(next);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [status, spawnTarget, endGame]);

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

      let target = targetsRef.current.find((t) => t.id === lockedRef.current) ?? null;
      let prefix = typedRef.current;

      if (!target) {
        const candidates = targetsRef.current
          .filter((t) => t.word.startsWith(e.key))
          .sort((a, b) => a.distancePct - b.distancePct);
        if (candidates.length === 0) {
          soundEngine.playKeyClick(preferences.soundEnabled, false);
          return;
        }
        target = candidates[0];
        prefix = '';
      }

      if (e.key === target.word[prefix.length]) {
        soundEngine.playKeyClick(preferences.soundEnabled, true);
        setHits((h) => h + 1);
        const nextPrefix = prefix + e.key;
        if (nextPrefix === target.word) {
          const clearedId = target.id;
          setTargets((prev) => prev.filter((t) => t.id !== clearedId));
          setLockedId(null);
          setTypedPrefix('');
          clearedRef.current += 1;
          const nextWave = Math.floor(clearedRef.current / 6) + 1;
          setWave(nextWave);
          setScore((s) => s + 75 + target!.word.length * 10);
        } else {
          setLockedId(target.id);
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
          <Shield className="w-5 h-5 text-[var(--accent-secondary)]" />
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Keyboard Defender</h2>
        </div>
        <div className="flex flex-wrap items-center gap-5 text-sm tabular-nums">
          <span>Score: <strong className="font-mono-typing text-[var(--accent-primary)]" data-testid="game-score">{score}</strong></span>
          <span>Wave: <strong className="font-mono-typing">{wave}</strong></span>
          <span>Shield: <strong className="font-mono-typing">{shield}/5</strong></span>
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
          <h3 className="text-2xl font-extrabold">Keyboard Defender</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Incoming targets converge on your central shield dome. Type each target&apos;s word to neutralize it before impact. Best score: {bestScore}.
          </p>
          <button
            type="button"
            data-start="true"
            onClick={startNewGame}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-6 py-3 text-sm font-semibold text-white"
          >
            <Play className="w-4 h-4" />
            <span>Defend Sector</span>
          </button>
        </div>
      )}

      {status === 'playing' && (
        <div className="relative h-80 w-full overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)]">
          {/* Central Shield Dome */}
          <div className="absolute left-1/2 bottom-4 -translate-x-1/2 flex flex-col items-center">
            <div className="h-12 w-24 rounded-t-full border-2 border-[var(--accent-secondary)] bg-[var(--accent-secondary)]/15 flex items-center justify-center">
              <Shield className="w-5 h-5 text-[var(--accent-secondary)]" />
            </div>
          </div>

          {targets.map((t) => {
            const x = 50 + Math.cos(t.angleRad) * t.distancePct;
            const y = 86 + Math.sin(t.angleRad) * (t.distancePct * 1.5);
            const isLocked = t.id === lockedId;
            return (
              <div
                key={t.id}
                style={{ left: `${Math.max(8, Math.min(84, x))}%`, top: `${Math.max(6, Math.min(78, y))}%` }}
                className={`absolute -translate-x-1/2 rounded-lg border px-3 py-1 font-mono-typing text-sm font-bold ${
                  isLocked
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/15 text-[var(--text-primary)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)]'
                }`}
              >
                {isLocked ? (
                  <>
                    <span className="text-[var(--status-success)]">{typedPrefix}</span>
                    <span>{t.word.slice(typedPrefix.length)}</span>
                  </>
                ) : (
                  t.word
                )}
              </div>
            );
          })}
        </div>
      )}

      {status === 'paused' && (
        <div className="py-12 text-center space-y-4">
          <h3 className="text-xl font-bold">Defense Paused</h3>
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
          <h3 className="text-2xl font-extrabold">Shield Depleted</h3>
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto tabular-nums">
            <div className="rounded-xl bg-[var(--bg-canvas)] p-3">
              <div className="text-xs text-[var(--text-secondary)]">Score</div>
              <div className="text-2xl font-bold font-mono-typing text-[var(--accent-primary)]">{score}</div>
            </div>
            <div className="rounded-xl bg-[var(--bg-canvas)] p-3">
              <div className="text-xs text-[var(--text-secondary)]">Wave</div>
              <div className="text-2xl font-bold font-mono-typing">{wave}</div>
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
