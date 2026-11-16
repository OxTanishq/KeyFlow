import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Check,
  Copy,
  RefreshCw,
  RotateCcw,
  Share2,
  Trophy,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { generateTestPassage } from '../core/practiceGenerator';
import { useAppStore } from '../store/useAppStore';
import { TypingWorkspace, type TypingCompletePayload } from '../components/TypingWorkspace';

type TestMode =
  | { kind: 'timed'; seconds: 15 | 30 | 60 | 120 }
  | { kind: 'words'; words: 25 | 50 };

export const TestPage: React.FC = () => {
  const { sessions, preferences, recordTypingSession } = useAppStore();
  const [mode, setMode] = useState<TestMode>({
    kind: 'timed',
    seconds: preferences.preferredDuration,
  });
  const [seed, setSeed] = useState(() => Date.now());
  const [runCounter, setRunCounter] = useState(0);
  const [result, setResult] = useState<TypingCompletePayload | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareFields, setShareFields] = useState({
    netWpm: true,
    rawWpm: true,
    accuracy: true,
    duration: true,
  });
  const [copied, setCopied] = useState(false);

  const testPassage = useMemo(() => {
    const count = mode.kind === 'words' ? mode.words : mode.seconds >= 60 ? 110 : 75;
    return generateTestPassage(count, seed);
  }, [mode, seed]);

  const previousBestWpm = useMemo(() => {
    const testSessions = sessions.filter((s) => s.mode === 'test');
    if (testSessions.length === 0) return 0;
    return Math.max(...testSessions.map((s) => Math.round(s.netWpm)));
  }, [sessions]);

  const handleComplete = async (payload: TypingCompletePayload) => {
    setResult(payload);
    await recordTypingSession({
      mode: 'test',
      category: mode.kind === 'timed' ? `${mode.seconds}s` : `${mode.words}w`,
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

  const buildShareText = () => {
    if (!result) return '';
    const parts: string[] = ['KeyFlow Typing Speed Result'];
    if (shareFields.netWpm) parts.push(`Net WPM: ${result.metrics.netWpm}`);
    if (shareFields.rawWpm) parts.push(`Raw WPM: ${result.metrics.rawWpm}`);
    if (shareFields.accuracy) parts.push(`Accuracy: ${result.metrics.accuracy}%`);
    if (shareFields.duration) parts.push(`Duration: ${Math.round(result.metrics.elapsedSeconds)}s`);
    return parts.join(' | ');
  };

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(buildShareText());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard failures
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Typing Speed Test
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Measure your true Net WPM and precision under timed or word-count challenges.
          </p>
        </div>

        {/* Duration / Word Count Segmented Selector */}
        <div
          role="group"
          aria-label="Typing test duration options"
          className="flex flex-wrap items-center gap-1 rounded-xl bg-[var(--bg-elevated)] p-1"
        >
          {([15, 30, 60, 120] as const).map((sec) => {
            const active = mode.kind === 'timed' && mode.seconds === sec;
            return (
              <button
                key={sec}
                type="button"
                onClick={() => {
                  setMode({ kind: 'timed', seconds: sec });
                  setResult(null);
                  setRunCounter((c) => c + 1);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {sec}s
              </button>
            );
          })}
          {([25, 50] as const).map((wc) => {
            const active = mode.kind === 'words' && mode.words === wc;
            return (
              <button
                key={`w-${wc}`}
                type="button"
                onClick={() => {
                  setMode({ kind: 'words', words: wc });
                  setResult(null);
                  setRunCounter((c) => c + 1);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {wc} words
              </button>
            );
          })}
        </div>
      </div>

      {result ? (
        <div className="space-y-6" data-testid="test-results-screen">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">Test Complete</h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  {result.metrics.netWpm > previousBestWpm && result.metrics.netWpm > 0
                    ? `New personal best! Up from ${previousBestWpm} WPM.`
                    : `Personal best: ${Math.max(previousBestWpm, result.metrics.netWpm)} WPM`}
                </p>
              </div>
              {result.metrics.netWpm > previousBestWpm && result.metrics.netWpm > 0 && (
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-secondary)]">
                  <Trophy className="w-5 h-5" />
                  <span>New Personal Best</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 tabular-nums">
              <div className="rounded-xl bg-[var(--bg-canvas)] p-4">
                <div className="text-xs text-[var(--text-secondary)]">Final Net WPM</div>
                <div className="text-3xl font-extrabold font-mono-typing text-[var(--accent-primary)]">
                  {result.metrics.netWpm}
                </div>
              </div>
              <div className="rounded-xl bg-[var(--bg-canvas)] p-4">
                <div className="text-xs text-[var(--text-secondary)]">Raw WPM</div>
                <div className="text-2xl font-bold font-mono-typing text-[var(--text-primary)]">
                  {result.metrics.rawWpm}
                </div>
              </div>
              <div className="rounded-xl bg-[var(--bg-canvas)] p-4">
                <div className="text-xs text-[var(--text-secondary)]">Accuracy</div>
                <div className="text-2xl font-bold font-mono-typing text-[var(--text-primary)]">
                  {result.metrics.accuracy}%
                </div>
              </div>
              <div className="rounded-xl bg-[var(--bg-canvas)] p-4">
                <div className="text-xs text-[var(--text-secondary)]">Correct Chars</div>
                <div className="text-2xl font-bold font-mono-typing text-[var(--status-success)]">
                  {result.metrics.correctChars}
                </div>
              </div>
              <div className="rounded-xl bg-[var(--bg-canvas)] p-4">
                <div className="text-xs text-[var(--text-secondary)]">Incorrect Chars</div>
                <div className="text-2xl font-bold font-mono-typing text-[var(--status-error)]">
                  {result.state.incorrectKeystrokes}
                </div>
              </div>
              <div className="rounded-xl bg-[var(--bg-canvas)] p-4">
                <div className="text-xs text-[var(--text-secondary)]">Duration</div>
                <div className="text-2xl font-bold font-mono-typing text-[var(--text-primary)]">
                  {Math.round(result.metrics.elapsedSeconds)}s
                </div>
              </div>
            </div>

            {/* WPM Timeline Chart */}
            {result.timeline.length >= 2 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Speed &amp; Accuracy Timeline
                </h3>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={result.timeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                      <XAxis dataKey="second" unit="s" stroke="var(--text-secondary)" fontSize={12} />
                      <YAxis stroke="var(--text-secondary)" fontSize={12} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="wpm"
                        name="Net WPM"
                        stroke="#6558F5"
                        strokeWidth={2.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="accuracy"
                        name="Accuracy %"
                        stroke="#22C5A8"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setRunCounter((c) => c + 1);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry Test</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSeed(Date.now());
                  setResult(null);
                  setRunCounter((c) => c + 1);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]/60"
              >
                <RefreshCw className="w-4 h-4" />
                <span>New Test</span>
              </button>
              <Link
                to="/progress"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]/60"
              >
                <BarChart3 className="w-4 h-4" />
                <span>View Progress</span>
              </Link>
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]/60"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Result</span>
              </button>
            </div>
          </div>

          {/* Share Result Modal */}
          {showShareModal && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Share typing test result"
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            >
              <div className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-4">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  Share Selected Statistics
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Choose which metrics to include in your shareable summary card.
                </p>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  {(
                    [
                      ['netWpm', 'Net WPM'],
                      ['rawWpm', 'Raw WPM'],
                      ['accuracy', 'Accuracy %'],
                      ['duration', 'Duration'],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shareFields[key]}
                        onChange={(e) =>
                          setShareFields((prev) => ({ ...prev, [key]: e.target.checked }))
                        }
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>

                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4 font-mono-typing text-xs text-[var(--text-primary)]">
                  {buildShareText() || 'Select at least one statistic above.'}
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowShareModal(false)}
                    className="rounded-lg border border-[var(--border-subtle)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)]"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyShare}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-xs font-semibold text-white"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <TypingWorkspace
          key={runCounter}
          text={testPassage}
          mode="test"
          timeLimitSeconds={mode.kind === 'timed' ? mode.seconds : null}
          onComplete={handleComplete}
          onRestart={() => setResult(null)}
        />
      )}
    </div>
  );
};
