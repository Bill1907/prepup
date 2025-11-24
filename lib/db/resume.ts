import { eq, and, desc, isNotNull } from "drizzle-orm";
import { getDrizzleDB } from "./core";
import { resumes, resumeHistory } from "./schema";

/**
 * 이력서 상세 정보 조회 (권한 검증 포함)
 * @param resumeId 이력서 ID
 * @param userId Clerk 사용자 ID
 * @returns 이력서 정보 또는 null (없거나 권한 없음, 비활성 이력서)
 */
export async function getResumeById(
  resumeId: string,
  userId: string
): Promise<typeof resumes.$inferSelect | null> {
  const db = getDrizzleDB();

  const [resume] = await db
    .select()
    .from(resumes)
    .where(
      and(
        eq(resumes.resumeId, resumeId),
        eq(resumes.clerkUserId, userId)
      )
    )
    .limit(1);

  if (!resume) {
    return null;
  }

  // 활성 이력서만 반환
  if (resume.isActive !== 1) {
    return null;
  }

  return resume;
}

/**
 * 사용자의 모든 활성 이력서 목록 조회
 * @param userId Clerk 사용자 ID
 * @returns 활성 이력서 목록
 */
export async function getActiveResumesByUserId(
  userId: string
): Promise<Array<typeof resumes.$inferSelect>> {
  const db = getDrizzleDB();

  return await db
    .select()
    .from(resumes)
    .where(
      and(
        eq(resumes.clerkUserId, userId),
        eq(resumes.isActive, 1)
      )
    )
    .orderBy(desc(resumes.createdAt));
}

/**
 * 이력서의 AI 리뷰 히스토리 조회 (권한 검증 포함)
 * @param resumeId 이력서 ID
 * @param userId Clerk 사용자 ID
 * @returns AI 피드백이 있는 히스토리 목록 (최신순)
 */
export async function getResumeHistoryWithAI(
  resumeId: string,
  userId: string
): Promise<Array<typeof resumeHistory.$inferSelect>> {
  const db = getDrizzleDB();

  return await db
    .select()
    .from(resumeHistory)
    .where(
      and(
        eq(resumeHistory.resumeId, resumeId),
        eq(resumeHistory.clerkUserId, userId),
        isNotNull(resumeHistory.aiFeedback)
      )
    )
    .orderBy(desc(resumeHistory.createdAt));
}

