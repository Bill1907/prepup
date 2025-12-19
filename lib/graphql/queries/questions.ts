import { gql } from "graphql-request";

// Re-export typed documents and types from generated code
export {
  GetQuestionsDocument,
  GetQuestionsByResumeDocument,
  GetQuestionStatsDocument,
  GetBookmarkedQuestionsDocument,
  GetQuestionByIdDocument,
  ToggleBookmarkDocument,
  DeleteQuestionDocument,
  CreateQuestionsDocument,
} from "../__generated__/graphql";

export type {
  GetQuestionsQuery,
  GetQuestionsQueryVariables,
  GetQuestionsByResumeQuery,
  GetQuestionsByResumeQueryVariables,
  GetQuestionStatsQuery,
  GetQuestionStatsQueryVariables,
  GetBookmarkedQuestionsQuery,
  GetBookmarkedQuestionsQueryVariables,
  GetQuestionByIdQuery,
  GetQuestionByIdQueryVariables,
  ToggleBookmarkMutation,
  ToggleBookmarkMutationVariables,
  DeleteQuestionMutation,
  DeleteQuestionMutationVariables,
  CreateQuestionsMutation,
  CreateQuestionsMutationVariables,
  Interview_Questions_Insert_Input,
} from "../__generated__/graphql";

// ============ Queries (for backward compatibility) ============

export const GET_QUESTIONS = gql`
  query GetQuestions($userId: String!) {
    interview_questions(
      where: { clerk_user_id: { _eq: $userId } }
      order_by: { created_at: desc }
    ) {
      question_id
      resume_id
      question_text
      category
      difficulty
      suggested_answer
      tips
      tags
      is_bookmarked
      created_at
      clerk_user_id
    }
  }
`;

export const GET_QUESTIONS_BY_RESUME = gql`
  query GetQuestionsByResume($resumeId: String!, $userId: String!) {
    interview_questions(
      where: { resume_id: { _eq: $resumeId }, clerk_user_id: { _eq: $userId } }
      order_by: { created_at: desc }
    ) {
      question_id
      resume_id
      question_text
      category
      difficulty
      suggested_answer
      tips
      tags
      is_bookmarked
      created_at
      clerk_user_id
    }
  }
`;

export const GET_QUESTION_STATS = gql`
  query GetQuestionStats($userId: String!) {
    total: interview_questions_aggregate(
      where: { clerk_user_id: { _eq: $userId } }
    ) {
      aggregate {
        count
      }
    }
    bookmarked: interview_questions_aggregate(
      where: { clerk_user_id: { _eq: $userId }, is_bookmarked: { _eq: true } }
    ) {
      aggregate {
        count
      }
    }
    behavioral: interview_questions_aggregate(
      where: {
        clerk_user_id: { _eq: $userId }
        category: { _eq: "behavioral" }
      }
    ) {
      aggregate {
        count
      }
    }
    technical: interview_questions_aggregate(
      where: { clerk_user_id: { _eq: $userId }, category: { _eq: "technical" } }
    ) {
      aggregate {
        count
      }
    }
    system_design: interview_questions_aggregate(
      where: {
        clerk_user_id: { _eq: $userId }
        category: { _eq: "system_design" }
      }
    ) {
      aggregate {
        count
      }
    }
    leadership: interview_questions_aggregate(
      where: {
        clerk_user_id: { _eq: $userId }
        category: { _eq: "leadership" }
      }
    ) {
      aggregate {
        count
      }
    }
    problem_solving: interview_questions_aggregate(
      where: {
        clerk_user_id: { _eq: $userId }
        category: { _eq: "problem_solving" }
      }
    ) {
      aggregate {
        count
      }
    }
    company_specific: interview_questions_aggregate(
      where: {
        clerk_user_id: { _eq: $userId }
        category: { _eq: "company_specific" }
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

export const GET_BOOKMARKED_QUESTIONS = gql`
  query GetBookmarkedQuestions($userId: String!) {
    interview_questions(
      where: { clerk_user_id: { _eq: $userId }, is_bookmarked: { _eq: true } }
      order_by: { created_at: desc }
    ) {
      question_id
      resume_id
      question_text
      category
      difficulty
      suggested_answer
      tips
      tags
      is_bookmarked
      created_at
      clerk_user_id
    }
  }
`;

export const GET_QUESTION_BY_ID = gql`
  query GetQuestionById($questionId: String!) {
    interview_questions_by_pk(question_id: $questionId) {
      question_id
      resume_id
      question_text
      category
      difficulty
      suggested_answer
      tips
      tags
      is_bookmarked
      created_at
      clerk_user_id
    }
  }
`;

// ============ Mutations ============

export const TOGGLE_BOOKMARK = gql`
  mutation ToggleBookmark($questionId: String!, $isBookmarked: Boolean!) {
    update_interview_questions_by_pk(
      pk_columns: { question_id: $questionId }
      _set: { is_bookmarked: $isBookmarked }
    ) {
      question_id
      is_bookmarked
    }
  }
`;

export const DELETE_QUESTION = gql`
  mutation DeleteQuestion($questionId: String!) {
    delete_interview_questions_by_pk(question_id: $questionId) {
      question_id
    }
  }
`;

export const CREATE_QUESTIONS = gql`
  mutation CreateQuestions($objects: [interview_questions_insert_input!]!) {
    insert_interview_questions(objects: $objects) {
      affected_rows
      returning {
        question_id
        question_text
        category
      }
    }
  }
`;

// ============ Legacy Type Aliases (for backward compatibility) ============
// These map the old manually-defined types to the generated ones

import type {
  GetQuestionsQuery,
  GetQuestionStatsQuery,
  GetQuestionByIdQuery,
  Interview_Questions_Insert_Input
} from "../__generated__/graphql";

// Keep business-logic category/difficulty types for type safety in app code
export type QuestionCategory =
  | "behavioral"
  | "technical"
  | "system_design"
  | "leadership"
  | "problem_solving"
  | "company_specific";

export type QuestionDifficulty = "easy" | "medium" | "hard";

// Question type derived from query result
export type Question = NonNullable<GetQuestionsQuery["interview_questions"]>[number];

// Stats type
export type QuestionStats = GetQuestionStatsQuery;

// Response types for backward compatibility
export type GetQuestionsResponse = GetQuestionsQuery;
export type GetQuestionStatsResponse = GetQuestionStatsQuery;
export type GetQuestionByIdResponse = GetQuestionByIdQuery;

// Input type for creating questions
export type CreateQuestionInput = Interview_Questions_Insert_Input;
