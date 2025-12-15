import { auth } from "@clerk/nextjs/server";
import {
  getPresignedUploadUrl,
  sanitizeFilename,
  MAX_FILE_SIZE,
  isValidFileType,
} from "@/lib/r2";

export const runtime = "edge";

/**
 * POST /api/resumes/upload/presigned-url
 * Presigned URL 생성 (클라이언트가 직접 R2에 업로드할 수 있도록)
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      filename: string;
      contentType: string;
      fileSize: number;
    };

    // 파일 검증
    if (!body.filename || !body.contentType || !body.fileSize) {
      return Response.json(
        { error: "Missing required fields: filename, contentType, fileSize" },
        { status: 400 }
      );
    }

    // 파일 크기 검증
    if (body.fileSize > MAX_FILE_SIZE) {
      return Response.json(
        {
          error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 }
      );
    }

    // 파일 타입 검증
    if (!isValidFileType(body.contentType)) {
      return Response.json(
        {
          error:
            "Invalid file type. Only PDF, DOC, and DOCX files are allowed.",
        },
        { status: 400 }
      );
    }

    // 파일 키 생성
    const sanitizedFilename = sanitizeFilename(body.filename);
    const timestamp = Date.now();
    const fileKey = `resumes/${userId}/${timestamp}-${sanitizedFilename}`;

    // Presigned URL 생성 (PUT용, 1시간 만료)
    const presignedUrl = await getPresignedUploadUrl(
      fileKey,
      body.contentType,
      3600
    );

    return Response.json({
      presignedUrl,
      fileKey,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );

    return Response.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
