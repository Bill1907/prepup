"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2, AlertCircle } from "lucide-react";

interface FilePreviewNonPdfProps {
  fileUrl: string;
}

export function FilePreviewNonPdf({ fileUrl }: FilePreviewNonPdfProps) {
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
            errorData.error || `Failed to get presigned URL: ${response.statusText}`
          );
        }

        const data = await response.json();
        setPresignedUrl(data.presignedUrl);
      } catch (err) {
        console.error("[File Preview] Failed to get presigned URL:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load file preview. Please try again."
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
      <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading file...</p>
      </div>
    );
  }

  if (error && !presignedUrl) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        {presignedUrl && (
          <Button asChild>
            <a href={presignedUrl} download>
              <Download className="mr-2 h-4 w-4" />
              Download File
            </a>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-gray-50 dark:bg-gray-800">
      <FileText className="h-16 w-16 text-gray-400 mb-4" />
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Preview not available for this file type
      </p>
      {presignedUrl && (
        <Button asChild>
          <a href={presignedUrl} download>
            <Download className="mr-2 h-4 w-4" />
            Download File
          </a>
        </Button>
      )}
    </div>
  );
}

