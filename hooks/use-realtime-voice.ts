/**
 * OpenAI Realtime Voice Agent Hook (SDK-based)
 * React hook for managing voice interview sessions with OpenAI Agents
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { VoiceSessionManager } from "@/lib/voice/session-manager";
import type {
  TranscriptMessage,
  UseRealtimeVoiceOptions,
  UseRealtimeVoiceReturn,
  ConnectionState,
  VoiceAgentError,
} from "@/lib/voice/types";

export type { TranscriptMessage };

export function useRealtimeVoice(
  options: UseRealtimeVoiceOptions
): UseRealtimeVoiceReturn {
  const {
    questionId,
    resumeId,
    onTranscriptUpdate,
    onToolCall,
    onError,
    onConnectionStateChange,
    onInterruption,
    onAgentThinking,
  } = options;

  // State management
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAgentThinking, setIsAgentThinking] = useState(false);

  // Session manager instance
  const sessionManagerRef = useRef<VoiceSessionManager | null>(null);
  const transcriptRef = useRef<TranscriptMessage[]>([]);

  // Initialize session manager
  useEffect(() => {
    sessionManagerRef.current = new VoiceSessionManager();

    return () => {
      // Cleanup on unmount
      if (sessionManagerRef.current) {
        sessionManagerRef.current.disconnect();
      }
    };
  }, []);

  // ===== Connection Management =====

  const connect = useCallback(async () => {
    if (isConnecting || isConnected) {
      console.warn("Already connecting or connected");
      return;
    }

    if (!sessionManagerRef.current) {
      console.error("Session manager not initialized");
      return;
    }

    try {
      setIsConnecting(true);

      await sessionManagerRef.current.connect(questionId, resumeId, {
        onConnectionStateChange: (state) => {
          setConnectionState(state);
          setIsConnected(state === "connected");
          setIsConnecting(state === "connecting");
          onConnectionStateChange?.(state);
        },

        onTranscriptUpdate: (messages) => {
          transcriptRef.current = messages;
          onTranscriptUpdate(messages);
        },

        onToolCall: (tool) => {
          console.log("Tool call requested:", tool);
          onToolCall?.(tool);
        },

        onError: (error) => {
          console.error("Voice agent error:", error);
          onError(error);
          setIsConnecting(false);
          setIsConnected(false);
        },

        onInterruption: () => {
          console.log("User interrupted agent");
          setIsSpeaking(false);
          onInterruption?.();
        },

        onAgentThinking: (thinking) => {
          setIsAgentThinking(thinking);
          onAgentThinking?.(thinking);
        },
      });
    } catch (error) {
      console.error("Connection error:", error);
      const voiceError: VoiceAgentError = {
        name: "VoiceAgentError",
        message: error instanceof Error ? error.message : String(error),
        code: "CONNECTION_FAILED",
      };
      onError(voiceError);
      setIsConnecting(false);
      setIsConnected(false);
    }
  }, [
    questionId,
    resumeId,
    isConnecting,
    isConnected,
    onTranscriptUpdate,
    onToolCall,
    onError,
    onConnectionStateChange,
    onInterruption,
    onAgentThinking,
  ]);

  const disconnect = useCallback(() => {
    if (sessionManagerRef.current) {
      sessionManagerRef.current.disconnect();
    }
    setIsConnected(false);
    setIsConnecting(false);
    setIsSpeaking(false);
    setIsAgentThinking(false);
    setConnectionState("disconnected");
  }, []);

  // ===== Transcript Management =====

  const getTranscript = useCallback((): TranscriptMessage[] => {
    return sessionManagerRef.current?.getTranscript() || [];
  }, []);

  const getHistory = useCallback(() => {
    return (
      sessionManagerRef.current?.getHistory() || {
        messages: [],
        totalTokens: 0,
        duration: 0,
      }
    );
  }, []);

  const clearTranscript = useCallback(() => {
    transcriptRef.current = [];
    onTranscriptUpdate([]);
  }, [onTranscriptUpdate]);

  // ===== Communication =====

  const sendMessage = useCallback(async (text: string) => {
    // TODO: Implement text message sending via data channel
    // This will be added when we need text input capability
    console.log("Send text message:", text);
  }, []);

  const sendAudio = useCallback((audioData: ArrayBuffer) => {
    // Audio is automatically sent via WebRTC peer connection
    // This method is here for potential future manual audio sending
    console.log("Audio data received:", audioData.byteLength, "bytes");
  }, []);

  // ===== Tool Approval =====

  const approveTool = useCallback(async (toolCallId: string) => {
    if (sessionManagerRef.current) {
      await sessionManagerRef.current.approveTool(toolCallId);
    }
  }, []);

  const rejectTool = useCallback(async (toolCallId: string, reason?: string) => {
    if (sessionManagerRef.current) {
      await sessionManagerRef.current.rejectTool(toolCallId, reason);
    }
  }, []);

  // ===== Session Management =====

  const exportSession = useCallback(() => {
    if (!sessionManagerRef.current) {
      return {
        sessionId: "",
        questionId: "",
        resumeId: "",
        userId: "",
        startTime: 0,
        endTime: 0,
        duration: 0,
        messages: [],
        totalTokens: 0,
      };
    }
    return sessionManagerRef.current.exportSession();
  }, []);

  const getSessionDuration = useCallback((): number => {
    return sessionManagerRef.current?.getSessionDuration() || 0;
  }, []);

  // ===== Update speaking state from session manager =====

  useEffect(() => {
    if (!sessionManagerRef.current) return;

    // Poll speaking state (in real SDK this would be event-driven)
    const interval = setInterval(() => {
      if (sessionManagerRef.current) {
        setIsSpeaking(sessionManagerRef.current.speaking);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // ===== Return hook interface =====

  return {
    // Connection methods
    connect,
    disconnect,

    // State
    isConnected,
    isConnecting,
    isSpeaking,
    isAgentThinking,
    connectionState,

    // Transcript & history
    getTranscript,
    getHistory,
    clearTranscript,

    // Communication
    sendMessage,
    sendAudio,

    // Tool approval
    approveTool,
    rejectTool,

    // Session management
    exportSession,
    getSessionDuration,
  };
}
