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
import { ArrowLeft, Clock, Star, FileText, Download } from "lucide-react";
import { getDrizzleDB } from "@/lib/db";
import { resumes, resumeHistory } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { ResumeHistory } from "@/types/database";

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
function parseAIFeedback(aiFeedback: string | null): string {
  if (!aiFeedback) return "";

  try {
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
    return aiFeedback;
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

  const { id } = await params;
  const resumeId = id;

  const db = getDrizzleDB();

  // 이력서 조회
  const [resume] = await db
    .select()
    .from(resumes)
    .where(
      and(
        eq(resumes.resumeId, resumeId),
        eq(resumes.clerkUserId, userId),
        eq(resumes.isActive, 1) // SQLite uses integer: 1 = true
      )
    )
    .limit(1);

  if (!resume) {
    notFound();
  }

  // 히스토리 조회 (에러 처리 포함)
  let history: ResumeHistory[] = [];
  try {
    history = await db
      .select()
      .from(resumeHistory)
      .where(
        and(
          eq(resumeHistory.resumeId, resumeId),
          eq(resumeHistory.clerkUserId, userId)
        )
      )
      .orderBy(desc(resumeHistory.createdAt));
  } catch (error) {
    // 테이블이 아직 생성되지 않았거나 다른 에러가 발생한 경우
    // 빈 배열로 처리하여 페이지는 정상적으로 표시되도록 함
    console.error("Error fetching resume history:", error);
    history = [];
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
                  Last updated {formatRelativeTime(resume.updatedAt)}
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
              {resume.aiFeedback && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>AI Feedback:</strong>{" "}
                    {parseAIFeedback(resume.aiFeedback)}
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
                <Card key={entry.historyId} className="relative">
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
                            {formatDate(entry.createdAt)} •{" "}
                            {formatRelativeTime(entry.createdAt)}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pl-16 space-y-4">
                    {entry.changeReason && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <p className="text-sm">
                          <strong>Change Reason:</strong> {entry.changeReason}
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
                            <span className="text-sm font-medium">
                              ATS Score
                            </span>
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

                    {entry.aiFeedback && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <p className="text-xs text-gray-700 dark:text-gray-300">
                          <strong>AI Feedback:</strong>{" "}
                          {parseAIFeedback(entry.aiFeedback)}
                        </p>
                      </div>
                    )}

                    {entry.fileUrl && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          File: {entry.fileUrl.split("/").pop()}
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
    </div>
  );
}
