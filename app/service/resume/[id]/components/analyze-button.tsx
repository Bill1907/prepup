"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { analyzeResume } from "@/app/actions/resume-actions";

interface ResumeAnalysisData {
  summary: string;
  score: number;
  strengths: string[];
  improvements: string[];
}

interface AnalyzeButtonProps {
  resumeId: string;
  fileUrl: string | null;
  isPdf: boolean;
  disabled?: boolean;
}

export function AnalyzeButton({
  resumeId,
  fileUrl,
  isPdf,
  disabled = false,
}: AnalyzeButtonProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workerReady, setWorkerReady] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] =
    useState<ResumeAnalysisData | null>(null);

  // Configure PDF.js worker on client side only, before using PDF.js
  useEffect(() => {
    if (typeof window === "undefined") return;

    const configureWorker = async () => {
      try {
        const { pdfjs } = await import("react-pdf");

        // ✅ react-pdf가 의존하는 pdfjs-dist 버전에서 worker 파일을 직접 가져옴
        if (!pdfjs.GlobalWorkerOptions.workerSrc) {
          pdfjs.GlobalWorkerOptions.workerSrc = new URL(
            "pdfjs-dist/build/pdf.worker.min.mjs",
            import.meta.url
          ).toString();
        }

        console.log(
          "[ANALYZE] pdfjs version:",
          pdfjs.version,
          "workerSrc:",
          pdfjs.GlobalWorkerOptions.workerSrc
        );
        setWorkerReady(true);
      } catch (error) {
        console.error("[ANALYZE] Failed to configure worker:", error);
        // Still set workerReady to true to allow retry
        setWorkerReady(true);
      }
    };

    configureWorker();
  }, []);

  const handleAnalyze = async () => {
    if (!fileUrl) return;

    // Wait for worker to be ready
    if (!workerReady) {
      setError(
        "PDF worker is not ready yet. Please wait a moment and try again."
      );
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      let text = "";

      if (isPdf) {
        // Get presigned URL from API
        let pdfUrl: string;
        try {
          const response = await fetch("/api/files/presigned-url", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ fileKey: fileUrl }),
          });

          if (!response.ok) {
            throw new Error(
              `Failed to get presigned URL: ${response.statusText}`
            );
          }

          const data = (await response.json()) as { presignedUrl: string };
          pdfUrl = (data as { presignedUrl: string }).presignedUrl;
          console.log("[ANALYZE] Using presigned URL from API");
        } catch (presignedError) {
          console.warn(
            "[ANALYZE] Failed to get presigned URL, using API route:",
            presignedError
          );
          // Fallback: API route 사용
          pdfUrl = `/api/files/${fileUrl}`;
        }

        try {
          // Dynamically import pdfjs to avoid SSR issues with DOMMatrix
          const { pdfjs } = await import("react-pdf");

          // Worker should already be configured from useEffect, but double-check
          if (
            typeof window !== "undefined" &&
            !pdfjs.GlobalWorkerOptions.workerSrc
          ) {
            pdfjs.GlobalWorkerOptions.workerSrc = new URL(
              "pdfjs-dist/build/pdf.worker.min.mjs",
              import.meta.url
            ).toString();
          }

          console.log(
            "[ANALYZE] pdfjs version:",
            pdfjs.version,
            "workerSrc:",
            pdfjs.GlobalWorkerOptions.workerSrc
          );
          console.log("[ANALYZE] Loading PDF from:", pdfUrl);

          // Configure PDF.js with proper CORS handling for presigned URLs
          const loadingTask = pdfjs.getDocument({
            url: pdfUrl,
            httpHeaders: {
              // Add headers that might be needed for CORS
            },
            withCredentials: false,
            // Disable range requests if CORS is an issue
            disableAutoFetch: false,
            disableStream: false,
          });

          const pdf = await loadingTask.promise;
          console.log(
            "[ANALYZE] PDF loaded successfully, pages:",
            pdf.numPages
          );

          let fullText = "";

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              // @ts-ignore - item.str exists in TextItem
              .map((item) => item.str)
              .join(" ");
            fullText += pageText + "\n";
          }

          console.log("[ANALYZE] Extracted text length:", fullText.length);
          text = fullText;
        } catch (pdfError: unknown) {
          // Better error logging
          const errorMessage =
            pdfError instanceof Error ? pdfError.message : String(pdfError);
          const errorStack =
            pdfError instanceof Error ? pdfError.stack : undefined;
          const errorName =
            pdfError instanceof Error ? pdfError.name : "Unknown";

          console.error("[ANALYZE] PDF Extraction Error:", {
            name: errorName,
            message: errorMessage,
            stack: errorStack,
            fileUrl: fileUrl,
            pdfUrl: pdfUrl,
            errorObject: pdfError,
          });

          // More specific error messages
          if (
            errorMessage.includes("CORS") ||
            errorMessage.includes("cross-origin")
          ) {
            throw new Error(
              "CORS error: PDF file cannot be accessed. Please check R2 CORS settings in Cloudflare Dashboard."
            );
          } else if (
            errorMessage.includes("404") ||
            errorMessage.includes("not found") ||
            errorMessage.includes("Failed to fetch")
          ) {
            throw new Error(
              "PDF file not found or inaccessible. Please check if the file exists and try again."
            );
          } else if (
            errorMessage.includes("worker") ||
            errorMessage.includes("Worker")
          ) {
            throw new Error(
              "PDF worker failed to load. Please refresh the page."
            );
          } else if (errorMessage.includes("Invalid PDF")) {
            throw new Error(
              "Invalid PDF file. Please upload a valid PDF file."
            );
          }

          throw new Error(`Failed to read PDF file: ${errorMessage}`);
        }
      } else {
        // For non-PDF files, we proceed with empty text.
        // The server might have alternative ways or just analyze based on metadata/title if needed,
        // but really we need text.
        // For now, let's just warn or proceed.
        // User requirement was "worker ai to read...".
        console.warn("Non-PDF file, text extraction skipped on client.");
      }

      const result = await analyzeResume(resumeId, text);
      console.log("[ANALYZE] Analysis result:", result);

      if (result.success && result.analysis) {
        setAnalysisResult(result.analysis);
      } else {
        setError(result.error || "Failed to analyze resume");
      }
    } catch (error) {
      console.error("[ANALYZE] Analysis error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during analysis"
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <Button
        onClick={handleAnalyze}
        disabled={isAnalyzing || !fileUrl || disabled}
        className="w-full"
        variant="default"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Analyze Resume
          </>
        )}
      </Button>

      {error && (
        <div className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {analysisResult && (
        <div className="space-y-4 p-4 border rounded-lg bg-card">
          {/* Score */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Resume Score</h3>
            <div className="flex items-center gap-2">
              <div
                className={`text-2xl font-bold ${
                  analysisResult.score >= 80
                    ? "text-green-600"
                    : analysisResult.score >= 60
                      ? "text-yellow-600"
                      : "text-red-600"
                }`}
              >
                {analysisResult.score}
              </div>
              <span className="text-sm text-muted-foreground">/ 100</span>
            </div>
          </div>

          {/* Summary */}
          <div>
            <h4 className="font-semibold mb-2">Professional Summary</h4>
            <p className="text-sm text-muted-foreground">
              {analysisResult.summary}
            </p>
          </div>

          {/* Strengths */}
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Key Strengths
            </h4>
            <ul className="space-y-1">
              {analysisResult.strengths.map((strength, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  • {strength}
                </li>
              ))}
            </ul>
          </div>

          {/* Areas for Improvement */}
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              Areas for Improvement
            </h4>
            <ul className="space-y-1">
              {analysisResult.improvements.map((improvement, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  • {improvement}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
