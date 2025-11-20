"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";
import Link from "next/link";
import { PDFDocument, rgb } from "pdf-lib";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// pdfjs-dist 타입 선언
type PDFDocumentProxy = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PDFPageProxy>;
};

type PDFPageProxy = {
  getViewport: (options: { scale: number }) => Viewport;
  render: (context: RenderContext) => {
    promise: Promise<void>;
    cancel: () => void;
  };
  getTextContent: () => Promise<TextContent>;
};

type TextContent = {
  items: TextItem[];
};

type TextItem = {
  str: string;
  transform: number[]; // [scaleX, skewY, skewX, scaleY, translateX, translateY]
  width: number;
  height: number;
  fontName: string;
};

type Viewport = {
  width: number;
  height: number;
};

type RenderContext = {
  canvasContext: CanvasRenderingContext2D;
  viewport: Viewport;
};

// Extracted content types
type ExtractedTextItem = {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
  page: number;
};

type ExtractedImage = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  imageData: string; // base64 data URL
  originalIndex: number; // for pdf-lib reference
};

import { Button } from "@/components/ui/button";

import {
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText,
  Upload,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Coordinate conversion utilities (PDF uses bottom-left origin, web uses top-left)
function pdfToWebY(pdfY: number, pageHeight: number): number {
  return pageHeight - pdfY;
}

function webToPdfY(webY: number, pageHeight: number): number {
  return pageHeight - webY;
}

// Extract text content from PDF page
async function extractPdfContent(
  pdfjsDoc: PDFDocumentProxy,
  pageNumber: number
): Promise<{ textItems: ExtractedTextItem[] }> {
  const page = await pdfjsDoc.getPage(pageNumber);
  const textContent = await page.getTextContent();
  const viewport = page.getViewport({ scale: 1 });

  const textItems: ExtractedTextItem[] = textContent.items.map((item, idx) => ({
    id: `text-${pageNumber}-${idx}`,
    text: item.str,
    x: item.transform[4],
    y: viewport.height - item.transform[5], // Convert to top-left origin
    width: item.width,
    height: item.height,
    fontSize: item.transform[0],
    fontName: item.fontName,
    page: pageNumber,
  }));

  return { textItems };
}

// Extract images from PDF page (using pdf-lib)
async function extractImagesFromPdf(
  pdfDoc: PDFDocument,
  pageIndex: number
): Promise<ExtractedImage[]> {
  const images: ExtractedImage[] = [];

  try {
    const page = pdfDoc.getPage(pageIndex);
    // Note: pdf-lib doesn't have built-in image extraction API
    // For now, we'll return empty array and focus on text editing
    // Image extraction would require lower-level PDF parsing
    return images;
  } catch (error) {
    console.error("Error extracting images:", error);
    return images;
  }
}

// EditableTextInput component
function EditableTextInput({
  item,
  scale,
  onUpdate,
}: {
  item: ExtractedTextItem;
  scale: number;
  onUpdate: (id: string, newText: string) => void;
}) {
  return (
    <input
      type="text"
      value={item.text}
      onChange={(e) => onUpdate(item.id, e.target.value)}
      style={{
        position: "absolute",
        left: `${item.x * scale}px`,
        top: `${item.y * scale}px`,
        width: `${Math.max(item.width * scale, 50)}px`,
        height: `${item.height * scale}px`,
        fontSize: `${item.fontSize * scale}px`,
        fontFamily: "Arial, sans-serif",
        border: "1px solid transparent",
        background: "transparent",
        padding: "0",
        margin: "0",
        outline: "none",
      }}
      className="hover:border-blue-400 hover:bg-blue-50/30 focus:border-blue-600 focus:bg-white transition-colors"
    />
  );
}

// DraggableImage component
function DraggableImage({
  image,
  scale,
  onUpdate,
}: {
  image: ExtractedImage;
  scale: number;
  onUpdate: (id: string, updates: Partial<ExtractedImage>) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains("resize-handle")) {
      setIsResizing(true);
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: image.width,
        height: image.height,
      });
    } else {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - image.x * scale,
        y: e.clientY - image.y * scale,
      });
    }
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const newX = (e.clientX - dragStart.x) / scale;
      const newY = (e.clientY - dragStart.y) / scale;
      onUpdate(image.id, { x: newX, y: newY });
    } else if (isResizing) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      const newWidth = Math.max(20, resizeStart.width + deltaX / scale);
      const newHeight = Math.max(20, resizeStart.height + deltaY / scale);
      onUpdate(image.id, { width: newWidth, height: newHeight });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  return (
    <div
      style={{
        position: "absolute",
        left: `${image.x * scale}px`,
        top: `${image.y * scale}px`,
        width: `${image.width * scale}px`,
        height: `${image.height * scale}px`,
        cursor: isDragging ? "grabbing" : "grab",
      }}
      className="border-2 border-blue-400 hover:border-blue-600"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <img
        src={image.imageData}
        alt=""
        className="w-full h-full object-contain pointer-events-none"
        draggable={false}
      />
      {/* Resize handle */}
      <div
        className="resize-handle absolute bottom-0 right-0 w-4 h-4 bg-blue-600 cursor-se-resize"
        style={{ cursor: "se-resize" }}
      />
    </div>
  );
}

// 편집 폼 스키마
const editPdfSchema = z.object({
  changeReason: z.string(),
});

type EditPdfFormValues = z.infer<typeof editPdfSchema>;
type SaveStatus = "idle" | "saving" | "success" | "error";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditPdfPage({ params }: PageProps) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const [resumeId, setResumeId] = useState<string>("");
  const [resume, setResume] = useState<{
    title: string;
    fileUrl: string | null;
  } | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pdfjsDoc, setPdfjsDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [extractedTextItems, setExtractedTextItems] = useState<
    ExtractedTextItem[]
  >([]);
  const [extractedImages, setExtractedImages] = useState<ExtractedImage[]>([]);
  const [canvasScale, setCanvasScale] = useState(1);
  const [pageWidth, setPageWidth] = useState(0);
  const [pageHeight, setPageHeight] = useState(0);

  // Resume ID와 데이터 로드
  useEffect(() => {
    async function loadResume() {
      const resolvedParams = await params;
      const id = resolvedParams.id;
      setResumeId(id);

      try {
        const response = await fetch(`/api/resumes/${id}`);
        if (!response.ok) {
          throw new Error("Failed to load resume");
        }
        const data = (await response.json()) as {
          resume: {
            title: string;
            fileUrl: string | null;
          };
        };
        setResume(data.resume);

        // PDF 파일이 있으면 로드
        if (data.resume.fileUrl) {
          console.log("data.resume.fileUrl", data.resume.fileUrl);
          console.log(
            "data.resume.fileUrl",
            `resumes/user_35KqG67gFrk3NDW3wvTNm6pq8LD/1763198979676-.pdf`
          );
          await loadPdf(data.resume.fileUrl);
        } else {
          setLoadError("No PDF file found for this resume");
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error loading resume:", error);
        setLoadError("Failed to load resume");
        setIsLoading(false);
      }
    }
    loadResume();
  }, [params]);

  // PDF 로드 함수
  async function loadPdf(fileUrl: string) {
    try {
      setIsLoading(true);
      setLoadError(null);

      // 1. Presigned URL 요청
      const presignedResponse = await fetch("/api/files/presigned-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileUrl }),
      });

      if (!presignedResponse.ok) {
        const errorData = (await presignedResponse
          .json()
          .catch(() => ({}))) as {
          error?: string;
        };
        if (
          presignedResponse.status === 404 ||
          presignedResponse.status === 403
        ) {
          throw new Error(
            errorData.error ||
              `PDF file not found or access denied. File path: ${fileUrl}`
          );
        }
        throw new Error(
          errorData.error ||
            `Failed to generate presigned URL (${presignedResponse.status})`
        );
      }

      const { presignedUrl } = (await presignedResponse.json()) as {
        presignedUrl: string;
        expiresIn?: number;
      };

      // 2. Presigned URL로 직접 파일 가져오기
      const fileResponse = await fetch(presignedUrl);
      if (!fileResponse.ok) {
        if (fileResponse.status === 404) {
          throw new Error(
            `PDF file not found in storage. The file may have been deleted or the path is incorrect. File path: ${fileUrl}`
          );
        }
        throw new Error(
          `Failed to load PDF file from R2 (${fileResponse.status})`
        );
      }

      const arrayBuffer = await fileResponse.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // pdf-lib으로 PDF 로드 (편집용)
      const pdf = await PDFDocument.load(bytes);
      setPdfDoc(pdf);
      setPdfBytes(bytes);

      // pdfjs-dist로 PDF 로드 (렌더링용)
      // @ts-ignore - pdfjs-dist 타입이 설치 후 자동 인식됨
      const pdfjs = await import("pdfjs-dist");

      // Worker 설정: public 폴더의 worker 파일 사용
      // @ts-ignore - pdfjs-dist 타입이 설치 후 자동 인식됨
      if (
        typeof window !== "undefined" &&
        !pdfjs.GlobalWorkerOptions.workerSrc
      ) {
        // @ts-ignore - pdfjs-dist 타입이 설치 후 자동 인식됨
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      }

      // @ts-ignore - pdfjs-dist 타입이 설치 후 자동 인식됨
      const loadingTask = pdfjs.getDocument({ data: bytes });
      const pdfjsDocument =
        (await loadingTask.promise) as unknown as PDFDocumentProxy;
      setPdfjsDoc(pdfjsDocument);
      setCurrentPage(1);

      // PDF 미리보기 렌더링 및 컨텐츠 추출
      await renderPdfPreview(pdfjsDocument, 1);

      // Extract text content from first page
      const { textItems } = await extractPdfContent(pdfjsDocument, 1);
      setExtractedTextItems(textItems);

      // Extract images if available
      const images = await extractImagesFromPdf(pdf, 0);
      setExtractedImages(images);
    } catch (error) {
      console.error("Error loading PDF:", error);
      setLoadError(
        error instanceof Error ? error.message : "Failed to load PDF file"
      );
    } finally {
      setIsLoading(false);
    }
  }

  // PDF 미리보기 렌더링 (pdfjs-dist 사용)
  async function renderPdfPreview(
    pdfDoc: PDFDocumentProxy,
    pageNumber: number
  ) {
    if (!canvasRef.current) return;

    // 이전 렌더 작업 취소
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch (error) {
        // 취소 중 에러는 무시 (이미 완료된 작업일 수 있음)
      }
      renderTaskRef.current = null;
    }

    try {
      // 페이지 가져오기
      const page = await pdfDoc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.0 });

      // Canvas 설정 - 컨테이너 전체 크기에 맞춰 최대한 크게 스케일링
      const canvas = canvasRef.current;
      // 부모 컨테이너의 실제 너비 가져오기
      const container = canvasRef.current.parentElement;
      const containerWidth = container?.clientWidth || window.innerWidth - 32;
      const availableHeight = window.innerHeight - 180; // 상단 헤더, 카드 헤더, 여백 최소화

      // 가로/세로 비율을 모두 고려하여 최대 크기로 스케일링
      const scaleX = (containerWidth - 8) / viewport.width; // 최소한의 padding만
      const scaleY = (availableHeight - 8) / viewport.height;
      const scale = Math.min(scaleX, scaleY, 5.0); // 최대 5배까지 확대 가능

      const scaledViewport = page.getViewport({ scale });

      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;
      setCanvasScale(scale);
      setPageWidth(viewport.width);
      setPageHeight(viewport.height);

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Canvas 초기화
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // PDF 페이지 렌더링
      const renderContext = {
        canvasContext: ctx,
        viewport: scaledViewport,
      };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;

      await renderTask.promise;
      renderTaskRef.current = null;
    } catch (error) {
      // 취소된 작업은 에러로 처리하지 않음
      const isCancelled =
        error instanceof Error &&
        (error.name === "RenderingCancelledException" ||
          error.message?.includes("cancelled") ||
          error.message?.includes("cancel"));
      if (isCancelled) {
        renderTaskRef.current = null;
        return;
      }
      console.error("Error rendering PDF page:", error);
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.fillStyle = "#ff0000";
        ctx.font = "16px Arial";
        ctx.fillText("Error rendering PDF", 20, 30);
      }
      renderTaskRef.current = null;
    }
  }

  // 페이지 변경 핸들러
  useEffect(() => {
    if (pdfjsDoc && currentPage && pdfDoc) {
      const loadPageContent = async () => {
        await renderPdfPreview(pdfjsDoc, currentPage);

        // Extract text content for current page
        const { textItems } = await extractPdfContent(pdfjsDoc, currentPage);
        setExtractedTextItems(textItems);

        // Extract images for current page
        const images = await extractImagesFromPdf(pdfDoc, currentPage - 1);
        setExtractedImages(images);
      };

      loadPageContent();
    }
    // 컴포넌트 언마운트 시 진행 중인 렌더 작업 취소
    return () => {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (error) {
          // 무시
        }
        renderTaskRef.current = null;
      }
    };
  }, [pdfjsDoc, currentPage, pdfDoc]);

  // 윈도우 리사이즈 핸들러 - PDF 크기 재조정
  useEffect(() => {
    if (!pdfjsDoc) return;

    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      // 디바운싱: 리사이즈 이벤트가 너무 자주 발생하는 것을 방지
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (pdfjsDoc && currentPage) {
          renderPdfPreview(pdfjsDoc, currentPage);
        }
      }, 150);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
      // 컴포넌트 언마운트 시 진행 중인 렌더 작업 취소
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (error) {
          // 무시
        }
        renderTaskRef.current = null;
      }
    };
  }, [pdfjsDoc, currentPage]);

  // 텍스트 업데이트 핸들러
  function updateTextItem(id: string, newText: string) {
    setExtractedTextItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, text: newText } : item))
    );
  }

  // 이미지 업데이트 핸들러
  function updateImageItem(id: string, updates: Partial<ExtractedImage>) {
    setExtractedImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, ...updates } : img))
    );
  }

  // 편집 폼
  const editForm = useForm({
    defaultValues: {
      changeReason: "",
    },
    // @ts-expect-error - zodValidator 타입 이슈
    validatorAdapter: zodValidator(),
    validators: {
      onChange: editPdfSchema,
    },
    onSubmit: async ({ value }) => {
      if (!pdfDoc || !pdfBytes || !pdfjsDoc) {
        setSaveError("No PDF loaded");
        return;
      }

      try {
        setSaveStatus("saving");
        setSaveError(null);

        // Create new PDF by copying pages from original
        const modifiedPdf = await PDFDocument.create();
        const originalPdf = await PDFDocument.load(pdfBytes);
        const totalPages = originalPdf.getPageCount();

        // Copy each page and redraw with edited content
        for (let i = 0; i < totalPages; i++) {
          const [copiedPage] = await modifiedPdf.copyPages(originalPdf, [i]);
          modifiedPdf.addPage(copiedPage);

          const page = modifiedPdf.getPage(i);
          const pageHeight = page.getHeight();
          const pageWidth = page.getWidth();

          // Draw white rectangle to cover original content
          page.drawRectangle({
            x: 0,
            y: 0,
            width: pageWidth,
            height: pageHeight,
            color: rgb(1, 1, 1),
          });

          // Redraw edited text items for this page
          const pageTextItems = extractedTextItems.filter(
            (item) => item.page === i + 1
          );

          for (const item of pageTextItems) {
            if (!item.text.trim()) continue;

            // Convert web coordinates to PDF coordinates
            const pdfX = item.x;
            const pdfY = pageHeight - item.y - item.height;

            try {
              page.drawText(item.text, {
                x: pdfX,
                y: pdfY,
                size: item.fontSize,
                color: rgb(0, 0, 0),
              });
            } catch (error) {
              console.error("Error drawing text:", error);
              // Continue with other text items even if one fails
            }
          }

          // Redraw repositioned images for this page
          const pageImages = extractedImages.filter(
            (img) => img.page === i + 1
          );

          for (const img of pageImages) {
            try {
              // Convert base64 to bytes
              const imageDataUrl = img.imageData;
              if (imageDataUrl.startsWith("data:image/")) {
                const base64Data = imageDataUrl.split(",")[1];
                const imageBytes = Uint8Array.from(atob(base64Data), (c) =>
                  c.charCodeAt(0)
                );

                // Embed image (try PNG first, then JPEG)
                let embeddedImage;
                try {
                  embeddedImage = await modifiedPdf.embedPng(imageBytes);
                } catch {
                  embeddedImage = await modifiedPdf.embedJpg(imageBytes);
                }

                // Convert web coordinates to PDF coordinates
                const pdfX = img.x;
                const pdfY = pageHeight - img.y - img.height;

                page.drawImage(embeddedImage, {
                  x: pdfX,
                  y: pdfY,
                  width: img.width,
                  height: img.height,
                });
              }
            } catch (error) {
              console.error("Error drawing image:", error);
              // Continue with other images even if one fails
            }
          }
        }

        // 수정된 PDF를 바이트로 변환
        const modifiedBytes = await modifiedPdf.save();

        // File 객체로 변환
        const blob = new Blob([new Uint8Array(modifiedBytes)], {
          type: "application/pdf",
        });
        const file = new File([blob], "resume.pdf", {
          type: "application/pdf",
        });

        // 파일 크기 검증
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(
            `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`
          );
        }

        // 1. Presigned URL 요청
        const presignedResponse = await fetch(
          "/api/resumes/upload/presigned-url",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              filename: "resume.pdf",
              contentType: "application/pdf",
              fileSize: file.size,
            }),
          }
        );

        if (!presignedResponse.ok) {
          const errorData = (await presignedResponse.json()) as {
            error?: string;
          };
          throw new Error(errorData.error || "Failed to generate upload URL");
        }

        const { presignedUrl, fileKey } = (await presignedResponse.json()) as {
          presignedUrl: string;
          fileKey: string;
        };

        // 2. Presigned URL로 직접 파일 업로드
        const uploadResponse = await fetch(presignedUrl, {
          method: "PUT",
          headers: {
            "Content-Type": "application/pdf",
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload file to R2");
        }

        // 3. 파일 업데이트 API 호출
        const updateResponse = await fetch(`/api/resumes/${resumeId}/file`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileKey,
            changeReason: `Edited ${extractedTextItems.filter((item) => item.page === currentPage).length} text item(s)`,
          }),
        });

        if (!updateResponse.ok) {
          const errorData = (await updateResponse.json()) as {
            error?: string;
          };
          throw new Error(errorData.error || "Failed to update resume");
        }

        setSaveStatus("success");
        setTimeout(() => {
          router.push(`/service/resume/${resumeId}`);
        }, 1000);
      } catch (error) {
        setSaveStatus("error");
        setSaveError(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred"
        );
      }
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (loadError || !resume) {
    const isFileNotFound =
      loadError?.includes("not found") || loadError?.includes("File not found");

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href={`/service/resume/${resumeId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Resume
            </Link>
          </Button>
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {isFileNotFound ? "PDF File Not Found" : "Error Loading Resume"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {loadError || "Resume not found"}
              </p>
              {isFileNotFound && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    The PDF file for this resume could not be found in storage.
                    Please upload a new file to continue editing.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button asChild>
                      <Link href={`/service/resume/upload`}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload New File
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href={`/service/resume/${resumeId}`}>
                        Back to Resume Details
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full mx-auto px-2 sm:px-4 py-8">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild size="sm">
                <Link href={`/service/resume/${resumeId}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Edit PDF Resume
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-0.5 text-sm">
                  {resume.title}
                </p>
              </div>
            </div>
            {/* Save Button - 상단에 가볍게 배치 */}
            <div className="flex items-center gap-3">
              {saveStatus === "error" && saveError && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">{saveError}</span>
                </div>
              )}
              {saveStatus === "success" && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Saved!</span>
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  editForm.handleSubmit();
                }}
              >
                <Button
                  type="submit"
                  disabled={saveStatus === "saving" || !pdfDoc}
                  size="sm"
                >
                  {saveStatus === "saving" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>

        <div>
          {/* PDF Preview - 전체 너비 */}
          <div>
            <Card className="w-full">
              <CardHeader className="px-4 py-3">
                <CardTitle className="text-lg">PDF Preview</CardTitle>
                <CardDescription className="text-sm">
                  {pdfjsDoc
                    ? `Page ${currentPage} of ${pdfjsDoc.numPages}`
                    : pdfDoc
                      ? `${pdfDoc.getPageCount()} page(s)`
                      : "Loading PDF..."}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {pdfjsDoc ? (
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4 bg-white overflow-auto max-w-full">
                      <div
                        className="relative mx-auto"
                        style={{
                          width: `${pageWidth * canvasScale}px`,
                          height: `${pageHeight * canvasScale}px`,
                          minHeight: "600px",
                        }}
                      >
                        {/* Background PDF render (semi-transparent for reference) */}
                        <canvas
                          ref={canvasRef}
                          className="absolute inset-0 pointer-events-none opacity-30 border rounded"
                        />

                        {/* Editable text inputs */}
                        {extractedTextItems
                          .filter((item) => item.page === currentPage)
                          .map((item) => (
                            <EditableTextInput
                              key={item.id}
                              item={item}
                              scale={canvasScale}
                              onUpdate={updateTextItem}
                            />
                          ))}

                        {/* Draggable images */}
                        {extractedImages
                          .filter((img) => img.page === currentPage)
                          .map((img) => (
                            <DraggableImage
                              key={img.id}
                              image={img}
                              scale={canvasScale}
                              onUpdate={updateImageItem}
                            />
                          ))}
                      </div>
                    </div>

                    {/* Page navigation - outside PDF container */}
                    {pdfjsDoc.numPages > 1 && (
                      <div className="flex items-center justify-center gap-4 py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(1, prev - 1))
                          }
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Page {currentPage} of {pdfjsDoc.numPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(pdfjsDoc.numPages, prev + 1)
                            )
                          }
                          disabled={currentPage === pdfjsDoc.numPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                      <p>
                        <strong>How to edit:</strong> Click on any text field to
                        edit its content directly.
                        {extractedImages.length > 0 &&
                          " Drag images to reposition them, or use the resize handle in the bottom-right corner."}
                      </p>
                      <p className="text-xs">
                        The semi-transparent background shows the original PDF
                        for reference. Your edits will be saved when you click
                        "Save Changes".
                      </p>
                    </div>
                  </div>
                ) : pdfDoc ? (
                  <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-gray-50 dark:bg-gray-800">
                    <Loader2 className="h-16 w-16 text-gray-400 mb-4 animate-spin" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Rendering PDF...
                    </p>
                  </div>
                ) : loadError ? (
                  <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                    <AlertCircle className="h-16 w-16 text-yellow-500 mb-4" />
                    <p className="text-gray-900 dark:text-gray-100 font-medium mb-2">
                      PDF File Not Found
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
                      {loadError}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
                      Please upload a new PDF file to continue editing.
                    </p>
                    <Button asChild>
                      <Link href={`/service/resume/upload`}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload New File
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-gray-50 dark:bg-gray-800">
                    <FileText className="h-16 w-16 text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No PDF loaded
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
