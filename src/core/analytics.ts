import type { LessonProgressRecord } from './lessons';

export interface TypingSessionRecord {
  id: string;
  mode: 'lesson' | 'practice' | 'test';
  category: string;
  durationSeconds: number;
  rawWpm: number;
  netWpm: number;
  accuracy: number;
  correctCharacters: number;
  incorrectCharacters: number;
  correctedCharacters: number;
  completedAt: string;
}

export interface KeyStatRecord {
  keyIdentifier: string;
  attempts: number;
  errors: number;
  updatedAt: string;
}

export interface GameScoreRecord {
  id: string;
  gameType: 'word-rush' | 'falling-words' | 'typing-race' | 'keyboard-defender' | 'speed-challenge';
  score: number;
  accuracy: number;
  wpm: number;
  level: number;
  createdAt: string;
}

export interface ProgressSummary {
  averageWpm: number;
  bestWpm: number;
  averageAccuracy: number;
  totalLessonsCompleted: number;
  totalStarsEarned: number;
  totalPracticeSeconds: number;
  currentStreakDays: number;
  totalTestsTaken: number;
  totalSessions: number;
}

export type TimeframeFilter = 'daily' | 'weekly' | 'monthly';

export function calculateStreakDays(isoDates: string[], referenceDate = new Date()): number {
  if (isoDates.length === 0) return 0;
  const dayKeys = new Set(
    isoDates
      .map((d) => {
        const dt = new Date(d);
        if (Number.isNaN(dt.getTime())) return null;
        return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      })
      .filter((x): x is string => x !== null)
  );

  if (dayKeys.size === 0) return 0;

  const formatDay = (dt: Date) =>
    `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;

  const cursor = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  if (!dayKeys.has(formatDay(cursor))) {
    // Allow streak to continue if yesterday was active
    cursor.setDate(cursor.getDate() - 1);
    if (!dayKeys.has(formatDay(cursor))) {
      return 0;
    }
  }

  let streak = 0;
  while (dayKeys.has(formatDay(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function computeProgressSummary(
  sessions: TypingSessionRecord[],
  lessonProgress: Record<string, LessonProgressRecord>
): ProgressSummary {
  const completedLessons = Object.values(lessonProgress).filter((l) => l.completed);
  const totalStarsEarned = Object.values(lessonProgress).reduce((sum, l) => sum + (l.stars || 0), 0);

  const scoredSessions = sessions.filter((s) => s.netWpm > 0);
  const averageWpm =
    scoredSessions.length > 0
      ? Math.round(scoredSessions.reduce((sum, s) => sum + s.netWpm, 0) / scoredSessions.length)
      : 0;
  const bestWpm =
    scoredSessions.length > 0
      ? Math.max(...scoredSessions.map((s) => Math.round(s.netWpm)))
      : 0;

  const averageAccuracy =
    sessions.length > 0
      ? Math.round((sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length) * 10) / 10
      : 0;

  const totalPracticeSeconds = Math.round(
    sessions.reduce((sum, s) => sum + Math.max(0, s.durationSeconds), 0)
  );

  const totalTestsTaken = sessions.filter((s) => s.mode === 'test').length;
  const currentStreakDays = calculateStreakDays(sessions.map((s) => s.completedAt));

  return {
    averageWpm,
    bestWpm,
    averageAccuracy,
    totalLessonsCompleted: completedLessons.length,
    totalStarsEarned,
    totalPracticeSeconds,
    currentStreakDays,
    totalTestsTaken,
    totalSessions: sessions.length,
  };
}

export function filterSessionsByTimeframe(
  sessions: TypingSessionRecord[],
  filter: TimeframeFilter,
  now = new Date()
): TypingSessionRecord[] {
  const msWindow =
    filter === 'daily'
      ? 24 * 60 * 60 * 1000
      : filter === 'weekly'
      ? 7 * 24 * 60 * 60 * 1000
      : 30 * 24 * 60 * 60 * 1000;
  const cutoff = now.getTime() - msWindow;
  return sessions.filter((s) => {
    const t = Date.parse(s.completedAt);
    return !Number.isNaN(t) && t >= cutoff;
  });
}

export function getTopMistypedKeys(
  keyStats: Record<string, KeyStatRecord>,
  limit = 8
): Array<{ key: string; errors: number; attempts: number; errorRate: number }> {
  return Object.values(keyStats)
    .filter((k) => k.attempts > 0 && k.errors > 0)
    .map((k) => ({
      key: k.keyIdentifier === 'Space' ? 'Space' : k.keyIdentifier.toUpperCase(),
      errors: k.errors,
      attempts: k.attempts,
      errorRate: Math.round((k.errors / k.attempts) * 1000) / 10,
    }))
    .sort((a, b) => b.errorRate - a.errorRate || b.errors - a.errors)
    .slice(0, limit);
}

export function buildDailyPracticeSeries(sessions: TypingSessionRecord[]) {
  const buckets = new Map<string, { day: string; minutes: number; sessions: number; avgWpm: number; wpmSum: number }>();
  const ordered = [...sessions].sort(
    (a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt)
  );
  for (const s of ordered) {
    const dt = new Date(s.completedAt);
    if (Number.isNaN(dt.getTime())) continue;
    const key = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const prev = buckets.get(key) ?? { day: key, minutes: 0, sessions: 0, avgWpm: 0, wpmSum: 0 };
    const minutes = prev.minutes + s.durationSeconds / 60;
    const count = prev.sessions + 1;
    const wpmSum = prev.wpmSum + s.netWpm;
    buckets.set(key, {
      day: key,
      minutes: Math.round(minutes * 10) / 10,
      sessions: count,
      wpmSum,
      avgWpm: Math.round(wpmSum / count),
    });
  }
  return Array.from(buckets.values()).map(({ day, minutes, sessions: count, avgWpm }) => ({
    day,
    minutes,
    sessions: count,
    avgWpm,
  }));
}

export function buildPersonalBestHistory(sessions: TypingSessionRecord[]) {
  const ordered = [...sessions]
    .filter((s) => s.netWpm > 0)
    .sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt));

  let runningBest = 0;
  const milestones: Array<{ date: string; wpm: number; accuracy: number; mode: string }> = [];
  for (const s of ordered) {
    const rounded = Math.round(s.netWpm);
    if (rounded > runningBest) {
      runningBest = rounded;
      milestones.push({
        date: new Date(s.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        wpm: rounded,
        accuracy: s.accuracy,
        mode: s.mode,
      });
    }
  }
  return milestones;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
}

export const ACHIEVEMENT_CATALOG: AchievementDefinition[] = [
  { id: 'first-lesson', title: 'First Keystrokes', description: 'Complete your first touch-typing lesson.' },
  { id: 'home-row-master', title: 'Home Row Anchor', description: 'Earn 3 stars on the Home Row lesson.' },
  { id: 'halfway-there', title: 'Halfway Curriculum', description: 'Complete at least 5 of the 10 lessons.' },
  { id: 'curriculum-graduate', title: 'Touch Typing Graduate', description: 'Complete all 10 lessons in the curriculum.' },
  { id: 'speed-40', title: '40 WPM Milestone', description: 'Reach 40 Net WPM in any lesson or typing test.' },
  { id: 'speed-70', title: '70 WPM Velocity', description: 'Reach 70 Net WPM in any lesson or typing test.' },
  { id: 'precision-98', title: 'Surgical Precision', description: 'Complete a session with 98% or higher accuracy.' },
  { id: 'arcade-player', title: 'Arcade Challenger', description: 'Record a score in any typing game.' },
];

export function evaluateUnlockedAchievements(
  sessions: TypingSessionRecord[],
  lessonProgress: Record<string, LessonProgressRecord>,
  gameScores: GameScoreRecord[]
): string[] {
  const unlocked = new Set<string>();
  const completedLessons = Object.values(lessonProgress).filter((l) => l.completed);
  if (completedLessons.length >= 1) unlocked.add('first-lesson');
  if ((lessonProgress['home-row']?.stars ?? 0) >= 3) unlocked.add('home-row-master');
  if (completedLessons.length >= 5) unlocked.add('halfway-there');
  if (completedLessons.length >= 10) unlocked.add('curriculum-graduate');
  if (sessions.some((s) => s.netWpm >= 40)) unlocked.add('speed-40');
  if (sessions.some((s) => s.netWpm >= 70)) unlocked.add('speed-70');
  if (sessions.some((s) => s.accuracy >= 98 && s.correctCharacters >= 25)) unlocked.add('precision-98');
  if (gameScores.length >= 1) unlocked.add('arcade-player');
  return Array.from(unlocked);
}
