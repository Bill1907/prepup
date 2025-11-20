import { auth } from "@clerk/nextjs/server";
import { getDrizzleDB } from "@/lib/db";
import { resumes, resumeHistory } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/resumes/[id]/history
 * 특정 이력서의 히스토리 목록 조회
 */
export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = getDrizzleDB();
    const { id } = await params;
    const resumeId = id;

    // 먼저 이력서가 존재하고 본인의 것인지 확인
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
      return Response.json(
        { error: "Resume not found" },
        { status: 404 }
      );
    }

    // 페이지네이션 파라미터
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // 히스토리 조회 (최신순)
    const history = await db
      .select()
      .from(resumeHistory)
      .where(
        and(
          eq(resumeHistory.resumeId, resumeId),
          eq(resumeHistory.clerkUserId, userId)
        )
      )
      .orderBy(desc(resumeHistory.createdAt))
      .limit(limit)
      .offset(offset);

    // 전체 개수 조회
    const totalCount = await db
      .select({ count: resumeHistory.historyId })
      .from(resumeHistory)
      .where(
        and(
          eq(resumeHistory.resumeId, resumeId),
          eq(resumeHistory.clerkUserId, userId)
        )
      );

    return Response.json({
      history,
      pagination: {
        total: totalCount.length,
        limit,
        offset,
        hasMore: offset + limit < totalCount.length,
      },
    });
  } catch (error) {
    console.error("Error fetching resume history:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

