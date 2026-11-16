import React from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AboutPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
          About KeyFlow
        </h1>
        <p className="text-base text-[var(--text-secondary)] leading-relaxed">
          KeyFlow is a structured touch-typing platform engineered to help students, writers, and software developers build effortless keyboard fluency without distractions.
        </p>
      </div>

      {/* Required Nexora Studios Section */}
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-4">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          Crafted by Nexora Studios
        </h2>
        <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
          This platform was designed and developed by Nexora Studios, a digital creative studio specializing in modern websites, custom web applications, interactive experiences, and innovative digital solutions.
        </p>
        <div className="pt-1">
          <a
            href="https://nexorastudios.ai.studio"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95"
          >
            <span>Visit Nexora Studios</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-3">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Educational Methodology</h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          KeyFlow pairs a 10-stage progressive curriculum with deterministic keystroke timing, opposite-hand Shift training, and per-key error heatmaps. Accuracy is always prioritized before speed: stars are earned strictly from precision thresholds (70%, 85%, and 95%).
        </p>
      </section>
    </div>
  );
};

export const PrivacyPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--accent-secondary)]">
          <ShieldCheck className="w-4 h-4" />
          <span>Privacy Policy</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">Your Typing Privacy</h1>
      </div>

      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-4 text-sm text-[var(--text-secondary)] leading-relaxed">
        <p>
          <strong className="text-[var(--text-primary)]">1. What We Store:</strong> In Guest Mode, lesson progress, session WPM/accuracy summaries, and key error statistics remain strictly inside your browser&apos;s IndexedDB and localStorage. When you sign in, only those structured learning metrics and your profile preferences are stored in our PostgreSQL database.
        </p>
        <p>
          <strong className="text-[var(--text-primary)]">2. Custom Passages Stay Local:</strong> Text you paste into Custom Practice is processed in memory inside your browser and is never transmitted to or logged by our servers.
        </p>
        <p>
          <strong className="text-[var(--text-primary)]">3. Full Deletion Control:</strong> You can permanently erase all recorded lessons, sessions, game scores, and key error telemetry at any time from{' '}
          <Link to="/settings" className="text-[var(--accent-primary)] underline">
            Settings
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

export const TermsPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">Terms of Service</h1>
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-4 text-sm text-[var(--text-secondary)] leading-relaxed">
        <p>
          KeyFlow is provided by Nexora Studios for personal and educational typing practice.
        </p>
        <p>
          Accounts participating in the public leaderboard agree to display their chosen display name, best verified Net WPM, and session accuracy publicly. Email addresses and private account identifiers are never exposed on public endpoints.
        </p>
        <p>
          Automated bots or scripted keystroke injection intended to falsify leaderboard rankings are prohibited.
        </p>
      </div>
    </div>
  );
};
