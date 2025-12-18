import { auth } from "@clerk/nextjs/server";
import { getPresignedUrl } from "@/lib/r2";
import {
  graphqlClient,
  GET_RESUME_BY_ID,
  type GetResumeByIdResponse,
} from "@/lib/graphql";

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
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: resumeId } = await params;

    // GraphQL로 이력서 조회 (본인의 이력서만)
    const data = await graphqlClient.request<GetResumeByIdResponse>(
      GET_RESUME_BY_ID,
      { resumeId }
    );

    const resume = data.resumes_by_pk;

    if (!resume || resume.clerk_user_id !== userId) {
      return Response.json({ error: "Resume not found" }, { status: 404 });
    }

    if (!resume.file_url) {
      return Response.json(
        { error: "File not found for this resume" },
        { status: 404 }
      );
    }

    // Presigned URL 생성 (GET 요청용, 5분 만료)
    const presignedUrl = await getPresignedUrl(resume.file_url, 300);

    // Presigned URL을 JSON으로 반환
    // 클라이언트에서 직접 다운로드 처리
    return Response.json({ url: presignedUrl });
  } catch (error) {
    console.error("Error generating download URL:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
