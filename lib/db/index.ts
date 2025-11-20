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
    .insert(schema.users)
    .values(userValues as any)
    .onConflictDoNothing();
}

/**
 * Drizzle 스키마 export
 */
export * from "./schema";
