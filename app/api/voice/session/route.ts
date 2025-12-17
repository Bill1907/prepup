import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { graphqlClient } from "@/lib/graphql/client";
import { GET_QUESTION_BY_ID } from "@/lib/graphql/queries/questions";
import { GET_RESUME_BY_ID } from "@/lib/graphql/queries/resumes";
import { createValidatedAgentConfig } from "@/lib/voice/agent-config";
import { formatToolsForOpenAI, INTERVIEW_TOOLS } from "@/lib/voice/tools";

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

    // 6. Build AI instructions with resume context using agent config
    const agentConfig = createValidatedAgentConfig({
      question: {
        id: question.question_id,
        text: question.question_text,
        category: question.category,
        difficulty: question.difficulty,
      },
      resume: {
        id: resume.resume_id,
        title: resume.title,
        analysis: analysisData,
      },
    });

    const instructions = agentConfig.instructions;

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

    // 7. Format tools for OpenAI
    const tools = formatToolsForOpenAI();

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: agentConfig.voiceConfig.model,
          voice: agentConfig.voiceConfig.voice,
          instructions,
          modalities: ["text", "audio"],
          turn_detection: {
            type: agentConfig.voiceConfig.turnDetection.type,
            threshold: agentConfig.voiceConfig.turnDetection.threshold,
            silence_duration_ms: agentConfig.voiceConfig.turnDetection.silenceDuration,
            prefix_padding_ms: agentConfig.voiceConfig.turnDetection.prefixPadding,
          },
          tools, // Add tool definitions
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

    const sessionData = (await openaiResponse.json()) as {
      client_secret: string;
      session_id: string;
      expires_at: string;
    };

    // 8. Return session token, metadata, and tool configuration
    return NextResponse.json({
      client_secret: sessionData.client_secret,
      session_id: sessionData.session_id,
      expires_at: sessionData.expires_at,
      question: {
        id: question.question_id,
        text: question.question_text,
        category: question.category,
        difficulty: question.difficulty,
      },
      resume: {
        id: resume.resume_id,
        title: resume.title,
        analysis: analysisData, // Include analysis for tool context
      },
      tools: INTERVIEW_TOOLS, // Return tool definitions for client
    });
  } catch (error) {
    console.error("Error in voice session route:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
