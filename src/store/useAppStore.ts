import { create } from 'zustand';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';
import {
  mergeLessonProgress,
  type LessonProgressRecord,
} from '../core/lessons';
import {
  evaluateUnlockedAchievements,
  type GameScoreRecord,
  type KeyStatRecord,
  type TypingSessionRecord,
} from '../core/analytics';
import {
  clearGuestData,
  DEFAULT_PREFERENCES,
  loadGuestData,
  loadLocalPreferences,
  saveGuestData,
  saveLocalPreferences,
  type UserPreferencesState,
} from '../core/localHistory';

export interface AuthUserSummary {
  uid: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
}

interface AppState {
  initialized: boolean;
  authLoading: boolean;
  syncing: boolean;
  user: AuthUserSummary | null;
  preferences: UserPreferencesState;
  lessonProgress: Record<string, LessonProgressRecord>;
  sessions: TypingSessionRecord[];
  keyStats: Record<string, KeyStatRecord>;
  gameScores: GameScoreRecord[];
  achievements: string[];
  guestPendingMerge: boolean;
  authError: string | null;
  newAchievementToast: string | null;

  initAuthAndData: () => () => void;
  signInWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  updatePreferences: (partial: Partial<UserPreferencesState>) => Promise<void>;
  recordLessonAttempt: (input: {
    lessonId: string;
    accuracy: number;
    wpm: number;
    stars: number;
    completed: boolean;
    durationSeconds: number;
    rawWpm: number;
    correctCharacters: number;
    incorrectCharacters: number;
    correctedCharacters: number;
    keyStats: Record<string, { attempts: number; errors: number }>;
  }) => Promise<void>;
  recordTypingSession: (input: {
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
  }) => Promise<void>;
  recordGameScore: (input: {
    gameType: GameScoreRecord['gameType'];
    score: number;
    accuracy: number;
    wpm: number;
    level: number;
  }) => Promise<void>;
  mergeGuestIntoAccount: () => Promise<void>;
  dismissGuestMerge: () => void;
  clearHistory: () => Promise<void>;
  dismissAchievementToast: () => void;
}

function applyThemeToDom(theme: 'light' | 'dark') {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

async function authorizedFetch(url: string, options: RequestInit = {}) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Not authenticated');
  const token = await currentUser.getIdToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

function mapBundleToState(bundle: {
  profile?: { displayName?: string; avatarUrl?: string | null; typingGoalWpm?: number; preferredDifficulty?: string } | null;
  preferences?: { theme?: string; soundEnabled?: boolean; keyboardLayout?: string; preferredDuration?: number; showKeyboard?: boolean; highlightErrors?: boolean } | null;
  lessonProgress?: Array<{ lessonId: string; bestAccuracy: number; bestWpm: number; stars: number; completed: boolean; attempts: number; updatedAt: string }>;
  sessions?: Array<{ id: number | string; mode: string; category: string; durationSeconds: number; rawWpm: number; netWpm: number; accuracy: number; correctCharacters: number; incorrectCharacters: number; correctedCharacters: number; completedAt: string }>;
  keyStats?: Array<{ keyIdentifier: string; attempts: number; errors: number; updatedAt: string }>;
  gameScores?: Array<{ id: number | string; gameType: string; score: number; accuracy: number; wpm: number; level: number; createdAt: string }>;
  achievements?: string[];
}, currentPrefs: UserPreferencesState) {
  const lpMap: Record<string, LessonProgressRecord> = {};
  for (const row of bundle.lessonProgress ?? []) {
    lpMap[row.lessonId] = {
      lessonId: row.lessonId,
      bestAccuracy: row.bestAccuracy,
      bestWpm: row.bestWpm,
      stars: row.stars,
      completed: row.completed,
      attempts: row.attempts,
      updatedAt: row.updatedAt,
    };
  }

  const sessions: TypingSessionRecord[] = (bundle.sessions ?? []).map((s) => ({
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
    completedAt: s.completedAt,
  }));

  const keyStats: Record<string, KeyStatRecord> = {};
  for (const k of bundle.keyStats ?? []) {
    keyStats[k.keyIdentifier] = {
      keyIdentifier: k.keyIdentifier,
      attempts: k.attempts,
      errors: k.errors,
      updatedAt: k.updatedAt,
    };
  }

  const gameScores: GameScoreRecord[] = (bundle.gameScores ?? []).map((g) => ({
    id: String(g.id),
    gameType: g.gameType as GameScoreRecord['gameType'],
    score: g.score,
    accuracy: g.accuracy,
    wpm: g.wpm,
    level: g.level,
    createdAt: g.createdAt,
  }));

  const prefs: UserPreferencesState = {
    ...currentPrefs,
    theme: (bundle.preferences?.theme as 'light' | 'dark') ?? currentPrefs.theme,
    soundEnabled: bundle.preferences?.soundEnabled ?? currentPrefs.soundEnabled,
    keyboardLayout: (bundle.preferences?.keyboardLayout as 'US' | 'UK') ?? currentPrefs.keyboardLayout,
    preferredDuration: (bundle.preferences?.preferredDuration as 15 | 30 | 60 | 120) ?? currentPrefs.preferredDuration,
    showKeyboard: bundle.preferences?.showKeyboard ?? currentPrefs.showKeyboard,
    highlightErrors: bundle.preferences?.highlightErrors ?? currentPrefs.highlightErrors,
    displayName: bundle.profile?.displayName ?? currentPrefs.displayName,
    typingGoalWpm: bundle.profile?.typingGoalWpm ?? currentPrefs.typingGoalWpm,
    preferredDifficulty: (bundle.profile?.preferredDifficulty as UserPreferencesState['preferredDifficulty']) ?? currentPrefs.preferredDifficulty,
  };

  return {
    preferences: prefs,
    lessonProgress: lpMap,
    sessions,
    keyStats,
    gameScores,
    achievements: bundle.achievements ?? evaluateUnlockedAchievements(sessions, lpMap, gameScores),
  };
}

export const useAppStore = create<AppState>((set, get) => {
  const initialPrefs = loadLocalPreferences();
  applyThemeToDom(initialPrefs.theme);

  return {
    initialized: false,
    authLoading: true,
    syncing: false,
    user: null,
    preferences: initialPrefs,
    lessonProgress: {},
    sessions: [],
    keyStats: {},
    gameScores: [],
    achievements: [],
    guestPendingMerge: false,
    authError: null,
    newAchievementToast: null,

    initAuthAndData: () => {
      // Load local guest data immediately for zero-latency boot
      loadGuestData().then((guest) => {
        if (!get().user) {
          const achievements = evaluateUnlockedAchievements(
            guest.sessions,
            guest.lessons,
            guest.gameScores
          );
          set({
            lessonProgress: guest.lessons,
            sessions: guest.sessions,
            keyStats: guest.keyStats,
            gameScores: guest.gameScores,
            achievements,
            initialized: true,
          });
        }
      });

      const unsubscribe = onAuthStateChanged(auth, async (fbUser: User | null) => {
        if (!fbUser) {
          const guest = await loadGuestData();
          const prefs = loadLocalPreferences();
          applyThemeToDom(prefs.theme);
          set({
            user: null,
            authLoading: false,
            initialized: true,
            guestPendingMerge: false,
            preferences: prefs,
            lessonProgress: guest.lessons,
            sessions: guest.sessions,
            keyStats: guest.keyStats,
            gameScores: guest.gameScores,
            achievements: evaluateUnlockedAchievements(
              guest.sessions,
              guest.lessons,
              guest.gameScores
            ),
          });
          return;
        }

        set({
          authLoading: false,
          syncing: true,
          authError: null,
          user: {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Typist',
            avatarUrl: fbUser.photoURL,
          },
        });

        try {
          const bundle = await authorizedFetch('/api/me');
          const mapped = mapBundleToState(bundle, get().preferences);
          applyThemeToDom(mapped.preferences.theme);
          saveLocalPreferences(mapped.preferences);

          const guest = await loadGuestData();
          const hasGuestProgress =
            Object.keys(guest.lessons).length > 0 || guest.sessions.length > 0;

          set({
            ...mapped,
            initialized: true,
            syncing: false,
            guestPendingMerge: hasGuestProgress,
          });
        } catch (error) {
          console.error('Failed to sync with server:', error);
          set({ initialized: true, syncing: false });
        }
      });

      return unsubscribe;
    },

    signInWithGoogle: async () => {
      set({ authError: null });
      try {
        await signInWithPopup(auth, googleAuthProvider);
        return true;
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Unable to complete sign-in. Please try again.';
        set({ authError: message });
        return false;
      }
    },

    logout: async () => {
      await signOut(auth);
      set({ user: null, guestPendingMerge: false });
    },

    updatePreferences: async (partial) => {
      const nextPrefs: UserPreferencesState = { ...get().preferences, ...partial };
      if (partial.theme) {
        applyThemeToDom(partial.theme);
      }
      saveLocalPreferences(nextPrefs);
      set({ preferences: nextPrefs });

      if (get().user) {
        try {
          await authorizedFetch('/api/preferences', {
            method: 'PATCH',
            body: JSON.stringify(partial),
          });
        } catch (error) {
          console.error('Failed to persist preferences to server:', error);
        }
      }
    },

    recordLessonAttempt: async (input) => {
      const nowIso = new Date().toISOString();
      const prevMap = get().lessonProgress;
      const existing = prevMap[input.lessonId];
      const nextRec: LessonProgressRecord = {
        lessonId: input.lessonId,
        bestAccuracy: Math.max(existing?.bestAccuracy ?? 0, input.accuracy),
        bestWpm: Math.max(existing?.bestWpm ?? 0, input.wpm),
        stars: Math.max(existing?.stars ?? 0, input.stars),
        completed: (existing?.completed ?? false) || input.completed,
        attempts: (existing?.attempts ?? 0) + 1,
        updatedAt: nowIso,
      };
      const nextLessons = { ...prevMap, [input.lessonId]: nextRec };
      set({ lessonProgress: nextLessons });

      await get().recordTypingSession({
        mode: 'lesson',
        category: input.lessonId,
        durationSeconds: input.durationSeconds,
        rawWpm: input.rawWpm,
        netWpm: input.wpm,
        accuracy: input.accuracy,
        correctCharacters: input.correctCharacters,
        incorrectCharacters: input.incorrectCharacters,
        correctedCharacters: input.correctedCharacters,
        keyStats: input.keyStats,
      });

      if (get().user) {
        try {
          await authorizedFetch('/api/lesson-progress', {
            method: 'POST',
            body: JSON.stringify({
              lessonId: input.lessonId,
              accuracy: input.accuracy,
              wpm: input.wpm,
              stars: input.stars,
              completed: input.completed,
            }),
          });
        } catch (error) {
          console.error('Failed to save lesson progress:', error);
        }
      } else {
        await saveGuestData({
          lessons: nextLessons,
          sessions: get().sessions,
          keyStats: get().keyStats,
          gameScores: get().gameScores,
        });
      }
    },

    recordTypingSession: async (input) => {
      const nowIso = new Date().toISOString();
      const newSession: TypingSessionRecord = {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        mode: input.mode,
        category: input.category,
        durationSeconds: input.durationSeconds,
        rawWpm: input.rawWpm,
        netWpm: input.netWpm,
        accuracy: input.accuracy,
        correctCharacters: input.correctCharacters,
        incorrectCharacters: input.incorrectCharacters,
        correctedCharacters: input.correctedCharacters,
        completedAt: nowIso,
      };

      const nextSessions = [newSession, ...get().sessions].slice(0, 100);
      const nextKeyStats = { ...get().keyStats };
      for (const [k, stat] of Object.entries(input.keyStats)) {
        const cur = nextKeyStats[k];
        nextKeyStats[k] = {
          keyIdentifier: k,
          attempts: (cur?.attempts ?? 0) + stat.attempts,
          errors: (cur?.errors ?? 0) + stat.errors,
          updatedAt: nowIso,
        };
      }

      const prevAchievements = new Set(get().achievements);
      const nextAchievements = evaluateUnlockedAchievements(
        nextSessions,
        get().lessonProgress,
        get().gameScores
      );
      const newlyUnlocked = nextAchievements.find((a) => !prevAchievements.has(a)) ?? null;

      set({
        sessions: nextSessions,
        keyStats: nextKeyStats,
        achievements: nextAchievements,
        newAchievementToast: newlyUnlocked ?? get().newAchievementToast,
      });

      if (get().user) {
        try {
          await authorizedFetch('/api/typing-sessions', {
            method: 'POST',
            body: JSON.stringify(input),
          });
        } catch (error) {
          console.error('Failed to persist typing session:', error);
        }
      } else {
        await saveGuestData({
          lessons: get().lessonProgress,
          sessions: nextSessions,
          keyStats: nextKeyStats,
          gameScores: get().gameScores,
        });
      }
    },

    recordGameScore: async (input) => {
      const nowIso = new Date().toISOString();
      const entry: GameScoreRecord = {
        id: `game-${Date.now()}`,
        ...input,
        createdAt: nowIso,
      };
      const nextGames = [entry, ...get().gameScores].slice(0, 50);
      const nextAchievements = evaluateUnlockedAchievements(
        get().sessions,
        get().lessonProgress,
        nextGames
      );
      set({ gameScores: nextGames, achievements: nextAchievements });

      if (get().user) {
        try {
          await authorizedFetch('/api/game-scores', {
            method: 'POST',
            body: JSON.stringify(input),
          });
        } catch (error) {
          console.error('Failed to persist game score:', error);
        }
      } else {
        await saveGuestData({
          lessons: get().lessonProgress,
          sessions: get().sessions,
          keyStats: get().keyStats,
          gameScores: nextGames,
        });
      }
    },

    mergeGuestIntoAccount: async () => {
      if (!get().user) return;
      const guest = await loadGuestData();
      const mergedLessons = mergeLessonProgress(guest.lessons, get().lessonProgress);
      set({ syncing: true });
      try {
        const bundle = await authorizedFetch('/api/merge-guest', {
          method: 'POST',
          body: JSON.stringify({
            lessons: Object.values(mergedLessons),
            sessions: guest.sessions.map((s) => ({
              mode: s.mode,
              category: s.category,
              durationSeconds: s.durationSeconds,
              rawWpm: s.rawWpm,
              netWpm: s.netWpm,
              accuracy: s.accuracy,
              correctCharacters: s.correctCharacters,
              incorrectCharacters: s.incorrectCharacters,
              correctedCharacters: s.correctedCharacters,
            })),
          }),
        });
        await clearGuestData();
        const mapped = mapBundleToState(bundle, get().preferences);
        set({ ...mapped, syncing: false, guestPendingMerge: false });
      } catch (error) {
        console.error('Guest merge failed:', error);
        set({ syncing: false });
      }
    },

    dismissGuestMerge: () => set({ guestPendingMerge: false }),

    clearHistory: async () => {
      if (get().user) {
        await authorizedFetch('/api/history', { method: 'DELETE' });
      } else {
        await clearGuestData();
      }
      set({
        lessonProgress: {},
        sessions: [],
        keyStats: {},
        gameScores: [],
        achievements: [],
      });
    },

    dismissAchievementToast: () => set({ newAchievementToast: null }),
  };
});
