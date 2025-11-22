import { auth } from "@clerk/nextjs/server";
import { getDrizzleDB, getPresignedUrl } from "@/lib/db";
import { resumes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const runtime = "edge";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/resumes/[id]/download
 * 이력서 원본 파일 다운로드용 Presigned URL로 리다이렉트
 * S3 호환 API를 사용하여 업로드/프리뷰와 일관성 유지
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

    // 이력서 조회 (본인의 이력서만)
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

    if (!resume.fileUrl) {
      return Response.json(
        { error: "File not found for this resume" },
        { status: 404 }
      );
    }

    // Presigned URL 생성 (GET 요청용, 5분 만료)
    const presignedUrl = await getPresignedUrl(resume.fileUrl, 300);

    // Presigned URL로 리다이렉트
    // 브라우저가 직접 R2에서 다운로드하므로 Workers 대역폭 절약
    return Response.redirect(presignedUrl, 302);
  } catch (error) {
    console.error("Error generating download URL:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

