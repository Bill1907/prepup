import { auth } from "@clerk/nextjs/server";
import { getDrizzleDB } from "@/lib/db";
import { resumes } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { Resume, NewResume } from "@/types/database";

/**
 * GET /api/resumes
 * 현재 사용자의 모든 활성 이력서 목록 조회
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = getDrizzleDB();

    const userResumes = await db
      .select()
      .from(resumes)
      .where(
        and(
          eq(resumes.clerkUserId, userId),
          eq(resumes.isActive, 1) // SQLite uses integer: 1 = true
        )
      )
      .orderBy(desc(resumes.createdAt));

    return Response.json({ resumes: userResumes });
  } catch (error) {
    console.error("Error fetching resumes:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/resumes
 * 새 이력서 생성 (메타데이터만)
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      title?: string;
      content?: string;
    };

    // 요청 본문 검증
    if (!body.title || typeof body.title !== "string" || body.title.trim().length === 0) {
      return Response.json(
        { error: "Title is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (body.content !== undefined && typeof body.content !== "string") {
      return Response.json(
        { error: "Content must be a string" },
        { status: 400 }
      );
    }

    const db = getDrizzleDB();

    // 새 이력서 생성
    const resumeId = crypto.randomUUID();
    const newResume: NewResume = {
      resumeId,
      clerkUserId: userId,
      title: body.title.trim(),
      content: body.content?.trim() || null,
      version: 1,
      isActive: 1, // SQLite uses integer for boolean: 1 = true
    };

    const [createdResume] = await db
      .insert(resumes)
      .values(newResume)
      .returning();

    return Response.json(
      { success: true, resume: createdResume },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating resume:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

