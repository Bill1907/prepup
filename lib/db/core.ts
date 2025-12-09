import { drizzle } from "drizzle-orm/d1";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "./schema";

/**
 * Drizzle ORM 데이터베이스 인스턴스 가져오기
 * Cloudflare D1 바인딩을 사용하여 Drizzle ORM 인스턴스를 반환합니다.
 * 로컬 개발 환경과 Cloudflare Workers 환경 모두 지원합니다.
 *
 * @returns Drizzle D1 데이터베이스 인스턴스
 * @throws 환경 변수에 prepup_db 바인딩이 없으면 에러 발생
 */
export function getDrizzleDB() {
  let d1Database: D1Database;

  try {
    // 먼저 @cloudflare/next-on-pages를 시도 (프로덕션 환경)
    const { env } = getRequestContext();
    const typedEnv = env as CloudflareEnv;

    if (!typedEnv.prepup_db) {
      throw new Error(
        'D1 database binding "prepup_db" is not configured. Please check wrangler.jsonc.'
      );
    }

    d1Database = typedEnv.prepup_db;
  } catch (error) {
    // 로컬 개발 환경 (npm run dev)에서는 @opennextjs/cloudflare 사용
    // initOpenNextCloudflareForDev()가 next.config.ts에서 호출되어 있음
    try {
      const { env } = getCloudflareContext();
      const typedEnv = env as CloudflareEnv;

      if (!typedEnv.prepup_db) {
        throw new Error(
          'D1 database binding "prepup_db" is not configured. Please check wrangler.jsonc.'
        );
      }

      d1Database = typedEnv.prepup_db;
    } catch (fallbackError) {
      // 두 방법 모두 실패한 경우
      if (error instanceof Error && error.message.includes("prepup_db")) {
        throw error;
      }
      if (
        fallbackError instanceof Error &&
        fallbackError.message.includes("prepup_db")
      ) {
        throw fallbackError;
      }

      throw new Error(
        "D1 database is not available in this environment. " +
          "Make sure wrangler.jsonc is properly configured with prepup_db binding. " +
          "For local development, ensure @opennextjs/cloudflare is properly initialized in next.config.ts. " +
          "See docs/development/getting-started.md for more information."
      );
    }
  }

  return drizzle(d1Database, { schema });
}

/**
 * R2 버킷 가져오기 (내부 헬퍼 함수)
 */
export function getR2Bucket(): R2Bucket {
  try {
    // 먼저 @cloudflare/next-on-pages를 시도 (프로덕션 환경)
    const { env } = getRequestContext();
    const typedEnv = env as CloudflareEnv;

    console.log("[getR2Bucket] Available env bindings:", Object.keys(env || {}));
    console.log("[getR2Bucket] prepup_files binding exists:", !!typedEnv.prepup_files);

    if (!typedEnv.prepup_files) {
      throw new Error(
        'R2 bucket binding "prepup_files" is not configured. Please check wrangler.jsonc.'
      );
    }

    return typedEnv.prepup_files;
  } catch (error) {
    console.error("[getR2Bucket] Error in getRequestContext:", error);
    
    // 로컬 개발 환경에서는 @opennextjs/cloudflare 사용
    try {
      const { env } = getCloudflareContext();
      const typedEnv = env as CloudflareEnv;

      console.log("[getR2Bucket] Fallback - Available env bindings:", Object.keys(env || {}));
      console.log("[getR2Bucket] Fallback - prepup_files binding exists:", !!typedEnv.prepup_files);

      if (!typedEnv.prepup_files) {
        throw new Error(
          'R2 bucket binding "prepup_files" is not configured. Please check wrangler.jsonc.'
        );
      }

      return typedEnv.prepup_files;
    } catch (fallbackError) {
      console.error("[getR2Bucket] Error in getCloudflareContext:", fallbackError);
      
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
          "Make sure wrangler.jsonc is properly configured with prepup_files binding. " +
          `Original error: ${error instanceof Error ? error.message : String(error)}. ` +
          `Fallback error: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`
      );
    }
  }
}
