"use server";

import { auth } from "@clerk/nextjs/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDrizzleDB } from "@/lib/db";
import { resumes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
        and(
          eq(resumes.resumeId, resumeId),
          eq(resumes.clerkUserId, userId)
        )
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

interface AnalyzeResult {
  success: boolean;
  error?: string;
}

/**
 * AI 이력서 분석
 */
export async function analyzeResume(resumeId: string, extractedText: string): Promise<AnalyzeResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const db = getDrizzleDB();
    
    // Verify ownership
    const [resume] = await db
      .select()
      .from(resumes)
      .where(and(eq(resumes.resumeId, resumeId), eq(resumes.clerkUserId, userId)))
      .limit(1);

    if (!resume) return { success: false, error: "Resume not found" };

    // Cloudflare AI Analysis
    let aiResponse: { summary: string; score: number; overall_feedback: string };
    
    try {
       // Get Cloudflare Context to access bindings
       let env;
       try {
         // @ts-ignore - Type definition might be tricky in dev
         const cfContext = await getCloudflareContext();
         env = cfContext.env;
       } catch (e) {
         console.warn("Cloudflare context not found. This is expected in local 'next dev'. Use 'npm run preview' or 'wrangler dev'.");
       }

       if (!env || !env.AI) {
         console.error("AI binding is missing");
         return { success: false, error: "AI service unavailable. Please try again later." };
       }

       const prompt = `
         You are an expert resume analyzer / career coach.
         Analyze the following resume text.
         
         Resume Content:
         """
         ${extractedText.substring(0, 12000)}
         """
         
         Provide the following in strict JSON format:
         {
           "summary": "A 2-3 sentence professional summary of the candidate.",
           "score": <number 0-100 based on completeness, impact, and clarity>,
           "overall_feedback": "3-4 key bullet points on what is good and what to improve."
         }
         
         Do not output markdown code blocks. Just the raw JSON string.
       `;

       // Using Llama 3 8B Instruct
       const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
         messages: [
            { role: 'system', content: 'You are a helpful assistant that outputs only valid JSON.' },
            { role: 'user', content: prompt }
         ]
       });

       const resultText = (response as any).response || "";
       const jsonStr = resultText.replace(/```json\n?|\n?```/g, "").trim();
       
       try {
         aiResponse = JSON.parse(jsonStr);
       } catch (e) {
         console.error("Failed to parse AI JSON:", jsonStr);
         // Fallback attempt: try to find JSON object pattern
         const match = jsonStr.match(/\{[\s\S]*\}/);
         if (match) {
             aiResponse = JSON.parse(match[0]);
         } else {
             throw new Error("Invalid JSON response from AI");
         }
       }
       
       // Validate score
       if (typeof aiResponse.score !== 'number') aiResponse.score = 70;

    } catch (aiErr) {
      console.error("AI Analysis Error:", aiErr);
      return { success: false, error: "AI analysis failed to process the resume." };
    }

    // Update DB
    await db
      .update(resumes)
      .set({
        content: extractedText,
        score: aiResponse.score,
        aiFeedback: JSON.stringify({
           summary: aiResponse.summary,
           overall_feedback: aiResponse.overall_feedback
        }),
        updatedAt: new Date().toISOString()
      })
      .where(eq(resumes.resumeId, resumeId));

    revalidatePath(`/service/resume/${resumeId}`);
    return { success: true };

  } catch (error) {
    console.error("Server Action Error:", error);
    return { success: false, error: "Internal server error" };
  }
}
