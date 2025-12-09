import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getQuestionsByUserId,
  getQuestionStats,
  type QuestionFilters,
  type QuestionCategory,
} from "@/lib/db/questions";
import { questionCategoryEnum } from "@/lib/db/schema";

export const runtime = "edge";

/**
 * GET /api/questions
 * 사용자의 질문 목록 조회
 * Query params:
 * - category: 카테고리 필터
 * - bookmarked: 북마크 필터 (true/false)
 * - resumeId: 이력서 ID 필터
 * - stats: true이면 통계만 반환
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statsOnly = searchParams.get("stats") === "true";

    // 통계만 요청한 경우
    if (statsOnly) {
      const stats = await getQuestionStats(userId);
      return NextResponse.json({ stats });
    }

    // 필터 파싱
    const filters: QuestionFilters = {};

    const category = searchParams.get("category");
    if (
      category &&
      questionCategoryEnum.includes(category as QuestionCategory)
    ) {
      filters.category = category as QuestionCategory;
    }

    const bookmarked = searchParams.get("bookmarked");
    if (bookmarked === "true") {
      filters.isBookmarked = true;
    } else if (bookmarked === "false") {
      filters.isBookmarked = false;
    }

    const resumeId = searchParams.get("resumeId");
    if (resumeId) {
      filters.resumeId = resumeId;
    }

    // 질문 목록 조회
    const questions = await getQuestionsByUserId(userId, filters);

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("[API] GET /api/questions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}
