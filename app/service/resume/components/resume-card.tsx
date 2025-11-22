"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Download, Clock, Star, MoreVertical, Trash2, Eye } from "lucide-react";
import { deleteResume } from "@/app/actions/resume-actions";
import { useRouter } from "next/navigation";

interface ResumeCardProps {
  resume: {
    id: string;
    name: string;
    status: "Reviewed" | "Draft";
    score: number;
    lastUpdated: string;
    version: number;
    feedback: string;
  };
}

export function ResumeCard({ resume }: ResumeCardProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteResume(resume.id);

      if (result.success) {
        setIsDeleteDialogOpen(false);
        router.refresh();
      } else {
        setError(result.error || "Failed to delete resume");
      }
    } catch (err) {
      console.error("Error deleting resume:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">{resume.name}</CardTitle>
                <CardDescription className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Updated {resume.lastUpdated}
                  </span>
                  <span>Version {resume.version}</span>
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={resume.status === "Reviewed" ? "default" : "outline"}>
                {resume.status}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/service/resume/${resume.id}`} className="cursor-pointer">
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/service/resume/${resume.id}/download`} className="cursor-pointer">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/service/resume/${resume.id}/history`} className="cursor-pointer">
                      <Clock className="mr-2 h-4 w-4" />
                      History
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {resume.score > 0 && (
            <>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">ATS Score</span>
                    <span className="text-sm font-bold">{resume.score}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        resume.score >= 90
                          ? "bg-green-500"
                          : resume.score >= 80
                          ? "bg-blue-500"
                          : "bg-yellow-500"
                      }`}
                      style={{ width: `${resume.score}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="h-5 w-5 fill-current" />
                  <span className="font-medium">{(resume.score / 20).toFixed(1)}</span>
                </div>
              </div>
            </>
          )}

          {resume.feedback && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>AI Feedback:</strong> {resume.feedback}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/service/resume/${resume.id}`}>View Details</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/service/resume/${resume.id}/download`}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/service/resume/${resume.id}/history`}>
                <Clock className="mr-2 h-4 w-4" />
                History
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 삭제 확인 Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Resume</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{resume.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

