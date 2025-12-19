import { gql } from "graphql-request";

// Re-export typed documents and types from generated code
export {
  GetResumesDocument,
  GetResumeByIdDocument,
  GetResumeStatsDocument,
  GetResumeHistoryDocument,
  GetResumeHistoryAllDocument,
  EnsureUserExistsDocument,
  UpdateResumeDocument,
  UpdateResumeAnalysisDocument,
  SoftDeleteResumeDocument,
  CreateResumeDocument,
  UpdateResumeMetadataDocument,
  InsertResumeHistoryDocument,
  UpdateResumeFileDocument,
  InsertUserDocument,
  DeleteUserDocument,
} from "../__generated__/graphql";

export type {
  GetResumesQuery,
  GetResumesQueryVariables,
  GetResumeByIdQuery,
  GetResumeByIdQueryVariables,
  GetResumeStatsQuery,
  GetResumeStatsQueryVariables,
  GetResumeHistoryQuery,
  GetResumeHistoryQueryVariables,
  GetResumeHistoryAllQuery,
  GetResumeHistoryAllQueryVariables,
  EnsureUserExistsMutation,
  EnsureUserExistsMutationVariables,
  UpdateResumeMutation,
  UpdateResumeMutationVariables,
  UpdateResumeAnalysisMutation,
  UpdateResumeAnalysisMutationVariables,
  SoftDeleteResumeMutation,
  SoftDeleteResumeMutationVariables,
  CreateResumeMutation,
  CreateResumeMutationVariables,
  UpdateResumeMetadataMutation,
  UpdateResumeMetadataMutationVariables,
  InsertResumeHistoryMutation,
  InsertResumeHistoryMutationVariables,
  UpdateResumeFileMutation,
  UpdateResumeFileMutationVariables,
  InsertUserMutation,
  InsertUserMutationVariables,
  DeleteUserMutation,
  DeleteUserMutationVariables,
} from "../__generated__/graphql";

// ============ Queries (for backward compatibility) ============

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
  query GetResumeById($resumeId: String!) {
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

export const GET_RESUME_HISTORY_ALL = gql`
  query GetResumeHistoryAll(
    $resumeId: String!
    $userId: String!
    $limit: Int
    $offset: Int
  ) {
    resume_history(
      where: {
        resume_id: { _eq: $resumeId }
        clerk_user_id: { _eq: $userId }
      }
      order_by: { created_at: desc }
      limit: $limit
      offset: $offset
    ) {
      history_id
      resume_id
      clerk_user_id
      title
      content
      version
      file_url
      ai_feedback
      score
      change_reason
      created_at
    }
    resume_history_aggregate(
      where: {
        resume_id: { _eq: $resumeId }
        clerk_user_id: { _eq: $userId }
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

// ============ Mutations ============

export const ENSURE_USER_EXISTS = gql`
  mutation EnsureUserExists($userId: String!, $email: String) {
    insert_users_one(
      object: {
        clerk_user_id: $userId
        email: $email
        language_preference: "en"
      }
      on_conflict: { constraint: users_pkey, update_columns: [] }
    ) {
      clerk_user_id
      email
      language_preference
    }
  }
`;

export const UPDATE_RESUME = gql`
  mutation UpdateResume(
    $resumeId: String!
    $title: String
    $content: String
    $aiFeedback: jsonb
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

export const UPDATE_RESUME_ANALYSIS = gql`
  mutation UpdateResumeAnalysis(
    $resumeId: String!
    $aiFeedback: jsonb
    $score: Int
  ) {
    update_resumes_by_pk(
      pk_columns: { resume_id: $resumeId }
      _set: { ai_feedback: $aiFeedback, score: $score }
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
    $content: String
  ) {
    insert_resumes_one(
      object: {
        resume_id: $resumeId
        clerk_user_id: $userId
        title: $title
        file_url: $fileUrl
        content: $content
      }
    ) {
      resume_id
      clerk_user_id
      title
      content
      file_url
      version
      is_active
      created_at
      updated_at
    }
  }
`;

export const UPDATE_RESUME_METADATA = gql`
  mutation UpdateResumeMetadata(
    $resumeId: String!
    $title: String
    $content: String
    $isActive: Boolean
    $version: Int
  ) {
    update_resumes_by_pk(
      pk_columns: { resume_id: $resumeId }
      _set: {
        title: $title
        content: $content
        is_active: $isActive
        version: $version
      }
    ) {
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

export const INSERT_RESUME_HISTORY = gql`
  mutation InsertResumeHistory(
    $historyId: String!
    $resumeId: String!
    $userId: String!
    $title: String!
    $content: String
    $version: Int!
    $fileUrl: String
    $aiFeedback: jsonb
    $score: Int
    $changeReason: String
  ) {
    insert_resume_history_one(
      object: {
        history_id: $historyId
        resume_id: $resumeId
        clerk_user_id: $userId
        title: $title
        content: $content
        version: $version
        file_url: $fileUrl
        ai_feedback: $aiFeedback
        score: $score
        change_reason: $changeReason
      }
    ) {
      history_id
      resume_id
      version
      created_at
    }
  }
`;

export const UPDATE_RESUME_FILE = gql`
  mutation UpdateResumeFile($resumeId: String!, $fileUrl: String!, $version: Int!) {
    update_resumes_by_pk(
      pk_columns: { resume_id: $resumeId }
      _set: { file_url: $fileUrl, version: $version }
    ) {
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

export const INSERT_USER = gql`
  mutation InsertUser($userId: String!, $email: String, $languagePreference: String) {
    insert_users_one(
      object: {
        clerk_user_id: $userId
        email: $email
        language_preference: $languagePreference
      }
    ) {
      clerk_user_id
      email
      language_preference
      created_at
    }
  }
`;

export const DELETE_USER = gql`
  mutation DeleteUser($userId: String!) {
    delete_users_by_pk(clerk_user_id: $userId) {
      clerk_user_id
    }
  }
`;

// ============ Legacy Type Aliases (for backward compatibility) ============
// These map the old manually-defined types to the generated ones

import type { GetResumesQuery, GetResumeByIdQuery, GetResumeStatsQuery, GetResumeHistoryQuery, CreateResumeMutation } from "../__generated__/graphql";

// Resume type derived from query result
export type Resume = NonNullable<GetResumesQuery["resumes"]>[number];

// Stats type
export type ResumeStats = GetResumeStatsQuery;

// Response types for backward compatibility
export type GetResumesResponse = GetResumesQuery;
export type GetResumeByIdResponse = GetResumeByIdQuery;
export type GetResumeStatsResponse = GetResumeStatsQuery;

// History item type
export type ResumeHistoryItem = NonNullable<GetResumeHistoryQuery["resume_history"]>[number];
export type GetResumeHistoryResponse = GetResumeHistoryQuery;

// Create response
export type CreateResumeResponse = CreateResumeMutation;
