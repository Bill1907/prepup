import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

// Enums
export const subscriptionTierEnum = ["free", "premium", "pro"] as const;
export const questionCategoryEnum = [
  "behavioral",
  "technical",
  "system_design",
  "leadership",
  "problem_solving",
  "company_specific",
] as const;
export const difficultyEnum = ["easy", "medium", "hard"] as const;
export const sessionStatusEnum = [
  "in_progress",
  "completed",
  "paused",
] as const;
export const subscriptionStatusEnum = [
  "active",
  "cancelled",
  "expired",
] as const;
export const paymentProviderEnum = [
  "toss_payments",
  "kakao_pay",
  "paddle",
] as const;

// 1) USERS
export const users = sqliteTable(
  "users",
  {
    clerkUserId: text("clerk_user_id").primaryKey(),
    email: text("email"), // 실제 DB에 존재하는 필드 (nullable)
    languagePreference: text("language_preference").notNull().default("en"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  }
);

// 2) RESUMES
export const resumes = sqliteTable(
  "resumes",
  {
    resumeId: text("resume_id").primaryKey(),
    clerkUserId: text("clerk_user_id")
      .notNull()
      .references(() => users.clerkUserId, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: text("content"),
    version: integer("version").notNull().default(1),
    isActive: integer("is_active").notNull().default(1),
    fileUrl: text("file_url"),
    aiFeedback: text("ai_feedback"), // JSON as TEXT
    score: integer("score"), // CHECK (score BETWEEN 0 AND 100)
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userIdx: index("idx_resumes_user").on(table.clerkUserId),
    activeIdx: index("idx_resumes_active").on(table.isActive),
  })
);

// 3) RESUME HISTORY
export const resumeHistory = sqliteTable(
  "resume_history",
  {
    historyId: text("history_id").primaryKey(),
    resumeId: text("resume_id")
      .notNull()
      .references(() => resumes.resumeId, { onDelete: "cascade" }),
    clerkUserId: text("clerk_user_id")
      .notNull()
      .references(() => users.clerkUserId, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: text("content"),
    version: integer("version").notNull(),
    fileUrl: text("file_url"),
    aiFeedback: text("ai_feedback"), // JSON as TEXT
    score: integer("score"), // CHECK (score BETWEEN 0 AND 100)
    changeReason: text("change_reason"), // 변경 사유 (선택사항)
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    resumeIdx: index("idx_history_resume").on(table.resumeId),
    userIdx: index("idx_history_user").on(table.clerkUserId),
    createdAtIdx: index("idx_history_created").on(table.createdAt),
  })
);

// 4) INTERVIEW QUESTIONS
export const interviewQuestions = sqliteTable(
  "interview_questions",
  {
    questionId: text("question_id").primaryKey(),
    resumeId: text("resume_id")
      .notNull()
      .references(() => resumes.resumeId, { onDelete: "cascade" }),
    clerkUserId: text("clerk_user_id")
      .notNull()
      .references(() => users.clerkUserId, { onDelete: "cascade" }),
    questionText: text("question_text").notNull(),
    category: text("category").$type<(typeof questionCategoryEnum)[number]>(),
    difficulty: text("difficulty").$type<(typeof difficultyEnum)[number]>(),
    suggestedAnswer: text("suggested_answer"),
    tips: text("tips"),
    tags: text("tags"), // JSON array as TEXT (e.g., '["자기소개", "프로젝트경험", "React"]')
    isBookmarked: integer("is_bookmarked", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userIdx: index("idx_q_user").on(table.clerkUserId),
    resumeIdx: index("idx_q_resume").on(table.resumeId),
    catDiffIdx: index("idx_q_cat_diff").on(table.category, table.difficulty),
  })
);

// 5) MOCK INTERVIEW SESSIONS
export const mockInterviewSessions = sqliteTable(
  "mock_interview_sessions",
  {
    sessionId: text("session_id").primaryKey(),
    clerkUserId: text("clerk_user_id")
      .notNull()
      .references(() => users.clerkUserId, { onDelete: "cascade" }),
    resumeId: text("resume_id").references(() => resumes.resumeId, {
      onDelete: "set null",
    }),
    startTime: text("start_time")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    endTime: text("end_time"),
    durationSeconds: integer("duration_seconds"),
    questionsCount: integer("questions_count"),
    recordingUrl: text("recording_url"),
    aiEvaluation: text("ai_evaluation"), // JSON as TEXT
    overallScore: integer("overall_score"), // CHECK (overall_score BETWEEN 0 AND 100)
    status: text("status")
      .$type<(typeof sessionStatusEnum)[number]>()
      .notNull()
      .default("in_progress" as (typeof sessionStatusEnum)[number]),
  },
  (table) => ({
    userIdx: index("idx_sessions_user").on(table.clerkUserId),
    statusIdx: index("idx_sessions_status").on(table.status),
    startIdx: index("idx_sessions_start").on(table.startTime),
  })
);

// 6) INTERVIEW ANSWERS
export const interviewAnswers = sqliteTable(
  "interview_answers",
  {
    answerId: text("answer_id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => mockInterviewSessions.sessionId, {
        onDelete: "cascade",
      }),
    questionId: text("question_id")
      .notNull()
      .references(() => interviewQuestions.questionId, {
        onDelete: "cascade",
      }),
    userAnswer: text("user_answer"),
    audioUrl: text("audio_url"),
    durationSeconds: integer("duration_seconds"),
    aiFeedback: text("ai_feedback"), // JSON as TEXT
    score: integer("score"), // CHECK (score BETWEEN 0 AND 100)
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    sessionIdx: index("idx_answers_session").on(table.sessionId),
    questionIdx: index("idx_answers_question").on(table.questionId),
  })
);

// 7) SUBSCRIPTIONS
export const subscriptions = sqliteTable(
  "subscriptions",
  {
    subscriptionId: text("subscription_id").primaryKey(),
    clerkUserId: text("clerk_user_id")
      .notNull()
      .unique()
      .references(() => users.clerkUserId, { onDelete: "cascade" }),
    tier: text("tier").$type<(typeof subscriptionTierEnum)[number]>().notNull(),
    startDate: text("start_date").notNull(),
    endDate: text("end_date"),
    autoRenew: integer("auto_renew", { mode: "boolean" })
      .notNull()
      .default(true),
    status: text("status")
      .$type<(typeof subscriptionStatusEnum)[number]>()
      .notNull()
      .default("active" as (typeof subscriptionStatusEnum)[number]),
    paymentProvider: text("payment_provider")
      .$type<(typeof paymentProviderEnum)[number]>()
      .default("toss_payments" as (typeof paymentProviderEnum)[number]),
    transactionId: text("transaction_id"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userIdx: index("idx_subscriptions_user").on(table.clerkUserId),
    statusIdx: index("idx_subscriptions_status").on(table.status),
  })
);

// 8) USER NOTES
export const userNotes = sqliteTable(
  "user_notes",
  {
    noteId: text("note_id").primaryKey(),
    clerkUserId: text("clerk_user_id")
      .notNull()
      .references(() => users.clerkUserId, { onDelete: "cascade" }),
    questionId: text("question_id").references(
      () => interviewQuestions.questionId,
      { onDelete: "set null" }
    ),
    noteText: text("note_text").notNull(),
    isPublic: integer("is_public", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userIdx: index("idx_notes_user").on(table.clerkUserId),
    questionIdx: index("idx_notes_question").on(table.questionId),
  })
);

// 9) USAGE STATS
export const usageStats = sqliteTable(
  "usage_stats",
  {
    statId: text("stat_id").primaryKey(),
    clerkUserId: text("clerk_user_id")
      .notNull()
      .references(() => users.clerkUserId, { onDelete: "cascade" }),
    resumesCreated: integer("resumes_created").notNull().default(0),
    interviewsCompleted: integer("interviews_completed").notNull().default(0),
    totalMockInterviewMinutes: integer("total_mock_interview_minutes")
      .notNull()
      .default(0),
    averageScore: real("average_score"),
    lastActivity: text("last_activity"),
  },
  (table) => ({
    userUniqueIdx: uniqueIndex("idx_usage_user_unique").on(table.clerkUserId),
  })
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  resumes: many(resumes),
  resumeHistory: many(resumeHistory),
  interviewQuestions: many(interviewQuestions),
  mockInterviewSessions: many(mockInterviewSessions),
  subscriptions: many(subscriptions),
  userNotes: many(userNotes),
  usageStats: many(usageStats),
}));

export const resumesRelations = relations(resumes, ({ one, many }) => ({
  user: one(users, {
    fields: [resumes.clerkUserId],
    references: [users.clerkUserId],
  }),
  interviewQuestions: many(interviewQuestions),
  mockInterviewSessions: many(mockInterviewSessions),
  history: many(resumeHistory),
}));

export const resumeHistoryRelations = relations(resumeHistory, ({ one }) => ({
  resume: one(resumes, {
    fields: [resumeHistory.resumeId],
    references: [resumes.resumeId],
  }),
  user: one(users, {
    fields: [resumeHistory.clerkUserId],
    references: [users.clerkUserId],
  }),
}));

export const interviewQuestionsRelations = relations(
  interviewQuestions,
  ({ one, many }) => ({
    resume: one(resumes, {
      fields: [interviewQuestions.resumeId],
      references: [resumes.resumeId],
    }),
    user: one(users, {
      fields: [interviewQuestions.clerkUserId],
      references: [users.clerkUserId],
    }),
    answers: many(interviewAnswers),
    notes: many(userNotes),
  })
);

export const mockInterviewSessionsRelations = relations(
  mockInterviewSessions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [mockInterviewSessions.clerkUserId],
      references: [users.clerkUserId],
    }),
    resume: one(resumes, {
      fields: [mockInterviewSessions.resumeId],
      references: [resumes.resumeId],
    }),
    answers: many(interviewAnswers),
  })
);

export const interviewAnswersRelations = relations(
  interviewAnswers,
  ({ one }) => ({
    session: one(mockInterviewSessions, {
      fields: [interviewAnswers.sessionId],
      references: [mockInterviewSessions.sessionId],
    }),
    question: one(interviewQuestions, {
      fields: [interviewAnswers.questionId],
      references: [interviewQuestions.questionId],
    }),
  })
);

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.clerkUserId],
    references: [users.clerkUserId],
  }),
}));

export const userNotesRelations = relations(userNotes, ({ one }) => ({
  user: one(users, {
    fields: [userNotes.clerkUserId],
    references: [users.clerkUserId],
  }),
  question: one(interviewQuestions, {
    fields: [userNotes.questionId],
    references: [interviewQuestions.questionId],
  }),
}));

export const usageStatsRelations = relations(usageStats, ({ one }) => ({
  user: one(users, {
    fields: [usageStats.clerkUserId],
    references: [users.clerkUserId],
  }),
}));
