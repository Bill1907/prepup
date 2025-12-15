"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bookmark, Trash2, Loader2 } from "lucide-react";
import { useToggleBookmark, useDeleteQuestion } from "@/hooks";
import type { QuestionCategory } from "@/lib/graphql/queries/questions";

interface Question {
  questionId: string;
  questionText: string;
  category: QuestionCategory | null;
  difficulty: "easy" | "medium" | "hard" | null;
  suggestedAnswer: string | null;
  tips: string | null;
  isBookmarked: boolean;
}

interface QuestionCardProps {
  question: Question;
}

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

export function QuestionCard({ question }: QuestionCardProps) {
  const toggleBookmark = useToggleBookmark();
  const deleteQuestion = useDeleteQuestion();

  const handleToggleBookmark = () => {
    toggleBookmark.mutate({
      questionId: question.questionId,
      isBookmarked: question.isBookmarked,
    });
  };

  const handleDelete = () => {
    if (!confirm("이 질문을 삭제하시겠습니까?")) return;
    deleteQuestion.mutate(question.questionId);
  };

  const difficultyVariant =
    question.difficulty === "easy"
      ? "default"
      : question.difficulty === "medium"
        ? "secondary"
        : "destructive";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 pr-4">
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
              {question.questionText}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
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
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleBookmark}
              disabled={toggleBookmark.isPending}
              className={question.isBookmarked ? "text-yellow-500" : ""}
            >
              {toggleBookmark.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Bookmark
                  className={`h-5 w-5 ${question.isBookmarked ? "fill-current" : ""}`}
                />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={deleteQuestion.isPending}
              className="text-gray-400 hover:text-red-500"
            >
              {deleteQuestion.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Trash2 className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {question.tips && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>💡 Tip:</strong> {question.tips}
            </p>
          </div>
        )}

        {question.suggestedAnswer && (
          <details className="mb-3">
            <summary className="text-sm font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-gray-200">
              📝 Suggested Answer Framework
            </summary>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
              {question.suggestedAnswer}
            </p>
          </details>
        )}

        <div className="flex gap-2">
          {/* @TODO: 이부분 기획적으로 생각해 봐야함 */}
          <Button size="sm" asChild>
            <Link href={`/service/questions/${question.questionId}/practice`}>
              Practice
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/service/questions/${question.questionId}`}>
              View Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
