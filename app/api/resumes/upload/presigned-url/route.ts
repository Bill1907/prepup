import { auth } from "@clerk/nextjs/server";
import { AwsClient } from "aws4fetch";
import { getRequestContext } from "@cloudflare/next-on-pages";

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
  const sanitized = filename
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_|_$/g, "");
  
  // 파일명이 비어있거나 확장자가 없는 경우 기본값 사용
  if (!sanitized || sanitized.trim() === "") {
    return "resume.pdf";
  }
  
  // 확장자가 없는 경우 .pdf 추가
  if (!sanitized.includes(".")) {
    return `${sanitized}.pdf`;
  }
  
  return sanitized;
}

/**
 * 파일 타입 검증
 */
function isValidFileType(contentType: string): boolean {
  return ALLOWED_FILE_TYPES.includes(contentType);
}

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

    // R2 API 토큰 확인 (로컬 개발 환경과 Cloudflare 환경 모두 지원)
    //
    // R2 API 토큰 생성 시 생성되는 값:
    // 1. Access Key ID (공개 식별자) → R2_ACCESS_KEY_ID에 설정
    // 2. Secret Access Key (비밀 키, 한 번만 표시됨) → R2_SECRET_ACCESS_KEY에 설정
    // 3. Account ID (Cloudflare Dashboard 우측 상단에서 확인) → R2_ACCOUNT_ID에 설정
    //
    // 로컬 개발 환경 설정 (.dev.vars 파일):
    //   R2_ACCESS_KEY_ID=생성된_Access_Key_ID_값
    //   R2_SECRET_ACCESS_KEY=생성된_Secret_Access_Key_값
    //   R2_ACCOUNT_ID=본인의_Cloudflare_Account_ID
    //
    // 프로덕션 환경 설정 (Wrangler secrets):
    //   npx wrangler secret put R2_ACCESS_KEY_ID
    //   npx wrangler secret put R2_SECRET_ACCESS_KEY
    //   npx wrangler secret put R2_ACCOUNT_ID
    let accessKeyId: string | undefined;
    let secretAccessKey: string | undefined;
    let accountId: string | undefined;

    try {
      // Cloudflare Workers 환경에서 시도
      const { env } = getRequestContext();
      const typedEnv = env as CloudflareEnv & {
        R2_ACCESS_KEY_ID?: string;
        R2_SECRET_ACCESS_KEY?: string;
        R2_ACCOUNT_ID?: string;
      };
      accessKeyId = typedEnv.R2_ACCESS_KEY_ID;
      secretAccessKey = typedEnv.R2_SECRET_ACCESS_KEY;
      accountId = typedEnv.R2_ACCOUNT_ID;
    } catch {
      // 로컬 개발 환경에서는 process.env 사용
      accessKeyId = process.env.R2_ACCESS_KEY_ID;
      secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
      accountId = process.env.R2_ACCOUNT_ID;
    }

    if (!accessKeyId || !secretAccessKey || !accountId) {
      return Response.json(
        {
          error:
            "R2 credentials not configured. Please set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_ACCOUNT_ID as Wrangler secrets.",
        },
        { status: 500 }
      );
    }

    // 파일 키 생성
    const sanitizedFilename = sanitizeFilename(body.filename);
    const timestamp = Date.now();
    const fileKey = `resumes/${userId}/${timestamp}-${sanitizedFilename}`;

    // R2 S3 호환 엔드포인트 URL 생성
    const bucketName = "prepup-files";
    const url = new URL(
      `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${fileKey}`
    );

    // Presigned URL 만료 시간 설정 (1시간)
    url.searchParams.set("X-Amz-Expires", "3600");

    // AWS 클라이언트 생성 및 서명
    const client = new AwsClient({
      accessKeyId,
      secretAccessKey,
    });

    const signedRequest = await client.sign(
      new Request(url.toString(), {
        method: "PUT",
        headers: {
          "Content-Type": body.contentType,
        },
      }),
      {
        aws: { signQuery: true },
      }
    );

    return Response.json({
      presignedUrl: signedRequest.url,
      fileKey,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
