/**
 * OpenAI RealtimeAgent configuration factory
 * Creates configured agents for interview sessions
 */

import type {
  AgentInstructions,
  VoiceConfig,
  SessionResponse,
} from "./types";

// ===== Agent Instructions Builder =====

export function buildAgentInstructions(
  questionData: SessionResponse["question"],
  resumeData: SessionResponse["resume"] & { analysis?: any }
): AgentInstructions {
  const { text: questionText, category, difficulty } = questionData;
  const { title: resumeTitle, analysis } = resumeData;

  // Extract resume analysis data
  const resumeSummary =
    analysis?.summary || "Candidate with relevant experience";
  const strengths = analysis?.strengths || [];
  const improvements = analysis?.improvements || [];

  return {
    role: "Professional Interview Coach",
    objective: `Conduct a structured behavioral interview for the question: "${questionText}"`,

    interviewStructure: {
      introduction: `Start with a brief 10-15 second introduction. Mention you'll be asking about "${questionText}" (${category} category${difficulty ? `, ${difficulty} difficulty` : ""}).`,
      mainQuestion: `Ask the main question clearly: "${questionText}". Give the candidate time to think and respond fully.`,
      followUpCount: 3,
      conclusion: `After exactly 3 follow-up questions, provide a brief professional conclusion and thank the candidate.`,
    },

    resumeContext: {
      summary: resumeSummary,
      strengths,
      improvements,
    },

    guidelines: [
      "Listen actively to the candidate's responses before asking follow-up questions",
      "Reference specific details from their resume when relevant",
      "Ask probing questions about concrete examples and outcomes",
      "Validate claims made in the resume through behavioral questions",
      "Maintain a professional, encouraging, and respectful tone",
      "Keep the interview focused and structured (10-15 minutes total)",
      "If the candidate asks for a hint, use the provideHint tool to offer guidance",
      "When the candidate finishes answering a follow-up question, you may use saveInterviewAnswer tool",
      "After completing all 3 follow-up questions, mention time to wrap up",
    ],

    constraints: [
      "Do NOT ask inappropriate or personal questions unrelated to professional skills",
      "Do NOT make assumptions about the candidate's abilities without evidence",
      "Do NOT interrupt the candidate while they're speaking",
      "Do NOT exceed 15 minutes total interview time",
      "Do NOT ask more than 3 follow-up questions",
      "Do NOT provide answers or coach the candidate (except when hint tool is called)",
      "Stay professional and maintain interview boundaries",
    ],
  };
}

// ===== Voice Configuration =====

export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  model: "gpt-4o-realtime-preview-2024-12-17",
  voice: "alloy",
  inputAudioFormat: "pcm16",
  outputAudioFormat: "pcm16",
  turnDetection: {
    type: "server_vad",
    threshold: 0.5,
    silenceDuration: 10000, // 10 seconds (maximum allowed)
    prefixPadding: 300, // 300ms prefix padding
  },
};

// ===== Agent Configuration Factory =====

export interface CreateAgentConfigOptions {
  question: SessionResponse["question"];
  resume: SessionResponse["resume"] & { analysis?: any };
  voiceConfig?: Partial<VoiceConfig>;
  customInstructions?: Partial<AgentInstructions>;
}

/**
 * Create a complete agent configuration for an interview session
 */
export function createAgentConfig(
  options: CreateAgentConfigOptions
): {
  instructions: string;
  voiceConfig: VoiceConfig;
  metadata: Record<string, any>;
} {
  const { question, resume, voiceConfig, customInstructions } = options;

  // Build structured instructions
  const instructions = buildAgentInstructions(question, resume);

  // Merge custom instructions if provided
  const finalInstructions = customInstructions
    ? { ...instructions, ...customInstructions }
    : instructions;

  // Merge voice config
  const finalVoiceConfig = voiceConfig
    ? { ...DEFAULT_VOICE_CONFIG, ...voiceConfig }
    : DEFAULT_VOICE_CONFIG;

  // Format instructions for OpenAI Realtime
  const instructionsText = formatInstructionsForAgent(finalInstructions);

  return {
    instructions: instructionsText,
    voiceConfig: finalVoiceConfig,
    metadata: {
      questionId: question.id,
      questionText: question.text,
      questionCategory: question.category,
      questionDifficulty: question.difficulty,
      resumeId: resume.id,
      resumeTitle: resume.title,
    },
  };
}

/**
 * Format structured instructions into natural language for the agent
 */
function formatInstructionsForAgent(instructions: AgentInstructions): string {
  const {
    role,
    objective,
    interviewStructure,
    resumeContext,
    guidelines,
    constraints,
  } = instructions;

  return `
# Role
You are a ${role}.

# Objective
${objective}

# Interview Structure

## Introduction (10-15 seconds)
${interviewStructure.introduction}

## Main Question
${interviewStructure.mainQuestion}

## Follow-up Questions
- Ask exactly ${interviewStructure.followUpCount} follow-up questions based on the candidate's response
- Each follow-up should dig deeper into specific examples, outcomes, and learnings
- Space out your questions naturally, allowing the candidate time to think and respond

## Conclusion
${interviewStructure.conclusion}

# Resume Context
The candidate's resume shows:
- Summary: ${resumeContext.summary}
${
  resumeContext.strengths.length > 0
    ? `- Key Strengths:\n${resumeContext.strengths.map((s) => `  * ${s}`).join("\n")}`
    : ""
}
${
  resumeContext.improvements.length > 0
    ? `- Areas to Explore:\n${resumeContext.improvements.map((i) => `  * ${i}`).join("\n")}`
    : ""
}

# Guidelines
${guidelines.map((g, i) => `${i + 1}. ${g}`).join("\n")}

# Constraints (IMPORTANT - Must Follow)
${constraints.map((c, i) => `${i + 1}. ${c}`).join("\n")}

# Tools Available
You have access to the following tools:
- **provideHint**: Use when candidate explicitly asks for a hint or guidance
- **saveInterviewAnswer**: Use after candidate completes answering a follow-up question
- **endInterview**: Use when all questions are answered and interview is complete (requires approval)

# Interview Flow
1. Brief introduction (10-15 sec)
2. Ask main question
3. Listen to full response
4. Ask follow-up question #1
5. Listen to full response (optionally save with saveInterviewAnswer tool)
6. Ask follow-up question #2
7. Listen to full response (optionally save with saveInterviewAnswer tool)
8. Ask follow-up question #3
9. Listen to full response (optionally save with saveInterviewAnswer tool)
10. Provide brief conclusion
11. Mention you can end the interview (user will confirm)

Remember: You are conducting a professional interview. Be respectful, attentive, and focused on gathering insights about the candidate's experience and skills.
`.trim();
}

// ===== Helper Functions =====

/**
 * Validate agent configuration
 */
export function validateAgentConfig(config: {
  instructions: string;
  voiceConfig: VoiceConfig;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check instructions
  if (!config.instructions || config.instructions.trim().length < 100) {
    errors.push("Instructions must be at least 100 characters");
  }

  // Check voice config
  if (!config.voiceConfig.model) {
    errors.push("Voice config must specify a model");
  }

  if (!config.voiceConfig.voice) {
    errors.push("Voice config must specify a voice");
  }

  // Check turn detection
  const { turnDetection } = config.voiceConfig;
  if (turnDetection.threshold < 0 || turnDetection.threshold > 1) {
    errors.push("Turn detection threshold must be between 0 and 1");
  }

  if (turnDetection.silenceDuration > 10000) {
    errors.push("Silence duration cannot exceed 10000ms");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create agent configuration with validation
 */
export function createValidatedAgentConfig(
  options: CreateAgentConfigOptions
): ReturnType<typeof createAgentConfig> {
  const config = createAgentConfig(options);
  const validation = validateAgentConfig(config);

  if (!validation.valid) {
    throw new Error(
      `Invalid agent configuration: ${validation.errors.join(", ")}`
    );
  }

  return config;
}
