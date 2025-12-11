import { auth, currentUser } from "@clerk/nextjs/server";
import { getDrizzleDB, ensureUserExists, getFile } from "@/lib/db/index";
import { resumes } from "@/lib/db/schema";
import type { NewResume } from "@/types/database";

export const runtime = "edge";

/**
 * POST /api/resumes/upload/complete
 * Presigned URL로 업로드 완료 후 메타데이터 저장
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      fileKey: string;
      title?: string;
      originalFilename?: string;
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

    // 중요: R2에 파일이 실제로 업로드되었는지 검증
    const fileObject = await getFile(body.fileKey);

    if (!fileObject) {
      console.error(`[UPLOAD] File not found in R2: ${body.fileKey}`);
      return Response.json(
        {
          error:
            "File upload failed. The file was not found in storage. Please try again.",
          fileKey: body.fileKey,
        },
        { status: 400 }
      );
    }

    const db = getDrizzleDB();

    // 사용자가 존재하는지 확인하고, 없으면 생성
    // Clerk webhook이 실패하거나 지연되어도 안전하게 동작하도록 합니다
    // Clerk에서 사용자 정보를 가져와 email 포함
    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress || null;
    await ensureUserExists(userId, userEmail);

    // 새 이력서 생성
    const resumeId = crypto.randomUUID();
    const resumeTitle =
      body.title?.trim() ||
      body.originalFilename?.replace(/\.[^/.]+$/, "") ||
      "Untitled Resume";

    const newResume: NewResume = {
      resumeId,
      clerkUserId: userId,
      title: resumeTitle,
      content: null,
      version: 1,
      isActive: 1, // SQLite uses integer for boolean: 1 = true
      fileUrl: body.fileKey,
    };

    const [createdResume] = await db
      .insert(resumes)
      .values(newResume)
      .returning();

    return Response.json(
      {
        success: true,
        resume: createdResume,
        fileUrl: body.fileKey,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error completing resume upload:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
