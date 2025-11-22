"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Download,
  History,
  Upload,
  AlertCircle,
  Loader2,
  FileText,
  CheckCircle2,
} from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

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
  changeReason: z.string().min(3, "Please provide a reason for the update"),
});

interface ResumeActionsProps {
  resumeId: string;
  hasFile: boolean;
  isPdf: boolean;
}

export function ResumeActions({
  resumeId,
  hasFile,
  isPdf,
}: ResumeActionsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      file: undefined as File | undefined,
      changeReason: "",
    },
    onSubmit: async ({ value }) => {
      try {
        setUploadStatus("uploading");
        setUploadError(null);

        // Validate form data with Zod
        const validation = uploadSchema.safeParse(value);
        if (!validation.success) {
          const firstError = validation.error.issues[0];
          throw new Error(firstError.message);
        }

        if (!value.file) {
          throw new Error("Please select a file");
        }

        // 1. Get Presigned URL
        const presignedResponse = await fetch(
          "/api/resumes/upload/presigned-url",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              filename: value.file.name,
              contentType: value.file.type,
              fileSize: value.file.size,
            }),
          }
        );

        if (!presignedResponse.ok) {
          const errorData = (await presignedResponse.json().catch(() => ({}))) as { error?: string };
          throw new Error(
            errorData.error || "Failed to generate upload URL"
          );
        }

        const { presignedUrl, fileKey } = (await presignedResponse.json()) as { presignedUrl: string; fileKey: string };

        // 2. Upload file to R2
        const uploadResponse = await fetch(presignedUrl, {
          method: "PUT",
          headers: {
            "Content-Type": value.file.type,
          },
          body: value.file,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload file to storage");
        }

        // 3. Update Resume Record
        const updateResponse = await fetch(`/api/resumes/${resumeId}/file`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileKey,
            changeReason: value.changeReason,
          }),
        });

        if (!updateResponse.ok) {
          const errorData = (await updateResponse.json().catch(() => ({}))) as { error?: string };
          throw new Error(errorData.error || "Failed to update resume");
        }

        setUploadStatus("success");
        
        // Close dialog and refresh after a short delay
        setTimeout(() => {
          setIsOpen(false);
          setUploadStatus("idle");
          form.reset();
          router.refresh();
        }, 1500);

      } catch (error) {
        console.error("Upload error:", error);
        setUploadStatus("error");
        setUploadError(
          error instanceof Error ? error.message : "An unexpected error occurred"
        );
      }
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setFieldValue("file", file);
    }
  };

  return (
    <div className="space-y-2">
      <Button variant="default" className="w-full" asChild>
        <Link href={`/service/resume/${resumeId}/download`}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Link>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Upload className="mr-2 h-4 w-4" />
            Update Resume File
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Resume File</DialogTitle>
            <DialogDescription>
              Upload a new version of your resume. This will create a new history entry.
            </DialogDescription>
          </DialogHeader>
          
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4 py-4"
          >
            {/* File Input */}
            <form.Field
              name="file"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor="file">New Resume File (PDF, DOC, DOCX)</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="file"
                      type="file"
                      ref={fileInputRef}
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleFileSelect}
                      className="cursor-pointer"
                      disabled={uploadStatus === "uploading" || uploadStatus === "success"}
                    />
                  </div>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            />

            {/* Change Reason Input */}
            <form.Field
              name="changeReason"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor="changeReason">Reason for Update</Label>
                  <Input
                    id="changeReason"
                    placeholder="e.g., Updated work experience, Added new skills"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    disabled={uploadStatus === "uploading" || uploadStatus === "success"}
                  />
                   {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            />

            {/* Status Messages */}
            {uploadStatus === "error" && uploadError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadStatus === "success" && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Resume updated successfully!</span>
              </div>
            )}

            <DialogFooter className="sm:justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsOpen(false)}
                disabled={uploadStatus === "uploading" || uploadStatus === "success"}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={uploadStatus === "uploading" || uploadStatus === "success"}
              >
                {uploadStatus === "uploading" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Update File"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Button variant="outline" className="w-full" asChild>
        <Link href={`/service/resume/${resumeId}/history`}>
          <History className="mr-2 h-4 w-4" />
          View History
        </Link>
      </Button>
    </div>
  );
}

