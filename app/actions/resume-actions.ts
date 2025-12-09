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
 * PDF URL을 다운로드해서 OpenAI Files API에 업로드하고 fileId를 반환
 * Cloudflare Workers 환경에서 동작하도록 메모리 기반 처리 사용
 */
async function uploadPdfFromUrl(pdfUrl: string): Promise<string> {
  // 1) PDF 다운로드
  const res = await fetch(pdfUrl);
  if (!res.ok) {
    throw new Error(`PDF 다운로드 실패: ${res.status} ${res.statusText}`);
  }
  const arrayBuffer = await res.arrayBuffer();

  // 2) File 객체 생성 (메모리에서 직접 - fs 모듈 불필요)
  const blob = new Blob([arrayBuffer], { type: "application/pdf" });
  const file = new File([blob], `resume_${Date.now()}.pdf`, {
    type: "application/pdf",
  });

  // 3) OpenAI Files API에 업로드
  const uploadedFile = await openai.files.create({
    file: file,
    purpose: "assistants",
  });

  return uploadedFile.id;
}

/**
 * AI 이력서 분석 (Files API + Assistants 사용)
 */
export async function analyzeResume(
  resumeId: string,
  presignedUrl: string
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
      // 1) PDF를 업로드하고 file_id 가져오기
      console.log("[ANALYZE] Uploading PDF from URL:", presignedUrl);
      const fileId = await uploadPdfFromUrl(presignedUrl);
      console.log("[ANALYZE] File uploaded, ID:", fileId);

      // 2) Assistant 생성
      const assistant = await openai.beta.assistants.create({
        name: "Resume Analyzer",
        instructions:
          "You are an expert resume analyzer and career coach. Analyze resumes and provide structured feedback in JSON format.",
        model: "gpt-4o",
        tools: [{ type: "file_search" }],
      });

      // 3) Thread 생성 및 파일 첨부
      const thread = await openai.beta.threads.create({
        messages: [
          {
            role: "user",
            content: `Analyze this resume PDF and provide detailed feedback in the following JSON format:

{
  "summary": "A 2-3 sentence professional summary of the candidate",
  "score": <number from 0-100 based on completeness, impact, and clarity>,
  "strengths": ["strength 1", "strength 2", ...],
  "improvements": ["improvement 1", "improvement 2", ...]
}

Provide:
1. A professional summary (2-3 sentences)
2. A score from 0-100 based on completeness, impact, and clarity
3. Key strengths (2-5 bullet points)
4. Areas for improvement (2-5 bullet points)

Return ONLY valid JSON, nothing else.`,
            attachments: [
              {
                file_id: fileId,
                tools: [{ type: "file_search" }],
              },
            ],
          },
        ],
      });

      // 4) Run 실행 및 완료 대기
      const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
        assistant_id: assistant.id,
      });

      if (run.status !== "completed") {
        throw new Error(`Run failed with status: ${run.status}`);
      }

      // 5) 응답 가져오기
      const messages = await openai.beta.threads.messages.list(thread.id);
      const lastMessage = messages.data[0];

      if (!lastMessage || lastMessage.role !== "assistant") {
        throw new Error("No assistant response found");
      }

      // 6) 텍스트 추출
      const textContent = lastMessage.content.find((c) => c.type === "text");
      if (!textContent || textContent.type !== "text") {
        throw new Error("No text content in response");
      }

      let responseText = textContent.text.value;

      // JSON만 추출 (markdown 코드 블록 제거)
      responseText = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      console.log("[ANALYZE] Raw response:", responseText);

      const analysisData: ResumeAnalysisData = JSON.parse(responseText);

      // 7) DB에 분석 결과 저장
      await db
        .update(resumes)
        .set({
          aiFeedback: JSON.stringify(analysisData),
          score: analysisData.score,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(resumes.resumeId, resumeId));

      console.log("[ANALYZE] Analysis saved to DB for resume:", resumeId);

      // 8) 정리 (파일 및 Assistant 삭제)
      await openai.files.delete(fileId).catch(console.error);
      await openai.beta.assistants.delete(assistant.id).catch(console.error);

      revalidatePath(`/service/resume/${resumeId}`);
      return { success: true, analysis: analysisData };
    } catch (error) {
      console.error("Server Action Error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Internal server error";
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    console.error("Analyze Resume Error:", error);
    return { success: false, error: "Failed to analyze resume" };
  }
}
