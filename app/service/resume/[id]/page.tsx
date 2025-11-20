import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Edit, 
  Download, 
  Clock, 
  Star, 
  ArrowLeft,
  Trash2,
  History
} from "lucide-react";
import { getDrizzleDB } from "@/lib/db";
import { resumes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

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

export default async function ResumeDetailPage({ params }: PageProps) {
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
        eq(resumes.isActive, true)
      )
    )
    .limit(1);

  if (!resume) {
    notFound();
  }

  // 파일 미리보기 URL 생성
  const filePreviewUrl = resume.fileUrl 
    ? `/api/files/${resume.fileUrl}`
    : null;

  const isPdf = resume.fileUrl?.endsWith(".pdf") || resume.fileUrl?.includes("application/pdf");

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
                Version {resume.version} • Created {formatDate(resume.createdAt)} • Updated {formatDate(resume.updatedAt)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/service/resume/${resumeId}/history`}>
                  <History className="mr-2 h-4 w-4" />
                  History
                </Link>
              </Button>
              {isPdf && resume.fileUrl ? (
                <Button variant="default" asChild>
                  <Link href={`/service/resume/${resumeId}/edit-pdf`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit PDF
                  </Link>
                </Button>
              ) : null}
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
                        <span className="text-lg font-bold">{resume.score}/100</span>
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
                          resume.score >= 90 ? "bg-green-500" : 
                          resume.score >= 80 ? "bg-blue-500" : 
                          "bg-yellow-500"
                        }`}
                        style={{ width: `${resume.score}%` }}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* AI Feedback Card */}
            {resume.aiFeedback && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {parseAIFeedback(resume.aiFeedback)}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="default" className="w-full" asChild>
                  <Link href={`/service/resume/${resumeId}/download`}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Link>
                </Button>
                {isPdf && resume.fileUrl ? (
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/service/resume/${resumeId}/edit-pdf`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit PDF
                    </Link>
                  </Button>
                ) : null}
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/service/resume/${resumeId}/history`}>
                    <History className="mr-2 h-4 w-4" />
                    View History
                  </Link>
                </Button>
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
                  {resume.fileUrl ? (
                    `File: ${resume.fileUrl.split("/").pop()}`
                  ) : (
                    "No file uploaded"
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filePreviewUrl ? (
                  <div className="w-full">
                    {isPdf ? (
                      <iframe
                        src={filePreviewUrl}
                        className="w-full h-[800px] border rounded-lg"
                        title="Resume Preview"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-gray-50 dark:bg-gray-800">
                        <FileText className="h-16 w-16 text-gray-400 mb-4" />
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Preview not available for this file type
                        </p>
                        <Button asChild>
                          <a href={filePreviewUrl} download>
                            <Download className="mr-2 h-4 w-4" />
                            Download File
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-gray-50 dark:bg-gray-800">
                    <FileText className="h-16 w-16 text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      No file uploaded
                    </p>
                    <Button asChild>
                      <Link href={`/service/resume/${resumeId}/edit`}>
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

