import { auth } from "@clerk/nextjs/server";
import {
  graphqlClient,
  GET_RESUME_BY_ID,
  INSERT_RESUME_HISTORY,
  UPDATE_RESUME_FILE,
  type GetResumeByIdResponse,
  type Resume,
} from "@/lib/graphql";

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
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: resumeId } = await params;

    // 먼저 이력서가 존재하고 본인의 것인지 확인
    const data = await graphqlClient.request<GetResumeByIdResponse>(
      GET_RESUME_BY_ID,
      { resumeId }
    );

    const existingResume = data.resumes_by_pk;

    if (!existingResume || existingResume.clerk_user_id !== userId) {
      return Response.json({ error: "Resume not found" }, { status: 404 });
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
      return Response.json({ error: "Invalid file key" }, { status: 403 });
    }

    // 현재 버전을 히스토리에 저장
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

    // 이력서 업데이트 (파일 URL 변경 및 버전 증가)
    const result = await graphqlClient.request<{
      update_resumes_by_pk: Resume;
    }>(UPDATE_RESUME_FILE, {
      resumeId,
      fileUrl: body.fileKey,
      version: existingResume.version + 1,
    });

    return Response.json({
      success: true,
      resume: result.update_resumes_by_pk,
    });
  } catch (error) {
    console.error("Error updating resume file:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
