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
import { ArrowLeft, Clock, Star, FileText } from "lucide-react";
import {
  graphqlClient,
  GET_RESUME_BY_ID,
  GET_RESUME_HISTORY_ALL,
  type GetResumeByIdResponse,
} from "@/lib/graphql";

interface ResumeHistoryAllResponse {
  resume_history: Array<{
    history_id: string;
    resume_id: string;
    clerk_user_id: string;
    title: string;
    content: string | null;
    version: number;
    file_url: string | null;
    ai_feedback: Record<string, unknown> | null;
    score: number | null;
    change_reason: string | null;
    created_at: string;
  }>;
  resume_history_aggregate: {
    aggregate: {
      count: number;
    };
  };
}

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
 * 상대 시간 포맷팅
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} ago`;
  } else {
    return "Just now";
  }
}

/**
 * AI Feedback 파싱
 */
function parseAIFeedback(
  aiFeedback: Record<string, unknown> | string | null
): string {
  if (!aiFeedback) return "";

  try {
    // 이미 객체인 경우
    if (typeof aiFeedback === "object") {
      if ("summary" in aiFeedback && typeof aiFeedback.summary === "string") {
        return aiFeedback.summary;
      }
      if (
        "overall_feedback" in aiFeedback &&
        typeof aiFeedback.overall_feedback === "string"
      ) {
        return aiFeedback.overall_feedback;
      }
      return JSON.stringify(aiFeedback);
    }

    // 문자열인 경우 파싱 시도
    const parsed = JSON.parse(aiFeedback);
    if (typeof parsed === "string") {
      return parsed;
    }
    if (parsed.summary) {
      return parsed.summary;
    }
    if (parsed.overall_feedback) {
      return parsed.overall_feedback;
    }
    return JSON.stringify(parsed);
  } catch {
    return typeof aiFeedback === "string" ? aiFeedback : "";
  }
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ResumeHistoryPage({ params }: PageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/auth/sign-in");
  }

  const { id: resumeId } = await params;

  // GraphQL로 이력서 조회
  const resumeData = await graphqlClient.request<GetResumeByIdResponse>(
    GET_RESUME_BY_ID,
    { resumeId }
  );

  const resume = resumeData.resumes_by_pk;

  if (!resume || resume.clerk_user_id !== userId || !resume.is_active) {
    notFound();
  }

  // GraphQL로 히스토리 조회
  let history: ResumeHistoryAllResponse["resume_history"] = [];
  try {
    const historyData =
      await graphqlClient.request<ResumeHistoryAllResponse>(
        GET_RESUME_HISTORY_ALL,
        {
          resumeId,
          userId,
          limit: 50,
          offset: 0,
        }
      );
    history = historyData.resume_history;
  } catch (error) {
    console.error("Error fetching resume history:", error);
    history = [];
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/service/resume/${resumeId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Resume
          </Link>
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Resume History
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {resume.title} • Version {resume.version}
            </p>
          </div>
        </div>
      </div>

      {/* Current Version Card */}
      <Card className="mb-6 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Current Version
                <Badge variant="default">v{resume.version}</Badge>
              </CardTitle>
              <CardDescription>
                Last updated {formatRelativeTime(resume.updated_at)}
              </CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href={`/service/resume/${resumeId}`}>View Details</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {resume.score !== null && (
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">ATS Score</span>
                    <span className="text-sm font-bold">
                      {resume.score}/100
                    </span>
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
                </div>
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="h-5 w-5 fill-current" />
                  <span className="font-medium">
                    {(resume.score / 20).toFixed(1)}
                  </span>
                </div>
              </div>
            )}
            {resume.ai_feedback && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>AI Feedback:</strong>{" "}
                  {parseAIFeedback(resume.ai_feedback)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* History Timeline */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Version History ({history.length}{" "}
          {history.length === 1 ? "entry" : "entries"})
        </h2>

        {history.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No history available yet. Changes will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {history.map((entry, index) => (
              <Card key={entry.history_id} className="relative">
                {/* Timeline connector */}
                {index < history.length - 1 && (
                  <div className="absolute left-8 top-16 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                        <Clock className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          Version {entry.version}
                          <Badge variant="outline">v{entry.version}</Badge>
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {formatDate(entry.created_at)} •{" "}
                          {formatRelativeTime(entry.created_at)}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pl-16 space-y-4">
                  {entry.change_reason && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-sm">
                        <strong>Change Reason:</strong> {entry.change_reason}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {entry.title}
                    </p>
                    {entry.content && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                        {entry.content}
                      </p>
                    )}
                  </div>

                  {entry.score !== null && (
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">ATS Score</span>
                          <span className="text-sm font-bold">
                            {entry.score}/100
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              entry.score >= 90
                                ? "bg-green-500"
                                : entry.score >= 80
                                  ? "bg-blue-500"
                                  : "bg-yellow-500"
                            }`}
                            style={{ width: `${entry.score}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-xs font-medium">
                          {(entry.score / 20).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  )}

                  {entry.ai_feedback && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <p className="text-xs text-gray-700 dark:text-gray-300">
                        <strong>AI Feedback:</strong>{" "}
                        {parseAIFeedback(entry.ai_feedback)}
                      </p>
                    </div>
                  )}

                  {entry.file_url && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        File: {entry.file_url.split("/").pop()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
