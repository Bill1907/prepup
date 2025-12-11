import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { getDrizzleDB } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getRequestContext } from "@cloudflare/next-on-pages";

export async function POST(req: Request) {
  // 환경 변수 가져오기 (로컬 개발 환경과 Cloudflare 환경 모두 지원)
  let WEBHOOK_SECRET: string | undefined;

  try {
    // Cloudflare Workers 환경에서 시도
    const { env } = getRequestContext();
    const typedEnv = env as CloudflareEnv & { CLERK_WEBHOOK_SECRET?: string };
    WEBHOOK_SECRET = typedEnv.CLERK_WEBHOOK_SECRET;
  } catch {
    // 로컬 개발 환경에서는 process.env 사용
    WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  }

  if (!WEBHOOK_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET is not configured");
    return new Response("Error: CLERK_WEBHOOK_SECRET is not configured", {
      status: 500,
    });
  }

  // Svix 헤더 가져오기
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("Missing svix headers");
    return new Response("Error: Missing svix headers", { status: 400 });
  }

  // 요청 본문 가져오기
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Webhook 검증
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error: Verification failed", { status: 400 });
  }

  const eventType = evt.type;
  const db = getDrizzleDB();

  try {
    // 사용자 생성 이벤트 처리
    if (eventType === "user.created") {
      const { id } = evt.data;

      await db.insert(users).values({
        clerkUserId: id,
        languagePreference: "en",
      });

      return new Response("User created successfully", { status: 200 });
    }

    // 사용자 업데이트 이벤트 처리
    if (eventType === "user.updated") {
      const { id } = evt.data;

      // updated_at은 트리거에 의해 자동으로 업데이트됩니다
      // language_preference만 업데이트가 필요한 경우 여기서 처리할 수 있습니다
      return new Response("User updated successfully", { status: 200 });
    }

    // 사용자 삭제 이벤트 처리
    if (eventType === "user.deleted") {
      const { id } = evt.data;

      if (!id) {
        console.error("No user ID found in delete event");
        return new Response("Error: No user ID found", { status: 400 });
      }

      // CASCADE로 자동 삭제되지만 명시적으로 처리
      await db.delete(users).where(eq(users.clerkUserId, id));

      return new Response("User deleted successfully", { status: 200 });
    }

    // 처리되지 않은 이벤트 타입
    return new Response(`Event type ${eventType} not handled`, { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      `Error processing webhook: ${error instanceof Error ? error.message : "Unknown error"}`,
      { status: 500 }
    );
  }
}
