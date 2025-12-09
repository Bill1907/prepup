import { auth } from "@clerk/nextjs/server";
import { getFile } from "@/lib/db";

export const runtime = "edge";

/**
 * GET /api/files/[...path]
 * R2에서 파일을 조회하고 스트리밍 반환
 * 인증된 사용자만 본인 파일에 접근 가능
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { path } = await params;
    // 각 경로 세그먼트를 디코딩 (URL 인코딩된 경우 대비)
    const decodedPath = path.map((segment) => decodeURIComponent(segment));
    const filePath = decodedPath.join("/");
    
    console.log(`[DEBUG] Original path array:`, path);
    console.log(`[DEBUG] Decoded path array:`, decodedPath);
    console.log(`[DEBUG] Final file path:`, filePath);

    // 보안: 파일 경로에 userId가 포함되어 있는지 확인
    // resumes/{userId}/... 형식이어야 함
    const pathParts = filePath.split("/");
    if (pathParts.length < 2 || pathParts[0] !== "resumes") {
      return Response.json(
        { error: "Invalid file path", path: filePath },
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

    // R2에서 파일 조회
    console.log(`[DEBUG] Attempting to fetch file from R2: ${filePath}`);
    console.log(`[DEBUG] Path parts:`, pathParts);
    console.log(`[DEBUG] File user ID: ${fileUserId}, Current user ID: ${userId}`);
    
    const fileObject = await getFile(filePath);

    if (!fileObject) {
      console.error(`[DEBUG] File not found in R2: ${filePath}`);
      console.error(`[DEBUG] Attempting to list files with prefix: resumes/${userId}/`);
      
      // 디버깅: 해당 사용자의 파일 목록 확인
      try {
        const { listFiles } = await import("@/lib/db");
        const files = await listFiles(`resumes/${userId}/`, 10);
        console.error(`[DEBUG] Available files for user:`, files.objects?.map(f => f.key));
      } catch (listError) {
        console.error(`[DEBUG] Error listing files:`, listError);
      }
      
      return Response.json(
        { error: "File not found", path: filePath },
        { status: 404 }
      );
    }

    console.log(`[DEBUG] File found in R2: ${filePath}, size: ${fileObject.size}`);

    // 파일 스트리밍 반환
    const contentType =
      fileObject.httpMetadata?.contentType || "application/octet-stream";

    return new Response(fileObject.body, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileObject.size.toString(),
        "Content-Disposition": `inline; filename="${fileObject.customMetadata?.originalFilename || pathParts[pathParts.length - 1]}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error fetching file:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : "Unknown error",
    });
    
    return Response.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

