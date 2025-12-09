import { auth } from "@clerk/nextjs/server";
import { AwsClient } from "aws4fetch";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const runtime = "edge";

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

    // 1. Cloudflare Workers 환경 (프로덕션) - getRequestContext 시도
    try {
      const { env } = getRequestContext();
      const typedEnv = env as CloudflareEnv & {
        R2_ACCESS_KEY_ID?: string;
        R2_SECRET_ACCESS_KEY?: string;
        R2_ACCOUNT_ID?: string;
      };
      accessKeyId = typedEnv.R2_ACCESS_KEY_ID;
      secretAccessKey = typedEnv.R2_SECRET_ACCESS_KEY;
      accountId = typedEnv.R2_ACCOUNT_ID;

      if (accessKeyId && secretAccessKey && accountId) {
        console.log("[Presigned URL] Using credentials from getRequestContext");
      }
    } catch (error) {
      console.log(
        "[Presigned URL] getRequestContext failed, trying getCloudflareContext"
      );
    }

    // 2. 로컬 개발 환경 - getCloudflareContext 시도
    if (!accessKeyId || !secretAccessKey || !accountId) {
      try {
        const { env } = getCloudflareContext();
        const typedEnv = env as CloudflareEnv & {
          R2_ACCESS_KEY_ID?: string;
          R2_SECRET_ACCESS_KEY?: string;
          R2_ACCOUNT_ID?: string;
        };
        accessKeyId = typedEnv.R2_ACCESS_KEY_ID;
        secretAccessKey = typedEnv.R2_SECRET_ACCESS_KEY;
        accountId = typedEnv.R2_ACCOUNT_ID;

        if (accessKeyId && secretAccessKey && accountId) {
          console.log(
            "[Presigned URL] Using credentials from getCloudflareContext"
          );
        }
      } catch (fallbackError) {
        console.log(
          "[Presigned URL] getCloudflareContext failed, trying process.env"
        );
      }
    }

    // 3. Fallback: process.env에서 직접 읽기 (로컬 개발 환경 - .env.local 지원)
    if (!accessKeyId || !secretAccessKey || !accountId) {
      // Next.js는 .env.local의 환경 변수를 process.env에 자동으로 로드합니다
      accessKeyId = process.env.R2_ACCESS_KEY_ID;
      secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
      accountId = process.env.R2_ACCOUNT_ID;

      if (accessKeyId && secretAccessKey && accountId) {
        console.log(
          "[Presigned URL] Using credentials from process.env (.env.local)"
        );
      } else {
        // 디버깅: process.env에 어떤 값들이 있는지 확인
        console.log("[Presigned URL] process.env check:", {
          hasR2_ACCESS_KEY_ID: !!process.env.R2_ACCESS_KEY_ID,
          hasR2_SECRET_ACCESS_KEY: !!process.env.R2_SECRET_ACCESS_KEY,
          hasR2_ACCOUNT_ID: !!process.env.R2_ACCOUNT_ID,
          // 보안을 위해 값은 로그하지 않음
        });
      }
    }

    // 환경 변수 검증 및 디버깅 정보
    if (!accessKeyId || !secretAccessKey || !accountId) {
      const missingVars: string[] = [];
      if (!accessKeyId) missingVars.push("R2_ACCESS_KEY_ID");
      if (!secretAccessKey) missingVars.push("R2_SECRET_ACCESS_KEY");
      if (!accountId) missingVars.push("R2_ACCOUNT_ID");

      console.error("[Presigned URL] Missing R2 credentials:", missingVars);
      console.error(
        "[Presigned URL] Please set these in either:",
        "\n  1. .dev.vars file (Cloudflare Workers standard)",
        "\n  2. .env.local file (Next.js standard - will be loaded to process.env)",
        "\n  3. Wrangler secrets (production)"
      );

      return Response.json(
        {
          error:
            `R2 credentials not configured. Missing: ${missingVars.join(", ")}. ` +
            "Please set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_ACCOUNT_ID in .env.local or .dev.vars (local) or as Wrangler secrets (production).",
        },
        { status: 500 }
      );
    }

    // Account ID 검증 (placeholder 값 체크)
    if (
      accountId.includes("your_cloudflare_account_id") ||
      accountId.includes("YOUR_ACCOUNT_ID")
    ) {
      console.error(
        "[Presigned URL] Invalid R2_ACCOUNT_ID: placeholder value detected"
      );
      return Response.json(
        {
          error:
            "R2_ACCOUNT_ID is set to a placeholder value. Please set your actual Cloudflare Account ID from the dashboard.",
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
    const r2Url = `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${fileKey}`;

    console.log("[Presigned URL] Generating presigned URL:", {
      bucketName,
      accountId: accountId.substring(0, 8) + "...", // 보안을 위해 일부만 로그
      fileKey,
      url: r2Url.substring(0, 50) + "...", // 보안을 위해 일부만 로그
    });

    const url = new URL(r2Url);

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
