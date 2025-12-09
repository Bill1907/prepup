"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileText,
  Info,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useUploadResume } from "@/hooks/use-resumes";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Zod 스키마 정의
const uploadSchema = z.object({
  file: z
    .instanceof(File, { message: "Please select a file" })
    .refine((file) => file.size > 0, "File cannot be empty")
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`
    )
    .refine(
      (file) => ALLOWED_FILE_TYPES.includes(file.type),
      "Only PDF, DOC, and DOCX files are allowed"
    ),
  title: z.string().optional(),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

export default function UploadResumePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // TanStack Query Mutation 사용
  const uploadMutation = useUploadResume();

  const form = useForm({
    defaultValues: {
      file: undefined as File | undefined,
      title: "",
    },

    onSubmit: async ({ value }) => {
      // Zod 스키마로 최종 검증
      const validation = uploadSchema.safeParse(value);
      if (!validation.success) {
        const error =
          validation.error.issues[0]?.message || "Validation failed";
        return;
      }

      if (!value.file) {
        return;
      }

      // TanStack Query Mutation 실행
      uploadMutation.mutate(
        {
          file: value.file,
          title: value.title?.trim(),
        },
        {
          onSuccess: () => {
            // 성공 후 1초 뒤 리다이렉트
            setTimeout(() => {
              router.push("/service/resume");
            }, 1000);
          },
        }
      );
    },
  });

  const handleFileSelect = (file: File | null) => {
    if (!file) return;

    // 파일을 form에 설정 (form.Field의 validator가 자동으로 검증)
    setSelectedFile(file);
    form.setFieldValue("file", file);

    // 파일명을 제목으로 자동 설정 (사용자가 입력하지 않은 경우)
    if (!form.state.values.title) {
      const titleFromFilename = file.name.replace(/\.[^/.]+$/, "");
      form.setFieldValue("title", titleFromFilename);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            href="/service/resume"
            className="text-blue-600 hover:underline text-sm"
          >
            ← Back to Resumes
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-4">
            Upload Resume
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Upload your resume to get AI-powered feedback and suggestions
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload Your Resume</CardTitle>
            <CardDescription>
              Supported formats: PDF, DOCX, DOC (Max size: 5MB)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
              }}
            >
              {/* 파일 드래그 앤 드롭 영역 */}
              <form.Field
                name="file"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return "Please select a file";
                    }
                    const validation = uploadSchema.shape.file.safeParse(value);
                    if (!validation.success) {
                      return (
                        validation.error.issues[0]?.message || "Invalid file"
                      );
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={(e) => {
                        // 버튼이 아닌 영역을 클릭한 경우에만 파일 선택 다이얼로그 열기
                        if (
                          (e.target as HTMLElement).closest("button") === null
                        ) {
                          fileInputRef.current?.click();
                        }
                      }}
                      className={`
                        border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer
                        ${
                          isDragging
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-300 dark:border-gray-700 hover:border-blue-500"
                        }
                        ${field.state.meta.errors.length > 0 ? "border-red-500" : ""}
                      `}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          handleFileSelect(file);
                        }}
                      />
                      <Upload
                        className={`h-12 w-12 mx-auto mb-4 ${
                          isDragging ? "text-blue-600" : "text-gray-400"
                        }`}
                      />
                      <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {isDragging
                          ? "Drop your file here"
                          : "Drop your resume here or click to browse"}
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        PDF, DOCX, or DOC up to 5MB
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                      >
                        Choose File
                      </Button>
                    </div>

                    {/* 선택된 파일 표시 */}
                    {selectedFile && (
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(selectedFile.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedFile(null);
                            form.setFieldValue(
                              "file",
                              undefined as File | undefined
                            );
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {/* 에러 메시지 */}
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* 제목 입력 (선택사항) */}
              <form.Field name="title">
                {(field) => (
                  <div className="mt-6 space-y-2">
                    <Label htmlFor="title">Resume Title (Optional)</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Software Engineer Resume"
                      value={field.state.value || ""}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      Leave blank to use filename as title
                    </p>
                  </div>
                )}
              </form.Field>

              {/* 업로드 상태 표시 */}
              {uploadMutation.isPending && (
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Uploading...
                    </span>
                  </div>
                  <Progress value={undefined} className="h-2" />
                </div>
              )}

              {uploadMutation.isSuccess && (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Resume uploaded successfully! Redirecting...
                  </p>
                </div>
              )}

              {uploadMutation.isError && uploadMutation.error && (
                <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {uploadMutation.error instanceof Error
                      ? uploadMutation.error.message
                      : "An unexpected error occurred"}
                  </p>
                </div>
              )}

              {/* 제출 버튼 */}
              <div className="mt-6 flex justify-end">
                <Button
                  type="submit"
                  disabled={uploadMutation.isPending || !selectedFile}
                >
                  {uploadMutation.isPending ? "Uploading..." : "Upload Resume"}
                </Button>
              </div>
            </form>

            {/* 팁 섹션 */}
            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-gray-900 dark:text-white mb-1">
                    Tips for better results:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                    <li>Use a clear, well-formatted resume</li>
                    <li>Include relevant keywords for your target role</li>
                    <li>Ensure all text is selectable (not images)</li>
                    <li>Include contact information and work experience</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 템플릿 섹션 (기존 유지) */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold mb-4">Or start from a template</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  "Modern Professional",
                  "Creative Designer",
                  "Executive Leader",
                  "Tech Specialist",
                ].map((template) => (
                  <Card
                    key={template}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <CardContent className="pt-6">
                      <FileText className="h-8 w-8 text-blue-600 mb-2" />
                      <h4 className="font-medium mb-2">{template}</h4>
                      <Button variant="outline" size="sm" className="w-full">
                        Use Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
