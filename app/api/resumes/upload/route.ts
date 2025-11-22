import { auth } from "@clerk/nextjs/server";
import { getDrizzleDB, uploadFile } from "@/lib/db";
import { resumes } from "@/lib/db/schema";
import type { NewResume } from "@/types/database";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

/**
 * 파일명을 안전하게 정리 (특수문자 제거)
 */
function sanitizeFilename(filename: string): string {
  // 확장자 분리
  const lastDotIndex = filename.lastIndexOf(".");
  let name = filename;
  let extension = "";
  
  if (lastDotIndex > 0) {
    name = filename.substring(0, lastDotIndex);
    extension = filename.substring(lastDotIndex);
  }
  
  // 파일명 sanitize (영문자, 숫자, 하이픈, 언더스코어만 허용)
  const sanitizedName = name
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_|_$/g, "");
  
  // 파일명이 비어있으면 기본값 사용
  const finalName = sanitizedName || "resume";
  
  // 확장자가 없으면 .pdf 추가
  const finalExtension = extension || ".pdf";
  
  return `${finalName}${finalExtension}`;
}

/**
 * 파일 타입 검증
 */
function isValidFileType(file: File): boolean {
  return ALLOWED_FILE_TYPES.includes(file.type);
}

/**
 * POST /api/resumes/upload
 * 이력서 파일을 R2에 업로드하고 데이터베이스에 메타데이터 저장
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;

    // 파일 검증
    if (!file) {
      return Response.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // 파일 타입 검증
    if (!isValidFileType(file)) {
      return Response.json(
        { error: "Invalid file type. Only PDF, DOC, and DOCX files are allowed." },
        { status: 400 }
      );
    }

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

    // 데이터베이스에 이력서 레코드 생성
    const db = getDrizzleDB();
    const resumeId = crypto.randomUUID();
    const resumeTitle = title?.trim() || file.name.replace(/\.[^/.]+$/, ""); // 확장자 제거

    const newResume: NewResume = {
      resumeId,
      clerkUserId: userId,
      title: resumeTitle,
      content: null,
      version: 1,
      isActive: 1, // SQLite uses integer for boolean: 1 = true
      fileUrl: fileKey,
    };

    const [createdResume] = await db
      .insert(resumes)
      .values(newResume)
      .returning();

    return Response.json(
      {
        success: true,
        resume: createdResume,
        fileUrl: fileKey,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error uploading resume:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

