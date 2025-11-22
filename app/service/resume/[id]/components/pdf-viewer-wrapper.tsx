"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Loader2, AlertCircle } from "lucide-react";

const PdfViewerComponent = dynamic<PdfViewerProps>(
  () => import("./pdf-viewer").then((mod) => mod.PdfViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    ),
  }
);

interface PdfViewerWrapperProps {
  fileUrl: string;
  resumeId: string;
}

interface PdfViewerProps {
  url: string;
  resumeId: string;
}

export function PdfViewerWrapper({ fileUrl, resumeId }: PdfViewerWrapperProps) {
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPresignedUrl = async () => {
      if (!fileUrl) {
        setError("File URL is not available");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // API를 통해 presigned URL 가져오기
        const response = await fetch("/api/files/presigned-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fileKey: fileUrl }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            (errorData as { error?: string })?.error ||
              `Failed to get presigned URL: ${response.statusText}`
          );
        }

        const data = (await response.json()) as { presignedUrl: string };
        setPresignedUrl(data.presignedUrl);
      } catch (err) {
        console.error("[PDF Viewer] Failed to get presigned URL:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load PDF preview. Please try again."
        );
        // Fallback: API route 사용
        setPresignedUrl(`/api/files/${fileUrl}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPresignedUrl();
  }, [fileUrl]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error && !presignedUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-96 border rounded-lg bg-gray-50 dark:bg-gray-800 p-6">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <p className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Fallback URL을 사용합니다.
        </p>
      </div>
    );
  }

  if (!presignedUrl) {
    return (
      <div className="flex items-center justify-center h-96 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-400">
          PDF를 불러올 수 없습니다.
        </p>
      </div>
    );
  }

  return <PdfViewerComponent url={presignedUrl} resumeId={resumeId} />;
}
