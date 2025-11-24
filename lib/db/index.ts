/**
 * Core DB utilities
 * DB 인스턴스와 R2 버킷 가져오기 함수들
 */
export { getDrizzleDB, getR2Bucket } from "./core";

/**
 * 사용자가 존재하는지 확인하고, 없으면 생성하는 헬퍼 함수
 * Clerk webhook이 실패하거나 지연되어도 안전하게 동작하도록 합니다.
 *
 * @param clerkUserId Clerk 사용자 ID
 * @param email 사용자 이메일 (선택사항, 실제 DB에 email 필드가 있는 경우 필요)
 * @returns Promise<void>
 */
export async function ensureUserExists(
  clerkUserId: string,
  email?: string | null
): Promise<void> {
  const { getDrizzleDB } = await import("./core");
  const { users } = await import("./schema");
  const db = getDrizzleDB();

  // 실제 데이터베이스 스키마에 email 필드가 있는 경우를 대비하여
  // email이 제공되면 포함하고, 없으면 빈 문자열이나 null을 사용
  // onConflictDoNothing을 사용하여 사용자가 이미 있으면 무시
  const userValues: {
    clerkUserId: string;
    languagePreference: string;
    email?: string | null;
  } = {
    clerkUserId,
    languagePreference: "en",
  };

  // email이 제공된 경우에만 포함
  if (email !== undefined) {
    userValues.email = email || null;
  }

  await db
    .insert(users)
    .values(userValues as any)
    .onConflictDoNothing();
}

/**
 * R2 버킷의 파일 목록 조회
 * @param prefix 파일 키 prefix (예: "resumes/user_123/")
 * @param limit 최대 반환 개수 (기본값: 1000)
 * @returns R2Objects (목록, truncated 여부 등)
 */
export async function listFiles(
  prefix?: string,
  limit: number = 1000
): Promise<R2Objects> {
  const { getR2Bucket } = await import("./core");
  const r2Bucket = getR2Bucket();
  return await r2Bucket.list({ prefix, limit });
}

/**
 * R2에서 파일 가져오기
 * @param fileKey R2에 저장된 파일 키
 * @returns R2Object 또는 null (파일이 없는 경우)
 */
export async function getFile(fileKey: string): Promise<R2Object | null> {
  const { getR2Bucket } = await import("./core");
  const r2Bucket = getR2Bucket();
  return await r2Bucket.get(fileKey);
}

/**
 * R2에 파일 업로드
 * @param fileKey R2에 저장할 파일 키
 * @param data 파일 데이터 (ArrayBuffer 또는 Uint8Array)
 * @param options 업로드 옵션 (contentType, metadata 등)
 */
export async function uploadFile(
  fileKey: string,
  data: ArrayBuffer | Uint8Array,
  options?: {
    contentType?: string;
    metadata?: Record<string, string>;
  }
): Promise<void> {
  const { getR2Bucket } = await import("./core");
  const r2Bucket = getR2Bucket();

  await r2Bucket.put(fileKey, data, {
    httpMetadata: options?.contentType
      ? {
          contentType: options.contentType,
        }
      : undefined,
    customMetadata: options?.metadata,
  });
}

/**
 * R2 파일에 대한 Presigned URL 생성 (GET용)
 * S3 호환 API를 사용하여 일관성 유지
 * @param fileKey R2 파일 키
 * @param expiresIn 만료 시간 (초, 기본 3600 = 1시간)
 * @returns Presigned URL
 */
export async function getPresignedUrl(
  fileKey: string,
  expiresIn: number = 3600
): Promise<string> {
  const { getRequestContext } = await import("@cloudflare/next-on-pages");

  // R2 API 토큰 확인
  let accessKeyId: string | undefined;
  let secretAccessKey: string | undefined;
  let accountId: string | undefined;

  try {
    // Cloudflare Workers 환경
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
    throw new Error(
      "R2 credentials not configured. Please set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_ACCOUNT_ID."
    );
  }

  // R2 S3 호환 엔드포인트 URL 생성
  const bucketName = "prepup-files";
  const url = new URL(
    `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${fileKey}`
  );

  // Presigned URL 만료 시간 설정
  url.searchParams.set("X-Amz-Expires", expiresIn.toString());

  // AWS 클라이언트 생성 및 서명
  const { AwsClient } = await import("aws4fetch");
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

  return signedRequest.url;
}

/**
 * Drizzle 스키마 export
 */
export * from "./schema";

/**
 * 도메인별 데이터 접근 함수 export
 * Resume 도메인
 */
export * from "./resume";
