"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { QuestionCard } from "./question-card";
import { useQuestions } from "@/hooks";
import type { QuestionCategory } from "@/lib/graphql/queries/questions";

const categoryOptions: { value: QuestionCategory | "all"; label: string }[] = [
  { value: "all", label: "All Categories" },
  { value: "behavioral", label: "Behavioral" },
  { value: "technical", label: "Technical" },
  { value: "system_design", label: "System Design" },
  { value: "leadership", label: "Leadership" },
  { value: "problem_solving", label: "Problem Solving" },
  { value: "company_specific", label: "Company Specific" },
];

export function QuestionsList() {
  const { data: questions, isLoading, error } = useQuestions();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<QuestionCategory | "all">("all");
  const [activeTab, setActiveTab] = useState("all");

  const filteredQuestions = useMemo(() => {
    if (!questions) return [];

    return questions.filter((q) => {
      // Search filter
      if (
        searchQuery &&
        !q.question_text.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Category filter
      if (categoryFilter !== "all" && q.category !== categoryFilter) {
        return false;
      }

      // Tab filter
      if (activeTab === "bookmarked" && !q.is_bookmarked) {
        return false;
      }

      return true;
    });
  }, [questions, searchQuery, categoryFilter, activeTab]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-red-500">질문을 불러오는데 실패했습니다</p>
        </CardContent>
      </Card>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            아직 생성된 질문이 없습니다
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            이력서를 선택하고 &apos;AI 질문 생성&apos; 버튼을 클릭하세요
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Questions</CardTitle>
        <CardDescription>
          총 {questions.length}개의 질문 | 필터링됨: {filteredQuestions.length}개
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="질문 검색..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={categoryFilter}
            onValueChange={(v) => setCategoryFilter(v as QuestionCategory | "all")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="bookmarked">Bookmarked</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filteredQuestions.length > 0 ? (
              filteredQuestions.map((question) => (
                <QuestionCard
                  key={question.question_id}
                  question={{
                    questionId: question.question_id,
                    questionText: question.question_text,
                    category: question.category,
                    difficulty: question.difficulty,
                    suggestedAnswer: question.suggested_answer,
                    tips: question.tips,
                    isBookmarked: question.is_bookmarked,
                  }}
                />
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">
                검색 결과가 없습니다
              </p>
            )}
          </TabsContent>

          <TabsContent value="bookmarked" className="space-y-4">
            {filteredQuestions.length > 0 ? (
              filteredQuestions.map((question) => (
                <QuestionCard
                  key={question.question_id}
                  question={{
                    questionId: question.question_id,
                    questionText: question.question_text,
                    category: question.category,
                    difficulty: question.difficulty,
                    suggestedAnswer: question.suggested_answer,
                    tips: question.tips,
                    isBookmarked: question.is_bookmarked,
                  }}
                />
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">
                북마크한 질문이 없습니다
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
