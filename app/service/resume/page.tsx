import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Edit, Download, Clock, Star, MoreVertical } from "lucide-react";
import { getDrizzleDB } from "@/lib/db";
import { resumes as resumesTable } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

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

export default async function ResumePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/auth/sign-in");
  }

  const db = getDrizzleDB();

  // 사용자의 활성 이력서 목록 조회
  const userResumes = await db
    .select()
    .from(resumesTable)
    .where(
      and(
        eq(resumesTable.clerkUserId, userId),
        eq(resumesTable.isActive, true)
      )
    )
    .orderBy(desc(resumesTable.createdAt));

  // 통계 계산
  const totalResumes = userResumes.length;
  const resumesWithScore = userResumes.filter((r) => r.score !== null);
  const reviewsCompleted = resumesWithScore.length;
  const avgScore = reviewsCompleted > 0
    ? Math.round(
        resumesWithScore.reduce((sum, r) => sum + (r.score || 0), 0) /
          reviewsCompleted
      )
    : 0;

  // DB 데이터를 UI에 맞게 변환
  const resumes = userResumes.map((resume) => ({
    id: resume.resumeId,
    name: resume.title,
    status: getStatusFromScore(resume.score),
    score: resume.score ?? 0,
    lastUpdated: formatRelativeTime(resume.updatedAt),
    version: resume.version,
    feedback: parseAIFeedback(resume.aiFeedback),
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Resume Management</h1>
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
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Resumes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalResumes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Avg. Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgScore}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Reviews Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reviewsCompleted}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Templates Used</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
        </div>

        {/* Resumes List */}
        {resumes.length === 0 ? (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                <FileText className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No resumes yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                Get started by uploading your first resume. We'll help you optimize it with AI-powered feedback.
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
            <Card key={resume.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{resume.name}</CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Updated {resume.lastUpdated}
                        </span>
                        <span>Version {resume.version}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={resume.status === "Reviewed" ? "default" : "outline"}
                    >
                      {resume.status}
                    </Badge>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {resume.score > 0 && (
                  <>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">ATS Score</span>
                          <span className="text-sm font-bold">{resume.score}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              resume.score >= 90 ? "bg-green-500" : 
                              resume.score >= 80 ? "bg-blue-500" : 
                              "bg-yellow-500"
                            }`}
                            style={{ width: `${resume.score}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="h-5 w-5 fill-current" />
                        <span className="font-medium">{(resume.score / 20).toFixed(1)}</span>
                      </div>
                    </div>
                  </>
                )}

                {resume.feedback && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>AI Feedback:</strong> {resume.feedback}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="default" asChild>
                    <Link href={`/service/resume/${resume.id}/edit-pdf`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Resume
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/service/resume/${resume.id}`}>
                      View Details
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/service/resume/${resume.id}/download`}>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/service/resume/${resume.id}/history`}>
                      <Clock className="mr-2 h-4 w-4" />
                      History
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        )}

        {/* Templates Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Resume Templates</CardTitle>
            <CardDescription>Start with a professional template</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              {["Modern", "Classic", "Creative", "Executive"].map((template) => (
                <Card key={template} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="h-32 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-lg flex items-center justify-center">
                      <FileText className="h-12 w-12 text-gray-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-semibold mb-2">{template}</h3>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={`/service/resume/template/${template.toLowerCase()}`}>
                        Use Template
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

