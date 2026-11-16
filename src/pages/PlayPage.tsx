import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowDown, Flag, Flame, Shield, Trophy, Zap } from 'lucide-react';
import type { GameScoreRecord } from '../core/analytics';
import { useAppStore } from '../store/useAppStore';
import { WordRushGame } from '../components/games/WordRushGame';
import { FallingWordsGame } from '../components/games/FallingWordsGame';
import { TypingRaceGame } from '../components/games/TypingRaceGame';
import { KeyboardDefenderGame } from '../components/games/KeyboardDefenderGame';
import { SpeedChallengeGame } from '../components/games/SpeedChallengeGame';

type GameId = GameScoreRecord['gameType'];

const GAMES_CATALOG: Array<{
  id: GameId;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'word-rush',
    title: 'Word Rush',
    description: 'Type each appearing word before its countdown fuse expires to stack combos.',
    icon: Zap,
  },
  {
    id: 'falling-words',
    title: 'Falling Words',
    description: 'Clear descending words in real time before they cross the floor boundary.',
    icon: ArrowDown,
  },
  {
    id: 'typing-race',
    title: 'Typing Race',
    description: 'Solo time trial where accurate keystrokes propel your vehicle to the finish line.',
    icon: Flag,
  },
  {
    id: 'keyboard-defender',
    title: 'Keyboard Defender',
    description: 'Lock onto incoming targets and clear them before they reach your central shield.',
    icon: Shield,
  },
  {
    id: 'speed-challenge',
    title: 'Speed Challenge',
    description: 'Complete as many words as possible in a 45-second sprint.',
    icon: Flame,
  },
];

export const PlayPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { gameScores, recordGameScore } = useAppStore();

  const initialGame = (searchParams.get('game') as GameId | null) ?? null;
  const autostart = searchParams.get('autostart') === '1';

  const [selectedGame, setSelectedGame] = useState<GameId | null>(
    initialGame ?? (autostart ? 'word-rush' : null)
  );

  const bestByGame = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of gameScores) {
      map[s.gameType] = Math.max(map[s.gameType] ?? 0, s.score);
    }
    return map;
  }, [gameScores]);

  const handleFinish = async (
    gameType: GameId,
    result: { score: number; accuracy: number; wpm: number; level: number }
  ) => {
    await recordGameScore({
      gameType,
      ...result,
    });
  };

  if (selectedGame) {
    const common = {
      bestScore: bestByGame[selectedGame] ?? 0,
      autostart,
      onExit: () => setSelectedGame(null),
      onFinish: (r: { score: number; accuracy: number; wpm: number; level: number }) =>
        handleFinish(selectedGame, r),
    };

    if (selectedGame === 'word-rush') return <WordRushGame {...common} />;
    if (selectedGame === 'falling-words') return <FallingWordsGame {...common} />;
    if (selectedGame === 'typing-race') return <TypingRaceGame {...common} />;
    if (selectedGame === 'keyboard-defender') return <KeyboardDefenderGame {...common} />;
    return <SpeedChallengeGame {...common} />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Typing Games
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Reinforce muscle memory and reaction speed across five playable arcade modes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {GAMES_CATALOG.map((g) => {
          const Icon = g.icon;
          const highScore = bestByGame[g.id] ?? 0;
          return (
            <div
              key={g.id}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 flex flex-col justify-between gap-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-mono-typing text-[var(--text-secondary)] tabular-nums">
                    <Trophy className="w-3.5 h-3.5 text-[var(--status-warning)]" />
                    <span>Best: {highScore}</span>
                  </span>
                </div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">{g.title}</h2>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {g.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedGame(g.id)}
                data-testid={`launch-${g.id}`}
                className="w-full rounded-xl bg-[var(--accent-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95"
              >
                Play {g.title}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
