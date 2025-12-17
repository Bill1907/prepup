import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { graphqlClient } from "@/lib/graphql/client";
import { GET_QUESTION_BY_ID } from "@/lib/graphql/queries/questions";
import { GET_RESUME_BY_ID } from "@/lib/graphql/queries/resumes";
import type { SessionResponse as OpenAISessionResponse } from "@/hooks/use-realtime-voice";

export const runtime = "edge";

interface ResumeAnalysisData {
  summary: string;
  score: number;
  strengths: string[];
  improvements: string[];
}

interface GetQuestionByIdResponse {
  interview_questions_by_pk: {
    question_id: string;
    resume_id: string;
    question_text: string;
    category: string;
    difficulty: string | null;
    suggested_answer: string | null;
    tips: string | null;
    clerk_user_id?: string;
  } | null;
}

interface GetResumeByIdResponse {
  resumes_by_pk: {
    resume_id: string;
    clerk_user_id: string;
    title: string;
    ai_feedback: unknown;
  } | null;
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse request body
    const body = await request.json();
    const { questionId, resumeId } = body as {
      questionId: string;
      resumeId: string;
    };

    if (!questionId || !resumeId) {
      return NextResponse.json(
        { error: "Missing questionId or resumeId" },
        { status: 400 }
      );
    }

    // 3. Fetch question data
    const questionResponse =
      await graphqlClient.request<GetQuestionByIdResponse>(GET_QUESTION_BY_ID, {
        questionId,
      });

    const question = questionResponse.interview_questions_by_pk;
    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // Verify user owns the question
    if (question.clerk_user_id && question.clerk_user_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4. Fetch resume data
    const resumeResponse = await graphqlClient.request<GetResumeByIdResponse>(
      GET_RESUME_BY_ID,
      { resumeId }
    );

    const resume = resumeResponse.resumes_by_pk;
    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    // Verify user owns the resume
    if (resume.clerk_user_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 5. Parse resume analysis data
    const analysisData = resume.ai_feedback as ResumeAnalysisData | null;
    if (!analysisData) {
      return NextResponse.json(
        { error: "Resume analysis not available" },
        { status: 400 }
      );
    }

    // 6. Build AI instructions with resume context
    const instructions = `You are an experienced ${question.category} interviewer conducting a structured interview.

INTERVIEW STRUCTURE:
1. Brief introduction (10-15 seconds): "Hello, I'm your AI interviewer. I'll be asking you about ${question.category} topics based on your resume. Let's begin."
2. Ask the main question: "${question.question_text}"
3. Listen carefully to the candidate's response
4. Ask EXACTLY 3 follow-up questions that:
   - Explicitly validate specific resume claims (e.g., "You mentioned ${analysisData.strengths[0] || "project X"}. Can you walk me through your specific contributions?")
   - Probe technical depth appropriate for ${question.difficulty || "medium"} difficulty level
   - Build naturally on their previous answers

RESUME CONTEXT:
Summary: ${analysisData.summary}

Key Projects/Experiences to Validate:
${analysisData.strengths.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Areas to Explore:
${analysisData.improvements.map((s, i) => `${i + 1}. ${s}`).join("\n")}

${question.tips ? `Interview Tips: ${question.tips}` : ""}
${question.suggested_answer ? `Suggested Answer Framework: ${question.suggested_answer}` : ""}

CONVERSATION RULES:
- Target 10-15 minute total duration
- Wait for approximately 10 seconds of silence before detecting end of user's turn
- Be professional yet conversational
- Explicitly reference resume items to verify authenticity (e.g., "In your resume, you mentioned...")
- Keep questions clear and focused
- After 3 follow-up questions, conclude with: "Thank you for your responses. That completes our interview."

Begin the interview when the connection is established.`;

    // 7. Generate OpenAI Realtime API ephemeral token
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
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview-2024-12-17",
          voice: "alloy",
          instructions,
          modalities: ["text", "audio"],
          turn_detection: {
            type: "server_vad",
            threshold: 0.5,
            silence_duration_ms: 10000, // 10 seconds (maximum allowed)
          },
        }),
      }
    );

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      console.error("OpenAI API error:", errorData);
      return NextResponse.json(
        { error: "Failed to create OpenAI session", details: errorData },
        { status: openaiResponse.status }
      );
    }

    const sessionData = (await openaiResponse.json()) as OpenAISessionResponse;

    // 8. Return session token and metadata
    return NextResponse.json({
      client_secret: sessionData.client_secret as string,
      session_id: sessionData.session_id as string,
      expires_at: sessionData.expires_at as string,
      question: {
        id: question.question_id,
        text: question.question_text,
        category: question.category,
        difficulty: question.difficulty,
      },
      resume: {
        id: resume.resume_id,
        title: resume.title,
      },
    });
  } catch (error) {
    console.error("Error in voice session route:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
