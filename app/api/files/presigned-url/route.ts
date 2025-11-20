import { auth } from "@clerk/nextjs/server";
import { AwsClient } from "aws4fetch";
import { getRequestContext } from "@cloudflare/next-on-pages";

/**
 * POST /api/files/presigned-url
 * GET 요청용 Presigned URL 생성 (클라이언트가 직접 R2에서 파일을 가져올 수 있도록)
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      fileUrl: string;
    };

    // 파일 URL 검증
    if (!body.fileUrl || typeof body.fileUrl !== "string") {
      return Response.json(
        { error: "Missing or invalid fileUrl" },
        { status: 400 }
      );
    }

    // 보안: 파일 경로에 userId가 포함되어 있는지 확인
    // resumes/{userId}/... 형식이어야 함
    const pathParts = body.fileUrl.split("/");
    if (pathParts.length < 2 || pathParts[0] !== "resumes") {
      return Response.json(
        { error: "Invalid file path", path: body.fileUrl },
        { status: 400 }
      );
    }

    const fileUserId = pathParts[1];
    if (fileUserId !== userId) {
      return Response.json(
        { error: "Forbidden: You can only access your own files" },
        { status: 403 }
      );
    }

    // R2 API 토큰 확인 (로컬 개발 환경과 Cloudflare 환경 모두 지원)
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

    // R2 S3 호환 엔드포인트 URL 생성
    const bucketName = "prepup-files";
    const url = new URL(
      `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${body.fileUrl}`
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
        method: "GET",
      }),
      {
        aws: { signQuery: true },
      }
    );

    return Response.json({
      presignedUrl: signedRequest.url,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

