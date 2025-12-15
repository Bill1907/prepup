import { auth } from "@clerk/nextjs/server";
import {
  graphqlClient,
  GET_RESUME_BY_ID,
  UPDATE_RESUME_METADATA,
  INSERT_RESUME_HISTORY,
  SOFT_DELETE_RESUME,
  type GetResumeByIdResponse,
  type Resume,
} from "@/lib/graphql";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/resumes/[id]
 * 특정 이력서 상세 정보 조회
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: resumeId } = await params;

    const data = await graphqlClient.request<GetResumeByIdResponse>(
      GET_RESUME_BY_ID,
      { resumeId }
    );

    const resume = data.resumes_by_pk;

    if (!resume || resume.clerk_user_id !== userId) {
      return Response.json({ error: "Resume not found" }, { status: 404 });
    }

    return Response.json({ resume });
  } catch (error) {
    console.error("Error fetching resume:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/resumes/[id]
 * 이력서 메타데이터 수정
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: resumeId } = await params;

    // 먼저 이력서가 존재하고 본인의 것인지 확인
    const existingData = await graphqlClient.request<GetResumeByIdResponse>(
      GET_RESUME_BY_ID,
      { resumeId }
    );

    const existingResume = existingData.resumes_by_pk;

    if (!existingResume || existingResume.clerk_user_id !== userId) {
      return Response.json({ error: "Resume not found" }, { status: 404 });
    }

    const body = (await request.json()) as {
      title?: string;
      content?: string;
      is_active?: boolean;
      changeReason?: string;
    };

    // 업데이트할 필드 검증
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

    if (Object.keys(updateData).length === 0) {
      return Response.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // 변경사항이 있는 경우에만 히스토리 저장
    const shouldSaveHistory =
      (body.title !== undefined && body.title !== existingResume.title) ||
      (body.content !== undefined && body.content !== existingResume.content);

    if (shouldSaveHistory) {
      const historyId = crypto.randomUUID();

      await graphqlClient.request(INSERT_RESUME_HISTORY, {
        historyId,
        resumeId: existingResume.resume_id,
        userId: existingResume.clerk_user_id,
        title: existingResume.title,
        content: existingResume.content,
        version: existingResume.version,
        fileUrl: existingResume.file_url,
        aiFeedback: existingResume.ai_feedback,
        score: existingResume.score,
        changeReason: body.changeReason || null,
      });

      updateData.version = existingResume.version + 1;
    }

    // 이력서 업데이트
    const result = await graphqlClient.request<{
      update_resumes_by_pk: Resume;
    }>(UPDATE_RESUME_METADATA, {
      resumeId,
      ...updateData,
    });

    return Response.json({
      success: true,
      resume: result.update_resumes_by_pk,
    });
  } catch (error) {
    console.error("Error updating resume:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/resumes/[id]
 * 이력서 삭제 (소프트 삭제: is_active = false)
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: resumeId } = await params;

    // 먼저 이력서가 존재하고 본인의 것인지 확인
    const existingData = await graphqlClient.request<GetResumeByIdResponse>(
      GET_RESUME_BY_ID,
      { resumeId }
    );

    const existingResume = existingData.resumes_by_pk;

    if (!existingResume || existingResume.clerk_user_id !== userId) {
      return Response.json({ error: "Resume not found" }, { status: 404 });
    }

    // 소프트 삭제
    await graphqlClient.request(SOFT_DELETE_RESUME, { resumeId });

    return Response.json({
      success: true,
      message: "Resume deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting resume:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
