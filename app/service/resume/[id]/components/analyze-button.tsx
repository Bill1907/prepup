"use client";

import { useState } from "react";
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
  const [analysisResult, setAnalysisResult] =
    useState<ResumeAnalysisData | null>(null);

  const handleAnalyze = async () => {
    if (!fileUrl) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Get presigned URL from API
      const response = await fetch("/api/files/presigned-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileKey: fileUrl }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get presigned URL: ${response.statusText}`);
      }

      const data = (await response.json()) as { presignedUrl: string };
      const presignedUrl = data.presignedUrl;
      console.log("[ANALYZE] Got presigned URL, sending to AI...");

      // Call server action with presigned URL
      const result = await analyzeResume(resumeId, presignedUrl);
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
