import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RefreshCw, Sparkles } from 'lucide-react';
import {
  PRACTICE_CATEGORIES,
  generatePracticeText,
  sanitizeCustomText,
  type DifficultyLevel,
  type PracticeCategory,
} from '../core/practiceGenerator';
import { getTopMistypedKeys } from '../core/analytics';
import { useAppStore } from '../store/useAppStore';
import { TypingWorkspace, type TypingCompletePayload } from '../components/TypingWorkspace';

export const PracticePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { keyStats, preferences, recordTypingSession } = useAppStore();

  const urlKeys = searchParams.get('keys');
  const initialCategory: PracticeCategory = urlKeys ? 'weak-keys' : 'common-words';

  const [category, setCategory] = useState<PracticeCategory>(initialCategory);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(preferences.preferredDifficulty);
  const [wordCount, setWordCount] = useState<number>(25);
  const [durationLimit, setDurationLimit] = useState<number | null>(null);
  const [includeNumbers, setIncludeNumbers] = useState(false);
  const [includePunctuation, setIncludePunctuation] = useState(false);
  const [customInput, setCustomInput] = useState(
    'Paste or type any custom passage here to practice at your own pace with full real-time accuracy telemetry.'
  );
  const [customError, setCustomError] = useState<string | null>(null);
  const [seed, setSeed] = useState(() => Date.now());
  const [result, setResult] = useState<TypingCompletePayload | null>(null);

  const weakKeyList = useMemo(() => {
    if (urlKeys) {
      return urlKeys
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return getTopMistypedKeys(keyStats, 5).map((k) => k.key.toLowerCase());
  }, [urlKeys, keyStats]);

  const practiceText = useMemo(
    () =>
      generatePracticeText({
        category,
        wordCount,
        difficulty,
        includeNumbers,
        includePunctuation,
        customText: customInput,
        weakKeys: weakKeyList,
        seed,
      }),
    [category, wordCount, difficulty, includeNumbers, includePunctuation, customInput, weakKeyList, seed]
  );

  useEffect(() => {
    if (urlKeys) {
      setCategory('weak-keys');
    }
  }, [urlKeys]);

  useEffect(() => {
    setResult(null);
  }, [practiceText, durationLimit]);

  const handleApplyCustom = () => {
    const cleaned = sanitizeCustomText(customInput);
    if (cleaned.length < 10) {
      setCustomError('Please enter at least 10 characters of text.');
      return;
    }
    setCustomError(null);
    setSeed(Date.now());
    setResult(null);
  };

  const handleComplete = async (payload: TypingCompletePayload) => {
    setResult(payload);
    await recordTypingSession({
      mode: 'practice',
      category,
      durationSeconds: Math.max(1, payload.metrics.elapsedSeconds),
      rawWpm: payload.metrics.rawWpm,
      netWpm: payload.metrics.netWpm,
      accuracy: payload.metrics.accuracy,
      correctCharacters: payload.metrics.correctChars,
      incorrectCharacters: payload.state.incorrectKeystrokes,
      correctedCharacters: payload.metrics.correctedMistakes,
      keyStats: payload.state.keyStats,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Free Typing Practice
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Choose a category, tune difficulty, or train your weakest keys with deterministic targeted drills.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSeed(Date.now());
            setResult(null);
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]/60 self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>New Passage</span>
        </button>
      </div>

      {/* Category Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {PRACTICE_CATEGORIES.map((cat) => {
          const active = category === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setCategory(cat.id);
                setSeed(Date.now());
                setResult(null);
              }}
              className={`rounded-xl border p-3 text-left transition-colors ${
                active
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--text-primary)]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div className="text-xs font-bold truncate">{cat.label}</div>
              <div className="text-[11px] opacity-80 line-clamp-2 mt-0.5">{cat.description}</div>
            </button>
          );
        })}
      </div>

      {/* Weak Keys Insight Banner */}
      {category === 'weak-keys' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
            <span className="text-[var(--text-secondary)]">
              Targeting keys:{' '}
              <strong className="font-mono-typing text-[var(--text-primary)]">
                {weakKeyList.map((k) => k.toUpperCase()).join(', ')}
              </strong>
            </span>
          </div>
          <span className="text-xs text-[var(--text-secondary)]">
            Ranked automatically from your recorded error rates
          </span>
        </div>
      )}

      {/* Custom Text Editor */}
      {category === 'custom' && (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-3">
          <label htmlFor="custom-practice-input" className="block text-sm font-semibold text-[var(--text-primary)]">
            Custom Plain-Text Passage (10–5,000 characters)
          </label>
          <textarea
            id="custom-practice-input"
            rows={3}
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            maxLength={5000}
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
          />
          {customError && <p className="text-xs text-[var(--status-error)]">{customError}</p>}
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-secondary)] tabular-nums">
              {customInput.length} / 5000 chars
            </span>
            <button
              type="button"
              onClick={handleApplyCustom}
              className="rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-xs font-semibold text-white hover:opacity-95"
            >
              Load Custom Text
            </button>
          </div>
        </div>
      )}

      {/* Practice Options */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 py-3.5 text-xs">
        <div className="flex items-center gap-2">
          <label htmlFor="practice-difficulty" className="font-semibold text-[var(--text-secondary)]">
            Difficulty
          </label>
          <select
            id="practice-difficulty"
            value={difficulty}
            onChange={(e) => {
              setDifficulty(e.target.value as DifficultyLevel);
              setSeed(Date.now());
            }}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-[var(--text-primary)]"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="practice-words" className="font-semibold text-[var(--text-secondary)]">
            Words
          </label>
          <select
            id="practice-words"
            value={wordCount}
            onChange={(e) => {
              setWordCount(Number(e.target.value));
              setSeed(Date.now());
            }}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-[var(--text-primary)]"
          >
            <option value={15}>15 words</option>
            <option value={25}>25 words</option>
            <option value={50}>50 words</option>
            <option value={75}>75 words</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="practice-timer" className="font-semibold text-[var(--text-secondary)]">
            Timer
          </label>
          <select
            id="practice-timer"
            value={durationLimit ?? 'untimed'}
            onChange={(e) =>
              setDurationLimit(e.target.value === 'untimed' ? null : Number(e.target.value))
            }
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-[var(--text-primary)]"
          >
            <option value="untimed">Untimed</option>
            <option value="30">30s</option>
            <option value="60">60s</option>
            <option value="120">120s</option>
          </select>
        </div>

        <label className="inline-flex items-center gap-1.5 cursor-pointer text-[var(--text-primary)]">
          <input
            type="checkbox"
            checked={includeNumbers}
            onChange={(e) => {
              setIncludeNumbers(e.target.checked);
              setSeed(Date.now());
            }}
          />
          <span>Numbers</span>
        </label>

        <label className="inline-flex items-center gap-1.5 cursor-pointer text-[var(--text-primary)]">
          <input
            type="checkbox"
            checked={includePunctuation}
            onChange={(e) => {
              setIncludePunctuation(e.target.checked);
              setSeed(Date.now());
            }}
          />
          <span>Punctuation</span>
        </label>
      </div>

      {/* Results Banner if completed */}
      {result && (
        <div
          data-testid="practice-result"
          className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Practice Complete</h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Session saved to your history and per-key analytics updated.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSeed(Date.now());
                setResult(null);
              }}
              className="rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-xs font-semibold text-white hover:opacity-95"
            >
              Practice Again
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 tabular-nums">
            <div className="rounded-xl bg-[var(--bg-canvas)] p-3.5">
              <div className="text-xs text-[var(--text-secondary)]">Net WPM</div>
              <div className="text-2xl font-bold font-mono-typing text-[var(--accent-primary)]">
                {result.metrics.netWpm}
              </div>
            </div>
            <div className="rounded-xl bg-[var(--bg-canvas)] p-3.5">
              <div className="text-xs text-[var(--text-secondary)]">Raw WPM</div>
              <div className="text-2xl font-bold font-mono-typing text-[var(--text-primary)]">
                {result.metrics.rawWpm}
              </div>
            </div>
            <div className="rounded-xl bg-[var(--bg-canvas)] p-3.5">
              <div className="text-xs text-[var(--text-secondary)]">Accuracy</div>
              <div className="text-2xl font-bold font-mono-typing text-[var(--text-primary)]">
                {result.metrics.accuracy}%
              </div>
            </div>
            <div className="rounded-xl bg-[var(--bg-canvas)] p-3.5">
              <div className="text-xs text-[var(--text-secondary)]">Corrected</div>
              <div className="text-2xl font-bold font-mono-typing text-[var(--text-primary)]">
                {result.metrics.correctedMistakes}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Typing Workspace */}
      {!result && (
        <TypingWorkspace
          text={practiceText}
          mode="practice"
          timeLimitSeconds={durationLimit}
          onComplete={handleComplete}
          onRestart={() => setResult(null)}
        />
      )}
    </div>
  );
};
