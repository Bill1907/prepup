import { auth, currentUser } from "@clerk/nextjs/server";
import {
  uploadFile,
  sanitizeFilename,
  MAX_FILE_SIZE,
  isValidFileType,
} from "@/lib/r2";
import {
  graphqlClient,
  CREATE_RESUME,
  ENSURE_USER_EXISTS,
  type CreateResumeResponse,
} from "@/lib/graphql";

/**
 * POST /api/resumes/upload
 * 이력서 파일을 R2에 업로드하고 데이터베이스에 메타데이터 저장
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;

    // 파일 검증
    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        {
          error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 }
      );
    }

    // 파일 타입 검증
    if (!isValidFileType(file.type)) {
      return Response.json(
        {
          error:
            "Invalid file type. Only PDF, DOC, and DOCX files are allowed.",
        },
        { status: 400 }
      );
    }

    // 사용자가 존재하는지 확인하고, 없으면 생성
    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress || null;
    await graphqlClient.request(ENSURE_USER_EXISTS, {
      userId,
      email: userEmail,
    });

    // 파일명 정리
    const sanitizedFilename = sanitizeFilename(file.name);
    const timestamp = Date.now();
    const fileKey = `resumes/${userId}/${timestamp}-${sanitizedFilename}`;

    // R2에 파일 업로드
    const fileArrayBuffer = await file.arrayBuffer();
    await uploadFile(fileKey, fileArrayBuffer, {
      contentType: file.type,
      metadata: {
        originalFilename: file.name,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
      },
    });

    // GraphQL로 이력서 레코드 생성
    const resumeId = crypto.randomUUID();
    const resumeTitle = title?.trim() || file.name.replace(/\.[^/.]+$/, ""); // 확장자 제거

    const data = await graphqlClient.request<CreateResumeResponse>(
      CREATE_RESUME,
      {
        resumeId,
        userId,
        title: resumeTitle,
        fileUrl: fileKey,
        content: null,
      }
    );

    return Response.json(
      {
        success: true,
        resume: data.insert_resumes_one,
        fileUrl: fileKey,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error uploading resume:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
