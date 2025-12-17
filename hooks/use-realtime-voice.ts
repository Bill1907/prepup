import { useState, useRef, useCallback } from "react";

export interface TranscriptMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface UseRealtimeVoiceOptions {
  questionId: string;
  resumeId: string;
  onTranscriptUpdate: (messages: TranscriptMessage[]) => void;
  onError: (error: Error) => void;
  onConnectionStateChange?: (
    state: "connecting" | "connected" | "disconnected"
  ) => void;
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
}

export function useRealtimeVoice(options: UseRealtimeVoiceOptions) {
  const {
    questionId,
    resumeId,
    onTranscriptUpdate,
    onError,
    onConnectionStateChange,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const transcriptRef = useRef<TranscriptMessage[]>([]);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Connect to OpenAI Realtime API
  const connect = useCallback(async () => {
    if (isConnecting || isConnected) {
      console.warn("Already connecting or connected");
      return;
    }

    setIsConnecting(true);
    onConnectionStateChange?.("connecting");

    try {
      // Step 1: Request session token from our API
      const sessionResponse = await fetch("/api/voice/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ questionId, resumeId }),
      });

      if (!sessionResponse.ok) {
        const errorData = (await sessionResponse.json()) as { error?: string };
        throw new Error(errorData.error || "Failed to create session");
      }

      const sessionData: SessionResponse = await sessionResponse.json();
      const { client_secret } = sessionData;

      // Step 2: Get user media (microphone)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      // Step 3: Create RTCPeerConnection
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;

      // Step 4: Add audio tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Step 5: Setup data channel for transcripts
      const dataChannel = pc.createDataChannel("oai-events");
      dataChannelRef.current = dataChannel;

      dataChannel.onopen = () => {
        console.log("Data channel opened");
        setIsConnected(true);
        setIsConnecting(false);
        onConnectionStateChange?.("connected");
        retryCountRef.current = 0; // Reset retry count on successful connection
      };

      dataChannel.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("Received message:", message);

          // Handle different message types from OpenAI Realtime API
          if (message.type === "conversation.item.created") {
            const item = message.item;
            if (item.type === "message") {
              const newMessage: TranscriptMessage = {
                id: item.id,
                role: item.role,
                content:
                  item.content?.[0]?.transcript ||
                  item.content?.[0]?.text ||
                  "",
                timestamp: Date.now(),
              };
              transcriptRef.current = [...transcriptRef.current, newMessage];
              onTranscriptUpdate(transcriptRef.current);
            }
          } else if (message.type === "response.audio.delta") {
            // AI is speaking
            setIsSpeaking(true);
          } else if (message.type === "response.audio.done") {
            // AI finished speaking
            setIsSpeaking(false);
          } else if (message.type === "input_audio_buffer.speech_started") {
            // User started speaking
            setIsSpeaking(false); // User is speaking, AI is not
          } else if (message.type === "input_audio_buffer.speech_stopped") {
            // User stopped speaking
            setIsSpeaking(false);
          }
        } catch (err) {
          console.error("Error parsing data channel message:", err);
        }
      };

      dataChannel.onerror = (error) => {
        console.error("Data channel error:", error);
        onError(new Error("Data channel error"));
      };

      dataChannel.onclose = () => {
        console.log("Data channel closed");
        handleDisconnect();
      };

      // Step 6: Setup peer connection event handlers
      pc.oniceconnectionstatechange = () => {
        console.log("ICE connection state:", pc.iceConnectionState);
        if (
          pc.iceConnectionState === "failed" ||
          pc.iceConnectionState === "disconnected"
        ) {
          handleConnectionFailure();
        }
      };

      pc.onconnectionstatechange = () => {
        console.log("Connection state:", pc.connectionState);
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          handleConnectionFailure();
        }
      };

      // Step 7: Create SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Step 8: Exchange SDP with OpenAI Realtime API
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
      await pc.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });

      console.log("WebRTC connection established successfully");
    } catch (err) {
      console.error("Error connecting to OpenAI Realtime API:", err);
      const error = err instanceof Error ? err : new Error(String(err));
      onError(error);
      setIsConnecting(false);
      setIsConnected(false);
      onConnectionStateChange?.("disconnected");

      // Cleanup on error
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    }
  }, [
    questionId,
    resumeId,
    isConnecting,
    isConnected,
    onTranscriptUpdate,
    onError,
    onConnectionStateChange,
  ]);

  // Handle connection failures with retry logic
  const handleConnectionFailure = useCallback(() => {
    console.log("Connection failure detected");

    if (retryCountRef.current < maxRetries) {
      retryCountRef.current++;
      console.log(
        `Retrying connection (attempt ${retryCountRef.current}/${maxRetries})...`
      );

      // Cleanup current connection
      disconnect();

      // Retry after a short delay
      setTimeout(() => {
        connect();
      }, 2000 * retryCountRef.current); // Exponential backoff: 2s, 4s, 6s
    } else {
      console.error("Max retries reached. Connection failed.");
      onError(new Error("Connection failed after maximum retry attempts"));
      disconnect();
    }
  }, [connect, onError]);

  // Disconnect from OpenAI Realtime API
  const disconnect = useCallback(() => {
    console.log("Disconnecting from OpenAI Realtime API");

    // Close data channel
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Stop media tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setIsSpeaking(false);
    onConnectionStateChange?.("disconnected");
  }, [onConnectionStateChange]);

  // Handle disconnect
  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  // Get current transcript
  const getTranscript = useCallback(() => {
    return transcriptRef.current;
  }, []);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    transcriptRef.current = [];
    onTranscriptUpdate([]);
  }, [onTranscriptUpdate]);

  return {
    connect,
    disconnect,
    isConnected,
    isConnecting,
    isSpeaking,
    getTranscript,
    clearTranscript,
  };
}
