"use server";

import { auth } from "@clerk/nextjs/server";
import { getDrizzleDB } from "@/lib/db";
import { resumes, questionCategoryEnum } from "@/lib/db/schema";
import {
  createQuestions,
  toggleBookmark as dbToggleBookmark,
  deleteQuestion as dbDeleteQuestion,
  getQuestionById,
  type QuestionCategory,
  type CreateQuestionInput,
} from "@/lib/db/questions";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { openai } from "@/lib/openaiClient";
import { randomUUID } from "node:crypto";

interface GeneratedQuestion {
  questionText: string;
  category: QuestionCategory;
  difficulty: "easy" | "medium" | "hard";
  suggestedAnswer: string;
  tips: string;
}

interface GenerateResult {
  success: boolean;
  error?: string;
  questionsCreated?: number;
}

/**
 * R2에서 PDF를 가져와 OpenAI Files API에 업로드하고 fileId를 반환
 * Cloudflare Workers 환경에서 동작하도록 메모리 기반 처리 사용
 */
async function uploadPdfFromR2(fileKey: string): Promise<string> {
  // R2에서 파일 데이터 가져오기
  const { getFileData } = await import("@/lib/db/index");
  const arrayBuffer = await getFileData(fileKey);

  if (!arrayBuffer) {
    throw new Error("File not found in R2");
  }

  // File 객체 생성 (메모리에서 직접 - fs 모듈 불필요)
  const blob = new Blob([arrayBuffer], { type: "application/pdf" });
  const fileObject = new File([blob], `resume_${Date.now()}.pdf`, {
    type: "application/pdf",
  });

  // OpenAI에 직접 업로드
  const uploadedFile = await openai.files.create({
    file: fileObject,
    purpose: "assistants",
  });

  return uploadedFile.id;
}

/**
 * 이력서 기반 AI 면접 질문 생성
 * @param resumeId 이력서 ID
 * @returns 생성 결과
 */
export async function generateQuestionsFromResume(
  resumeId: string
): Promise<GenerateResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const db = getDrizzleDB();

    // 이력서 소유권 확인
    const [resume] = await db
      .select()
      .from(resumes)
      .where(
        and(eq(resumes.resumeId, resumeId), eq(resumes.clerkUserId, userId))
      )
      .limit(1);

    if (!resume) return { success: false, error: "Resume not found" };
    if (!resume.fileUrl) return { success: false, error: "Resume has no file" };

    try {
      // R2에서 직접 PDF 가져와서 OpenAI에 업로드
      const fileId = await uploadPdfFromR2(resume.fileUrl);

      // 3) Assistant 생성
      const assistant = await openai.beta.assistants.create({
        name: "Interview Question Generator",
        instructions: `You are an expert career coach and interviewer. Analyze resumes and generate relevant interview questions.
Generate questions that are:
1. Directly related to the candidate's experience and skills shown in their resume
2. Varied across different categories (behavioral, technical, system design, leadership, problem solving, company specific)
3. Appropriate difficulty levels (easy, medium, hard)
4. Helpful for interview preparation`,
        model: "gpt-4o",
        tools: [{ type: "file_search" }],
      });

      // 4) Thread 생성 및 질문 생성 요청
      const categories = questionCategoryEnum.join(", ");
      const thread = await openai.beta.threads.create({
        messages: [
          {
            role: "user",
            content: `Analyze this resume PDF and generate 10-15 interview questions that an interviewer might ask this candidate.

For each question, provide:
1. questionText: The interview question
2. category: One of [${categories}]
3. difficulty: One of [easy, medium, hard]
4. suggestedAnswer: A detailed suggested answer framework (2-3 sentences describing what a good answer should include)
5. tips: Brief tips for answering this question

Return the result as a JSON array:
[
  {
    "questionText": "...",
    "category": "behavioral",
    "difficulty": "medium",
    "suggestedAnswer": "...",
    "tips": "..."
  },
  ...
]

Focus on:
- Behavioral questions about their past experiences mentioned in the resume
- Technical questions relevant to their skills
- System design questions if they have relevant experience
- Leadership questions if they mention management/team lead experience
- Problem-solving questions related to their domain

Return ONLY valid JSON array, nothing else.`,
            attachments: [
              {
                file_id: fileId,
                tools: [{ type: "file_search" }],
              },
            ],
          },
        ],
      });

      // 5) Run 실행 및 완료 대기
      const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
        assistant_id: assistant.id,
      });

      if (run.status !== "completed") {
        throw new Error(`Run failed with status: ${run.status}`);
      }

      // 6) 응답 가져오기
      const messages = await openai.beta.threads.messages.list(thread.id);
      const lastMessage = messages.data[0];

      if (!lastMessage || lastMessage.role !== "assistant") {
        throw new Error("No assistant response found");
      }

      // 7) 텍스트 추출
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

      const generatedQuestions: GeneratedQuestion[] = JSON.parse(responseText);

      // 8) DB에 질문 저장
      const questionsToInsert: CreateQuestionInput[] = generatedQuestions.map(
        (q) => ({
          questionId: randomUUID(),
          resumeId: resumeId,
          clerkUserId: userId,
          questionText: q.questionText,
          category: q.category,
          difficulty: q.difficulty,
          suggestedAnswer: q.suggestedAnswer,
          tips: q.tips,
        })
      );

      const count = await createQuestions(questionsToInsert);

      // 9) 정리 (파일 및 Assistant 삭제)
      await openai.files.delete(fileId).catch(console.error);
      await openai.beta.assistants.delete(assistant.id).catch(console.error);

      revalidatePath("/service/questions");
      return { success: true, questionsCreated: count };
    } catch (error) {
      console.error("[QUESTIONS] Generation Error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Internal server error";
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    console.error("[QUESTIONS] Action Error:", error);
    return { success: false, error: "Failed to generate questions" };
  }
}

interface ToggleBookmarkResult {
  success: boolean;
  error?: string;
  isBookmarked?: boolean;
}

/**
 * 질문 북마크 토글
 * @param questionId 질문 ID
 * @returns 토글 결과
 */
export async function toggleQuestionBookmark(
  questionId: string
): Promise<ToggleBookmarkResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const newState = await dbToggleBookmark(questionId, userId);

    if (newState === null) {
      return { success: false, error: "Question not found" };
    }

    revalidatePath("/service/questions");
    return { success: true, isBookmarked: newState };
  } catch (error) {
    console.error("[QUESTIONS] Toggle Bookmark Error:", error);
    return { success: false, error: "Failed to toggle bookmark" };
  }
}

interface DeleteResult {
  success: boolean;
  error?: string;
}

/**
 * 질문 삭제
 * @param questionId 질문 ID
 * @returns 삭제 결과
 */
export async function deleteQuestion(
  questionId: string
): Promise<DeleteResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    // 권한 확인
    const question = await getQuestionById(questionId, userId);
    if (!question) {
      return { success: false, error: "Question not found" };
    }

    await dbDeleteQuestion(questionId, userId);

    revalidatePath("/service/questions");
    return { success: true };
  } catch (error) {
    console.error("[QUESTIONS] Delete Error:", error);
    return { success: false, error: "Failed to delete question" };
  }
}
