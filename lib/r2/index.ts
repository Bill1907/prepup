/**
 * R2 Storage Utilities
 * Cloudflare R2 파일 저장소 관련 유틸리티 함수들
 */

import { getRequestContext } from "@cloudflare/next-on-pages";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { AwsClient } from "aws4fetch";

/**
 * R2 버킷 가져오기
 */
export function getR2Bucket(): R2Bucket {
  try {
    // 먼저 @cloudflare/next-on-pages를 시도 (프로덕션 환경)
    const { env } = getRequestContext();
    const typedEnv = env as CloudflareEnv;

    if (!typedEnv.prepup_files) {
      throw new Error(
        'R2 bucket binding "prepup_files" is not configured. Please check wrangler.jsonc.'
      );
    }

    return typedEnv.prepup_files;
  } catch (error) {
    // 로컬 개발 환경에서는 @opennextjs/cloudflare 사용
    try {
      const { env } = getCloudflareContext();
      const typedEnv = env as CloudflareEnv;

      if (!typedEnv.prepup_files) {
        throw new Error(
          'R2 bucket binding "prepup_files" is not configured. Please check wrangler.jsonc.'
        );
      }

      return typedEnv.prepup_files;
    } catch (fallbackError) {
      // 두 방법 모두 실패한 경우
      if (error instanceof Error && error.message.includes("prepup_files")) {
        throw error;
      }
      if (
        fallbackError instanceof Error &&
        fallbackError.message.includes("prepup_files")
      ) {
        throw fallbackError;
      }

      throw new Error(
        "R2 bucket is not available in this environment. " +
          "Make sure wrangler.jsonc is properly configured with prepup_files binding."
      );
    }
  }
}

/**
 * R2 API 자격 증명 가져오기
 */
function getR2Credentials(): {
  accessKeyId: string;
  secretAccessKey: string;
  accountId: string;
} {
  let accessKeyId: string | undefined;
  let secretAccessKey: string | undefined;
  let accountId: string | undefined;

  try {
    // Edge runtime 및 로컬 개발 환경에서는 getCloudflareContext 사용
    const { env } = getCloudflareContext();
    const typedEnv = env as CloudflareEnv & {
      R2_ACCESS_KEY_ID?: string;
      R2_SECRET_ACCESS_KEY?: string;
      R2_ACCOUNT_ID?: string;
    };
    accessKeyId = typedEnv.R2_ACCESS_KEY_ID;
    secretAccessKey = typedEnv.R2_SECRET_ACCESS_KEY;
    accountId = typedEnv.R2_ACCOUNT_ID;
  } catch {
    // Cloudflare Workers 환경 (프로덕션)에서는 getRequestContext 사용
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
    } catch {
      // Fallback to process.env
      accessKeyId = process.env.R2_ACCESS_KEY_ID;
      secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
      accountId = process.env.R2_ACCOUNT_ID;
    }
  }

  if (!accessKeyId || !secretAccessKey || !accountId) {
    throw new Error(
      "R2 credentials not configured. Please set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_ACCOUNT_ID."
    );
  }

  return { accessKeyId, secretAccessKey, accountId };
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
  const r2Bucket = getR2Bucket();
  return await r2Bucket.list({ prefix, limit });
}

/**
 * R2에서 파일 가져오기
 * @param fileKey R2에 저장된 파일 키
 * @returns R2Object 또는 null (파일이 없는 경우)
 */
export async function getFile(fileKey: string): Promise<R2Object | null> {
  const r2Bucket = getR2Bucket();
  return await r2Bucket.get(fileKey);
}

/**
 * R2에서 파일 데이터를 직접 가져오기 (ArrayBuffer로 반환)
 * OpenAI API 등에 업로드하기 위한 용도
 * @param fileKey R2에 저장된 파일 키
 * @returns ArrayBuffer 또는 null (파일이 없는 경우)
 */
export async function getFileData(fileKey: string): Promise<ArrayBuffer | null> {
  const r2Bucket = getR2Bucket();
  const file = await r2Bucket.get(fileKey);

  if (!file) {
    return null;
  }

  return await file.arrayBuffer();
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
  const { accessKeyId, secretAccessKey, accountId } = getR2Credentials();

  // R2 S3 호환 엔드포인트 URL 생성
  const bucketName = "prepup-files";
  const url = new URL(
    `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${fileKey}`
  );

  // Presigned URL 만료 시간 설정
  url.searchParams.set("X-Amz-Expires", expiresIn.toString());

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

  return signedRequest.url;
}

/**
 * R2 파일에 대한 Presigned URL 생성 (PUT용, 업로드)
 * @param fileKey R2 파일 키
 * @param contentType 파일 MIME 타입
 * @param expiresIn 만료 시간 (초, 기본 3600 = 1시간)
 * @returns Presigned URL
 */
export async function getPresignedUploadUrl(
  fileKey: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  const { accessKeyId, secretAccessKey, accountId } = getR2Credentials();

  // R2 S3 호환 엔드포인트 URL 생성
  const bucketName = "prepup-files";
  const url = new URL(
    `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${fileKey}`
  );

  // Presigned URL 만료 시간 설정
  url.searchParams.set("X-Amz-Expires", expiresIn.toString());

  // AWS 클라이언트 생성 및 서명
  const client = new AwsClient({
    accessKeyId,
    secretAccessKey,
  });

  const signedRequest = await client.sign(
    new Request(url.toString(), {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
      },
    }),
    {
      aws: { signQuery: true },
    }
  );

  return signedRequest.url;
}

// ============ Utility Functions ============

/**
 * 파일명을 안전하게 정리 (특수문자 제거)
 */
export function sanitizeFilename(filename: string): string {
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

// ============ Constants ============

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

/**
 * 파일 타입 검증
 */
export function isValidFileType(contentType: string): boolean {
  return ALLOWED_FILE_TYPES.includes(contentType);
}
