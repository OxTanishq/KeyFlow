import type { LessonProgressRecord } from './lessons';
import type { GameScoreRecord, KeyStatRecord, TypingSessionRecord } from './analytics';

export interface UserPreferencesState {
  theme: 'light' | 'dark';
  soundEnabled: boolean;
  keyboardLayout: 'US' | 'UK';
  preferredDuration: 15 | 30 | 60 | 120;
  showKeyboard: boolean;
  highlightErrors: boolean;
  displayName: string;
  typingGoalWpm: number;
  preferredDifficulty: 'beginner' | 'intermediate' | 'advanced';
}

export const DEFAULT_PREFERENCES: UserPreferencesState = {
  theme: 'light',
  soundEnabled: true,
  keyboardLayout: 'US',
  preferredDuration: 60,
  showKeyboard: true,
  highlightErrors: true,
  displayName: 'Guest Typist',
  typingGoalWpm: 60,
  preferredDifficulty: 'intermediate',
};

const PREFS_KEY = 'keyflow_preferences_v1';
const LESSONS_KEY = 'keyflow_guest_lessons_v1';
const SESSIONS_KEY = 'keyflow_guest_sessions_v1';
const KEYSTATS_KEY = 'keyflow_guest_keystats_v1';
const GAMES_KEY = 'keyflow_guest_games_v1';

const DB_NAME = 'keyflow_indexed_db';
const DB_VERSION = 1;

function openIndexedDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('history')) {
          db.createObjectStore('history');
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openIndexedDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction('history', 'readonly');
      const store = tx.objectStore('history');
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbSet<T>(key: string, value: T): Promise<void> {
  const db = await openIndexedDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction('history', 'readwrite');
      const store = tx.objectStore('history');
      store.put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export function loadLocalPreferences(): UserPreferencesState {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function saveLocalPreferences(prefs: UserPreferencesState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage quota errors
  }
}

export async function loadGuestData(): Promise<{
  lessons: Record<string, LessonProgressRecord>;
  sessions: TypingSessionRecord[];
  keyStats: Record<string, KeyStatRecord>;
  gameScores: GameScoreRecord[];
}> {
  const idbLessons = await idbGet<Record<string, LessonProgressRecord>>('lessons');
  const idbSessions = await idbGet<TypingSessionRecord[]>('sessions');
  const idbKeyStats = await idbGet<Record<string, KeyStatRecord>>('keyStats');
  const idbGames = await idbGet<GameScoreRecord[]>('gameScores');

  const readLs = <T,>(k: string, fallback: T): T => {
    if (typeof window === 'undefined') return fallback;
    try {
      const raw = window.localStorage.getItem(k);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  };

  return {
    lessons: idbLessons ?? readLs(LESSONS_KEY, {}),
    sessions: idbSessions ?? readLs(SESSIONS_KEY, []),
    keyStats: idbKeyStats ?? readLs(KEYSTATS_KEY, {}),
    gameScores: idbGames ?? readLs(GAMES_KEY, []),
  };
}

export async function saveGuestData(data: {
  lessons: Record<string, LessonProgressRecord>;
  sessions: TypingSessionRecord[];
  keyStats: Record<string, KeyStatRecord>;
  gameScores: GameScoreRecord[];
}): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(LESSONS_KEY, JSON.stringify(data.lessons));
      window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(data.sessions.slice(0, 100)));
      window.localStorage.setItem(KEYSTATS_KEY, JSON.stringify(data.keyStats));
      window.localStorage.setItem(GAMES_KEY, JSON.stringify(data.gameScores.slice(0, 50)));
    } catch {
      // Ignore quota errors
    }
  }
  await Promise.all([
    idbSet('lessons', data.lessons),
    idbSet('sessions', data.sessions.slice(0, 100)),
    idbSet('keyStats', data.keyStats),
    idbSet('gameScores', data.gameScores.slice(0, 50)),
  ]);
}

export async function clearGuestData(): Promise<void> {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(LESSONS_KEY);
    window.localStorage.removeItem(SESSIONS_KEY);
    window.localStorage.removeItem(KEYSTATS_KEY);
    window.localStorage.removeItem(GAMES_KEY);
  }
  await saveGuestData({ lessons: {}, sessions: [], keyStats: {}, gameScores: [] });
}
