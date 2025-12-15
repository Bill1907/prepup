import { eq, and, desc, sql } from "drizzle-orm";
import { getDrizzleDB } from "../core";
import { interviewQuestions, questionCategoryEnum } from "../schema";

export type QuestionCategory = (typeof questionCategoryEnum)[number];

export interface QuestionFilters {
  category?: QuestionCategory;
  isBookmarked?: boolean;
  resumeId?: string;
}

export interface QuestionStats {
  total: number;
  bookmarked: number;
  byCategory: Record<QuestionCategory, number>;
}

/**
 * 특정 이력서 기반 질문 조회
 * @param resumeId 이력서 ID
 * @param userId Clerk 사용자 ID
 * @returns 질문 목록 (최신순)
 */
export async function getQuestionsByResumeId(
  resumeId: string,
  userId: string
): Promise<Array<typeof interviewQuestions.$inferSelect>> {
  const db = getDrizzleDB();

  return await db
    .select()
    .from(interviewQuestions)
    .where(
      and(
        eq(interviewQuestions.resumeId, resumeId),
        eq(interviewQuestions.clerkUserId, userId)
      )
    )
    .orderBy(desc(interviewQuestions.createdAt));
}

/**
 * 사용자의 모든 질문 조회 (필터링 지원)
 * @param userId Clerk 사용자 ID
 * @param filters 필터 옵션 (카테고리, 북마크)
 * @returns 질문 목록 (최신순)
 */
export async function getQuestionsByUserId(
  userId: string,
  filters?: QuestionFilters
): Promise<Array<typeof interviewQuestions.$inferSelect>> {
  const db = getDrizzleDB();

  const conditions = [eq(interviewQuestions.clerkUserId, userId)];

  if (filters?.category) {
    conditions.push(eq(interviewQuestions.category, filters.category));
  }

  if (filters?.isBookmarked !== undefined) {
    conditions.push(eq(interviewQuestions.isBookmarked, filters.isBookmarked));
  }

  if (filters?.resumeId) {
    conditions.push(eq(interviewQuestions.resumeId, filters.resumeId));
  }

  return await db
    .select()
    .from(interviewQuestions)
    .where(and(...conditions))
    .orderBy(desc(interviewQuestions.createdAt));
}

/**
 * 질문 단건 조회
 * @param questionId 질문 ID
 * @param userId Clerk 사용자 ID
 * @returns 질문 또는 null
 */
export async function getQuestionById(
  questionId: string,
  userId: string
): Promise<typeof interviewQuestions.$inferSelect | null> {
  const db = getDrizzleDB();

  const [question] = await db
    .select()
    .from(interviewQuestions)
    .where(
      and(
        eq(interviewQuestions.questionId, questionId),
        eq(interviewQuestions.clerkUserId, userId)
      )
    )
    .limit(1);

  return question || null;
}

export interface CreateQuestionInput {
  questionId: string;
  resumeId: string;
  clerkUserId: string;
  questionText: string;
  category?: QuestionCategory;
  difficulty?: "easy" | "medium" | "hard";
  suggestedAnswer?: string;
  tips?: string;
  tags?: string; // JSON array as string (e.g., '["자기소개", "프로젝트경험"]')
}

/**
 * 질문 일괄 생성
 * @param questions 생성할 질문 배열
 * @returns 생성된 질문 수
 */
export async function createQuestions(
  questions: CreateQuestionInput[]
): Promise<number> {
  if (questions.length === 0) return 0;

  const db = getDrizzleDB();

  await db.insert(interviewQuestions).values(questions);

  return questions.length;
}

/**
 * 북마크 토글
 * @param questionId 질문 ID
 * @param userId Clerk 사용자 ID
 * @returns 업데이트된 북마크 상태 또는 null (질문 없음)
 */
export async function toggleBookmark(
  questionId: string,
  userId: string
): Promise<boolean | null> {
  const db = getDrizzleDB();

  // 현재 상태 조회
  const [question] = await db
    .select({ isBookmarked: interviewQuestions.isBookmarked })
    .from(interviewQuestions)
    .where(
      and(
        eq(interviewQuestions.questionId, questionId),
        eq(interviewQuestions.clerkUserId, userId)
      )
    )
    .limit(1);

  if (!question) return null;

  const newState = !question.isBookmarked;

  await db
    .update(interviewQuestions)
    .set({ isBookmarked: newState })
    .where(eq(interviewQuestions.questionId, questionId));

  return newState;
}

/**
 * 질문 삭제
 * @param questionId 질문 ID
 * @param userId Clerk 사용자 ID
 * @returns 삭제 성공 여부
 */
export async function deleteQuestion(
  questionId: string,
  userId: string
): Promise<boolean> {
  const db = getDrizzleDB();

  const result = await db
    .delete(interviewQuestions)
    .where(
      and(
        eq(interviewQuestions.questionId, questionId),
        eq(interviewQuestions.clerkUserId, userId)
      )
    );

  return true;
}

/**
 * 질문 통계 조회
 * @param userId Clerk 사용자 ID
 * @returns 질문 통계 (총 개수, 북마크 수, 카테고리별 개수)
 */
export async function getQuestionStats(userId: string): Promise<QuestionStats> {
  const db = getDrizzleDB();

  // 전체 질문 조회 (카테고리별 집계를 위해)
  const allQuestions = await db
    .select({
      category: interviewQuestions.category,
      isBookmarked: interviewQuestions.isBookmarked,
    })
    .from(interviewQuestions)
    .where(eq(interviewQuestions.clerkUserId, userId));

  const stats: QuestionStats = {
    total: allQuestions.length,
    bookmarked: allQuestions.filter((q) => q.isBookmarked).length,
    byCategory: {
      behavioral: 0,
      technical: 0,
      system_design: 0,
      leadership: 0,
      problem_solving: 0,
      company_specific: 0,
    },
  };

  // 카테고리별 집계
  for (const q of allQuestions) {
    if (q.category && q.category in stats.byCategory) {
      stats.byCategory[q.category as QuestionCategory]++;
    }
  }

  return stats;
}

/**
 * 이력서에 연결된 질문 수 조회
 * @param resumeId 이력서 ID
 * @param userId Clerk 사용자 ID
 * @returns 질문 수
 */
export async function getQuestionCountByResumeId(
  resumeId: string,
  userId: string
): Promise<number> {
  const db = getDrizzleDB();

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(interviewQuestions)
    .where(
      and(
        eq(interviewQuestions.resumeId, resumeId),
        eq(interviewQuestions.clerkUserId, userId)
      )
    );

  return result[0]?.count ?? 0;
}

