/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { AppShell } from './components/AppShell';
import { LandingPage } from './pages/LandingPage';
import { LearnPage } from './pages/LearnPage';
import { LessonDetailPage } from './pages/LessonDetailPage';
import { PracticePage } from './pages/PracticePage';
import { TestPage } from './pages/TestPage';
import { KeyboardGuidePage } from './pages/KeyboardGuidePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { AuthPage } from './pages/AuthPages';
import { ProfilePage, SettingsPage } from './pages/ProfileAndSettingsPage';
import { AboutPage, PrivacyPage, TermsPage } from './pages/InfoPages';

const PlayPage = lazy(() =>
  import('./pages/PlayPage').then((m) => ({ default: m.PlayPage }))
);
const ProgressPage = lazy(() =>
  import('./pages/ProgressPage').then((m) => ({ default: m.ProgressPage }))
);

const RouteLoadingFallback: React.FC = () => (
  <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading page">
    <div className="h-8 w-56 rounded-xl bg-[var(--bg-elevated)]" />
    <div className="h-44 w-full rounded-2xl bg-[var(--bg-elevated)]" />
  </div>
);

const NotFoundPage: React.FC = () => (
  <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-10 text-center space-y-4">
    <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">Page not found</h1>
    <p className="text-sm text-[var(--text-secondary)]">
      The requested route does not exist on KeyFlow.
    </p>
    <Link
      to="/"
      className="inline-flex rounded-xl bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-semibold text-white"
    >
      Return Home
    </Link>
  </div>
);

const AppRoutes: React.FC = () => {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <AppShell variant={isLanding ? 'landing' : 'workspace'}>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/learn/:lessonId" element={<LessonDetailPage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/play" element={<PlayPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/keyboard" element={<KeyboardGuidePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/auth/login" element={<AuthPage mode="login" />} />
          <Route path="/auth/register" element={<AuthPage mode="register" />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
};

export default function App() {
  const initAuthAndData = useAppStore((s) => s.initAuthAndData);

  useEffect(() => {
    const unsub = initAuthAndData();
    return () => unsub();
  }, [initAuthAndData]);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
