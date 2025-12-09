"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Upload, AlertCircle, RefreshCw } from "lucide-react";
import { ResumeCard } from "./components/resume-card";
import { useResumes, useResumeStats } from "@/hooks/use-resumes";

/**
 * 날짜를 상대 시간 문자열로 변환 (예: "2 hours ago", "1 day ago")
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
 * AI Feedback을 파싱하여 문자열로 반환
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
    // JSON 파싱 실패 시 원본 문자열 반환
    return aiFeedback;
  }
}

/**
 * 점수 기반으로 상태를 결정
 */
function getStatusFromScore(score: number | null): "Reviewed" | "Draft" {
  return score !== null ? "Reviewed" : "Draft";
}

/**
 * Stats Loading Skeleton
 */
function StatsLoadingSkeleton() {
  return (
    <div className="grid md:grid-cols-4 gap-4 mb-8">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Resume List Loading Skeleton
 */
function ResumeListLoadingSkeleton() {
  return (
    <div className="grid gap-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Error State Component
 */
function ErrorState({
  message,
  onRetry
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
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
  );
}

export default function ResumePage() {
  const { userId, isLoaded: isAuthLoaded } = useAuth();

  // Redirect if not authenticated (after auth is loaded)
  if (isAuthLoaded && !userId) {
    redirect("/auth/sign-in");
  }

  // Fetch resumes using GraphQL + TanStack Query
  const {
    data: resumesData,
    isLoading: isResumesLoading,
    error: resumesError,
    refetch: refetchResumes,
  } = useResumes();

  // Fetch stats using GraphQL + TanStack Query
  const {
    data: stats,
    isLoading: isStatsLoading,
  } = useResumeStats();

  // Transform resume data for UI
  const resumes = (resumesData || []).map((resume) => ({
    id: resume.resume_id,
    name: resume.title,
    status: getStatusFromScore(resume.score),
    score: resume.score ?? 0,
    lastUpdated: formatRelativeTime(resume.updated_at),
    version: resume.version,
    feedback: parseAIFeedback(resume.ai_feedback),
  }));

  // Show loading state while auth is loading
  if (!isAuthLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Resume Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Upload, edit, and optimize your resumes with AI-powered feedback
            </p>
          </div>
          <Button asChild>
            <Link href="/service/resume/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload New Resume
            </Link>
          </Button>
        </div>

        {/* Quick Stats */}
        {isStatsLoading ? (
          <StatsLoadingSkeleton />
        ) : (
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Resumes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Avg. Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.avgScore ?? 0}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Reviews Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.reviewed ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Templates Used
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Resumes List */}
        {isResumesLoading ? (
          <ResumeListLoadingSkeleton />
        ) : resumesError ? (
          <ErrorState
            message="Failed to load resumes. Please try again."
            onRetry={() => refetchResumes()}
          />
        ) : resumes.length === 0 ? (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                <FileText className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No resumes yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                Get started by uploading your first resume. We'll help you
                optimize it with AI-powered feedback.
              </p>
              <Button asChild>
                <Link href="/service/resume/upload">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Your First Resume
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {resumes.map((resume) => (
              <ResumeCard key={resume.id} resume={resume} />
            ))}
          </div>
        )}

        {/* Templates Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Resume Templates</CardTitle>
            <CardDescription>
              Start with a professional template
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              {["Modern", "Classic", "Creative", "Executive"].map(
                (template) => (
                  <Card
                    key={template}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <CardHeader>
                      <div className="h-32 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-lg flex items-center justify-center">
                        <FileText className="h-12 w-12 text-gray-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <h3 className="font-semibold mb-2">{template}</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        asChild
                      >
                        <Link
                          href={`/service/resume/template/${template.toLowerCase()}`}
                        >
                          Use Template
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
