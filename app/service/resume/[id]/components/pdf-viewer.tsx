"use client";

import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from "lucide-react";

// Correct import paths for react-pdf styles
// In recent versions, these are available directly from dist/Page
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

if (typeof window !== "undefined") {
  // ✅ react-pdf가 의존하는 pdfjs-dist 버전에서 worker 파일을 직접 가져옴
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  console.log(
    "[PDF Viewer] pdfjs version:",
    pdfjs.version,
    "workerSrc:",
    pdfjs.GlobalWorkerOptions.workerSrc
  );
}

interface PdfViewerProps {
  url: string;
  resumeId: string;
}

export function PdfViewer({ url, resumeId }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setIsLoading(false);
    setLoadError(null);
  }

  function onDocumentLoadError(error: Error) {
    console.error("Error loading PDF:", error);
    let message = "Failed to load PDF file.";
    if (error.message?.includes("Unexpected server response (404)")) {
      message = "PDF 파일을 찾을 수 없습니다. 이력서를 새로 업로드해 주세요.";
    }
    setLoadError(message);
    setIsLoading(false);
  }

  // Reset state when URL changes
  useEffect(() => {
    setIsLoading(true);
    setLoadError(null);
    setNumPages(null);
    setPageNumber(1);
  }, [url]);

  // Handle resize to fit container
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Calculate optimal width
  const pdfWidth = containerWidth ? containerWidth - 32 : undefined; // -32 for padding
  const errorDescription =
    loadError ??
    "Failed to load PDF file. Please try again or upload a new version.";

  return (
    <div
      className="flex flex-col items-center space-y-4 w-full"
      ref={containerRef}
    >
      <div className="relative border rounded-lg shadow-sm overflow-hidden bg-white dark:bg-gray-800 min-h-[200px] w-full flex justify-center">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex items-center justify-center h-96 w-full">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center gap-4 text-center h-96 w-full px-6">
              <p className="text-sm text-red-500">{errorDescription}</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button asChild size="sm">
                  <Link href={`/service/resume/${resumeId}/download`}>
                    PDF 다운로드 시도
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/service/resume/upload`}>새 파일 업로드</Link>
                </Button>
              </div>
            </div>
          }
          className="max-w-full"
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            width={pdfWidth}
            rotate={rotation}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="shadow-md"
          />
        </Document>
      </div>

      {numPages && !loadError && (
        <div className="flex items-center justify-between w-full max-w-md bg-white dark:bg-gray-800 p-2 rounded-lg border shadow-sm">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              disabled={pageNumber <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {pageNumber} / {numPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
              disabled={pageNumber >= numPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-2 border-l pl-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              title="Rotate"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setScale((s) => Math.min(3, s + 0.1))}
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
