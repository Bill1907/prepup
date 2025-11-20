import { auth } from "@clerk/nextjs/server";
import { getDrizzleDB } from "@/lib/db";
import { resumes, resumeHistory } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { NewResumeHistory } from "@/types/database";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * PUT /api/resumes/[id]/file
 * 이력서 파일 업데이트 (새 파일 업로드 및 기존 파일 교체)
 * 요청 본문: { fileKey: string, changeReason?: string }
 */
export async function PUT(
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
    const [existingResume] = await db
      .select()
      .from(resumes)
      .where(
        and(
          eq(resumes.resumeId, resumeId),
          eq(resumes.clerkUserId, userId)
        )
      )
      .limit(1);

    if (!existingResume) {
      return Response.json(
        { error: "Resume not found" },
        { status: 404 }
      );
    }

    const body = (await request.json()) as {
      fileKey: string;
      changeReason?: string;
    };

    // 요청 본문 검증
    if (!body.fileKey || typeof body.fileKey !== "string") {
      return Response.json(
        { error: "fileKey is required and must be a string" },
        { status: 400 }
      );
    }

    // 보안: 파일 키가 해당 사용자의 것인지 확인
    if (!body.fileKey.startsWith(`resumes/${userId}/`)) {
      return Response.json(
        { error: "Invalid file key" },
        { status: 403 }
      );
    }

    // 현재 버전을 히스토리에 저장
    const historyId = crypto.randomUUID();
    const historyEntry: NewResumeHistory = {
      historyId,
      resumeId: existingResume.resumeId,
      clerkUserId: existingResume.clerkUserId,
      title: existingResume.title,
      content: existingResume.content,
      version: existingResume.version,
      fileUrl: existingResume.fileUrl || null,
      aiFeedback: existingResume.aiFeedback || null,
      score: existingResume.score,
      changeReason: body.changeReason || null,
    };

    await db.insert(resumeHistory).values(historyEntry);

    // 이력서 업데이트 (파일 URL 변경 및 버전 증가)
    const [updatedResume] = await db
      .update(resumes)
      .set({
        fileUrl: body.fileKey,
        version: existingResume.version + 1,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(resumes.resumeId, resumeId))
      .returning();

    return Response.json({
      success: true,
      resume: updatedResume,
    });
  } catch (error) {
    console.error("Error updating resume file:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

