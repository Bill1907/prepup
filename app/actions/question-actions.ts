"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { openai } from "@/lib/openaiClient";
import { randomUUID } from "node:crypto";
import { validateFileKey, getPresignedUrl } from "@/lib/r2";
import {
  graphqlClient,
  GET_RESUME_BY_ID,
  CREATE_QUESTIONS,
  TOGGLE_BOOKMARK,
  DELETE_QUESTION,
  type GetResumeByIdResponse,
  type CreateQuestionInput,
  type QuestionCategory,
} from "@/lib/graphql";

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

// Question categories for prompt
const questionCategoryEnum = [
  "behavioral",
  "technical",
  "system_design",
  "leadership",
  "problem_solving",
  "company_specific",
] as const;

/**
 * R2에서 PDF를 가져와 OpenAI Files API에 업로드하고 fileId를 반환
 * Presigned URL을 통해 파일 데이터를 가져옴 (로컬 개발 환경에서도 작동)
 */
async function uploadPdfFromR2(fileKey: string, userId: string): Promise<string> {
  console.log(`[QUESTIONS] Starting PDF upload from R2, fileKey: ${fileKey}`);

  const validation = validateFileKey(fileKey);
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  try {
    // Presigned URL 생성 (5분 만료)
    console.log(`[QUESTIONS] Generating presigned URL for file...`);
    const presignedUrl = await getPresignedUrl(fileKey, 300);
    console.log(`[QUESTIONS] Got presigned URL, fetching file...`);

    // Presigned URL을 사용하여 파일 다운로드
    const response = await fetch(presignedUrl, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch file from storage (${response.status}): ${response.statusText}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();

    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error(
        `Resume file not found or empty. File key: ${fileKey}. ` +
          `Please ensure the resume was uploaded correctly.`
      );
    }

    console.log(
      `[QUESTIONS] Retrieved file from API, size: ${arrayBuffer.byteLength} bytes`
    );

    const blob = new Blob([arrayBuffer], { type: "application/pdf" });
    const fileObject = new File([blob], `resume_${Date.now()}.pdf`, {
      type: "application/pdf",
    });

    console.log(`[QUESTIONS] Uploading to OpenAI Files API...`);
    const uploadedFile = await openai.files.create({
      file: fileObject,
      purpose: "assistants",
    });

    console.log(
      `[QUESTIONS] Successfully uploaded to OpenAI: ${uploadedFile.id}`
    );
    return uploadedFile.id;
  } catch (error) {
    console.error(
      `[QUESTIONS] Upload failed for file key "${fileKey}":`,
      error
    );
    throw error;
  }
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
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    const data = await graphqlClient.request<GetResumeByIdResponse>(
      GET_RESUME_BY_ID,
      { resumeId }
    );

    const resume = data.resumes_by_pk;

    if (!resume) {
      return { success: false, error: "Resume not found" };
    }
    if (resume.clerk_user_id !== userId) {
      return { success: false, error: "Unauthorized access to resume" };
    }
    if (!resume.file_url) {
      return { success: false, error: "Resume file not uploaded" };
    }

    try {
      const fileId = await uploadPdfFromR2(resume.file_url, userId);

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

      const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
        assistant_id: assistant.id,
      });

      if (run.status !== "completed") {
        throw new Error(`Run failed with status: ${run.status}`);
      }

      const messages = await openai.beta.threads.messages.list(thread.id);
      const lastMessage = messages.data[0];

      if (!lastMessage || lastMessage.role !== "assistant") {
        throw new Error("No assistant response found");
      }

      const textContent = lastMessage.content.find((c) => c.type === "text");
      if (!textContent || textContent.type !== "text") {
        throw new Error("No text content in response");
      }

      let responseText = textContent.text.value;

      responseText = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const generatedQuestions: GeneratedQuestion[] = JSON.parse(responseText);

      const questionsToInsert: CreateQuestionInput[] = generatedQuestions.map(
        (q) => ({
          question_id: randomUUID(),
          resume_id: resumeId,
          clerk_user_id: userId,
          question_text: q.questionText,
          category: q.category,
          difficulty: q.difficulty,
          suggested_answer: q.suggestedAnswer,
          tips: q.tips,
        })
      );

      const result = await graphqlClient.request<{
        insert_interview_questions: {
          affected_rows: number;
        };
      }>(CREATE_QUESTIONS, { objects: questionsToInsert });

      const count = result.insert_interview_questions.affected_rows;

      await Promise.all([
        openai.files.delete(fileId).catch(console.error),
        openai.beta.assistants.delete(assistant.id).catch(console.error),
      ]);

      revalidatePath("/service/questions");
      return { success: true, questionsCreated: count };
    } catch (error) {
      console.error("[QUESTIONS] Generation Error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Question generation failed";
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    console.error("[QUESTIONS] Unexpected Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to generate questions";
    return { success: false, error: errorMessage };
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
 * @param currentState 현재 북마크 상태
 * @returns 토글 결과
 */
export async function toggleQuestionBookmark(
  questionId: string,
  currentState: boolean = false
): Promise<ToggleBookmarkResult> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    const newState = !currentState;

    await graphqlClient.request(TOGGLE_BOOKMARK, {
      questionId,
      isBookmarked: newState,
    });

    revalidatePath("/service/questions");
    return { success: true, isBookmarked: newState };
  } catch (error) {
    console.error("[QUESTIONS] Toggle Bookmark Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to toggle bookmark";
    return { success: false, error: errorMessage };
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
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    await graphqlClient.request(DELETE_QUESTION, { questionId });

    revalidatePath("/service/questions");
    return { success: true };
  } catch (error) {
    console.error("[QUESTIONS] Delete Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete question";
    return { success: false, error: errorMessage };
  }
}
