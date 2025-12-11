"use client";

import { useAuth } from "@clerk/nextjs";
import { redirect, notFound, useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  FileText,
  Star,
  ArrowLeft,
  History,
  Edit,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { useResume, useResumeHistory } from "@/hooks/use-resumes";
import { ResumeActions } from "./components/resume-actions";
import { PdfViewerWrapper } from "./components/pdf-viewer-wrapper";
import { AnalyzeButton } from "./components/analyze-button";
import { FilePreviewNonPdf } from "./components/file-preview-non-pdf";
import type { ResumeHistoryItem } from "@/lib/graphql";

/**
 * 날짜 포맷팅
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * AI Feedback 타입 정의
 */
interface AIFeedbackData {
  summary: string;
  score: number;
  strengths: string[];
  improvements: string[];
}

/**
 * AI Feedback 파싱
 */
function parseAIFeedback(aiFeedback: string | null): AIFeedbackData | null {
  if (!aiFeedback) return null;

  try {
    const parsed = JSON.parse(aiFeedback);

    // 이미 구조화된 데이터인 경우
    if (
      parsed.summary &&
      Array.isArray(parsed.strengths) &&
      Array.isArray(parsed.improvements)
    ) {
      return parsed as AIFeedbackData;
    }

    // 레거시 포맷 처리
    if (typeof parsed === "string") {
      return {
        summary: parsed,
        score: 0,
        strengths: [],
        improvements: [],
      };
    }

    if (parsed.overall_feedback) {
      return {
        summary: parsed.overall_feedback,
        score: parsed.score || 0,
        strengths: parsed.strengths || [],
        improvements: parsed.improvements || [],
      };
    }

    return null;
  } catch {
    // JSON 파싱 실패시 텍스트로 처리
    return {
      summary: aiFeedback,
      score: 0,
      strengths: [],
      improvements: [],
    };
  }
}

/**
 * AI Feedback 표시 컴포넌트
 */
function AIFeedbackDisplay({ feedback }: { feedback: AIFeedbackData | null }) {
  if (!feedback) return null;

  return (
    <div className="space-y-4">
      {/* Summary */}
      {feedback.summary && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Summary
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {feedback.summary}
          </p>
        </div>
      )}

      {/* Strengths */}
      {feedback.strengths && feedback.strengths.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Strengths
          </h4>
          <ul className="space-y-1">
            {feedback.strengths.map((strength, idx) => (
              <li
                key={idx}
                className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
              >
                <span className="text-green-500 mt-1">•</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvements */}
      {feedback.improvements && feedback.improvements.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            Areas for Improvement
          </h4>
          <ul className="space-y-1">
            {feedback.improvements.map((improvement, idx) => (
              <li
                key={idx}
                className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
              >
                <span className="text-amber-500 mt-1">•</span>
                <span>{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Loading Skeleton for Resume Detail
 */
function ResumeDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Skeleton */}
      <div className="mb-6">
        <Skeleton className="h-10 w-32 mb-4" />
        <div className="flex items-start justify-between">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column Skeleton */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column Skeleton */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[600px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/**
 * Error State Component
 */
function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/service/resume">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Resumes
        </Link>
      </Button>
      <Card className="py-12">
        <CardContent className="flex flex-col items-center justify-center text-center">
          <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Something went wrong
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
            {message}
          </p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResumeDetailPage() {
  const params = useParams();
  const resumeId = params.id as string;
  const { userId, isLoaded: isAuthLoaded } = useAuth();

  // Redirect if not authenticated (after auth is loaded)
  if (isAuthLoaded && !userId) {
    redirect("/auth/sign-in");
  }

  // Fetch resume data using GraphQL + TanStack Query
  const {
    data: resume,
    isLoading: isResumeLoading,
    error: resumeError,
    refetch: refetchResume,
  } = useResume(resumeId);

  // Fetch AI history using GraphQL + TanStack Query
  const { data: aiHistory, isLoading: isHistoryLoading } =
    useResumeHistory(resumeId);

  // Show loading state while auth is loading or data is fetching
  if (!isAuthLoaded || isResumeLoading) {
    return <ResumeDetailSkeleton />;
  }

  // Handle error state
  if (resumeError) {
    return (
      <ErrorState
        message="Failed to load resume details. Please try again."
        onRetry={() => refetchResume()}
      />
    );
  }

  // Handle not found
  if (!resume) {
    notFound();
  }

  // Check authorization - only show if user owns the resume and it's active
  if (resume.clerk_user_id !== userId || !resume.is_active) {
    notFound();
  }

  const isPdf = resume.file_url?.toLowerCase().endsWith(".pdf") || false;
  const currentFeedback = parseAIFeedback(resume.ai_feedback);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/service/resume">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Resumes
          </Link>
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {resume.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Version {resume.version} • Created {formatDate(resume.created_at)}{" "}
              • Updated {formatDate(resume.updated_at)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/service/resume/${resumeId}/history`}>
                <History className="mr-2 h-4 w-4" />
                History
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Status & Score Card */}
          <Card>
            <CardHeader>
              <CardTitle>Status & Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge
                  variant={resume.score !== null ? "default" : "outline"}
                  className="mb-2"
                >
                  {resume.score !== null ? "Reviewed" : "Draft"}
                </Badge>
              </div>
              {resume.score !== null && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">ATS Score</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">
                        {resume.score}/100
                      </span>
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm font-medium">
                          {(resume.score / 20).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        resume.score >= 90
                          ? "bg-green-500"
                          : resume.score >= 80
                            ? "bg-blue-500"
                            : "bg-yellow-500"
                      }`}
                      style={{ width: `${resume.score}%` }}
                    />
                  </div>
                </>
              )}

              <div className="pt-2">
                <AnalyzeButton
                  resumeId={resumeId}
                  fileUrl={resume.file_url}
                  isPdf={isPdf}
                />
              </div>
            </CardContent>
          </Card>

          {/* AI Feedback Card */}
          {currentFeedback && (
            <Card>
              <CardHeader>
                <CardTitle>Current AI Review</CardTitle>
                <CardDescription>
                  Latest analysis of your resume
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AIFeedbackDisplay feedback={currentFeedback} />
              </CardContent>
            </Card>
          )}

          {/* Historical AI Reviews */}
          {!isHistoryLoading && aiHistory && aiHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Review History</CardTitle>
                <CardDescription>
                  Previous AI analyses ({aiHistory.length} review
                  {aiHistory.length !== 1 ? "s" : ""})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {aiHistory.map(
                    (historyItem: ResumeHistoryItem, index: number) => {
                      const historyFeedback = parseAIFeedback(
                        historyItem.ai_feedback
                      );
                      return (
                        <AccordionItem
                          key={historyItem.history_id}
                          value={`item-${index}`}
                        >
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center justify-between w-full pr-4">
                              <div className="flex items-center gap-3">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <div className="text-left">
                                  <div className="text-sm font-medium">
                                    Version {historyItem.version}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {formatDate(historyItem.created_at)}
                                  </div>
                                </div>
                              </div>
                              {historyItem.score !== null && (
                                <Badge variant="secondary" className="ml-2">
                                  Score: {historyItem.score}/100
                                </Badge>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="pt-4">
                              <AIFeedbackDisplay feedback={historyFeedback} />
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    }
                  )}
                </Accordion>
              </CardContent>
            </Card>
          )}

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <ResumeActions
                resumeId={resumeId}
                hasFile={!!resume.file_url}
                isPdf={isPdf}
              />
            </CardContent>
          </Card>

          {/* Content Preview (if exists) */}
          {resume.content && (
            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {resume.content}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - File Preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Resume Preview</CardTitle>
              <CardDescription>
                {resume.file_url
                  ? `File: ${resume.file_url.split("/").pop()}`
                  : "No file uploaded"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resume.file_url ? (
                <div className="w-full">
                  {isPdf ? (
                    <PdfViewerWrapper
                      fileUrl={resume.file_url}
                      resumeId={resumeId}
                    />
                  ) : (
                    <FilePreviewNonPdf fileUrl={resume.file_url} />
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-gray-50 dark:bg-gray-800">
                  <FileText className="h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    No file uploaded
                  </p>
                  <Button asChild>
                    <Link href={`/service/resume/upload`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Upload File
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
