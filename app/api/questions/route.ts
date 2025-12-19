import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  graphqlClient,
  GET_QUESTIONS,
  GET_BOOKMARKED_QUESTIONS,
  GET_QUESTION_STATS,
  type GetQuestionsResponse,
  type GetQuestionStatsResponse,
  type QuestionCategory,
} from "@/lib/graphql";

export const runtime = "edge";

// Valid question categories
const validCategories: QuestionCategory[] = [
  "behavioral",
  "technical",
  "system_design",
  "leadership",
  "problem_solving",
  "company_specific",
];

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
      const data = await graphqlClient.request<GetQuestionStatsResponse>(
        GET_QUESTION_STATS,
        { userId }
      );

      const stats = {
        total: data.total.aggregate?.count ?? 0,
        bookmarked: data.bookmarked.aggregate?.count ?? 0,
        byCategory: {
          behavioral: data.behavioral.aggregate?.count ?? 0,
          technical: data.technical.aggregate?.count ?? 0,
          system_design: data.system_design.aggregate?.count ?? 0,
          leadership: data.leadership.aggregate?.count ?? 0,
          problem_solving: data.problem_solving.aggregate?.count ?? 0,
          company_specific: data.company_specific.aggregate?.count ?? 0,
        },
      };

      return NextResponse.json({ stats });
    }

    // 필터 파싱
    const category = searchParams.get("category");
    const bookmarked = searchParams.get("bookmarked");
    const resumeId = searchParams.get("resumeId");

    // 북마크만 조회하는 경우
    if (bookmarked === "true") {
      const data = await graphqlClient.request<GetQuestionsResponse>(
        GET_BOOKMARKED_QUESTIONS,
        { userId }
      );

      let questions = data.interview_questions;

      // 추가 필터 적용
      if (category && validCategories.includes(category as QuestionCategory)) {
        questions = questions.filter((q) => q.category === category);
      }
      if (resumeId) {
        questions = questions.filter((q) => q.resume_id === resumeId);
      }

      return NextResponse.json({ questions });
    }

    // 전체 질문 조회
    const data = await graphqlClient.request<GetQuestionsResponse>(
      GET_QUESTIONS,
      { userId }
    );

    let questions = data.interview_questions;

    // 클라이언트 측 필터링 (추후 GraphQL where 절로 최적화 가능)
    if (category && validCategories.includes(category as QuestionCategory)) {
      questions = questions.filter((q) => q.category === category);
    }
    if (bookmarked === "false") {
      questions = questions.filter((q) => !q.is_bookmarked);
    }
    if (resumeId) {
      questions = questions.filter((q) => q.resume_id === resumeId);
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("[API] GET /api/questions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}
