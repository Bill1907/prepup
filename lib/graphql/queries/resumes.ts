import { gql } from "graphql-request";

// ============ Queries ============

export const GET_RESUMES = gql`
  query GetResumes($userId: String!) {
    resumes(
      where: { clerk_user_id: { _eq: $userId }, is_active: { _eq: true } }
      order_by: { created_at: desc }
    ) {
      resume_id
      title
      content
      version
      is_active
      file_url
      ai_feedback
      score
      created_at
      updated_at
    }
  }
`;

export const GET_RESUME_BY_ID = gql`
  query GetResumeById($resumeId: String!, $userId: String!) {
    resumes_by_pk(resume_id: $resumeId) {
      resume_id
      clerk_user_id
      title
      content
      version
      is_active
      file_url
      ai_feedback
      score
      created_at
      updated_at
    }
  }
`;

export const GET_RESUME_STATS = gql`
  query GetResumeStats($userId: String!) {
    total: resumes_aggregate(
      where: { clerk_user_id: { _eq: $userId }, is_active: { _eq: true } }
    ) {
      aggregate {
        count
      }
    }
    reviewed: resumes_aggregate(
      where: {
        clerk_user_id: { _eq: $userId }
        is_active: { _eq: true }
        score: { _is_null: false }
      }
    ) {
      aggregate {
        count
        avg {
          score
        }
      }
    }
  }
`;

export const GET_RESUME_HISTORY = gql`
  query GetResumeHistory($resumeId: String!, $userId: String!) {
    resume_history(
      where: {
        resume_id: { _eq: $resumeId }
        clerk_user_id: { _eq: $userId }
        ai_feedback: { _is_null: false }
      }
      order_by: { created_at: desc }
    ) {
      history_id
      resume_id
      clerk_user_id
      version
      ai_feedback
      score
      created_at
    }
  }
`;

// ============ Mutations ============

export const UPDATE_RESUME = gql`
  mutation UpdateResume(
    $resumeId: String!
    $title: String
    $content: String
    $aiFeedback: String
    $score: Int
  ) {
    update_resumes_by_pk(
      pk_columns: { resume_id: $resumeId }
      _set: {
        title: $title
        content: $content
        ai_feedback: $aiFeedback
        score: $score
      }
    ) {
      resume_id
      title
      score
      ai_feedback
      updated_at
    }
  }
`;

export const SOFT_DELETE_RESUME = gql`
  mutation SoftDeleteResume($resumeId: String!) {
    update_resumes_by_pk(
      pk_columns: { resume_id: $resumeId }
      _set: { is_active: false }
    ) {
      resume_id
      is_active
    }
  }
`;

export const CREATE_RESUME = gql`
  mutation CreateResume(
    $resumeId: String!
    $userId: String!
    $title: String!
    $fileUrl: String
  ) {
    insert_resumes_one(
      object: {
        resume_id: $resumeId
        clerk_user_id: $userId
        title: $title
        file_url: $fileUrl
      }
    ) {
      resume_id
      clerk_user_id
      title
      file_url
      version
      is_active
      created_at
      updated_at
    }
  }
`;

// ============ Types ============

export interface Resume {
  resume_id: string;
  clerk_user_id: string;
  title: string;
  content: string | null;
  version: number;
  is_active: boolean;
  file_url: string | null;
  ai_feedback: string | null;
  score: number | null;
  created_at: string;
  updated_at: string;
}

export interface ResumeStats {
  total: { aggregate: { count: number } };
  reviewed: { aggregate: { count: number; avg: { score: number | null } } };
}

export interface GetResumesResponse {
  resumes: Resume[];
}

export interface GetResumeByIdResponse {
  resumes_by_pk: Resume | null;
}

export interface GetResumeStatsResponse {
  total: { aggregate: { count: number } };
  reviewed: { aggregate: { count: number; avg: { score: number | null } } };
}

export interface ResumeHistoryItem {
  history_id: string;
  resume_id: string;
  clerk_user_id: string;
  version: number;
  ai_feedback: string | null;
  score: number | null;
  created_at: string;
}

export interface GetResumeHistoryResponse {
  resume_history: ResumeHistoryItem[];
}

export interface CreateResumeResponse {
  insert_resumes_one: Resume | null;
}
