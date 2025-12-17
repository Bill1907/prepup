/**
 * OpenAI Realtime Agent Tools for Interview Sessions
 * Tools that the AI agent can call during interviews
 */

import { graphqlClient } from "@/lib/graphql/client";
import type { ToolDefinition, ToolCallResult, ToolExecutionContext } from "./types";

// ===== Tool Definitions (Schema for OpenAI) =====

export const INTERVIEW_TOOLS: ToolDefinition[] = [
  {
    name: "getResumeDetails",
    description:
      "Fetch additional details from the candidate's resume when you need more context about their experience, skills, or background. Use this when the candidate mentions something that you want to explore further based on their resume.",
    parameters: {
      type: "object",
      properties: {
        section: {
          type: "string",
          enum: ["summary", "strengths", "improvements", "full_analysis"],
          description:
            "Which section of the resume analysis to retrieve: summary (brief overview), strengths (key strong points), improvements (areas to develop), or full_analysis (complete analysis)",
        },
      },
      required: ["section"],
    },
    needsApproval: false,
  },

  {
    name: "provideHint",
    description:
      "Provide a helpful hint to the candidate when they explicitly ask for guidance or help. This should offer direction without giving away the complete answer. Only use when the candidate directly requests assistance.",
    parameters: {
      type: "object",
      properties: {
        hintType: {
          type: "string",
          enum: ["structure", "example", "framework", "general"],
          description:
            "Type of hint to provide: structure (how to organize the answer), example (suggest thinking about similar situations), framework (mention relevant frameworks like STAR), general (general guidance)",
        },
        context: {
          type: "string",
          description:
            "Brief context about what the candidate is struggling with",
        },
      },
      required: ["hintType", "context"],
    },
    needsApproval: false,
  },

  {
    name: "saveInterviewAnswer",
    description:
      "Save the candidate's answer to a follow-up question. Use this after the candidate has finished responding to one of your follow-up questions. This helps track their responses throughout the interview.",
    parameters: {
      type: "object",
      properties: {
        questionNumber: {
          type: "number",
          description: "Which follow-up question this answers (1, 2, or 3)",
        },
        questionText: {
          type: "string",
          description: "The exact follow-up question you asked",
        },
        answerSummary: {
          type: "string",
          description:
            "A brief summary of the candidate's answer (2-3 sentences)",
        },
        keyPoints: {
          type: "array",
          items: { type: "string" },
          description:
            "Key points or insights from the candidate's response",
        },
      },
      required: [
        "questionNumber",
        "questionText",
        "answerSummary",
        "keyPoints",
      ],
    },
    needsApproval: false,
  },

  {
    name: "endInterview",
    description:
      "Mark the interview as complete and generate final feedback. Use this ONLY after you have asked all 3 follow-up questions and provided your conclusion. This will save the complete interview session and generate performance feedback for the candidate.",
    parameters: {
      type: "object",
      properties: {
        overallPerformance: {
          type: "string",
          enum: ["excellent", "good", "satisfactory", "needs_improvement"],
          description: "Overall assessment of the candidate's performance",
        },
        keyStrengths: {
          type: "array",
          items: { type: "string" },
          description:
            "2-3 key strengths demonstrated during the interview",
        },
        areasToImprove: {
          type: "array",
          items: { type: "string" },
          description: "2-3 areas where the candidate could improve",
        },
        completionStatus: {
          type: "string",
          enum: ["completed", "partial"],
          description:
            "Whether all questions were answered (completed) or interview ended early (partial)",
        },
      },
      required: [
        "overallPerformance",
        "keyStrengths",
        "areasToImprove",
        "completionStatus",
      ],
    },
    needsApproval: true, // Requires user confirmation
  },
];

// ===== Tool Implementations =====

/**
 * Get resume details - Fetch specific sections from resume analysis
 */
export async function executeGetResumeDetails(
  args: { section: string },
  context: ToolExecutionContext
): Promise<ToolCallResult> {
  try {
    const { section } = args;
    const { resumeAnalysis } = context;

    if (!resumeAnalysis) {
      return {
        toolCallId: "",
        name: "getResumeDetails",
        result: {
          error: "Resume analysis not available",
        },
        timestamp: Date.now(),
      };
    }

    let result: any;

    switch (section) {
      case "summary":
        result = {
          section: "summary",
          content: resumeAnalysis.summary || "No summary available",
        };
        break;

      case "strengths":
        result = {
          section: "strengths",
          items: resumeAnalysis.strengths || [],
        };
        break;

      case "improvements":
        result = {
          section: "improvements",
          items: resumeAnalysis.improvements || [],
        };
        break;

      case "full_analysis":
        result = {
          section: "full_analysis",
          data: resumeAnalysis,
        };
        break;

      default:
        result = {
          error: `Unknown section: ${section}`,
        };
    }

    return {
      toolCallId: "",
      name: "getResumeDetails",
      result,
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      toolCallId: "",
      name: "getResumeDetails",
      result: null,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: Date.now(),
    };
  }
}

/**
 * Provide hint - Generate helpful guidance for the candidate
 */
export async function executeProvideHint(
  args: { hintType: string; context: string },
  context: ToolExecutionContext
): Promise<ToolCallResult> {
  try {
    const { hintType, context: hintContext } = args;

    const hints: Record<string, string> = {
      structure: `Consider using the STAR method: Situation (context), Task (challenge), Action (what you did), Result (outcome). This helps structure your answer clearly.`,

      example: `Think about a specific time when you faced a similar situation. Focus on a concrete example with measurable outcomes rather than speaking generally.`,

      framework: `Try organizing your response with a clear beginning, middle, and end. Start with the context, explain your approach, and finish with the results and what you learned.`,

      general: `Take a moment to think about your most relevant experience. It's okay to take time to organize your thoughts. Focus on demonstrating your skills through specific examples.`,
    };

    const hint = hints[hintType] || hints.general;

    return {
      toolCallId: "",
      name: "provideHint",
      result: {
        hintType,
        hint,
        candidateContext: hintContext,
      },
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      toolCallId: "",
      name: "provideHint",
      result: null,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: Date.now(),
    };
  }
}

/**
 * Save interview answer - Store candidate's response to database
 */
export async function executeSaveInterviewAnswer(
  args: {
    questionNumber: number;
    questionText: string;
    answerSummary: string;
    keyPoints: string[];
  },
  context: ToolExecutionContext
): Promise<ToolCallResult> {
  try {
    const { questionNumber, questionText, answerSummary, keyPoints } = args;
    const { sessionId, userId, questionId } = context;

    // TODO: Implement GraphQL mutation to save answer
    // For now, return success with the data
    // This will be implemented in Phase 6 (Data Persistence)

    const savedData = {
      id: `answer_${sessionId}_${questionNumber}`,
      session_id: sessionId,
      question_number: questionNumber,
      question_text: questionText,
      answer_summary: answerSummary,
      key_points: keyPoints,
      timestamp: new Date().toISOString(),
    };

    console.log("Saving interview answer:", savedData);

    return {
      toolCallId: "",
      name: "saveInterviewAnswer",
      result: {
        success: true,
        saved: savedData,
        message: `Answer ${questionNumber} saved successfully`,
      },
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      toolCallId: "",
      name: "saveInterviewAnswer",
      result: null,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: Date.now(),
    };
  }
}

/**
 * End interview - Finalize session and generate feedback
 */
export async function executeEndInterview(
  args: {
    overallPerformance: string;
    keyStrengths: string[];
    areasToImprove: string[];
    completionStatus: string;
  },
  context: ToolExecutionContext
): Promise<ToolCallResult> {
  try {
    const { overallPerformance, keyStrengths, areasToImprove, completionStatus } =
      args;
    const { sessionId, userId, questionId, resumeId } = context;

    // TODO: Implement GraphQL mutations:
    // 1. Save final interview session data
    // 2. Generate AI feedback summary
    // 3. Update interview_sessions table
    // This will be implemented in Phase 6 (Data Persistence)

    const feedbackData = {
      session_id: sessionId,
      overall_performance: overallPerformance,
      key_strengths: keyStrengths,
      areas_to_improve: areasToImprove,
      completion_status: completionStatus,
      generated_at: new Date().toISOString(),
    };

    console.log("Ending interview with feedback:", feedbackData);

    return {
      toolCallId: "",
      name: "endInterview",
      result: {
        success: true,
        feedback: feedbackData,
        message: "Interview ended successfully. Feedback generated.",
      },
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      toolCallId: "",
      name: "endInterview",
      result: null,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: Date.now(),
    };
  }
}

// ===== Tool Executor =====

/**
 * Execute a tool call based on tool name
 */
export async function executeToolCall(
  toolName: string,
  args: Record<string, any>,
  context: ToolExecutionContext
): Promise<ToolCallResult> {
  switch (toolName) {
    case "getResumeDetails":
      return executeGetResumeDetails(args as { section: string }, context);

    case "provideHint":
      return executeProvideHint(args as { hintType: string; context: string }, context);

    case "saveInterviewAnswer":
      return executeSaveInterviewAnswer(
        args as {
          questionNumber: number;
          questionText: string;
          answerSummary: string;
          keyPoints: string[];
        },
        context
      );

    case "endInterview":
      return executeEndInterview(
        args as {
          overallPerformance: string;
          keyStrengths: string[];
          areasToImprove: string[];
          completionStatus: string;
        },
        context
      );

    default:
      return {
        toolCallId: "",
        name: toolName,
        result: null,
        error: `Unknown tool: ${toolName}`,
        timestamp: Date.now(),
      };
  }
}

// ===== Tool Utilities =====

/**
 * Get tool definition by name
 */
export function getToolDefinition(name: string): ToolDefinition | undefined {
  return INTERVIEW_TOOLS.find((tool) => tool.name === name);
}

/**
 * Check if tool requires approval
 */
export function toolRequiresApproval(name: string): boolean {
  const tool = getToolDefinition(name);
  return tool?.needsApproval ?? false;
}

/**
 * Format tool definitions for OpenAI Realtime API
 */
export function formatToolsForOpenAI(): any[] {
  return INTERVIEW_TOOLS.map((tool) => ({
    type: "function",
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  }));
}
