import { auth } from "@clerk/nextjs/server";
import { getPresignedUrl } from "@/lib/db";

export const runtime = "edge";

/**
 * POST /api/files/presigned-url
 * R2 파일 읽기용 Presigned URL 생성
 * lib/db의 getPresignedUrl 함수를 사용하여 일관성 유지
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      fileKey: string;
      expiresIn?: number;
    };

    if (!body.fileKey || typeof body.fileKey !== "string") {
      return Response.json(
        { error: "fileKey is required and must be a string" },
        { status: 400 }
      );
    }

    // 보안: 파일 키가 해당 사용자의 것인지 확인
    if (!body.fileKey.startsWith(`resumes/${userId}/`)) {
      return Response.json(
        { error: "Forbidden: You can only access your own files" },
        { status: 403 }
      );
    }

    // lib/db의 getPresignedUrl 함수 사용
    const expiresIn = body.expiresIn || 3600; // 기본 1시간
    const presignedUrl = await getPresignedUrl(body.fileKey, expiresIn);

    return Response.json({
      presignedUrl,
      fileKey: body.fileKey,
      expiresIn,
    });
  } catch (error) {
    console.error("Error generating presigned URL for file access:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : "Unknown error",
    });

    return Response.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
