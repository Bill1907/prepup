// R2 Storage Helper Functions
// Cloudflare R2 스토리지 관련 헬퍼 함수들
//
// D1 데이터베이스는 lib/db/index.ts의 Drizzle ORM을 사용하세요:
//   import { getDrizzleDB } from "@/lib/db/index";

import { getRequestContext } from "@cloudflare/next-on-pages";

// Drizzle ORM re-export (편의를 위해)
export { getDrizzleDB } from "./db/index";
export * from "./db/schema";

/**
 * R2 스토리지 인스턴스 가져오기
 * Cloudflare R2 바인딩에서 스토리지 인스턴스를 반환합니다.
 *
 * @returns R2Bucket 인스턴스
 * @throws 환경 변수에 FILES 바인딩이 없으면 에러 발생
 */
export function getR2() {
  const { env } = getRequestContext();
  // CloudflareEnv는 cloudflare-env.d.ts에서 전역으로 선언됨
  const typedEnv = env as CloudflareEnv;

  if (!typedEnv.FILES) {
    throw new Error(
      'R2 bucket binding "FILES" is not configured. Please check wrangler.jsonc.'
    );
  }

  return typedEnv.FILES;
}

/**
 * UUID 생성 헬퍼
 * @deprecated crypto.randomUUID()를 직접 사용하거나 Drizzle의 generateId를 사용하세요
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * 현재 타임스탬프 헬퍼
 * @deprecated new Date().toISOString()을 직접 사용하세요
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

// R2 헬퍼 함수들

/**
 * R2에 파일 업로드
 */
export async function uploadFile(
  key: string,
  data: ReadableStream | ArrayBuffer | string | Blob,
  options?: {
    contentType?: string;
    metadata?: Record<string, string>;
  }
) {
  const r2 = getR2();
  await r2.put(key, data as any, {
    httpMetadata: options?.contentType
      ? {
          contentType: options.contentType,
        }
      : undefined,
    customMetadata: options?.metadata,
  });
  return key;
}

/**
 * R2에서 파일 가져오기
 */
export async function getFile(key: string) {
  const r2 = getR2();
  return await r2.get(key);
}

/**
 * R2에서 파일 삭제
 */
export async function deleteFile(key: string) {
  const r2 = getR2();
  await r2.delete(key);
}

/**
 * R2 파일 목록 가져오기
 */
export async function listFiles(prefix?: string, limit: number = 100) {
  const r2 = getR2();
  return await r2.list({
    prefix,
    limit,
  });
}
