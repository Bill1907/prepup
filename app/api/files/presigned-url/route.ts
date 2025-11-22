import { auth } from "@clerk/nextjs/server";
import { AwsClient } from "aws4fetch";

export const runtime = "edge";

/**
 * POST /api/files/presigned-url
 * R2 파일 읽기용 Presigned URL 생성
 * 업로드와 동일한 방식으로 S3 API를 사용하여 일관성 유지
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      fileKey: string;
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

    // R2 API 토큰 확인
    let accessKeyId: string | undefined;
    let secretAccessKey: string | undefined;
    let accountId: string | undefined;

    try {
      // Cloudflare Workers 환경
      const { getRequestContext } = await import("@cloudflare/next-on-pages");
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
      // 로컬 개발 환경
      accessKeyId = process.env.R2_ACCESS_KEY_ID;
      secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
      accountId = process.env.R2_ACCOUNT_ID;
    }

    if (!accessKeyId || !secretAccessKey || !accountId) {
      return Response.json(
        {
          error:
            "R2 credentials not configured. Please set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_ACCOUNT_ID.",
        },
        { status: 500 }
      );
    }

    // R2 S3 호환 엔드포인트 URL 생성
    const bucketName = "prepup-files";
    const url = new URL(
      `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${body.fileKey}`
    );

    // Presigned URL 만료 시간 설정 (1시간)
    url.searchParams.set("X-Amz-Expires", "3600");

    // AWS 클라이언트 생성 및 서명 (GET 요청용)
    const client = new AwsClient({
      accessKeyId,
      secretAccessKey,
    });

    const signedRequest = await client.sign(
      new Request(url.toString(), {
        method: "GET",
      }),
      {
        aws: { signQuery: true },
      }
    );

    return Response.json({
      presignedUrl: signedRequest.url,
      fileKey: body.fileKey,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error("Error generating presigned URL for file access:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
