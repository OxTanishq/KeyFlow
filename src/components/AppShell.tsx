import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Award,
  BarChart3,
  BookOpen,
  Gamepad2,
  Home,
  Info,
  Keyboard,
  LogIn,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sparkles,
  Sun,
  Timer,
  Trophy,
  User,
  X,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { ACHIEVEMENT_CATALOG } from '../core/analytics';
import { BrandLogo } from './BrandLogo';

interface AppShellProps {
  children: React.ReactNode;
  variant?: 'landing' | 'workspace';
}

const SIDEBAR_ITEMS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/learn', label: 'Learn', icon: BookOpen },
  { to: '/practice', label: 'Practice', icon: Sparkles },
  { to: '/play', label: 'Play', icon: Gamepad2 },
  { to: '/test', label: 'Test', icon: Timer },
  { to: '/progress', label: 'Progress', icon: BarChart3 },
  { to: '/keyboard', label: 'Keyboard Guide', icon: Keyboard },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/about', label: 'About', icon: Info },
];

export const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)]">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Left: Product Logo & Short Description */}
          <div className="space-y-3">
            <Link to="/" className="inline-flex items-center">
              <BrandLogo />
            </Link>
            <p className="text-sm leading-relaxed max-w-xs">
              Structured touch typing lessons, adaptive weak-key practice, arcade games, and real-time performance analytics.
            </p>
          </div>

          {/* Center: Links */}
          <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
            <Link to="/learn" className="hover:text-[var(--text-primary)] transition-colors">
              Learn
            </Link>
            <Link to="/practice" className="hover:text-[var(--text-primary)] transition-colors">
              Practice
            </Link>
            <Link to="/test" className="hover:text-[var(--text-primary)] transition-colors">
              Typing Test
            </Link>
            <Link to="/play" className="hover:text-[var(--text-primary)] transition-colors">
              Typing Games
            </Link>
            <Link to="/progress" className="hover:text-[var(--text-primary)] transition-colors">
              Progress
            </Link>
            <Link to="/keyboard" className="hover:text-[var(--text-primary)] transition-colors">
              Finger Guide
            </Link>
            <Link to="/about" className="hover:text-[var(--text-primary)] transition-colors">
              About
            </Link>
            <Link to="/privacy" className="hover:text-[var(--text-primary)] transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-[var(--text-primary)] transition-colors">
              Terms of Service
            </Link>
            <Link to="/leaderboard" className="hover:text-[var(--text-primary)] transition-colors">
              Leaderboard
            </Link>
          </nav>

          {/* Right: Nexora Studios Credit */}
          <div className="flex flex-col md:items-end justify-between gap-3 text-sm">
            <div className="md:text-right space-y-1.5">
              <p className="font-semibold text-[var(--text-primary)]">
                Designed &amp; Developed by{' '}
                <a
                  href="https://nexorastudios.ai.studio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent-primary)] hover:underline"
                >
                  Nexora Studios
                </a>
              </p>
              <p className="text-xs">
                Independent engineering &amp; interactive educational design.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-6 text-xs">
          <p>
            &copy; {year} KeyFlow. Made by{' '}
            <a
              href="https://nexorastudios.ai.studio"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--text-primary)] hover:text-[var(--accent-primary)] underline-offset-2 hover:underline"
            >
              Nexora Studios
            </a>
            .
          </p>
          <p>Built for physical keyboards with real-time browser telemetry.</p>
        </div>
      </div>
    </footer>
  );
};

export const AppShell: React.FC<AppShellProps> = ({ children, variant = 'workspace' }) => {
  const {
    user,
    preferences,
    updatePreferences,
    guestPendingMerge,
    mergeGuestIntoAccount,
    dismissGuestMerge,
    newAchievementToast,
    dismissAchievementToast,
  } = useAppStore();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const toggleTheme = () => {
    updatePreferences({ theme: preferences.theme === 'dark' ? 'light' : 'dark' });
  };

  const achievementMeta = newAchievementToast
    ? ACHIEVEMENT_CATALOG.find((a) => a.id === newAchievementToast)
    : null;

  if (variant === 'landing') {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)]">
        {/* Clean 3-Zone Top Bar */}
        <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-xs">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3.5">
            <Link to="/" className="shrink-0">
              <BrandLogo />
            </Link>

            <nav
              aria-label="Primary navigation"
              className="hidden lg:flex items-center gap-6 text-sm font-medium text-[var(--text-secondary)]"
            >
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `whitespace-nowrap shrink-0 transition-colors hover:text-[var(--text-primary)] ${
                    isActive ? 'text-[var(--text-primary)] font-semibold' : ''
                  }`
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/learn"
                className={({ isActive }) =>
                  `whitespace-nowrap shrink-0 transition-colors hover:text-[var(--text-primary)] ${
                    isActive ? 'text-[var(--text-primary)] font-semibold' : ''
                  }`
                }
              >
                Learn
              </NavLink>
              <NavLink
                to="/practice"
                className={({ isActive }) =>
                  `whitespace-nowrap shrink-0 transition-colors hover:text-[var(--text-primary)] ${
                    isActive ? 'text-[var(--text-primary)] font-semibold' : ''
                  }`
                }
              >
                Practice
              </NavLink>
              <NavLink
                to="/play"
                className={({ isActive }) =>
                  `whitespace-nowrap shrink-0 transition-colors hover:text-[var(--text-primary)] ${
                    isActive ? 'text-[var(--text-primary)] font-semibold' : ''
                  }`
                }
              >
                Play
              </NavLink>
              <NavLink
                to="/test"
                className={({ isActive }) =>
                  `whitespace-nowrap shrink-0 transition-colors hover:text-[var(--text-primary)] ${
                    isActive ? 'text-[var(--text-primary)] font-semibold' : ''
                  }`
                }
              >
                Typing Test
              </NavLink>
              <NavLink
                to="/progress"
                className={({ isActive }) =>
                  `whitespace-nowrap shrink-0 transition-colors hover:text-[var(--text-primary)] ${
                    isActive ? 'text-[var(--text-primary)] font-semibold' : ''
                  }`
                }
              >
                Progress
              </NavLink>
            </nav>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={preferences.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]/60"
              >
                {preferences.theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <Link
                to={user ? '/profile' : '/auth/login'}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]/60 whitespace-nowrap shrink-0"
              >
                {user ? <User className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />}
                <span>{user ? user.displayName.split(' ')[0] : 'Sign In'}</span>
              </Link>

              <Link
                to="/learn"
                className="inline-flex items-center rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:opacity-95 whitespace-nowrap shrink-0"
              >
                Start Learning
              </Link>

              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className="inline-flex lg:hidden h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)]"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden bg-black/40" onClick={() => setMobileOpen(false)}>
            <div
              className="w-72 h-full bg-[var(--bg-surface)] p-5 flex flex-col gap-2 border-r border-[var(--border-subtle)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
                <BrandLogo />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="p-2 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {SIDEBAR_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                  >
                    <Icon className="w-4 h-4 text-[var(--text-secondary)]" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* Desktop Collapsible Sidebar */}
      <aside
        aria-label="Workspace navigation"
        className={`hidden lg:flex flex-col shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] transition-[width] duration-200 ${
          collapsed ? 'w-[72px]' : 'w-60'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border-subtle)]">
          <Link to="/" className="overflow-hidden">
            <BrandLogo showWordmark={!collapsed} />
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[var(--border-subtle)]">
          <Link
            to={user ? '/profile' : '/auth/login'}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
          >
            <User className="w-4 h-4 shrink-0 text-[var(--text-secondary)]" />
            {!collapsed && (
              <span className="truncate">
                {user ? user.displayName : 'Guest Mode · Sign In'}
              </span>
            )}
          </Link>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-black/40" onClick={() => setMobileOpen(false)}>
          <div
            className="w-72 h-full bg-[var(--bg-surface)] p-5 flex flex-col gap-1.5 border-r border-[var(--border-subtle)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[var(--border-subtle)]">
              <BrandLogo />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="p-2 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                >
                  <Icon className="w-4 h-4 text-[var(--text-secondary)]" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-xs px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="inline-flex lg:hidden h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)]"
            >
              <Menu className="w-4 h-4" />
            </button>
            <Link to="/" className="lg:hidden">
              <BrandLogo />
            </Link>
            <span className="hidden lg:inline text-sm text-[var(--text-secondary)]">
              {user ? `Signed in as ${user.displayName}` : 'Guest Mode · Progress saved locally'}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={preferences.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]/60"
            >
              {preferences.theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <Link
              to={user ? '/profile' : '/auth/login'}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]/60 whitespace-nowrap"
            >
              {user ? <User className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />}
              <span>{user ? 'Profile' : 'Sign In'}</span>
            </Link>
          </div>
        </header>

        {/* Guest Progress Merge Prompt */}
        {guestPendingMerge && (
          <div className="border-b border-[var(--border-subtle)] bg-[var(--accent-primary)]/10 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--text-primary)]">
              You have local guest progress on this device. Merge it into your account without overwriting newer records?
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={mergeGuestIntoAccount}
                className="rounded-lg bg-[var(--accent-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-95"
              >
                Merge Progress
              </button>
              <button
                type="button"
                onClick={dismissGuestMerge}
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Achievement Toast */}
        {achievementMeta && (
          <div
            role="status"
            className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 shadow-lg"
          >
            <Award className="w-5 h-5 text-[var(--accent-primary)] shrink-0" />
            <div className="text-sm">
              <div className="font-semibold text-[var(--text-primary)]">
                Achievement Unlocked: {achievementMeta.title}
              </div>
              <div className="text-xs text-[var(--text-secondary)]">
                {achievementMeta.description}
              </div>
            </div>
            <button
              type="button"
              onClick={dismissAchievementToast}
              aria-label="Dismiss achievement notification"
              className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
};
