"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Bookmark, TrendingUp, Zap, BookOpen, Star, Loader2 } from "lucide-react";
import { useResumes, useQuestions, useQuestionStats } from "@/hooks";
import { QuestionGenerateForm } from "./components/question-generate-form";
import { QuestionsList } from "./components/questions-list";
import { CategoryGrid } from "./components/category-grid";

export default function QuestionsPage() {
  const { data: resumes, isLoading: resumesLoading } = useResumes();
  const { data: questions, isLoading: questionsLoading } = useQuestions();
  const { data: stats, isLoading: statsLoading } = useQuestionStats();

  const isLoading = resumesLoading || questionsLoading || statsLoading;

  // Get recently practiced (most recent questions)
  const recentQuestions = questions?.slice(0, 3) ?? [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Interview Questions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            이력서를 기반으로 맞춤형 면접 질문을 생성하고 연습하세요
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Total Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Technical
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.byCategory.technical ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Bookmark className="h-4 w-4" />
                Bookmarked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.bookmarked ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Behavioral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.byCategory.behavioral ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Question Generation */}
            <Card>
              <CardHeader>
                <CardTitle>AI 질문 생성</CardTitle>
                <CardDescription>
                  이력서를 선택하면 AI가 맞춤형 면접 질문을 생성합니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QuestionGenerateForm
                  resumes={resumes?.map((r) => ({
                    resumeId: r.resume_id,
                    title: r.title,
                    fileUrl: r.file_url,
                    createdAt: r.created_at,
                  })) ?? []}
                />
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Question Categories</CardTitle>
                <CardDescription>카테고리별 질문 수</CardDescription>
              </CardHeader>
              <CardContent>
                <CategoryGrid stats={stats?.byCategory ?? {
                  behavioral: 0,
                  technical: 0,
                  system_design: 0,
                  leadership: 0,
                  problem_solving: 0,
                  company_specific: 0,
                }} />
              </CardContent>
            </Card>

            {/* Questions List */}
            <QuestionsList />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Questions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Recent Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentQuestions.length > 0 ? (
                  recentQuestions.map((question) => (
                    <div
                      key={question.question_id}
                      className="border-l-2 border-blue-500 pl-3"
                    >
                      <p className="text-sm font-medium mb-1 line-clamp-2">
                        {question.question_text}
                      </p>
                      {question.category && (
                        <span className="text-xs text-gray-500 capitalize">
                          {question.category.replace("_", " ")}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">
                    아직 생성된 질문이 없습니다
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Study Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Study Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="font-medium">1.</div>
                  <p>큰 소리로 답변을 연습하여 자신감을 키우세요</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="font-medium">2.</div>
                  <p>행동 질문에는 STAR 방법을 사용하세요</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="font-medium">3.</div>
                  <p>자신을 녹화하여 개선점을 파악하세요</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="font-medium">4.</div>
                  <p>답변을 정기적으로 검토하고 업데이트하세요</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/service/resume">
                    <Zap className="mr-2 h-4 w-4" />
                    이력서 관리
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/service/mock-interview">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Start Mock Interview
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
