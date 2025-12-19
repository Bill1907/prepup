"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import {
  graphqlClient,
  GET_QUESTIONS,
  GET_QUESTIONS_BY_RESUME,
  GET_QUESTION_STATS,
  GET_BOOKMARKED_QUESTIONS,
  TOGGLE_BOOKMARK,
  DELETE_QUESTION,
  CREATE_QUESTIONS,
  type GetQuestionsResponse,
  type GetQuestionStatsResponse,
  type Question,
  type CreateQuestionInput,
} from "@/lib/graphql";

// Query Keys
export const questionKeys = {
  all: ["questions"] as const,
  lists: () => [...questionKeys.all, "list"] as const,
  list: (userId: string) => [...questionKeys.lists(), userId] as const,
  byResume: (resumeId: string) =>
    [...questionKeys.all, "resume", resumeId] as const,
  bookmarked: (userId: string) =>
    [...questionKeys.all, "bookmarked", userId] as const,
  stats: (userId: string) => [...questionKeys.all, "stats", userId] as const,
};

/**
 * 사용자의 모든 질문 조회
 */
export function useQuestions() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: questionKeys.list(userId || ""),
    queryFn: async () => {
      if (!userId) throw new Error("Unauthorized");

      const data = await graphqlClient.request<GetQuestionsResponse>(
        GET_QUESTIONS,
        { userId }
      );
      return data.interview_questions;
    },
    enabled: !!userId,
    retry: false,
    staleTime: 30000, // 30초 동안 fresh로 간주
    refetchOnWindowFocus: false,
  });
}

/**
 * 특정 이력서의 질문 조회
 */
export function useQuestionsByResume(resumeId: string) {
  const { userId } = useAuth();

  return useQuery({
    queryKey: questionKeys.byResume(resumeId),
    queryFn: async () => {
      if (!userId) throw new Error("Unauthorized");

      const data = await graphqlClient.request<GetQuestionsResponse>(
        GET_QUESTIONS_BY_RESUME,
        { resumeId, userId }
      );
      return data.interview_questions;
    },
    enabled: !!userId && !!resumeId,
    retry: false,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
}

/**
 * 북마크된 질문 조회
 */
export function useBookmarkedQuestions() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: questionKeys.bookmarked(userId || ""),
    queryFn: async () => {
      if (!userId) throw new Error("Unauthorized");

      const data = await graphqlClient.request<GetQuestionsResponse>(
        GET_BOOKMARKED_QUESTIONS,
        { userId }
      );
      return data.interview_questions;
    },
    enabled: !!userId,
    retry: false,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
}

/**
 * 질문 통계 조회
 */
export function useQuestionStats() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: questionKeys.stats(userId || ""),
    queryFn: async () => {
      if (!userId) throw new Error("Unauthorized");

      const data = await graphqlClient.request<GetQuestionStatsResponse>(
        GET_QUESTION_STATS,
        { userId }
      );

      return {
        total: data.total.aggregate?.count ?? 0,
        bookmarked: data.bookmarked.aggregate?.count ?? 0,
        byCategory: {
          behavioral: data.behavioral.aggregate?.count ?? 0,
          technical: data.technical.aggregate?.count ?? 0,
          system_design: data.system_design.aggregate?.count ?? 0,
          leadership: data.leadership.aggregate?.count ?? 0,
          problem_solving: data.problem_solving.aggregate?.count ?? 0,
          company_specific: data.company_specific.aggregate?.count ?? 0,
        },
      };
    },
    enabled: !!userId,
    retry: false,
    staleTime: 60000, // 통계는 1분 동안 캐시
    refetchOnWindowFocus: false,
  });
}

/**
 * 북마크 토글
 */
export function useToggleBookmark() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async ({
      questionId,
      isBookmarked,
    }: {
      questionId: string;
      isBookmarked: boolean;
    }) => {
      await graphqlClient.request(TOGGLE_BOOKMARK, {
        questionId,
        isBookmarked: !isBookmarked, // 토글
      });
      return { questionId, newState: !isBookmarked };
    },
    onMutate: async ({ questionId, isBookmarked }) => {
      await queryClient.cancelQueries({
        queryKey: questionKeys.list(userId || ""),
      });

      const previousQuestions = queryClient.getQueryData<Question[]>(
        questionKeys.list(userId || "")
      );

      // Optimistic update
      queryClient.setQueryData<Question[]>(
        questionKeys.list(userId || ""),
        (old) =>
          old?.map((q) =>
            q.question_id === questionId
              ? { ...q, is_bookmarked: !isBookmarked }
              : q
          ) ?? []
      );

      return { previousQuestions };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousQuestions) {
        queryClient.setQueryData(
          questionKeys.list(userId || ""),
          context.previousQuestions
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: questionKeys.bookmarked(userId || ""),
      });
      queryClient.invalidateQueries({
        queryKey: questionKeys.stats(userId || ""),
      });
    },
  });
}

/**
 * 질문 삭제
 */
export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (questionId: string) => {
      await graphqlClient.request(DELETE_QUESTION, { questionId });
      return questionId;
    },
    onMutate: async (questionId) => {
      await queryClient.cancelQueries({
        queryKey: questionKeys.list(userId || ""),
      });

      const previousQuestions = queryClient.getQueryData<Question[]>(
        questionKeys.list(userId || "")
      );

      // Optimistic update
      queryClient.setQueryData<Question[]>(
        questionKeys.list(userId || ""),
        (old) => old?.filter((q) => q.question_id !== questionId) ?? []
      );

      return { previousQuestions };
    },
    onError: (_err, _questionId, context) => {
      if (context?.previousQuestions) {
        queryClient.setQueryData(
          questionKeys.list(userId || ""),
          context.previousQuestions
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: questionKeys.stats(userId || ""),
      });
    },
  });
}

/**
 * 질문 일괄 생성
 */
export function useCreateQuestions() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (questions: CreateQuestionInput[]) => {
      const result = await graphqlClient.request<{
        insert_interview_questions: {
          affected_rows: number;
          returning: Question[];
        };
      }>(CREATE_QUESTIONS, { objects: questions });
      return result.insert_interview_questions;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: questionKeys.stats(userId || ""),
      });
    },
  });
}
