import { auth } from "@clerk/nextjs/server";
import { getDrizzleDB } from "@/lib/db";
import { resumes, resumeHistory } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { Resume, NewResumeHistory } from "@/types/database";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/resumes/[id]
 * 특정 이력서 상세 정보 조회
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

    return Response.json({ resume });
  } catch (error) {
    console.error("Error fetching resume:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/resumes/[id]
 * 이력서 메타데이터 수정
 */
export async function PATCH(
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
      title?: string;
      content?: string;
      is_active?: boolean;
      changeReason?: string;
    };

    // 업데이트할 필드 검증 및 준비
    const updateData: {
      title?: string;
      content?: string | null;
      isActive?: boolean;
      version?: number;
    } = {};

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || body.title.trim().length === 0) {
        return Response.json(
          { error: "Title must be a non-empty string" },
          { status: 400 }
        );
      }
      updateData.title = body.title.trim();
    }

    if (body.content !== undefined) {
      if (typeof body.content !== "string") {
        return Response.json(
          { error: "Content must be a string" },
          { status: 400 }
        );
      }
      updateData.content = body.content.trim() || null;
    }

    if (body.is_active !== undefined) {
      if (typeof body.is_active !== "boolean") {
        return Response.json(
          { error: "is_active must be a boolean" },
          { status: 400 }
        );
      }
      updateData.isActive = body.is_active;
    }

    // 업데이트할 필드가 없으면 에러
    if (Object.keys(updateData).length === 0) {
      return Response.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // 변경사항이 있는 경우에만 히스토리 저장
    // (title이나 content가 변경되는 경우)
    const shouldSaveHistory = 
      (body.title !== undefined && body.title !== existingResume.title) ||
      (body.content !== undefined && body.content !== existingResume.content);

    if (shouldSaveHistory) {
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

      // 버전 증가
      updateData.version = existingResume.version + 1;
    }

    // 이력서 업데이트
    const [updatedResume] = await db
      .update(resumes)
      .set({
        ...updateData,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(resumes.resumeId, resumeId))
      .returning();

    return Response.json({
      success: true,
      resume: updatedResume,
    });
  } catch (error) {
    console.error("Error updating resume:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/resumes/[id]
 * 이력서 삭제 (소프트 삭제: is_active = false)
 */
export async function DELETE(
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

    // 소프트 삭제: is_active = false
    await db
      .update(resumes)
      .set({ isActive: false })
      .where(eq(resumes.resumeId, resumeId));

    return Response.json({
      success: true,
      message: "Resume deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting resume:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

