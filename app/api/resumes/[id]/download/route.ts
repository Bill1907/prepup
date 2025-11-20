import { auth } from "@clerk/nextjs/server";
import { getDrizzleDB, getFile } from "@/lib/db";
import { resumes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/resumes/[id]/download
 * 이력서 원본 파일 다운로드
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

    // R2에서 파일 조회
    const fileObject = await getFile(resume.fileUrl);

    if (!fileObject) {
      return Response.json(
        { error: "File not found in storage" },
        { status: 404 }
      );
    }

    // 파일명 추출 (fileUrl에서 또는 메타데이터에서)
    const fileName = resume.fileUrl.split("/").pop() || "resume.pdf";
    const originalFilename = fileObject.customMetadata?.originalFilename || fileName;

    // 파일 확장자 확인
    const contentType =
      fileObject.httpMetadata?.contentType || "application/pdf";

    // 다운로드용 헤더 설정
    return new Response(fileObject.body, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileObject.size.toString(),
        "Content-Disposition": `attachment; filename="${originalFilename}"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    console.error("Error downloading resume file:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

