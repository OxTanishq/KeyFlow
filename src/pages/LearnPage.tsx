import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Hand, Lock, Play, Star } from 'lucide-react';
import {
  LESSONS,
  getLessonUnlockStates,
  type LessonDefinition,
} from '../core/lessons';
import { computeProgressSummary } from '../core/analytics';
import { useAppStore } from '../store/useAppStore';
import { VirtualKeyboard } from '../components/VirtualKeyboard';

const CURRICULUM_STAGES = [
  'Home position',
  'One hand at a time',
  'The rows above and below',
  'The whole alphabet',
  'Numbers and Shift',
  'Real sentences',
];

export const LearnPage: React.FC = () => {
  const { lessonProgress, sessions } = useAppStore();
  const [activeStageTab, setActiveStageTab] = useState(CURRICULUM_STAGES[0]);

  const unlockStates = useMemo(
    () => getLessonUnlockStates(lessonProgress),
    [lessonProgress]
  );

  const summary = useMemo(
    () => computeProgressSummary(sessions, lessonProgress),
    [sessions, lessonProgress]
  );

  const currentLesson: LessonDefinition = useMemo(() => {
    const found = LESSONS.find(
      (l) => unlockStates[l.id] === 'in_progress' || unlockStates[l.id] === 'available'
    );
    return found ?? LESSONS[LESSONS.length - 1];
  }, [unlockStates]);

  const overallPercent = Math.round((summary.totalLessonsCompleted / LESSONS.length) * 100);
  const practiceMinutes = Math.round(summary.totalPracticeSeconds / 60);

  return (
    <div className="space-y-10">
      {/* Header + Overall Progress Card */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Learn Touch Typing
          </h1>
          <p className="text-base text-[var(--text-secondary)] leading-relaxed">
            Build confidence with every keystroke. Master the keyboard one lesson at a time.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 w-full lg:w-80 shrink-0 space-y-3 tabular-nums">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>{summary.totalLessonsCompleted} of {LESSONS.length} lessons</span>
            <span className="font-mono-typing text-[var(--accent-primary)]">{overallPercent}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-[var(--bg-elevated)] overflow-hidden">
            <div
              className="h-full bg-[var(--accent-primary)] transition-[width] duration-300"
              style={{ width: `${overallPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="inline-flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-[var(--status-warning)] fill-[var(--status-warning)]" />
              <span>{summary.totalStarsEarned} of 30 stars earned</span>
            </span>
            <span>{summary.currentStreakDays}d streak</span>
          </div>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 tabular-nums">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <div className="text-xs text-[var(--text-secondary)]">Current Lesson</div>
          <div className="mt-1 text-lg font-bold text-[var(--text-primary)] truncate">
            {currentLesson.sequenceNumber}. {currentLesson.title}
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <div className="text-xs text-[var(--text-secondary)]">Average Accuracy</div>
          <div className="mt-1 text-2xl font-bold font-mono-typing text-[var(--text-primary)]">
            {summary.averageAccuracy > 0 ? `${summary.averageAccuracy}%` : '—'}
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <div className="text-xs text-[var(--text-secondary)]">Total Practice Time</div>
          <div className="mt-1 text-2xl font-bold font-mono-typing text-[var(--text-primary)]">
            {practiceMinutes > 0 ? `${practiceMinutes}m` : `${summary.totalPracticeSeconds}s`}
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <div className="text-xs text-[var(--text-secondary)]">Learning Streak</div>
          <div className="mt-1 text-2xl font-bold font-mono-typing text-[var(--text-primary)]">
            {summary.currentStreakDays} {summary.currentStreakDays === 1 ? 'day' : 'days'}
          </div>
        </div>
      </div>

      {/* Featured Current Lesson Spotlight + Mini Keyboard Preview */}
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <p className="text-xs font-semibold text-[var(--accent-primary)]">
              Up Next · Lesson {currentLesson.sequenceNumber} of {LESSONS.length}
            </p>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-primary)] text-lg font-bold text-white font-mono-typing">
                {currentLesson.sequenceNumber}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                  {currentLesson.title}
                </h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {currentLesson.subtitle}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)]">
              <span>{currentLesson.difficulty}</span>
              <span aria-hidden="true">·</span>
              <span>
                {currentLesson.isExploratory
                  ? 'Explore freely, no timer'
                  : `Pass at ${currentLesson.requiredAccuracy}% accuracy`}
              </span>
              <span aria-hidden="true">·</span>
              <span>Keys: {currentLesson.coveredKeys.join(', ')}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to={`/learn/${currentLesson.id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95"
              >
                <span>Start lesson</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/keyboard"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)]/60"
              >
                <Hand className="w-4 h-4 text-[var(--text-secondary)]" />
                <span>Finger guide</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-2">
            <VirtualKeyboard
              mode="lesson"
              highlightedKeys={currentLesson.coveredKeys}
              showLegend={false}
              compact
            />
            <p className="text-center text-xs text-[var(--text-secondary)]">
              Highlighted keys show the finger colors used in this lesson.
            </p>
          </div>
        </div>
      </section>

      {/* Main Learning Path + Sticky Side Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section className="lg:col-span-8 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Your learning path</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                10 sequential lessons. Passing each lesson unlocks the next.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--status-success)]" />
                <span>Completed</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Play className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>Available</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                <span>Locked</span>
              </span>
            </div>
          </div>

          <div className="space-y-3" data-testid="lesson-list">
            {LESSONS.map((lesson) => {
              const status = unlockStates[lesson.id];
              const record = lessonProgress[lesson.id];
              const isLocked = status === 'locked';
              const isCurrent = status === 'available' || status === 'in_progress';
              const isCompleted = status === 'completed';

              return (
                <div
                  key={lesson.id}
                  data-lesson-id={lesson.id}
                  data-status={status}
                  className={`rounded-2xl border p-5 transition-colors ${
                    isCurrent
                      ? 'border-[var(--accent-primary)]/60 bg-[var(--bg-surface)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-surface)]'
                  } ${isLocked ? 'opacity-70' : ''}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono-typing text-sm font-bold ${
                          isCompleted
                            ? 'bg-emerald-500/15 text-[var(--status-success)]'
                            : isCurrent
                            ? 'bg-[var(--accent-primary)] text-white'
                            : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : lesson.sequenceNumber}
                      </div>

                      <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
                          <span>Lesson {lesson.sequenceNumber}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {isCompleted
                              ? 'Completed'
                              : status === 'in_progress'
                              ? 'In Progress'
                              : isCurrent
                              ? 'Available'
                              : 'Locked'}
                          </span>
                          {!lesson.isExploratory && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>Pass at {lesson.requiredAccuracy}%</span>
                            </>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-[var(--text-primary)]">
                          {lesson.title}
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {lesson.subtitle}
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {lesson.coveredKeys.map((k) => (
                            <span
                              key={k}
                              className="inline-flex items-center justify-center min-w-[26px] h-6 px-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] font-mono-typing text-xs font-semibold text-[var(--text-primary)]"
                            >
                              {k}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
                      {/* Stars */}
                      <div className="flex items-center gap-1" aria-label={`${record?.stars ?? 0} of 3 stars`}>
                        {[1, 2, 3].map((n) => (
                          <Star
                            key={n}
                            className={`w-4 h-4 ${
                              (record?.stars ?? 0) >= n
                                ? 'text-[var(--status-warning)] fill-[var(--status-warning)]'
                                : 'text-[var(--border-subtle)]'
                            }`}
                          />
                        ))}
                      </div>

                      {record && (
                        <div className="text-xs text-[var(--text-secondary)] tabular-nums font-mono-typing">
                          Best: {Math.round(record.bestAccuracy)}% · {Math.round(record.bestWpm)} WPM
                        </div>
                      )}

                      {isLocked ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 py-2 text-xs font-medium text-[var(--text-secondary)]">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Locked</span>
                        </span>
                      ) : (
                        <Link
                          to={`/learn/${lesson.id}`}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap ${
                            isCurrent
                              ? 'bg-[var(--accent-primary)] text-white hover:opacity-95'
                              : 'border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]/60'
                          }`}
                        >
                          <span>
                            {isCompleted ? 'Replay' : status === 'in_progress' ? 'Continue' : 'Start'}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* How the Course Works Sidebar */}
        <aside className="lg:col-span-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-5 lg:sticky lg:top-20">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">How the course works</h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            It starts with the home row, because that is where your fingers return after every reach. Then it builds outwards:
          </p>
          <ol className="space-y-3 text-sm">
            {[
              ['1', 'Home position', 'Lessons 1 and 2'],
              ['2', 'One hand at a time', 'Lessons 3 and 4'],
              ['3', 'The rows above and below', 'Lessons 5 and 6'],
              ['4', 'The whole alphabet', 'Lesson 7'],
              ['5', 'Numbers and Shift', 'Lessons 8 and 9'],
              ['6', 'Real sentences', 'Lesson 10'],
            ].map(([num, label, sub]) => (
              <li key={num} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--bg-elevated)] font-mono-typing text-xs font-bold text-[var(--text-primary)]">
                  {num}
                </span>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">{label}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{sub}</div>
                </div>
              </li>
            ))}
          </ol>

          <div className="border-t border-[var(--border-subtle)] pt-4 space-y-2 text-xs text-[var(--text-secondary)] leading-relaxed">
            <p className="font-semibold text-[var(--text-primary)]">Star rating rules</p>
            <p>Stars come from accuracy, independent of speed: 1 star at 70%, 2 stars at 85%, 3 stars at 95%.</p>
          </div>
        </aside>
      </div>

      {/* Course Curriculum Tabbed Breakdown */}
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Course curriculum</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Explore what each of the 10 lessons teaches, the keys it covers, and the accuracy required to pass.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Course stages"
          className="flex flex-wrap gap-1.5 rounded-xl bg-[var(--bg-elevated)] p-1.5"
        >
          {CURRICULUM_STAGES.map((stage) => (
            <button
              key={stage}
              type="button"
              role="tab"
              aria-selected={activeStageTab === stage}
              onClick={() => setActiveStageTab(stage)}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                activeStageTab === stage
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {stage}
            </button>
          ))}
        </div>

        <div role="tabpanel" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LESSONS.filter((l) => l.stageLabel === activeStageTab).map((l) => {
            const locked = unlockStates[l.id] === 'locked';
            return (
              <div
                key={l.id}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-5 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono-typing text-xs font-bold text-[var(--accent-primary)]">
                    Lesson {String(l.sequenceNumber).padStart(2, '0')}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {l.isExploratory ? 'Explore, no score' : `Pass at ${l.requiredAccuracy}%`}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">{l.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {l.description}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-mono-typing text-[var(--text-secondary)]">
                    Keys: {l.coveredKeys.join(' ')}
                  </span>
                  {!locked && (
                    <Link
                      to={`/learn/${l.id}`}
                      className="text-xs font-semibold text-[var(--accent-primary)] hover:underline"
                    >
                      Open lesson
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
