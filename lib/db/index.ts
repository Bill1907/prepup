import { drizzle } from "drizzle-orm/d1";
import { getRequestContext } from "@cloudflare/next-on-pages";
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
    // Cloudflare Workers 환경 (프로덕션 또는 wrangler dev)
    const { env } = getRequestContext();
    const typedEnv = env as CloudflareEnv;

    if (!typedEnv.prepup_db) {
      throw new Error(
        'D1 database binding "prepup_db" is not configured. Please check wrangler.jsonc.'
      );
    }

    d1Database = typedEnv.prepup_db;
  } catch (error) {
    // 로컬 개발 환경 (npm run dev)
    // @cloudflare/next-on-pages가 로컬에서도 동작하도록 시도
    // 만약 실패하면 명확한 에러 메시지 제공
    if (error instanceof Error && error.message.includes("prepup_db")) {
      throw error;
    }

    // 로컬 개발 환경에서는 wrangler dev를 사용하거나
    // 원격 D1에 직접 연결하는 방법을 사용해야 합니다
    throw new Error(
      "D1 database is not available in this environment. " +
        "For local development, use 'wrangler dev' or ensure @cloudflare/next-on-pages is properly configured. " +
        "See docs/development/getting-started.md for more information."
    );
  }

  return drizzle(d1Database, { schema });
}

/**
 * Drizzle 스키마 export
 */
export * from "./schema";

