import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Award, BarChart3, Flame, Target, Timer, Trophy } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ACHIEVEMENT_CATALOG,
  buildDailyPracticeSeries,
  buildPersonalBestHistory,
  computeProgressSummary,
  filterSessionsByTimeframe,
  getTopMistypedKeys,
  type TimeframeFilter,
} from '../core/analytics';
import { LESSONS } from '../core/lessons';
import { FINGER_META, type KeyDefinition } from '../core/keyboardLayout';
import { useAppStore } from '../store/useAppStore';
import { VirtualKeyboard } from '../components/VirtualKeyboard';

export const ProgressPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessions, lessonProgress, keyStats, achievements } = useAppStore();
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('monthly');
  const [selectedKey, setSelectedKey] = useState<KeyDefinition | null>(null);

  const summary = useMemo(
    () => computeProgressSummary(sessions, lessonProgress),
    [sessions, lessonProgress]
  );

  const filteredSessions = useMemo(
    () => filterSessionsByTimeframe(sessions, timeframe),
    [sessions, timeframe]
  );

  const sessionTimeline = useMemo(() => {
    return [...filteredSessions]
      .sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt))
      .map((s, idx) => ({
        index: idx + 1,
        label: new Date(s.completedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        wpm: Math.round(s.netWpm),
        rawWpm: Math.round(s.rawWpm),
        accuracy: s.accuracy,
      }));
  }, [filteredSessions]);

  const dailyPractice = useMemo(
    () => buildDailyPracticeSeries(filteredSessions),
    [filteredSessions]
  );

  const mistypedKeys = useMemo(() => getTopMistypedKeys(keyStats, 8), [keyStats]);
  const personalBests = useMemo(() => buildPersonalBestHistory(sessions), [sessions]);

  const lessonChartData = useMemo(
    () =>
      LESSONS.map((l) => ({
        name: `L${l.sequenceNumber}`,
        title: l.title,
        accuracy: Math.round(lessonProgress[l.id]?.bestAccuracy ?? 0),
        stars: lessonProgress[l.id]?.stars ?? 0,
      })),
    [lessonProgress]
  );

  const selectedKeyStat = useMemo(() => {
    if (!selectedKey) return null;
    const lookup =
      selectedKey.id === 'Space'
        ? 'Space'
        : selectedKey.char?.toLowerCase() ?? selectedKey.label.toLowerCase();
    const stat = keyStats[lookup];
    const attempts = stat?.attempts ?? 0;
    const errors = stat?.errors ?? 0;
    const accuracy = attempts > 0 ? Math.round(((attempts - errors) / attempts) * 1000) / 10 : null;
    return { lookup, attempts, errors, accuracy };
  }, [selectedKey, keyStats]);

  const unlockedSet = new Set(achievements);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Performance Analytics
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Real metrics recorded across your lessons, practice drills, and typing speed tests.
          </p>
        </div>

        {/* Timeframe Filter */}
        <div
          role="group"
          aria-label="Analytics timeframe"
          className="inline-flex items-center gap-1 rounded-xl bg-[var(--bg-elevated)] p-1 self-start"
        >
          {(['daily', 'weekly', 'monthly'] as const).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
                timeframe === tf
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* 7 Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 tabular-nums">
        {[
          { label: 'Avg WPM', value: summary.averageWpm || '—' },
          { label: 'Best WPM', value: summary.bestWpm || '—' },
          { label: 'Avg Accuracy', value: summary.averageAccuracy ? `${summary.averageAccuracy}%` : '—' },
          { label: 'Lessons Done', value: `${summary.totalLessonsCompleted}/10` },
          {
            label: 'Practice Time',
            value:
              summary.totalPracticeSeconds >= 60
                ? `${Math.round(summary.totalPracticeSeconds / 60)}m`
                : `${summary.totalPracticeSeconds}s`,
          },
          { label: 'Streak', value: `${summary.currentStreakDays}d` },
          { label: 'Tests Taken', value: summary.totalTestsTaken },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4"
          >
            <div className="text-xs text-[var(--text-secondary)]">{card.label}</div>
            <div className="mt-1 text-xl font-bold font-mono-typing text-[var(--text-primary)]">
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State Banner if zero sessions */}
      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-10 text-center space-y-4">
          <BarChart3 className="w-10 h-10 text-[var(--accent-primary)] mx-auto" />
          <h2 className="text-xl font-bold text-[var(--text-primary)]">No recorded typing sessions yet</h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
            Complete a lesson, practice session, or typing speed test to populate your real-time charts and key accuracy heatmap.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-1">
            <Link
              to="/learn"
              className="rounded-xl bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Start Lesson 1
            </Link>
            <Link
              to="/test"
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-5 py-2.5 text-sm font-semibold text-[var(--text-primary)]"
            >
              Take a Typing Test
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. WPM Over Time */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-3">
            <h2 className="text-base font-bold text-[var(--text-primary)]">WPM Over Time</h2>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sessionTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="label" stroke="var(--text-secondary)" fontSize={12} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="wpm"
                    name="Net WPM"
                    stroke="#6558F5"
                    fill="#6558F5"
                    fillOpacity={0.14}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Accuracy Over Time */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-3">
            <h2 className="text-base font-bold text-[var(--text-primary)]">Accuracy Over Time</h2>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sessionTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="label" stroke="var(--text-secondary)" fontSize={12} />
                  <YAxis domain={[50, 100]} stroke="var(--text-secondary)" fontSize={12} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    name="Accuracy %"
                    stroke="#22C5A8"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Practice Duration by Day */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-3">
            <h2 className="text-base font-bold text-[var(--text-primary)]">Practice Duration by Day (min)</h2>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyPractice}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="day" stroke="var(--text-secondary)" fontSize={12} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="minutes" name="Minutes" fill="#6558F5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4. Lesson Completion Accuracy */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-3">
            <h2 className="text-base font-bold text-[var(--text-primary)]">Lesson Best Accuracy (%)</h2>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lessonChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
                  <YAxis domain={[0, 100]} stroke="var(--text-secondary)" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="accuracy" name="Best Accuracy %" fill="#22C5A8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 5. Most Frequently Mistyped Keys */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-3">
            <h2 className="text-base font-bold text-[var(--text-primary)]">Most Frequently Mistyped Keys</h2>
            {mistypedKeys.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-sm text-[var(--text-secondary)]">
                No key errors recorded yet — keep practicing to populate error breakdown.
              </div>
            ) : (
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mistypedKeys}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="key" stroke="var(--text-secondary)" fontSize={12} />
                    <YAxis stroke="var(--text-secondary)" fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="errorRate" name="Error Rate %" fill="#EF5466" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* 6. Personal Best History */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-3">
            <h2 className="text-base font-bold text-[var(--text-primary)]">Personal Best Milestones</h2>
            {personalBests.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-sm text-[var(--text-secondary)]">
                Complete a timed test or scored lesson to track personal best WPM milestones.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 tabular-nums">
                {personalBests.map((pb, idx) => (
                  <div
                    key={`${pb.date}-${idx}`}
                    className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-4 py-2.5 text-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <Trophy className="w-4 h-4 text-[var(--status-warning)]" />
                      <span className="font-mono-typing font-bold text-[var(--text-primary)]">
                        {pb.wpm} WPM
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        ({pb.accuracy}% acc · {pb.mode})
                      </span>
                    </div>
                    <span className="text-xs text-[var(--text-secondary)]">{pb.date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Keyboard Error Heatmap */}
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Interactive Key Accuracy Heatmap
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Click any key to inspect recorded attempts, error rate, and launch targeted weak-key practice.
            </p>
          </div>
          {mistypedKeys.length > 0 && (
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/practice?keys=${encodeURIComponent(
                    mistypedKeys
                      .slice(0, 4)
                      .map((k) => k.key.toLowerCase())
                      .join(',')
                  )}`
                )
              }
              className="rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-xs font-semibold text-white hover:opacity-95 whitespace-nowrap self-start"
            >
              Practice Top Weak Keys
            </button>
          )}
        </div>

        <VirtualKeyboard
          mode="heatmap"
          keyStats={keyStats}
          selectedHeatmapKey={selectedKeyStat?.lookup ?? null}
          onKeySelect={(k) => setSelectedKey(k)}
        />

        {selectedKey && selectedKeyStat && (
          <div
            data-testid="heatmap-key-inspector"
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-5 py-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="font-mono-typing text-lg font-bold text-[var(--text-primary)]">
                  Key: {selectedKey.label}
                </span>
                <span className="text-xs text-[var(--text-secondary)]">
                  Finger: {FINGER_META[selectedKey.finger].label}
                </span>
              </div>
              <div className="text-xs text-[var(--text-secondary)] tabular-nums">
                {selectedKeyStat.attempts > 0
                  ? `Attempts: ${selectedKeyStat.attempts} · Errors: ${selectedKeyStat.errors} · Accuracy: ${selectedKeyStat.accuracy}%`
                  : 'No keystrokes recorded for this key yet.'}
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(`/practice?keys=${encodeURIComponent(selectedKeyStat.lookup)}`)
              }
              className="rounded-lg border border-[var(--accent-primary)] px-4 py-2 text-xs font-semibold text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10"
            >
              Practice &ldquo;{selectedKey.label}&rdquo;
            </button>
          </div>
        )}
      </section>

      {/* Achievements */}
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-[var(--accent-primary)]" />
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Achievements</h2>
          <span className="text-xs text-[var(--text-secondary)] tabular-nums">
            ({achievements.length} / {ACHIEVEMENT_CATALOG.length})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ACHIEVEMENT_CATALOG.map((ach) => {
            const isUnlocked = unlockedSet.has(ach.id);
            return (
              <div
                key={ach.id}
                className={`rounded-xl border p-4 space-y-1.5 ${
                  isUnlocked
                    ? 'border-[var(--accent-primary)]/50 bg-[var(--accent-primary)]/5'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-canvas)] opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[var(--text-primary)]">{ach.title}</span>
                  {isUnlocked ? (
                    <Flame className="w-4 h-4 text-[var(--accent-primary)]" />
                  ) : (
                    <Target className="w-4 h-4 text-[var(--text-secondary)]" />
                  )}
                </div>
                <p className="text-xs text-[var(--text-secondary)]">{ach.description}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
