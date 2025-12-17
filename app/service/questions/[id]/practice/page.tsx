"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, Loader2, Phone, PhoneOff, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { graphqlClient } from "@/lib/graphql/client";
import {
  GET_QUESTION_BY_ID,
  type Question,
  type QuestionCategory,
} from "@/lib/graphql/queries/questions";
import { useRealtimeVoice, type TranscriptMessage } from "@/hooks/use-realtime-voice";
import type { ConnectionState } from "@/lib/voice/types";
import { useState, useEffect, useRef } from "react";

const categoryLabels: Record<QuestionCategory, string> = {
  behavioral: "Behavioral",
  technical: "Technical",
  system_design: "System Design",
  leadership: "Leadership",
  problem_solving: "Problem Solving",
  company_specific: "Company Specific",
};

const categoryColors: Record<QuestionCategory, string> = {
  behavioral: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  technical:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  system_design:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  leadership:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  problem_solving:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  company_specific:
    "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
};

interface GetQuestionByIdResponse {
  interview_questions_by_pk: Question | null;
}

export default function PracticePage() {
  const params = useParams();
  const router = useRouter();
  const { userId } = useAuth();
  const questionId = params.id as string;

  // State management
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [interviewTime, setInterviewTime] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Fetch question data
  const { data, isLoading, error } = useQuery<GetQuestionByIdResponse>({
    queryKey: ["question", questionId],
    queryFn: async () => {
      const response = await graphqlClient.request<GetQuestionByIdResponse>(
        GET_QUESTION_BY_ID,
        { questionId }
      );
      return response;
    },
    enabled: !!questionId,
  });

  const question = data?.interview_questions_by_pk;

  // Initialize realtime voice hook
  const realtimeVoice = useRealtimeVoice({
    questionId,
    resumeId: question?.resume_id || "",
    onTranscriptUpdate: (messages) => {
      setTranscript(messages);
      // Auto-scroll to bottom
      setTimeout(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    },
    onError: (err) => {
      console.error("Realtime voice error:", err);
      setConnectionError(err.message);
    },
    onConnectionStateChange: (state) => {
      setConnectionState(state);
    },
  });

  // Start interview timer
  useEffect(() => {
    if (realtimeVoice.isConnected && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setInterviewTime((prev) => prev + 1);
      }, 1000);
    } else if (!realtimeVoice.isConnected && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [realtimeVoice.isConnected]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle start interview
  const handleStartInterview = async () => {
    setConnectionError(null);
    setTranscript([]);
    setInterviewTime(0);
    await realtimeVoice.connect();
  };

  // Handle end interview
  const handleEndInterview = () => {
    realtimeVoice.disconnect();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Error state
  if (error || !question) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
              질문을 찾을 수 없습니다.
            </p>
            <Button
              onClick={() => router.push("/service/questions")}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              질문 목록으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user owns this question
  if (question.clerk_user_id && question.clerk_user_id !== userId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
              이 질문에 대한 접근 권한이 없습니다.
            </p>
            <Button
              onClick={() => router.push("/service/questions")}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              질문 목록으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const difficultyVariant =
    question.difficulty === "easy"
      ? "default"
      : question.difficulty === "medium"
        ? "secondary"
        : "destructive";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Timer */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/service/questions")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Questions
          </Button>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Timer className="h-5 w-5" />
            <span className="font-mono text-lg">{formatTime(interviewTime)}</span>
          </div>
        </div>

        {/* Question Display */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  {question.category && (
                    <Badge
                      variant="outline"
                      className={categoryColors[question.category]}
                    >
                      {categoryLabels[question.category]}
                    </Badge>
                  )}
                  {question.difficulty && (
                    <Badge variant={difficultyVariant}>
                      {question.difficulty.charAt(0).toUpperCase() +
                        question.difficulty.slice(1)}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-2xl">{question.question_text}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {question.tips && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>💡 Tip:</strong> {question.tips}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Interview Session */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>AI Interview Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Connection Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <span className="flex items-center gap-2">
                  {connectionState === "connected" && (
                    <>
                      <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm text-green-600 dark:text-green-400">
                        Connected
                      </span>
                    </>
                  )}
                  {connectionState === "connecting" && (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      <span className="text-sm text-blue-600 dark:text-blue-400">
                        Connecting...
                      </span>
                    </>
                  )}
                  {connectionState === "disconnected" && (
                    <>
                      <span className="h-2 w-2 bg-gray-400 rounded-full" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Disconnected
                      </span>
                    </>
                  )}
                </span>
                {realtimeVoice.isSpeaking && (
                  <Badge variant="outline" className="ml-4">
                    🎤 AI Speaking...
                  </Badge>
                )}
              </div>

              {/* Interview Controls */}
              <div className="flex gap-2">
                {!realtimeVoice.isConnected && !realtimeVoice.isConnecting && (
                  <Button onClick={handleStartInterview} size="sm">
                    <Phone className="mr-2 h-4 w-4" />
                    Start Interview
                  </Button>
                )}
                {realtimeVoice.isConnected && (
                  <Button onClick={handleEndInterview} variant="destructive" size="sm">
                    <PhoneOff className="mr-2 h-4 w-4" />
                    End Interview
                  </Button>
                )}
              </div>
            </div>

            {/* Error Display */}
            {connectionError && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">
                  <strong>Error:</strong> {connectionError}
                </p>
              </div>
            )}

            {/* Transcript Display */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                📝 Conversation Transcript
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
                {transcript.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    {realtimeVoice.isConnected
                      ? "Waiting for conversation to begin..."
                      : "Click 'Start Interview' to begin practicing"}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {transcript.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.role === "assistant" ? "justify-start" : "justify-end"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.role === "assistant"
                              ? "bg-blue-100 dark:bg-blue-900/30 text-gray-900 dark:text-gray-100"
                              : "bg-green-100 dark:bg-green-900/30 text-gray-900 dark:text-gray-100"
                          }`}
                        >
                          <p className="text-xs font-medium mb-1">
                            {message.role === "assistant" ? "AI Interviewer" : "You"}
                          </p>
                          <p className="text-sm whitespace-pre-wrap">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={transcriptEndRef} />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Controls */}
        <div className="flex gap-4 justify-between">
          <Button variant="outline" onClick={() => router.push("/service/questions")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
          <Button
            onClick={() => alert("저장 기능은 준비 중입니다.")}
            disabled={transcript.length === 0}
          >
            Save Interview
          </Button>
        </div>
      </div>
    </div>
  );
}
