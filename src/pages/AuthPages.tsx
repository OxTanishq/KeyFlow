import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface AuthPageProps {
  mode: 'login' | 'register';
}

export const AuthPage: React.FC<AuthPageProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { user, authError, signInWithGoogle } = useAppStore();

  const handleGoogleAuth = async () => {
    const ok = await signInWithGoogle();
    if (ok) {
      navigate('/learn');
    }
  };

  if (user) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Already Signed In</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Signed in as <strong>{user.displayName}</strong>.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            to="/learn"
            className="rounded-xl bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Continue Learning
          </Link>
          <Link
            to="/profile"
            className="rounded-xl border border-[var(--border-subtle)] px-5 py-2.5 text-sm font-semibold text-[var(--text-primary)]"
          >
            View Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">
          {mode === 'login' ? 'Sign in to KeyFlow' : 'Create your KeyFlow account'}
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Sync your 10-lesson progress, analytics history, and personal bests across devices with PostgreSQL cloud persistence.
        </p>
      </div>

      {authError && (
        <div
          role="alert"
          className="rounded-xl border border-[var(--status-error)]/40 bg-rose-500/10 p-3 text-xs text-[var(--status-error)]"
        >
          {authError}
        </div>
      )}

      <button
        type="button"
        onClick={handleGoogleAuth}
        className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl bg-[var(--accent-primary)] px-5 py-3 text-sm font-semibold text-white hover:opacity-95"
      >
        <LogIn className="w-4 h-4" />
        <span>Continue with Google</span>
      </button>

      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4 space-y-1.5 text-xs text-[var(--text-secondary)]">
        <div className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
          <ShieldCheck className="w-4 h-4 text-[var(--accent-secondary)]" />
          <span>Guest Mode Always Available</span>
        </div>
        <p>
          Prefer not to sign in right now? Your local progress stays in your browser and can be merged into your account anytime later.
        </p>
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border-subtle)]">
        <Link
          to={mode === 'login' ? '/auth/register' : '/auth/login'}
          className="text-[var(--accent-primary)] font-semibold hover:underline"
        >
          {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Sign in'}
        </Link>
        <Link to="/learn" className="hover:text-[var(--text-primary)]">
          Continue as Guest
        </Link>
      </div>
    </div>
  );
};
