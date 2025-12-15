import { auth } from "@clerk/nextjs/server";
import {
  graphqlClient,
  GET_RESUMES,
  CREATE_RESUME,
  type GetResumesResponse,
  type CreateResumeResponse,
} from "@/lib/graphql";

/**
 * GET /api/resumes
 * 현재 사용자의 모든 활성 이력서 목록 조회
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await graphqlClient.request<GetResumesResponse>(GET_RESUMES, {
      userId,
    });

    return Response.json({ resumes: data.resumes });
  } catch (error) {
    console.error("Error fetching resumes:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/resumes
 * 새 이력서 생성 (메타데이터만)
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      title?: string;
      content?: string;
    };

    // 요청 본문 검증
    if (
      !body.title ||
      typeof body.title !== "string" ||
      body.title.trim().length === 0
    ) {
      return Response.json(
        { error: "Title is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (body.content !== undefined && typeof body.content !== "string") {
      return Response.json(
        { error: "Content must be a string" },
        { status: 400 }
      );
    }

    const resumeId = crypto.randomUUID();

    const data = await graphqlClient.request<CreateResumeResponse>(
      CREATE_RESUME,
      {
        resumeId,
        userId,
        title: body.title.trim(),
        content: body.content?.trim() || null,
        fileUrl: null,
      }
    );

    return Response.json(
      { success: true, resume: data.insert_resumes_one },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating resume:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
