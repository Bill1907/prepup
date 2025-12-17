import { auth } from "@clerk/nextjs/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

/**
 * POST /api/ephemeral
 * OpenAI Realtime API의 client_secrets를 생성하는 엔드포인트
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 환경 변수 가져오기 (로컬 개발 환경과 Cloudflare 환경 모두 지원)
    let apiKey: string | undefined;

    try {
      // Cloudflare Workers 환경에서 시도
      const { env } = getRequestContext();
      const typedEnv = env as CloudflareEnv & { OPENAI_API_KEY?: string };
      apiKey = typedEnv.OPENAI_API_KEY;
    } catch {
      // 로컬 개발 환경에서는 process.env 사용
      apiKey = process.env.OPENAI_API_KEY;
    }

    if (!apiKey) {
      return Response.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://api.openai.com/v1/realtime/client_secrets",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session: {
            type: "realtime",
            model: "gpt-realtime",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI API error:", errorData);
      return Response.json(
        { error: "Failed to create client secret", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error("Error in ephemeral route:", error);
    return Response.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
