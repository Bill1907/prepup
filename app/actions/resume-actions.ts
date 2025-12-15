"use server";

import { auth } from "@clerk/nextjs/server";
import { getPresignedUrl } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { openai } from "@/lib/openaiClient";
import {
  graphqlClient,
  UPDATE_RESUME_ANALYSIS,
  SOFT_DELETE_RESUME,
  GET_RESUME_BY_ID,
  type GetResumeByIdResponse,
} from "@/lib/graphql";

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

    // GraphQL로 이력서 조회하여 소유권 확인
    const data = await graphqlClient.request<GetResumeByIdResponse>(
      GET_RESUME_BY_ID,
      { resumeId }
    );

    const resume = data.resumes_by_pk;

    if (!resume || resume.clerk_user_id !== userId) {
      return {
        success: false,
        error: "Resume not found or you don't have permission to delete it.",
      };
    }

    // GraphQL로 Soft delete
    await graphqlClient.request(SOFT_DELETE_RESUME, { resumeId });

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
  saveError?: string; // 저장 실패 시 에러 메시지
}

/**
 * R2에서 PDF 파일을 가져와서 OpenAI Files API에 업로드하고 fileId를 반환
 * Presigned URL을 통해 프로덕션 R2에 접근 (로컬/프로덕션 환경 모두 지원)
 */
async function uploadPdfFromR2(fileKey: string): Promise<string> {
  // 1) Presigned URL 생성 후 파일 다운로드
  const presignedUrl = await getPresignedUrl(fileKey, 300); // 5분 만료

  const response = await fetch(presignedUrl);

  if (!response.ok) {
    throw new Error(
      `R2에서 파일을 다운로드할 수 없습니다: ${response.status} ${response.statusText}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();

  // 2) File 객체 생성 (메모리에서 직접 - fs 모듈 불필요)
  const blob = new Blob([arrayBuffer], { type: "application/pdf" });
  const fileToUpload = new File([blob], `resume_${Date.now()}.pdf`, {
    type: "application/pdf",
  });

  // 3) OpenAI Files API에 업로드
  const uploadedFile = await openai.files.create({
    file: fileToUpload,
    purpose: "assistants",
  });

  return uploadedFile.id;
}

/**
 * AI 이력서 분석 (Files API + Assistants 사용)
 * @param resumeId 이력서 ID
 * @param fileKey R2에 저장된 파일 키 (예: "resumes/{userId}/{timestamp}-filename.pdf")
 *
 * 참고: 이력서 데이터는 GraphQL(Hasura)을 통해 관리되므로,
 * 서버 액션에서는 파일 키 기반 검증만 수행합니다.
 * 파일 키에 userId가 포함되어 있어 다른 사용자의 파일에 접근할 수 없습니다.
 */
export async function analyzeResume(
  resumeId: string,
  fileKey: string
): Promise<AnalyzeResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    // 보안: 파일 키가 해당 사용자의 것인지 확인
    // 파일 키 형식: "resumes/{userId}/{timestamp}-filename.pdf"
    const expectedPrefix = `resumes/${userId}/`;
    if (!fileKey.startsWith(expectedPrefix)) {
      console.error(
        "[ANALYZE] Invalid file key - unauthorized access attempt:",
        {
          fileKey,
          userId,
          expectedPrefix,
        }
      );
      return {
        success: false,
        error: "Unauthorized: You can only analyze your own files",
      };
    }

    try {
      // 1) R2에서 PDF를 직접 가져와서 OpenAI에 업로드하고 file_id 가져오기
      const fileId = await uploadPdfFromR2(fileKey);

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

      const analysisData: ResumeAnalysisData = JSON.parse(responseText);

      // 7) GraphQL을 통해 분석 결과 저장 (Hasura)
      let saveError: string | undefined;
      try {
        await graphqlClient.request(UPDATE_RESUME_ANALYSIS, {
          resumeId,
          aiFeedback: analysisData,
          score: analysisData.score,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to save analysis to database";
        console.error("[ANALYZE] Failed to save analysis to DB:", error);
        saveError = errorMessage;
        // 저장 실패해도 분석 결과는 반환하되, 에러 정보도 함께 전달
      }

      // 8) 정리 (파일 및 Assistant 삭제)
      await openai.files.delete(fileId).catch(console.error);
      await openai.beta.assistants.delete(assistant.id).catch(console.error);

      revalidatePath(`/service/resume/${resumeId}`);
      return {
        success: true,
        analysis: analysisData,
        saveError, // 저장 실패 시 클라이언트에서 처리할 수 있도록 에러 전달
      };
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
