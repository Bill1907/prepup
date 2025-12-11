"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function DownloadResumePage({ params }: PageProps) {
  const router = useRouter();

  useEffect(() => {
    async function downloadResume() {
      const resolvedParams = await params;
      const resumeId = resolvedParams.id;

      try {
        const response = await fetch(`/api/resumes/${resumeId}/download`);

        if (!response.ok) {
          throw new Error("Failed to download resume");
        }

        // 파일 다운로드
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;

        // Content-Disposition 헤더에서 파일명 추출
        const contentDisposition = response.headers.get("Content-Disposition");
        let filename = "resume.pdf";
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        // 다운로드 후 상세 페이지로 리다이렉트
        router.push(`/service/resume/${resumeId}`);
      } catch (error) {
        console.error("Error downloading resume:", error);
        router.push(`/service/resume/${resumeId}`);
      }
    }

    downloadResume();
  }, [params, router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          Preparing download...
        </p>
      </div>
    </div>
  );
}
