"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, FileText } from "lucide-react";
import { generateQuestionsFromResume } from "@/app/actions/question-actions";

interface Resume {
  resumeId: string;
  title: string;
  fileUrl: string | null;
  createdAt: string;
}

interface QuestionGenerateFormProps {
  resumes: Resume[];
}

export function QuestionGenerateForm({ resumes }: QuestionGenerateFormProps) {
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!selectedResumeId) {
      setError("이력서를 선택해주세요");
      return;
    }

    const selectedResume = resumes.find((r) => r.resumeId === selectedResumeId);
    if (!selectedResume?.fileUrl) {
      setError("선택한 이력서에 파일이 없습니다");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      // Call server action - server will fetch PDF directly from R2
      const result = await generateQuestionsFromResume(selectedResumeId);

      if (result.success) {
        setSuccess(`${result.questionsCreated}개의 질문이 생성되었습니다!`);
        // Refresh the page to show new questions
        window.location.reload();
      } else {
        setError(result.error || "질문 생성에 실패했습니다");
      }
    } catch (err) {
      console.error("[QUESTIONS] Error:", err);
      setError("예상치 못한 오류가 발생했습니다");
    } finally {
      setIsGenerating(false);
    }
  };

  if (resumes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
        <FileText className="h-10 w-10 text-gray-400 mb-3" />
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          등록된 이력서가 없습니다
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          먼저 이력서를 업로드해주세요
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
            이력서 선택
          </label>
          <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="질문을 생성할 이력서를 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {resumes.map((resume) => (
                <SelectItem key={resume.resumeId} value={resume.resumeId}>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>{resume.title}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !selectedResumeId}
          className="shrink-0"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              생성 중...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              AI 질문 생성
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-400">
            {success}
          </p>
        </div>
      )}
    </div>
  );
}
