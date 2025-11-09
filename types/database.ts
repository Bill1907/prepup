// PrepUp Database Types
// Drizzle ORM에서 자동 생성되는 타입을 사용합니다.

import type {
  InferSelectModel,
  InferInsertModel,
} from "drizzle-orm";
import {
  users,
  resumes,
  interviewQuestions,
  mockInterviewSessions,
  interviewAnswers,
  subscriptions,
  userNotes,
  usageStats,
} from "@/lib/db/schema";

// Select 타입 (조회용)
export type User = InferSelectModel<typeof users>;
export type Resume = InferSelectModel<typeof resumes>;
export type InterviewQuestion = InferSelectModel<typeof interviewQuestions>;
export type MockInterviewSession = InferSelectModel<
  typeof mockInterviewSessions
>;
export type InterviewAnswer = InferSelectModel<typeof interviewAnswers>;
export type Subscription = InferSelectModel<typeof subscriptions>;
export type UserNote = InferSelectModel<typeof userNotes>;
export type UsageStat = InferSelectModel<typeof usageStats>;

// Insert 타입 (삽입용)
export type NewUser = InferInsertModel<typeof users>;
export type NewResume = InferInsertModel<typeof resumes>;
export type NewInterviewQuestion = InferInsertModel<typeof interviewQuestions>;
export type NewMockInterviewSession = InferInsertModel<
  typeof mockInterviewSessions
>;
export type NewInterviewAnswer = InferInsertModel<typeof interviewAnswers>;
export type NewSubscription = InferInsertModel<typeof subscriptions>;
export type NewUserNote = InferInsertModel<typeof userNotes>;
export type NewUsageStat = InferInsertModel<typeof usageStats>;

// JSON 파싱을 위한 타입 (기존 호환성 유지)
export interface AIFeedback {
  summary: string;
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  keywords?: string[];
}

export interface AIEvaluation {
  communication_score: number;
  technical_score: number;
  problem_solving_score: number;
  confidence_score: number;
  overall_feedback: string;
  strengths: string[];
  areas_for_improvement: string[];
}

// Enum 타입들
export type SubscriptionTier = "free" | "premium" | "pro";
export type QuestionCategory = "behavioral" | "technical" | "situational";
export type Difficulty = "easy" | "medium" | "hard";
export type SessionStatus = "in_progress" | "completed" | "paused";
export type SubscriptionStatus = "active" | "cancelled" | "expired";
export type PaymentProvider = "toss_payments" | "kakao_pay" | "paddle";
