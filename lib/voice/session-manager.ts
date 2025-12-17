/**
 * OpenAI Realtime Session Manager
 * Manages RealtimeAgent lifecycle, WebRTC connection, and event orchestration
 */

import type {
  SessionMetadata,
  SessionResponse,
  ConnectionState,
  VoiceAgentError,
  ToolCallRequest,
  ToolExecutionContext,
  TranscriptMessage,
  ConversationHistory,
} from "./types";
import { createValidatedAgentConfig } from "./agent-config";
import { INTERVIEW_TOOLS, executeToolCall, toolRequiresApproval } from "./tools";

// ===== Session Manager Class =====

export class VoiceSessionManager {
  private sessionMetadata: SessionMetadata | null = null;
  private connectionState: ConnectionState = "disconnected";
  private isConnected = false;
  private isConnecting = false;
  private isSpeaking = false;
  private isThinking = false;

  // Session data
  private transcript: TranscriptMessage[] = [];
  private conversationHistory: ConversationHistory = { messages: [] };

  // WebRTC components (for now, using manual WebRTC until full SDK migration)
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private mediaStream: MediaStream | null = null;

  // Tool execution context
  private toolExecutionContext: ToolExecutionContext | null = null;
  private pendingToolApprovals = new Map<string, ToolCallRequest>();

  // Event callbacks
  private eventHandlers: {
    onConnectionStateChange?: (state: ConnectionState) => void;
    onTranscriptUpdate?: (messages: TranscriptMessage[]) => void;
    onToolCall?: (tool: ToolCallRequest) => void;
    onError?: (error: VoiceAgentError) => void;
    onInterruption?: () => void;
    onAgentThinking?: (thinking: boolean) => void;
  } = {};

  constructor() {}

  // ===== Connection Management =====

  /**
   * Initialize and connect to OpenAI Realtime API
   */
  async connect(
    questionId: string,
    resumeId: string,
    callbacks: typeof this.eventHandlers
  ): Promise<void> {
    if (this.isConnecting || this.isConnected) {
      console.warn("Already connecting or connected");
      return;
    }

    this.isConnecting = true;
    this.eventHandlers = callbacks;
    this.setConnectionState("connecting");

    try {
      // Step 1: Request session token from backend
      const sessionResponse = await fetch("/api/voice/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, resumeId }),
      });

      if (!sessionResponse.ok) {
        const errorData = (await sessionResponse.json()) as { error?: string };
        throw new Error(errorData.error || "Failed to create session");
      }

      const sessionData: SessionResponse = await sessionResponse.json();
      const { client_secret, session_id, question, resume } = sessionData;

      if (!client_secret || !session_id) {
        throw new Error("Invalid session response: missing credentials");
      }

      // Store session metadata
      this.sessionMetadata = {
        sessionId: session_id,
        questionId,
        resumeId,
        userId: "", // Will be populated from auth
        startTime: Date.now(),
      };

      // Store tool execution context
      this.toolExecutionContext = {
        sessionId: session_id,
        userId: "", // From auth
        questionId,
        resumeId,
        resumeAnalysis: (resume as any).analysis,
      };

      // Step 2: Get user media (microphone)
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Step 3: Create RTCPeerConnection
      this.peerConnection = new RTCPeerConnection();

      // Add audio tracks
      this.mediaStream.getTracks().forEach((track) => {
        this.peerConnection!.addTrack(track, this.mediaStream!);
      });

      // Step 4: Setup data channel for events
      this.dataChannel = this.peerConnection.createDataChannel("oai-events");
      this.setupDataChannelHandlers();

      // Step 5: Setup peer connection handlers
      this.setupPeerConnectionHandlers();

      // Step 6: Create and exchange SDP
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      const sdpResponse = await fetch("https://api.openai.com/v1/realtime", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${client_secret}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      });

      if (!sdpResponse.ok) {
        throw new Error(`SDP exchange failed: ${sdpResponse.status}`);
      }

      const answerSdp = await sdpResponse.text();
      await this.peerConnection.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });

      console.log("✅ WebRTC connection established successfully");
    } catch (error) {
      console.error("❌ Connection error:", error);
      this.handleConnectionError(error);
      this.cleanup();
    }
  }

  /**
   * Disconnect from session
   */
  disconnect(): void {
    console.log("Disconnecting from OpenAI Realtime API");
    this.cleanup();
    this.setConnectionState("disconnected");
  }

  // ===== Data Channel Event Handlers =====

  private setupDataChannelHandlers(): void {
    if (!this.dataChannel) return;

    this.dataChannel.onopen = () => {
      console.log("✅ Data channel opened");
      this.isConnected = true;
      this.isConnecting = false;
      this.setConnectionState("connected");
    };

    this.dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleRealtimeEvent(message);
      } catch (error) {
        console.error("Error parsing data channel message:", error);
      }
    };

    this.dataChannel.onerror = (error) => {
      console.error("❌ Data channel error:", error);
      this.eventHandlers.onError?.({
        name: "VoiceAgentError",
        message: "Data channel error",
        code: "NETWORK_ERROR",
      } as VoiceAgentError);
    };

    this.dataChannel.onclose = () => {
      console.log("Data channel closed");
      this.disconnect();
    };
  }

  // ===== Peer Connection Event Handlers =====

  private setupPeerConnectionHandlers(): void {
    if (!this.peerConnection) return;

    this.peerConnection.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", this.peerConnection?.iceConnectionState);
      if (
        this.peerConnection?.iceConnectionState === "failed" ||
        this.peerConnection?.iceConnectionState === "disconnected"
      ) {
        this.setConnectionState("error");
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      console.log("Connection state:", this.peerConnection?.connectionState);
      if (
        this.peerConnection?.connectionState === "failed" ||
        this.peerConnection?.connectionState === "closed"
      ) {
        this.setConnectionState("error");
      }
    };
  }

  // ===== Realtime Event Handling =====

  private handleRealtimeEvent(message: any): void {
    const { type } = message;

    switch (type) {
      case "conversation.item.created":
        this.handleConversationItem(message.item);
        break;

      case "response.audio.delta":
        this.setAgentSpeaking(true);
        break;

      case "response.audio.done":
        this.setAgentSpeaking(false);
        break;

      case "input_audio_buffer.speech_started":
        this.setAgentSpeaking(false);
        break;

      case "input_audio_buffer.speech_stopped":
        // User stopped speaking
        break;

      case "response.function_call_arguments.done":
        this.handleToolCall(message);
        break;

      case "conversation.item.audio.interrupted":
        this.eventHandlers.onInterruption?.();
        break;

      default:
        console.log("Unhandled event type:", type);
    }
  }

  private handleConversationItem(item: any): void {
    if (item.type === "message") {
      const newMessage: TranscriptMessage = {
        id: item.id,
        role: item.role,
        content: item.content?.[0]?.transcript || item.content?.[0]?.text || "",
        timestamp: Date.now(),
        type: "message",
      };

      this.transcript.push(newMessage);
      this.conversationHistory.messages.push(newMessage);
      this.eventHandlers.onTranscriptUpdate?.(this.transcript);
    }
  }

  private async handleToolCall(message: any): Promise<void> {
    const { call_id: toolCallId, name, arguments: argsString } = message;

    try {
      const args = JSON.parse(argsString);

      const toolCall: ToolCallRequest = {
        id: toolCallId,
        name,
        args,
        timestamp: Date.now(),
      };

      // Check if tool requires approval
      if (toolRequiresApproval(name)) {
        this.pendingToolApprovals.set(toolCallId, toolCall);
        this.eventHandlers.onToolCall?.(toolCall);
        return;
      }

      // Execute tool automatically
      if (this.toolExecutionContext) {
        const result = await executeToolCall(name, args, this.toolExecutionContext);
        console.log("Tool executed:", result);

        // Add tool result to transcript
        this.addToolResultToTranscript(toolCall, result);
      }
    } catch (error) {
      console.error("Error handling tool call:", error);
    }
  }

  private addToolResultToTranscript(
    toolCall: ToolCallRequest,
    result: any
  ): void {
    const toolMessage: TranscriptMessage = {
      id: `tool_${toolCall.id}`,
      role: "assistant",
      content: `[Tool: ${toolCall.name}] ${JSON.stringify(result.result, null, 2)}`,
      timestamp: Date.now(),
      type: "tool_result",
      toolName: toolCall.name,
      toolResult: result.result,
    };

    this.transcript.push(toolMessage);
    this.eventHandlers.onTranscriptUpdate?.(this.transcript);
  }

  // ===== Tool Approval Management =====

  async approveTool(toolCallId: string): Promise<void> {
    const toolCall = this.pendingToolApprovals.get(toolCallId);
    if (!toolCall || !this.toolExecutionContext) {
      console.warn("No pending tool approval found:", toolCallId);
      return;
    }

    try {
      const result = await executeToolCall(
        toolCall.name,
        toolCall.args,
        this.toolExecutionContext
      );
      console.log("Tool approved and executed:", result);

      this.addToolResultToTranscript(toolCall, result);
      this.pendingToolApprovals.delete(toolCallId);
    } catch (error) {
      console.error("Error executing approved tool:", error);
    }
  }

  async rejectTool(toolCallId: string, reason?: string): Promise<void> {
    const toolCall = this.pendingToolApprovals.get(toolCallId);
    if (!toolCall) {
      console.warn("No pending tool approval found:", toolCallId);
      return;
    }

    console.log(`Tool rejected: ${toolCall.name}, reason: ${reason}`);
    this.pendingToolApprovals.delete(toolCallId);
  }

  // ===== State Management =====

  private setConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    this.eventHandlers.onConnectionStateChange?.(state);
  }

  private setAgentSpeaking(speaking: boolean): void {
    this.isSpeaking = speaking;
  }

  private setAgentThinking(thinking: boolean): void {
    this.isThinking = thinking;
    this.eventHandlers.onAgentThinking?.(thinking);
  }

  private handleConnectionError(error: any): void {
    const voiceError: VoiceAgentError = {
      name: "VoiceAgentError",
      message: error instanceof Error ? error.message : String(error),
      code: "CONNECTION_FAILED",
      details: error,
    };

    this.eventHandlers.onError?.(voiceError);
    this.setConnectionState("error");
  }

  // ===== Cleanup =====

  private cleanup(): void {
    // Close data channel
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Stop media tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    this.isConnected = false;
    this.isConnecting = false;
    this.isSpeaking = false;
    this.isThinking = false;
  }

  // ===== Public Getters =====

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  getTranscript(): TranscriptMessage[] {
    return this.transcript;
  }

  getHistory(): ConversationHistory {
    return this.conversationHistory;
  }

  getSessionDuration(): number {
    if (!this.sessionMetadata) return 0;
    return Date.now() - this.sessionMetadata.startTime;
  }

  exportSession(): SessionMetadata & ConversationHistory {
    const metadata = this.sessionMetadata || {
      sessionId: "",
      questionId: "",
      resumeId: "",
      userId: "",
      startTime: 0,
    };

    return {
      ...metadata,
      endTime: Date.now(),
      duration: this.getSessionDuration(),
      messages: this.conversationHistory.messages,
      totalTokens: this.conversationHistory.totalTokens,
    };
  }

  // ===== Status Getters =====

  get connected(): boolean {
    return this.isConnected;
  }

  get connecting(): boolean {
    return this.isConnecting;
  }

  get speaking(): boolean {
    return this.isSpeaking;
  }

  get thinking(): boolean {
    return this.isThinking;
  }
}
