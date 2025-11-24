import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  FileText,
  Download,
  Star,
  ArrowLeft,
  History,
  Edit,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { getResumeById, getResumeHistoryWithAI, resumeHistory } from "@/lib/db";
import { ResumeActions } from "./components/resume-actions";
import { PdfViewerWrapper } from "./components/pdf-viewer-wrapper";
import { AnalyzeButton } from "./components/analyze-button";
import { FilePreviewNonPdf } from "./components/file-preview-non-pdf";

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

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ResumeDetailPage({ params }: PageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/auth/sign-in");
  }

  const { id } = await params;
  const resumeId = id;

  // 이력서 조회 (본인의 이력서만, 권한 검증 포함)
  const resume = await getResumeById(resumeId, userId);

  if (!resume) {
    notFound();
  }

  // AI 리뷰 히스토리 조회
  const aiHistory = await getResumeHistoryWithAI(resumeId, userId);

  const isPdf = resume.fileUrl?.toLowerCase().endsWith(".pdf") || false;
  const currentFeedback = parseAIFeedback(resume.aiFeedback);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
                Version {resume.version} • Created{" "}
                {formatDate(resume.createdAt)} • Updated{" "}
                {formatDate(resume.updatedAt)}
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
                    fileUrl={resume.fileUrl}
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
            {aiHistory.length > 0 && (
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
                      (
                        historyItem: typeof resumeHistory.$inferSelect,
                        index: number
                      ) => {
                        const historyFeedback = parseAIFeedback(
                          historyItem.aiFeedback
                        );
                        return (
                          <AccordionItem
                            key={historyItem.historyId}
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
                                      {formatDate(historyItem.createdAt)}
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
                  hasFile={!!resume.fileUrl}
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
                  {resume.fileUrl
                    ? `File: ${resume.fileUrl.split("/").pop()}`
                    : "No file uploaded"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {resume.fileUrl ? (
                  <div className="w-full">
                    {isPdf ? (
                      <PdfViewerWrapper
                        fileUrl={resume.fileUrl}
                        resumeId={resumeId}
                      />
                    ) : (
                      <FilePreviewNonPdf fileUrl={resume.fileUrl} />
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
    </div>
  );
}
