import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
  uid: text('uid').primaryKey(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  typingGoalWpm: integer('typing_goal_wpm').notNull().default(60),
  preferredDifficulty: text('preferred_difficulty').notNull().default('intermediate'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const lessons = pgTable('lessons', {
  id: text('id').primaryKey(), // e.g. 'meet-the-keyboard'
  sequenceNumber: integer('sequence_number').notNull().unique(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  requiredAccuracy: integer('required_accuracy').notNull().default(85),
  coveredKeys: text('covered_keys').notNull(), // comma-separated keys
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const lessonProgress = pgTable(
  'lesson_progress',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .references(() => profiles.uid, { onDelete: 'cascade' })
      .notNull(),
    lessonId: text('lesson_id')
      .references(() => lessons.id, { onDelete: 'cascade' })
      .notNull(),
    bestAccuracy: real('best_accuracy').notNull().default(0),
    bestWpm: real('best_wpm').notNull().default(0),
    stars: integer('stars').notNull().default(0),
    completed: boolean('completed').notNull().default(false),
    attempts: integer('attempts').notNull().default(0),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('lesson_progress_user_lesson_idx').on(table.userId, table.lessonId),
  ]
);

export const typingSessions = pgTable('typing_sessions', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => profiles.uid, { onDelete: 'cascade' })
    .notNull(),
  mode: text('mode').notNull(), // 'lesson' | 'practice' | 'test'
  category: text('category').notNull().default('standard'),
  durationSeconds: real('duration_seconds').notNull(),
  rawWpm: real('raw_wpm').notNull(),
  netWpm: real('net_wpm').notNull(),
  accuracy: real('accuracy').notNull(),
  correctCharacters: integer('correct_characters').notNull(),
  incorrectCharacters: integer('incorrect_characters').notNull(),
  correctedCharacters: integer('corrected_characters').notNull().default(0),
  completedAt: timestamp('completed_at').defaultNow().notNull(),
});

export const keyStatistics = pgTable(
  'key_statistics',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .references(() => profiles.uid, { onDelete: 'cascade' })
      .notNull(),
    keyIdentifier: text('key_identifier').notNull(),
    attempts: integer('attempts').notNull().default(0),
    errors: integer('errors').notNull().default(0),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('key_statistics_user_key_idx').on(table.userId, table.keyIdentifier),
  ]
);

export const gameScores = pgTable('game_scores', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => profiles.uid, { onDelete: 'cascade' })
    .notNull(),
  gameType: text('game_type').notNull(), // 'word-rush' | 'falling-words' | 'typing-race' | 'keyboard-defender' | 'speed-challenge'
  score: integer('score').notNull(),
  accuracy: real('accuracy').notNull(),
  wpm: real('wpm').notNull().default(0),
  level: integer('level').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userPreferences = pgTable('user_preferences', {
  userId: text('user_id')
    .primaryKey()
    .references(() => profiles.uid, { onDelete: 'cascade' }),
  theme: text('theme').notNull().default('light'),
  soundEnabled: boolean('sound_enabled').notNull().default(true),
  keyboardLayout: text('keyboard_layout').notNull().default('US'),
  preferredDuration: integer('preferred_duration').notNull().default(60),
  showKeyboard: boolean('show_keyboard').notNull().default(true),
  highlightErrors: boolean('highlight_errors').notNull().default(true),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const achievements = pgTable(
  'achievements',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .references(() => profiles.uid, { onDelete: 'cascade' })
      .notNull(),
    achievementType: text('achievement_type').notNull(),
    unlockedAt: timestamp('unlocked_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('achievements_user_type_idx').on(table.userId, table.achievementType),
  ]
);

export const profilesRelations = relations(profiles, ({ many, one }) => ({
  lessonProgress: many(lessonProgress),
  typingSessions: many(typingSessions),
  keyStatistics: many(keyStatistics),
  gameScores: many(gameScores),
  preferences: one(userPreferences, {
    fields: [profiles.uid],
    references: [userPreferences.userId],
  }),
  achievements: many(achievements),
}));
