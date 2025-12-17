/**
 * Type definitions for OpenAI Voice Agents integration
 */

// ===== Transcript & Conversation Types =====

export interface TranscriptMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  type?: "message" | "tool_call" | "tool_result" | "interruption";
  toolName?: string;
  toolArgs?: Record<string, any>;
  toolResult?: any;
}

export interface ConversationHistory {
  messages: TranscriptMessage[];
  totalTokens?: number;
  duration?: number;
}

// ===== Connection & Session Types =====

export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error";

export interface SessionMetadata {
  sessionId: string;
  questionId: string;
  resumeId: string;
  userId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

export interface SessionResponse {
  client_secret?: string;
  session_id?: string;
  expires_at?: string;
  question: {
    id?: string;
    text?: string;
    category?: string;
    difficulty?: string | null;
  };
  resume: {
    id?: string;
    title: string;
  };
  tools?: ToolDefinition[];
}

// ===== Tool Types =====

export interface ToolExecutionContext {
  sessionId: string;
  userId: string;
  questionId: string;
  resumeId: string;
  resumeAnalysis?: any;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
  needsApproval?: boolean;
}

export interface ToolCallRequest {
  id: string;
  name: string;
  args: Record<string, any>;
  timestamp: number;
}

export interface ToolCallResult {
  toolCallId: string;
  name: string;
  result: any;
  error?: string;
  timestamp: number;
}

export interface ToolApprovalRequest {
  toolCall: ToolCallRequest;
  approve: () => Promise<void>;
  reject: (reason?: string) => Promise<void>;
}

// ===== Agent Configuration Types =====

export interface AgentInstructions {
  role: string;
  objective: string;
  interviewStructure: {
    introduction: string;
    mainQuestion: string;
    followUpCount: number;
    conclusion: string;
  };
  resumeContext: {
    summary: string;
    strengths: string[];
    improvements: string[];
  };
  guidelines: string[];
  constraints: string[];
}

export interface VoiceConfig {
  model: string;
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  inputAudioFormat: "pcm16" | "g711_ulaw" | "g711_alaw";
  outputAudioFormat: "pcm16" | "g711_ulaw" | "g711_alaw";
  turnDetection: {
    type: "server_vad";
    threshold: number;
    silenceDuration: number;
    prefixPadding?: number;
  };
}

// ===== Hook Interface Types =====

export interface UseRealtimeVoiceOptions {
  questionId: string;
  resumeId: string;
  onTranscriptUpdate: (messages: TranscriptMessage[]) => void;
  onToolCall?: (tool: ToolCallRequest) => void;
  onToolResult?: (result: ToolCallResult) => void;
  onError: (error: Error) => void;
  onConnectionStateChange?: (state: ConnectionState) => void;
  onInterruption?: () => void;
  onAgentThinking?: (isThinking: boolean) => void;
}

export interface UseRealtimeVoiceReturn {
  // Connection methods
  connect: () => Promise<void>;
  disconnect: () => void;

  // State
  isConnected: boolean;
  isConnecting: boolean;
  isSpeaking: boolean;
  isAgentThinking: boolean;
  connectionState: ConnectionState;

  // Transcript & history
  getTranscript: () => TranscriptMessage[];
  getHistory: () => ConversationHistory;
  clearTranscript: () => void;

  // Communication
  sendMessage: (text: string) => Promise<void>;
  sendAudio: (audioData: ArrayBuffer) => void;

  // Tool approval
  approveTool: (toolCallId: string) => Promise<void>;
  rejectTool: (toolCallId: string, reason?: string) => Promise<void>;

  // Session management
  exportSession: () => SessionMetadata & ConversationHistory;
  getSessionDuration: () => number;
}

// ===== Guardrail Types =====

export interface GuardrailConfig {
  enabled: boolean;
  debounceChars: number;
  rules: GuardrailRule[];
}

export interface GuardrailRule {
  id: string;
  description: string;
  pattern?: RegExp;
  validator?: (text: string, context: ConversationHistory) => boolean;
  action: "warn" | "block" | "notify";
  severity: "low" | "medium" | "high";
}

export interface GuardrailViolation {
  ruleId: string;
  message: string;
  severity: "low" | "medium" | "high";
  timestamp: number;
  context: string;
}

// ===== Error Types =====

export class VoiceAgentError extends Error {
  constructor(
    message: string,
    public code: VoiceErrorCode,
    public details?: any
  ) {
    super(message);
    this.name = "VoiceAgentError";
  }
}

export type VoiceErrorCode =
  | "CONNECTION_FAILED"
  | "SESSION_EXPIRED"
  | "AUDIO_DEVICE_ERROR"
  | "TOOL_EXECUTION_FAILED"
  | "INVALID_SESSION"
  | "NETWORK_ERROR"
  | "RATE_LIMIT_EXCEEDED"
  | "AUTHENTICATION_FAILED"
  | "UNKNOWN_ERROR";

// ===== Event Types =====

export interface VoiceAgentEvents {
  connected: () => void;
  disconnected: (reason?: string) => void;
  error: (error: VoiceAgentError) => void;
  transcriptUpdate: (messages: TranscriptMessage[]) => void;
  historyUpdated: (history: ConversationHistory) => void;
  audioInterrupted: () => void;
  agentSpeaking: (speaking: boolean) => void;
  agentThinking: (thinking: boolean) => void;
  toolCallRequested: (request: ToolCallRequest) => void;
  toolApprovalRequested: (approval: ToolApprovalRequest) => void;
  toolExecuted: (result: ToolCallResult) => void;
  guardrailTripped: (violation: GuardrailViolation) => void;
}

// ===== Database Persistence Types =====

export interface InterviewSessionData {
  session_id: string;
  user_id: string;
  question_id: string;
  resume_id: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  transcript: TranscriptMessage[];
  history: ConversationHistory;
  feedback_summary?: string;
  performance_score?: number;
  tool_interactions: ToolCallResult[];
  interruption_count: number;
  metadata: Record<string, any>;
}

export interface InterviewAnswerData {
  id: string;
  session_id: string;
  question_text: string;
  answer_text: string;
  answer_audio_url?: string;
  timestamp: number;
  duration: number;
  tool_hints_used: number;
}
