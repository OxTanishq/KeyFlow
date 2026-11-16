import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from './index.ts';
import {
  achievements,
  gameScores,
  keyStatistics,
  lessonProgress,
  lessons,
  profiles,
  typingSessions,
  userPreferences,
} from './schema.ts';
import { LESSONS, type LessonProgressRecord } from '../core/lessons.ts';
import { evaluateUnlockedAchievements } from '../core/analytics.ts';

let lessonsSeeded = false;

export async function ensureLessonsSeeded() {
  if (lessonsSeeded) return;
  try {
    for (const lesson of LESSONS) {
      await db
        .insert(lessons)
        .values({
          id: lesson.id,
          sequenceNumber: lesson.sequenceNumber,
          title: lesson.title,
          description: lesson.description,
          requiredAccuracy: lesson.requiredAccuracy,
          coveredKeys: lesson.coveredKeys.join(','),
          content: lesson.content,
        })
        .onConflictDoUpdate({
          target: lessons.id,
          set: {
            sequenceNumber: lesson.sequenceNumber,
            title: lesson.title,
            description: lesson.description,
            requiredAccuracy: lesson.requiredAccuracy,
            coveredKeys: lesson.coveredKeys.join(','),
            content: lesson.content,
          },
        });
    }
    lessonsSeeded = true;
  } catch (error) {
    console.error('Failed to seed lessons:', error);
    throw new Error('Failed to initialize curriculum catalog.', { cause: error });
  }
}

export async function getOrCreateProfile(uid: string, email: string, displayName?: string, avatarUrl?: string | null) {
  try {
    const fallbackName = displayName?.trim() || email.split('@')[0] || 'Typist';
    const [profile] = await db
      .insert(profiles)
      .values({
        uid,
        email,
        displayName: fallbackName,
        avatarUrl: avatarUrl ?? null,
      })
      .onConflictDoUpdate({
        target: profiles.uid,
        set: {
          email,
          updatedAt: new Date(),
        },
      })
      .returning();

    await db
      .insert(userPreferences)
      .values({ userId: uid })
      .onConflictDoNothing({ target: userPreferences.userId });

    return profile;
  } catch (error) {
    console.error('getOrCreateProfile failed:', error);
    throw new Error('Database error synchronizing user profile.', { cause: error });
  }
}

export async function getUserBundle(uid: string) {
  try {
    await ensureLessonsSeeded();
    const [profile] = await db.select().from(profiles).where(eq(profiles.uid, uid));
    const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, uid));
    const lpRows = await db.select().from(lessonProgress).where(eq(lessonProgress.userId, uid));
    const sessionRows = await db
      .select()
      .from(typingSessions)
      .where(eq(typingSessions.userId, uid))
      .orderBy(desc(typingSessions.completedAt))
      .limit(100);
    const keyRows = await db.select().from(keyStatistics).where(eq(keyStatistics.userId, uid));
    const gameRows = await db
      .select()
      .from(gameScores)
      .where(eq(gameScores.userId, uid))
      .orderBy(desc(gameScores.createdAt))
      .limit(50);
    const achievementRows = await db.select().from(achievements).where(eq(achievements.userId, uid));

    return {
      profile: profile ?? null,
      preferences: prefs ?? null,
      lessonProgress: lpRows,
      sessions: sessionRows,
      keyStats: keyRows,
      gameScores: gameRows,
      achievements: achievementRows.map((a) => a.achievementType),
    };
  } catch (error) {
    console.error('getUserBundle failed:', error);
    throw new Error('Failed to load user learning history.', { cause: error });
  }
}

export async function upsertLessonProgressRow(
  uid: string,
  input: {
    lessonId: string;
    accuracy: number;
    wpm: number;
    stars: number;
    completed: boolean;
  }
) {
  try {
    await ensureLessonsSeeded();
    const [existing] = await db
      .select()
      .from(lessonProgress)
      .where(and(eq(lessonProgress.userId, uid), eq(lessonProgress.lessonId, input.lessonId)));

    if (!existing) {
      const [inserted] = await db
        .insert(lessonProgress)
        .values({
          userId: uid,
          lessonId: input.lessonId,
          bestAccuracy: input.accuracy,
          bestWpm: input.wpm,
          stars: input.stars,
          completed: input.completed,
          attempts: 1,
          updatedAt: new Date(),
        })
        .returning();
      return inserted;
    }

    const [updated] = await db
      .update(lessonProgress)
      .set({
        bestAccuracy: Math.max(existing.bestAccuracy, input.accuracy),
        bestWpm: Math.max(existing.bestWpm, input.wpm),
        stars: Math.max(existing.stars, input.stars),
        completed: existing.completed || input.completed,
        attempts: existing.attempts + 1,
        updatedAt: new Date(),
      })
      .where(eq(lessonProgress.id, existing.id))
      .returning();
    return updated;
  } catch (error) {
    console.error('upsertLessonProgressRow failed:', error);
    throw new Error('Failed to save lesson progress.', { cause: error });
  }
}

export async function recordTypingSessionAndKeys(
  uid: string,
  sessionInput: {
    mode: 'lesson' | 'practice' | 'test';
    category: string;
    durationSeconds: number;
    rawWpm: number;
    netWpm: number;
    accuracy: number;
    correctCharacters: number;
    incorrectCharacters: number;
    correctedCharacters: number;
    keyStats: Record<string, { attempts: number; errors: number }>;
  }
) {
  try {
    const [sessionRow] = await db
      .insert(typingSessions)
      .values({
        userId: uid,
        mode: sessionInput.mode,
        category: sessionInput.category,
        durationSeconds: sessionInput.durationSeconds,
        rawWpm: sessionInput.rawWpm,
        netWpm: sessionInput.netWpm,
        accuracy: sessionInput.accuracy,
        correctCharacters: sessionInput.correctCharacters,
        incorrectCharacters: sessionInput.incorrectCharacters,
        correctedCharacters: sessionInput.correctedCharacters,
      })
      .returning();

    for (const [keyIdentifier, stat] of Object.entries(sessionInput.keyStats)) {
      if (stat.attempts <= 0) continue;
      await db
        .insert(keyStatistics)
        .values({
          userId: uid,
          keyIdentifier: keyIdentifier.slice(0, 16),
          attempts: stat.attempts,
          errors: stat.errors,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [keyStatistics.userId, keyStatistics.keyIdentifier],
          set: {
            attempts: sql`${keyStatistics.attempts} + ${stat.attempts}`,
            errors: sql`${keyStatistics.errors} + ${stat.errors}`,
            updatedAt: new Date(),
          },
        });
    }

    await syncAchievements(uid);
    return sessionRow;
  } catch (error) {
    console.error('recordTypingSessionAndKeys failed:', error);
    throw new Error('Failed to save typing session.', { cause: error });
  }
}

export async function recordGameScoreRow(
  uid: string,
  input: {
    gameType: 'word-rush' | 'falling-words' | 'typing-race' | 'keyboard-defender' | 'speed-challenge';
    score: number;
    accuracy: number;
    wpm: number;
    level: number;
  }
) {
  try {
    const [row] = await db
      .insert(gameScores)
      .values({
        userId: uid,
        gameType: input.gameType,
        score: input.score,
        accuracy: input.accuracy,
        wpm: input.wpm,
        level: input.level,
      })
      .returning();
    await syncAchievements(uid);
    return row;
  } catch (error) {
    console.error('recordGameScoreRow failed:', error);
    throw new Error('Failed to save game score.', { cause: error });
  }
}

export async function updateProfileAndPreferences(
  uid: string,
  input: {
    displayName?: string;
    avatarUrl?: string | null;
    typingGoalWpm?: number;
    preferredDifficulty?: string;
    theme?: string;
    soundEnabled?: boolean;
    keyboardLayout?: string;
    preferredDuration?: number;
    showKeyboard?: boolean;
    highlightErrors?: boolean;
  }
) {
  try {
    if (
      input.displayName !== undefined ||
      input.avatarUrl !== undefined ||
      input.typingGoalWpm !== undefined ||
      input.preferredDifficulty !== undefined
    ) {
      const profileUpdate: Partial<typeof profiles.$inferInsert> = { updatedAt: new Date() };
      if (input.displayName !== undefined) profileUpdate.displayName = input.displayName;
      if (input.avatarUrl !== undefined) profileUpdate.avatarUrl = input.avatarUrl;
      if (input.typingGoalWpm !== undefined) profileUpdate.typingGoalWpm = input.typingGoalWpm;
      if (input.preferredDifficulty !== undefined) profileUpdate.preferredDifficulty = input.preferredDifficulty;

      await db.update(profiles).set(profileUpdate).where(eq(profiles.uid, uid));
    }

    const prefUpdate: Partial<typeof userPreferences.$inferInsert> = { updatedAt: new Date() };
    if (input.theme !== undefined) prefUpdate.theme = input.theme;
    if (input.soundEnabled !== undefined) prefUpdate.soundEnabled = input.soundEnabled;
    if (input.keyboardLayout !== undefined) prefUpdate.keyboardLayout = input.keyboardLayout;
    if (input.preferredDuration !== undefined) prefUpdate.preferredDuration = input.preferredDuration;
    if (input.showKeyboard !== undefined) prefUpdate.showKeyboard = input.showKeyboard;
    if (input.highlightErrors !== undefined) prefUpdate.highlightErrors = input.highlightErrors;

    if (Object.keys(prefUpdate).length > 1) {
      await db.update(userPreferences).set(prefUpdate).where(eq(userPreferences.userId, uid));
    }

    return await getUserBundle(uid);
  } catch (error) {
    console.error('updateProfileAndPreferences failed:', error);
    throw new Error('Failed to update user preferences.', { cause: error });
  }
}

export async function syncAchievements(uid: string) {
  try {
    const bundle = await getUserBundle(uid);
    const lpMap: Record<string, LessonProgressRecord> = {};
    for (const row of bundle.lessonProgress) {
      lpMap[row.lessonId] = {
        lessonId: row.lessonId,
        bestAccuracy: row.bestAccuracy,
        bestWpm: row.bestWpm,
        stars: row.stars,
        completed: row.completed,
        attempts: row.attempts,
        updatedAt: row.updatedAt.toISOString(),
      };
    }
    const unlocked = evaluateUnlockedAchievements(
      bundle.sessions.map((s) => ({
        id: String(s.id),
        mode: s.mode as 'lesson' | 'practice' | 'test',
        category: s.category,
        durationSeconds: s.durationSeconds,
        rawWpm: s.rawWpm,
        netWpm: s.netWpm,
        accuracy: s.accuracy,
        correctCharacters: s.correctCharacters,
        incorrectCharacters: s.incorrectCharacters,
        correctedCharacters: s.correctedCharacters,
        completedAt: s.completedAt.toISOString(),
      })),
      lpMap,
      bundle.gameScores.map((g) => ({
        id: String(g.id),
        gameType: g.gameType as 'word-rush',
        score: g.score,
        accuracy: g.accuracy,
        wpm: g.wpm,
        level: g.level,
        createdAt: g.createdAt.toISOString(),
      }))
    );

    for (const achievementType of unlocked) {
      await db
        .insert(achievements)
        .values({ userId: uid, achievementType })
        .onConflictDoNothing({ target: [achievements.userId, achievements.achievementType] });
    }
  } catch (error) {
    console.error('syncAchievements failed:', error);
  }
}

export async function mergeGuestProgress(
  uid: string,
  payload: {
    lessons: LessonProgressRecord[];
    sessions: Array<{
      mode: 'lesson' | 'practice' | 'test';
      category: string;
      durationSeconds: number;
      rawWpm: number;
      netWpm: number;
      accuracy: number;
      correctCharacters: number;
      incorrectCharacters: number;
      correctedCharacters: number;
    }>;
  }
) {
  try {
    await ensureLessonsSeeded();
    for (const item of payload.lessons) {
      await upsertLessonProgressRow(uid, {
        lessonId: item.lessonId,
        accuracy: item.bestAccuracy,
        wpm: item.bestWpm,
        stars: item.stars,
        completed: item.completed,
      });
    }
    for (const sess of payload.sessions.slice(0, 25)) {
      await db.insert(typingSessions).values({
        userId: uid,
        mode: sess.mode,
        category: sess.category,
        durationSeconds: sess.durationSeconds,
        rawWpm: sess.rawWpm,
        netWpm: sess.netWpm,
        accuracy: sess.accuracy,
        correctCharacters: sess.correctCharacters,
        incorrectCharacters: sess.incorrectCharacters,
        correctedCharacters: sess.correctedCharacters,
      });
    }
    await syncAchievements(uid);
    return await getUserBundle(uid);
  } catch (error) {
    console.error('mergeGuestProgress failed:', error);
    throw new Error('Failed to merge guest progress.', { cause: error });
  }
}

export async function getPublicLeaderboard(limit = 20) {
  try {
    const rows = await db
      .select({
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
        bestWpm: sql<number>`COALESCE(MAX(${typingSessions.netWpm}), 0)`,
        avgAccuracy: sql<number>`COALESCE(AVG(${typingSessions.accuracy}), 0)`,
        totalSessions: sql<number>`COUNT(${typingSessions.id})`,
      })
      .from(profiles)
      .innerJoin(typingSessions, eq(profiles.uid, typingSessions.userId))
      .groupBy(profiles.uid, profiles.displayName, profiles.avatarUrl)
      .orderBy(desc(sql`COALESCE(MAX(${typingSessions.netWpm}), 0)`))
      .limit(limit);

    return rows.map((r, idx) => ({
      rank: idx + 1,
      displayName: r.displayName,
      avatarUrl: r.avatarUrl,
      bestWpm: Math.round(Number(r.bestWpm)),
      avgAccuracy: Math.round(Number(r.avgAccuracy) * 10) / 10,
      totalSessions: Number(r.totalSessions),
    }));
  } catch (error) {
    console.error('getPublicLeaderboard failed:', error);
    throw new Error('Failed to fetch leaderboard.', { cause: error });
  }
}

export async function deleteUserHistory(uid: string) {
  try {
    await db.delete(lessonProgress).where(eq(lessonProgress.userId, uid));
    await db.delete(typingSessions).where(eq(typingSessions.userId, uid));
    await db.delete(keyStatistics).where(eq(keyStatistics.userId, uid));
    await db.delete(gameScores).where(eq(gameScores.userId, uid));
    await db.delete(achievements).where(eq(achievements.userId, uid));
    return true;
  } catch (error) {
    console.error('deleteUserHistory failed:', error);
    throw new Error('Failed to clear user typing history.', { cause: error });
  }
}
