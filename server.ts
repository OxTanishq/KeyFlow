import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { z } from 'zod';
import { createServer as createViteServer } from 'vite';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import {
  deleteUserHistory,
  getOrCreateProfile,
  getPublicLeaderboard,
  getUserBundle,
  mergeGuestProgress,
  recordGameScoreRow,
  recordTypingSessionAndKeys,
  updateProfileAndPreferences,
  upsertLessonProgressRow,
} from './src/db/repository.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const lessonProgressSchema = z.object({
  lessonId: z.string().min(1).max(64),
  accuracy: z.number().min(0).max(100),
  wpm: z.number().min(0).max(350),
  stars: z.number().int().min(0).max(3),
  completed: z.boolean(),
});

const typingSessionSchema = z.object({
  mode: z.enum(['lesson', 'practice', 'test']),
  category: z.string().min(1).max(64),
  durationSeconds: z.number().min(0).max(7200),
  rawWpm: z.number().min(0).max(350),
  netWpm: z.number().min(0).max(350),
  accuracy: z.number().min(0).max(100),
  correctCharacters: z.number().int().min(0).max(50000),
  incorrectCharacters: z.number().int().min(0).max(50000),
  correctedCharacters: z.number().int().min(0).max(50000).default(0),
  keyStats: z
    .record(
      z.string().max(16),
      z.object({
        attempts: z.number().int().min(0).max(50000),
        errors: z.number().int().min(0).max(50000),
      })
    )
    .default({}),
});

const gameScoreSchema = z.object({
  gameType: z.enum([
    'word-rush',
    'falling-words',
    'typing-race',
    'keyboard-defender',
    'speed-challenge',
  ]),
  score: z.number().int().min(0).max(1000000),
  accuracy: z.number().min(0).max(100),
  wpm: z.number().min(0).max(350).default(0),
  level: z.number().int().min(1).max(100).default(1),
});

const preferencesSchema = z.object({
  displayName: z.string().trim().min(1).max(60).optional(),
  avatarUrl: z.string().max(300).nullable().optional(),
  typingGoalWpm: z.number().int().min(15).max(250).optional(),
  preferredDifficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  theme: z.enum(['light', 'dark']).optional(),
  soundEnabled: z.boolean().optional(),
  keyboardLayout: z.enum(['US', 'UK']).optional(),
  preferredDuration: z.number().int().min(15).max(120).optional(),
  showKeyboard: z.boolean().optional(),
  highlightErrors: z.boolean().optional(),
});

const mergeGuestSchema = z.object({
  lessons: z
    .array(
      z.object({
        lessonId: z.string().min(1).max(64),
        bestAccuracy: z.number().min(0).max(100),
        bestWpm: z.number().min(0).max(350),
        stars: z.number().int().min(0).max(3),
        completed: z.boolean(),
        attempts: z.number().int().min(0).max(10000),
        updatedAt: z.string(),
      })
    )
    .max(20),
  sessions: z
    .array(
      typingSessionSchema.omit({ keyStats: true })
    )
    .max(50),
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '256kb' }));

  // Security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Public leaderboard (exposes only displayName, avatarUrl, bestWpm, avgAccuracy, totalSessions)
  app.get('/api/leaderboard', async (_req, res) => {
    try {
      const leaders = await getPublicLeaderboard(25);
      res.json({ leaders });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to load leaderboard';
      res.status(500).json({ error: message });
    }
  });

  // Sync user & load full learning bundle
  app.get('/api/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      await getOrCreateProfile(
        user.uid,
        user.email || `${user.uid}@users.keyflow.local`,
        user.name,
        user.picture ?? null
      );
      const bundle = await getUserBundle(user.uid);
      res.json(bundle);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load profile';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/lesson-progress', requireAuth, async (req: AuthRequest, res) => {
    const parsed = lessonProgressSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid lesson progress payload' });
      return;
    }
    try {
      const user = req.user!;
      await getOrCreateProfile(user.uid, user.email || `${user.uid}@users.keyflow.local`, user.name);
      const row = await upsertLessonProgressRow(user.uid, parsed.data);
      res.json({ lessonProgress: row });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save lesson progress';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/typing-sessions', requireAuth, async (req: AuthRequest, res) => {
    const parsed = typingSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid typing session payload' });
      return;
    }
    try {
      const user = req.user!;
      await getOrCreateProfile(user.uid, user.email || `${user.uid}@users.keyflow.local`, user.name);
      const row = await recordTypingSessionAndKeys(user.uid, parsed.data);
      res.json({ session: row });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to record session';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/game-scores', requireAuth, async (req: AuthRequest, res) => {
    const parsed = gameScoreSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid game score payload' });
      return;
    }
    try {
      const user = req.user!;
      await getOrCreateProfile(user.uid, user.email || `${user.uid}@users.keyflow.local`, user.name);
      const row = await recordGameScoreRow(user.uid, parsed.data);
      res.json({ gameScore: row });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save game score';
      res.status(500).json({ error: message });
    }
  });

  app.patch('/api/preferences', requireAuth, async (req: AuthRequest, res) => {
    const parsed = preferencesSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid preferences payload' });
      return;
    }
    try {
      const user = req.user!;
      await getOrCreateProfile(user.uid, user.email || `${user.uid}@users.keyflow.local`, user.name);
      const bundle = await updateProfileAndPreferences(user.uid, parsed.data);
      res.json(bundle);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update preferences';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/merge-guest', requireAuth, async (req: AuthRequest, res) => {
    const parsed = mergeGuestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid guest merge payload' });
      return;
    }
    try {
      const user = req.user!;
      await getOrCreateProfile(user.uid, user.email || `${user.uid}@users.keyflow.local`, user.name);
      const bundle = await mergeGuestProgress(user.uid, parsed.data);
      res.json(bundle);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to merge guest progress';
      res.status(500).json({ error: message });
    }
  });

  app.delete('/api/history', requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      await deleteUserHistory(user.uid);
      res.json({ cleared: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete history';
      res.status(500).json({ error: message });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT || 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`KeyFlow server running on http://0.0.0.0:${port}`);
  });
}

startServer();
