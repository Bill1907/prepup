import { gql } from "graphql-request";

// ============ Queries ============

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
      is_bookmarked
      created_at
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
      is_bookmarked
      created_at
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
      where: { clerk_user_id: { _eq: $userId }, category: { _eq: "behavioral" } }
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
      where: { clerk_user_id: { _eq: $userId }, category: { _eq: "leadership" } }
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
      is_bookmarked
      created_at
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

// ============ Types ============

export type QuestionCategory =
  | "behavioral"
  | "technical"
  | "system_design"
  | "leadership"
  | "problem_solving"
  | "company_specific";

export type QuestionDifficulty = "easy" | "medium" | "hard";

export interface Question {
  question_id: string;
  resume_id: string;
  question_text: string;
  category: QuestionCategory | null;
  difficulty: QuestionDifficulty | null;
  suggested_answer: string | null;
  tips: string | null;
  is_bookmarked: boolean;
  created_at: string;
}

export interface QuestionStats {
  total: { aggregate: { count: number } };
  bookmarked: { aggregate: { count: number } };
  behavioral: { aggregate: { count: number } };
  technical: { aggregate: { count: number } };
  system_design: { aggregate: { count: number } };
  leadership: { aggregate: { count: number } };
  problem_solving: { aggregate: { count: number } };
  company_specific: { aggregate: { count: number } };
}

export interface GetQuestionsResponse {
  interview_questions: Question[];
}

export interface GetQuestionStatsResponse extends QuestionStats {}

export interface CreateQuestionInput {
  question_id: string;
  resume_id: string;
  clerk_user_id: string;
  question_text: string;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  suggested_answer: string;
  tips: string;
}
