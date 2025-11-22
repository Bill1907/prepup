import { auth } from "@clerk/nextjs/server";
import { listFiles } from "@/lib/db";

export const runtime = "edge";

/**
 * GET /api/debug/r2-list
 * R2 버킷의 파일 목록을 조회 (디버깅용)
 */
export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const prefix = url.searchParams.get("prefix") || `resumes/${userId}/`;

    const files = await listFiles(prefix, 50);

    return Response.json({
      prefix,
      count: files.objects.length,
      truncated: files.truncated,
      files: files.objects.map((obj) => ({
        key: obj.key,
        size: obj.size,
        uploaded: obj.uploaded.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error listing R2 files:", error);
    return Response.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

