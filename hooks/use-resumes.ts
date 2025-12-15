"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import {
  graphqlClient,
  GET_RESUMES,
  GET_RESUME_BY_ID,
  GET_RESUME_STATS,
  GET_RESUME_HISTORY,
  SOFT_DELETE_RESUME,
  UPDATE_RESUME,
  UPDATE_RESUME_ANALYSIS,
  CREATE_RESUME,
  ENSURE_USER_EXISTS,
  type GetResumesResponse,
  type GetResumeByIdResponse,
  type GetResumeStatsResponse,
  type GetResumeHistoryResponse,
  type CreateResumeResponse,
  type Resume,
} from "@/lib/graphql";
import { useUser } from "@clerk/nextjs";

// Query Keys
export const resumeKeys = {
  all: ["resumes"] as const,
  lists: () => [...resumeKeys.all, "list"] as const,
  list: (userId: string) => [...resumeKeys.lists(), userId] as const,
  details: () => [...resumeKeys.all, "detail"] as const,
  detail: (id: string) => [...resumeKeys.details(), id] as const,
  stats: (userId: string) => [...resumeKeys.all, "stats", userId] as const,
  history: (resumeId: string) =>
    [...resumeKeys.all, "history", resumeId] as const,
};

/**
 * 사용자의 이력서 목록 조회
 */
export function useResumes() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: resumeKeys.list(userId || ""),
    queryFn: async () => {
      if (!userId) throw new Error("Unauthorized");

      const data = await graphqlClient.request<GetResumesResponse>(
        GET_RESUMES,
        { userId }
      );
      return data.resumes;
    },
    enabled: !!userId,
    retry: false,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
}

/**
 * 특정 이력서 조회
 */
export function useResume(resumeId: string) {
  const { userId } = useAuth();

  return useQuery({
    queryKey: resumeKeys.detail(resumeId),
    queryFn: async () => {
      if (!userId) throw new Error("Unauthorized");

      const data = await graphqlClient.request<GetResumeByIdResponse>(
        GET_RESUME_BY_ID,
        { resumeId }
      );
      return data.resumes_by_pk;
    },
    enabled: !!userId && !!resumeId,
    retry: false,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
}

/**
 * 이력서 통계 조회
 */
export function useResumeStats() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: resumeKeys.stats(userId || ""),
    queryFn: async () => {
      if (!userId) throw new Error("Unauthorized");

      const data = await graphqlClient.request<GetResumeStatsResponse>(
        GET_RESUME_STATS,
        { userId }
      );

      return {
        total: data.total.aggregate.count,
        reviewed: data.reviewed.aggregate.count,
        avgScore: Math.round(data.reviewed.aggregate.avg?.score || 0),
      };
    },
    enabled: !!userId,
    retry: false,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
}

/**
 * 이력서 삭제 (Soft Delete)
 */
export function useDeleteResume() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (resumeId: string) => {
      await graphqlClient.request(SOFT_DELETE_RESUME, { resumeId });
      return resumeId;
    },
    onMutate: async (resumeId) => {
      // 이전 캐시 취소
      await queryClient.cancelQueries({
        queryKey: resumeKeys.list(userId || ""),
      });

      // 이전 데이터 스냅샷
      const previousResumes = queryClient.getQueryData<Resume[]>(
        resumeKeys.list(userId || "")
      );

      // Optimistic update
      queryClient.setQueryData<Resume[]>(
        resumeKeys.list(userId || ""),
        (old) => old?.filter((r) => r.resume_id !== resumeId) ?? []
      );

      return { previousResumes };
    },
    onError: (_err, _resumeId, context) => {
      // 롤백
      if (context?.previousResumes) {
        queryClient.setQueryData(
          resumeKeys.list(userId || ""),
          context.previousResumes
        );
      }
    },
    onSettled: () => {
      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: resumeKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: resumeKeys.stats(userId || ""),
      });
    },
  });
}

/**
 * 이력서 분석 결과 업데이트
 */
export function useUpdateResumeAnalysis() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async ({
      resumeId,
      aiFeedback,
      score,
    }: {
      resumeId: string;
      aiFeedback: Record<string, unknown>;
      score: number;
    }) => {
      await graphqlClient.request(UPDATE_RESUME_ANALYSIS, {
        resumeId,
        aiFeedback,
        score,
      });
      return { resumeId, aiFeedback, score };
    },
    onSuccess: (data) => {
      // 해당 이력서 캐시 업데이트
      queryClient.invalidateQueries({
        queryKey: resumeKeys.detail(data.resumeId),
      });
      queryClient.invalidateQueries({
        queryKey: resumeKeys.list(userId || ""),
      });
      queryClient.invalidateQueries({
        queryKey: resumeKeys.stats(userId || ""),
      });
      queryClient.invalidateQueries({
        queryKey: resumeKeys.history(data.resumeId),
      });
    },
  });
}

/**
 * 이력서 AI 리뷰 히스토리 조회
 */
export function useResumeHistory(resumeId: string) {
  const { userId } = useAuth();

  return useQuery({
    queryKey: resumeKeys.history(resumeId),
    queryFn: async () => {
      if (!userId) throw new Error("Unauthorized");

      const data = await graphqlClient.request<GetResumeHistoryResponse>(
        GET_RESUME_HISTORY,
        { resumeId, userId }
      );
      return data.resume_history;
    },
    enabled: !!userId && !!resumeId,
    retry: false,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
}

/**
 * 이력서 업로드 Mutation
 * Presigned URL 생성 -> R2 업로드 -> 메타데이터 저장의 전체 프로세스를 처리
 */
export function useUploadResume() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({ file, title }: { file: File; title?: string }) => {
      if (!userId) throw new Error("Unauthorized");

      // 1. Presigned URL 요청
      const presignedResponse = await fetch(
        "/api/resumes/upload/presigned-url",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
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
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to R2");
      }

      // 3. Ensure user exists in GraphQL database before creating resume
      // This prevents foreign key violations if Clerk webhook hasn't run yet
      const userEmail = user?.emailAddresses?.[0]?.emailAddress || null;
      try {
        await graphqlClient.request(ENSURE_USER_EXISTS, {
          userId,
          email: userEmail,
        });
      } catch (error) {
        // Ignore errors if user already exists (on_conflict handles it)
        console.warn("User sync warning:", error);
      }

      // 4. 업로드 완료 후 메타데이터 저장 (GraphQL)
      const resumeTitle =
        title?.trim() ||
        file.name.replace(/\.[^/.]+$/, "") ||
        "Untitled Resume";

      // Generate UUID for resume_id (required by schema)
      const resumeId = crypto.randomUUID();

      const data = await graphqlClient.request<CreateResumeResponse>(
        CREATE_RESUME,
        {
          resumeId,
          userId,
          title: resumeTitle,
          fileUrl: fileKey,
        }
      );

      if (!data.insert_resumes_one) {
        throw new Error("Failed to save metadata");
      }

      return {
        success: true,
        resume: data.insert_resumes_one,
        fileUrl: fileKey,
      };
    },
    onSuccess: () => {
      // 업로드 성공 후 관련 쿼리 무효화하여 자동 새로고침
      queryClient.invalidateQueries({ queryKey: resumeKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: resumeKeys.stats(userId || ""),
      });
    },
  });
}
