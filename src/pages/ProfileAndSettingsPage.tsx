import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, LogOut, Trash2, User } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const ProfilePage: React.FC = () => {
  const { user, preferences, updatePreferences, logout } = useAppStore();
  const [displayName, setDisplayName] = useState(
    user?.displayName || preferences.displayName
  );
  const [goalWpm, setGoalWpm] = useState(preferences.typingGoalWpm);
  const [difficulty, setDifficulty] = useState(preferences.preferredDifficulty);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    await updatePreferences({
      displayName: displayName.trim(),
      typingGoalWpm: goalWpm,
      preferredDifficulty: difficulty,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">Your Profile</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Manage your display name, typing speed goal, and preferred difficulty.
          </p>
        </div>
        {user ? (
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--status-error)]/60"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        ) : (
          <Link
            to="/auth/login"
            className="rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-xs font-semibold text-white"
          >
            Sign In to Sync
          </Link>
        )}
      </div>

      <form
        onSubmit={handleSave}
        className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-5"
      >
        <div className="flex items-center gap-4 pb-4 border-b border-[var(--border-subtle)]">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={displayName}
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-elevated)]">
              <User className="w-5 h-5 text-[var(--text-secondary)]" />
            </div>
          )}
          <div>
            <div className="font-bold text-[var(--text-primary)]">
              {user ? user.displayName : 'Guest Mode'}
            </div>
            <div className="text-xs text-[var(--text-secondary)]">
              {user?.email || 'Progress stored locally in your browser'}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="profile-name" className="block text-sm font-semibold text-[var(--text-primary)]">
            Display Name
          </label>
          <input
            id="profile-name"
            type="text"
            required
            maxLength={60}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 py-2.5 text-sm text-[var(--text-primary)]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="profile-goal" className="block text-sm font-semibold text-[var(--text-primary)]">
              Target Speed (WPM)
            </label>
            <input
              id="profile-goal"
              type="number"
              min={15}
              max={200}
              value={goalWpm}
              onChange={(e) => setGoalWpm(Number(e.target.value))}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 py-2.5 text-sm font-mono-typing text-[var(--text-primary)]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="profile-difficulty" className="block text-sm font-semibold text-[var(--text-primary)]">
              Preferred Difficulty
            </label>
            <select
              id="profile-difficulty"
              value={difficulty}
              onChange={(e) =>
                setDifficulty(e.target.value as 'beginner' | 'intermediate' | 'advanced')
              }
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 py-2.5 text-sm text-[var(--text-primary)]"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          {saved && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--status-success)]">
              <Check className="w-3.5 h-3.5" />
              Saved
            </span>
          )}
          <button
            type="submit"
            className="rounded-xl bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95"
          >
            Save Profile
          </button>
        </div>
      </form>
    </div>
  );
};

export const SettingsPage: React.FC = () => {
  const { preferences, updatePreferences, clearHistory } = useAppStore();
  const [confirmClear, setConfirmClear] = useState(false);
  const [cleared, setCleared] = useState(false);

  const handleClear = async () => {
    await clearHistory();
    setConfirmClear(false);
    setCleared(true);
    window.setTimeout(() => setCleared(false), 3000);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">Application Settings</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Customize theme appearance, audio feedback, keyboard layout, and data privacy controls.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] divide-y divide-[var(--border-subtle)]">
        <div className="p-5 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">Appearance Theme</div>
            <div className="text-xs text-[var(--text-secondary)]">Switch between Light and Dark mode.</div>
          </div>
          <div className="flex items-center gap-1 rounded-xl bg-[var(--bg-elevated)] p-1">
            {(['light', 'dark'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => updatePreferences({ theme: t })}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize ${
                  preferences.theme === t
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">Typing Sound Effects</div>
            <div className="text-xs text-[var(--text-secondary)]">Web Audio mechanical key clicks and chimes.</div>
          </div>
          <input
            type="checkbox"
            aria-label="Enable typing sound effects"
            checked={preferences.soundEnabled}
            onChange={(e) => updatePreferences({ soundEnabled: e.target.checked })}
            className="h-4 w-4"
          />
        </div>

        <div className="p-5 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">Show Virtual Keyboard</div>
            <div className="text-xs text-[var(--text-secondary)]">Display finger-coded keyboard during exercises.</div>
          </div>
          <input
            type="checkbox"
            aria-label="Show virtual keyboard during exercises"
            checked={preferences.showKeyboard}
            onChange={(e) => updatePreferences({ showKeyboard: e.target.checked })}
            className="h-4 w-4"
          />
        </div>

        <div className="p-5 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">Error Highlighting</div>
            <div className="text-xs text-[var(--text-secondary)]">Highlight mistyped characters immediately.</div>
          </div>
          <input
            type="checkbox"
            aria-label="Enable error highlighting"
            checked={preferences.highlightErrors}
            onChange={(e) => updatePreferences({ highlightErrors: e.target.checked })}
            className="h-4 w-4"
          />
        </div>

        <div className="p-5 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">Default Test Duration</div>
            <div className="text-xs text-[var(--text-secondary)]">Preferred timer when opening Typing Test.</div>
          </div>
          <select
            aria-label="Default test duration"
            value={preferences.preferredDuration}
            onChange={(e) =>
              updatePreferences({ preferredDuration: Number(e.target.value) as 15 | 30 | 60 | 120 })
            }
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-1.5 text-xs font-semibold"
          >
            <option value={15}>15 seconds</option>
            <option value={30}>30 seconds</option>
            <option value={60}>60 seconds</option>
            <option value={120}>120 seconds</option>
          </select>
        </div>
      </div>

      {/* Data Deletion Control */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-3">
        <h2 className="text-base font-bold text-[var(--text-primary)]">Data &amp; History Controls</h2>
        <p className="text-xs text-[var(--text-secondary)]">
          Erase all recorded lesson progress, session telemetry, game scores, and key error statistics.
        </p>
        {cleared && (
          <p className="text-xs font-semibold text-[var(--status-success)]">
            All typing history has been cleared.
          </p>
        )}
        {!confirmClear ? (
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--status-error)]/40 px-4 py-2 text-xs font-semibold text-[var(--status-error)] hover:bg-rose-500/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Typing History</span>
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClear}
              className="rounded-xl bg-[var(--status-error)] px-4 py-2 text-xs font-semibold text-white"
            >
              Confirm Permanent Delete
            </button>
            <button
              type="button"
              onClick={() => setConfirmClear(false)}
              className="rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-xs font-medium"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
