import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, User } from 'lucide-react';

interface LeaderEntry {
  rank: number;
  displayName: string;
  avatarUrl: string | null;
  bestWpm: number;
  avgAccuracy: number;
  totalSessions: number;
}

export const LeaderboardPage: React.FC = () => {
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/leaderboard')
      .then(async (res) => {
        if (!res.ok) throw new Error('Unable to load leaderboard rankings');
        return res.json();
      })
      .then((data) => {
        if (active) {
          setLeaders(data.leaders ?? []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unable to load leaderboard');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Community Leaderboard
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Rankings of signed-in learners based on verified Net WPM and session accuracy.
          </p>
        </div>
        <Link
          to="/test"
          className="rounded-xl bg-[var(--accent-primary)] px-4 py-2.5 text-xs font-semibold text-white self-start"
        >
          Set a New Score
        </Link>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center text-sm text-[var(--text-secondary)]">
          Loading rankings...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center text-sm text-[var(--status-error)]">
          {error}
        </div>
      ) : leaders.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-10 text-center space-y-3">
          <Trophy className="w-8 h-8 text-[var(--status-warning)] mx-auto" />
          <h2 className="text-lg font-bold text-[var(--text-primary)]">No ranked scores yet</h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
            Sign in and complete a typing test or lesson to claim the top spot on the leaderboard.
          </p>
          <div className="pt-1">
            <Link
              to="/auth/login"
              className="inline-flex rounded-xl bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Sign In to Compete
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 text-xs text-[var(--text-secondary)]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Rank</th>
                  <th className="px-5 py-3 font-semibold">Typist</th>
                  <th className="px-5 py-3 font-semibold text-right">Best WPM</th>
                  <th className="px-5 py-3 font-semibold text-right">Avg Accuracy</th>
                  <th className="px-5 py-3 font-semibold text-right">Sessions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] tabular-nums">
                {leaders.map((row) => (
                  <tr key={`${row.rank}-${row.displayName}`}>
                    <td className="px-5 py-3.5 font-mono-typing font-bold text-[var(--text-primary)]">
                      #{row.rank}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        {row.avatarUrl ? (
                          <img
                            src={row.avatarUrl}
                            alt={row.displayName}
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-elevated)]">
                            <User className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                          </span>
                        )}
                        <span className="font-semibold text-[var(--text-primary)]">
                          {row.displayName}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono-typing font-bold text-[var(--accent-primary)]">
                      {row.bestWpm}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono-typing">
                      {row.avgAccuracy}%
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono-typing text-[var(--text-secondary)]">
                      {row.totalSessions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
