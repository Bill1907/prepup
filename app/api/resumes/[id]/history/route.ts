import { auth } from "@clerk/nextjs/server";
import {
  graphqlClient,
  GET_RESUME_BY_ID,
  GET_RESUME_HISTORY_ALL,
  type GetResumeByIdResponse,
} from "@/lib/graphql";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

interface ResumeHistoryAllResponse {
  resume_history: Array<{
    history_id: string;
    resume_id: string;
    clerk_user_id: string;
    title: string;
    content: string | null;
    version: number;
    file_url: string | null;
    ai_feedback: Record<string, unknown> | null;
    score: number | null;
    change_reason: string | null;
    created_at: string;
  }>;
  resume_history_aggregate: {
    aggregate: {
      count: number;
    };
  };
}

/**
 * GET /api/resumes/[id]/history
 * 특정 이력서의 히스토리 목록 조회
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: resumeId } = await params;

    // 먼저 이력서가 존재하고 본인의 것인지 확인
    const resumeData = await graphqlClient.request<GetResumeByIdResponse>(
      GET_RESUME_BY_ID,
      { resumeId }
    );

    const resume = resumeData.resumes_by_pk;

    if (!resume || resume.clerk_user_id !== userId) {
      return Response.json({ error: "Resume not found" }, { status: 404 });
    }

    // 페이지네이션 파라미터
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // 히스토리 조회 (최신순)
    const historyData =
      await graphqlClient.request<ResumeHistoryAllResponse>(
        GET_RESUME_HISTORY_ALL,
        {
          resumeId,
          userId,
          limit,
          offset,
        }
      );

    const total = historyData.resume_history_aggregate.aggregate.count;

    return Response.json({
      history: historyData.resume_history,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching resume history:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
