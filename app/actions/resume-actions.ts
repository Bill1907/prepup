"use server";

import { auth } from "@clerk/nextjs/server";
import { getDrizzleDB } from "@/lib/db";
import { resumes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { openai } from "@/lib/openaiClient";

/**
 * 이력서 삭제 (Soft Delete)
 * isActive를 false로 설정하여 논리적으로 삭제
 */
export async function deleteResume(resumeId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "Unauthorized. Please sign in.",
      };
    }

    const db = getDrizzleDB();

    // 사용자가 소유한 이력서인지 확인
    const resume = await db
      .select()
      .from(resumes)
      .where(
        and(eq(resumes.resumeId, resumeId), eq(resumes.clerkUserId, userId))
      )
      .limit(1);

    if (resume.length === 0) {
      return {
        success: false,
        error: "Resume not found or you don't have permission to delete it.",
      };
    }

    // Soft delete: isActive를 0으로 설정
    await db
      .update(resumes)
      .set({
        isActive: 0,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(resumes.resumeId, resumeId));

    // 페이지 재검증
    revalidatePath("/service/resume");

    return {
      success: true,
      message: "Resume deleted successfully.",
    };
  } catch (error) {
    console.error("Error deleting resume:", error);
    return {
      success: false,
      error: "Failed to delete resume. Please try again.",
    };
  }
}

interface ResumeAnalysisData {
  summary: string;
  score: number;
  strengths: string[];
  improvements: string[];
}

interface AnalyzeResult {
  success: boolean;
  error?: string;
  analysis?: ResumeAnalysisData;
}

/**
 * AI 이력서 분석 (JSON Mode 사용)
 */
export async function analyzeResume(
  resumeId: string,
  extractedText: string
): Promise<AnalyzeResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const db = getDrizzleDB();

    // Verify ownership
    const [resume] = await db
      .select()
      .from(resumes)
      .where(
        and(eq(resumes.resumeId, resumeId), eq(resumes.clerkUserId, userId))
      )
      .limit(1);

    if (!resume) return { success: false, error: "Resume not found" };

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert resume analyzer and career coach. Analyze resumes and provide structured feedback.",
          },
          {
            role: "user",
            content: `Analyze the following resume and provide detailed feedback:

Resume Content:
"""
${extractedText.substring(0, 12000)}
"""

Provide:
1. A professional summary (2-3 sentences)
2. A score from 0-100 based on completeness, impact, and clarity
3. Key strengths (2-5 bullet points)
4. Areas for improvement (2-5 bullet points)`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "resume_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                summary: {
                  type: "string",
                  description:
                    "A 2-3 sentence professional summary of the candidate",
                },
                score: {
                  type: "number",
                  description:
                    "A score from 0-100 based on completeness, impact, and clarity",
                },
                strengths: {
                  type: "array",
                  description: "List of key strengths found in the resume",
                  items: {
                    type: "string",
                  },
                },
                improvements: {
                  type: "array",
                  description: "List of areas that need improvement",
                  items: {
                    type: "string",
                  },
                },
              },
              required: ["summary", "score", "strengths", "improvements"],
              additionalProperties: false,
            },
          },
        },
      });

      // Parse the structured response
      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error("No response from AI");
      }

      const analysisData: ResumeAnalysisData = JSON.parse(responseContent);

      revalidatePath(`/service/resume/${resumeId}`);
      return { success: true, analysis: analysisData };
    } catch (error) {
      console.error("Server Action Error:", error);
      return { success: false, error: "Internal server error" };
    }
  } catch (error) {
    console.error("Analyze Resume Error:", error);
    return { success: false, error: "Failed to analyze resume" };
  }
}
