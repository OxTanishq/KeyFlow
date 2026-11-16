import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  ChevronDown,
  Gamepad2,
  Keyboard,
  ShieldCheck,
  Sparkles,
  Timer,
} from 'lucide-react';
import { findKeyByEvent, FINGER_META, type KeyDefinition } from '../core/keyboardLayout';
import { LESSONS } from '../core/lessons';
import { soundEngine } from '../core/soundEngine';
import { useAppStore } from '../store/useAppStore';
import { VirtualKeyboard } from '../components/VirtualKeyboard';

const FAQ_ITEMS = [
  {
    q: 'Do I need to create an account before starting lessons?',
    a: 'No. You can begin all 10 lessons, practice modes, timed tests, and typing games immediately in Guest Mode. Your progress saves locally in your browser and can be merged into your account anytime you sign in.',
  },
  {
    q: 'How are Net WPM and Accuracy calculated?',
    a: 'Raw WPM divides total keystrokes by 5 per active minute. Net WPM subtracts uncorrected errors per minute so rushing with mistakes never inflates your score. Accuracy measures correct keystrokes divided by total keystrokes.',
  },
  {
    q: 'Can I use KeyFlow on a phone or tablet?',
    a: 'You can browse your progress, curriculum, and finger guide on any screen size. For actual touch-typing training and speed tests, we recommend a physical keyboard so your fingers build true spatial muscle memory.',
  },
  {
    q: 'How does Weak-Key Practice select exercises?',
    a: 'As you complete lessons, practice drills, and tests, KeyFlow records per-key attempt and error counts. Weak-Key Practice deterministically ranks your highest-error keys and builds word drills focused on those characters.',
  },
];

export const LandingPage: React.FC = () => {
  const { preferences } = useAppStore();
  const [pressedCodes, setPressedCodes] = useState<Set<string>>(() => new Set());
  const [lastKey, setLastKey] = useState<KeyDefinition | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const activeTag = (document.activeElement as HTMLElement | null)?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

      const keyDef = findKeyByEvent(e.code, e.key);
      if (keyDef) {
        if (e.key === ' ') e.preventDefault();
        setPressedCodes((prev) => {
          const next = new Set(prev);
          next.add(keyDef.id);
          return next;
        });
        setLastKey(keyDef);
        soundEngine.playKeyClick(preferences.soundEnabled, true);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const keyDef = findKeyByEvent(e.code, e.key);
      if (keyDef) {
        setPressedCodes((prev) => {
          if (!prev.has(keyDef.id)) return prev;
          const next = new Set(prev);
          next.delete(keyDef.id);
          return next;
        });
      }
    };

    const onBlur = () => setPressedCodes(new Set());

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [preferences.soundEnabled]);

  const activeFinger = lastKey ? FINGER_META[lastKey.finger] : null;

  return (
    <div className="divide-y divide-[var(--border-subtle)]">
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 py-8 lg:py-10">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm font-semibold text-[var(--accent-primary)]">
            Interactive Touch Typing Platform · Made by Nexora Studios
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--text-primary)] leading-[1.08] text-balance">
            Master Your Keyboard. Unlock Your Speed.
          </h1>
          <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl leading-relaxed">
            Learn touch typing with interactive lessons, intelligent weak-key practice, real-time WPM and accuracy feedback, arcade typing games, and detailed progress tracking.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              to="/learn"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-95 transition-opacity"
            >
              <span>Start Learning</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/test"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]/60 transition-colors"
            >
              <Timer className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>Take a Typing Test</span>
            </Link>
          </div>
        </div>

        {/* Live Interactive Hero Keyboard */}
        <div className="mt-7 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Try pressing any key on your keyboard
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Physical keystrokes highlight the matching virtual key and show its assigned finger in real time.
              </p>
            </div>
            <div
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-4 py-2 text-sm tabular-nums min-w-[220px]"
              data-testid="hero-key-feedback"
            >
              {lastKey && activeFinger ? (
                <div className="flex items-center justify-between gap-4">
                  <span>
                    Key:{' '}
                    <strong className="font-mono-typing text-[var(--text-primary)]">
                      {lastKey.label}
                    </strong>
                  </span>
                  <span className="font-semibold" style={{ color: activeFinger.colorHex }}>
                    {activeFinger.label}
                  </span>
                </div>
              ) : (
                <span className="text-[var(--text-secondary)]">Waiting for keystroke or click...</span>
              )}
            </div>
          </div>

          <VirtualKeyboard
            mode="interactive"
            activePressedCodes={pressedCodes}
            onKeySelect={(k) => {
              setLastKey(k);
              soundEngine.playKeyClick(preferences.soundEnabled, true);
              setPressedCodes(new Set([k.id]));
              window.setTimeout(() => setPressedCodes(new Set()), 160);
            }}
          />
        </div>
      </section>

      {/* How the Platform Works */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="max-w-2xl mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            How KeyFlow builds lasting speed
          </h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            Speed comes from eliminating hesitation. Follow a proven three-stage workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-3">
            <span className="text-xs font-semibold text-[var(--accent-primary)]">01 · Learn</span>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Guided Finger Habits</h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Progress sequentially through 10 structured lessons from Home Row to full sentences with live finger placement cues and accuracy stars.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-3">
            <span className="text-xs font-semibold text-[var(--accent-primary)]">02 · Target</span>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Weak-Key Remediation</h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Every session tracks per-key error frequencies. Practice Mode generates targeted drills for the exact keys slowing you down.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-3">
            <span className="text-xs font-semibold text-[var(--accent-primary)]">03 · Measure</span>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Verified Telemetry</h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Monitor Net WPM, Raw WPM, accuracy trends, daily streaks, and keyboard heatmaps powered by deterministic browser timing.
            </p>
          </div>
        </div>
      </section>

      {/* Curriculum & Feature Showcase */}
      <section className="mx-auto max-w-7xl px-6 py-14 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* 10-Lesson Path Preview */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-[var(--accent-primary)]" />
                <h2 className="text-xl font-bold text-[var(--text-primary)]">10-Lesson Curriculum</h2>
              </div>
              <Link
                to="/learn"
                className="text-sm font-semibold text-[var(--accent-primary)] hover:underline whitespace-nowrap"
              >
                Open curriculum
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {LESSONS.map((lesson) => (
                <Link
                  key={lesson.id}
                  to={`/learn/${lesson.id}`}
                  className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 py-2.5 text-sm hover:border-[var(--accent-primary)]/60 transition-colors"
                >
                  <span className="font-medium text-[var(--text-primary)] truncate">
                    {lesson.sequenceNumber}. {lesson.title}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)] font-mono-typing shrink-0 ml-2">
                    {lesson.isExploratory ? 'Explore' : `${lesson.requiredAccuracy}%`}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Games, Practice & Analytics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/practice"
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-2 hover:border-[var(--accent-primary)]/60 transition-colors"
            >
              <Sparkles className="w-5 h-5 text-[var(--accent-primary)]" />
              <h3 className="font-bold text-[var(--text-primary)]">Adaptive Practice</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                10 modes including Code Symbols, Numbers, Custom Text, and Weak-Key drills.
              </p>
            </Link>
            <Link
              to="/play"
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-2 hover:border-[var(--accent-primary)]/60 transition-colors"
            >
              <Gamepad2 className="w-5 h-5 text-[var(--accent-secondary)]" />
              <h3 className="font-bold text-[var(--text-primary)]">5 Typing Games</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Word Rush, Falling Words, Typing Race, Keyboard Defender, and Speed Challenge.
              </p>
            </Link>
            <Link
              to="/progress"
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-2 hover:border-[var(--accent-primary)]/60 transition-colors"
            >
              <BarChart3 className="w-5 h-5 text-[var(--accent-primary)]" />
              <h3 className="font-bold text-[var(--text-primary)]">Analytics &amp; Heatmap</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Interactive error heatmap, WPM history charts, streaks, and milestone badges.
              </p>
            </Link>
            <Link
              to="/keyboard"
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-2 hover:border-[var(--accent-primary)]/60 transition-colors"
            >
              <Keyboard className="w-5 h-5 text-[var(--accent-secondary)]" />
              <h3 className="font-bold text-[var(--text-primary)]">Finger Placement Guide</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Visual two-hand mapping showing exact finger zones and opposite-hand Shift rules.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-6 py-14">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-6">
          Frequently asked questions
        </h2>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={item.q}
                className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-sm sm:text-base text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]/50"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 text-[var(--text-secondary)] transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-sm text-[var(--text-secondary)] leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 sm:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--accent-secondary)]">
              <ShieldCheck className="w-4 h-4" />
              <span>Private by default · Free Guest Mode or Cloud Sync</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              Ready to build effortless typing rhythm?
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Start with Lesson 1 in under 10 seconds, or benchmark your current speed right away.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/learn"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-5 py-3 text-sm font-semibold text-white hover:opacity-95"
            >
              <span>Start Learning</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/test"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]/60"
            >
              <span>Take a Typing Test</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
