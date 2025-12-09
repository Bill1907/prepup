import { vi } from 'vitest';

// In-memory database state for testing
interface MockUser {
  clerkUserId: string;
  email: string | null;
  languagePreference: string;
  createdAt: string;
  updatedAt: string;
}

interface MockResume {
  resumeId: string;
  clerkUserId: string;
  title: string;
  content: string | null;
  version: number;
  isActive: number;
  fileUrl: string | null;
  aiFeedback: string | null;
  score: number | null;
  createdAt: string;
  updatedAt: string;
}

interface MockQuestion {
  questionId: string;
  resumeId: string;
  clerkUserId: string;
  questionText: string;
  category: string | null;
  difficulty: string | null;
  suggestedAnswer: string | null;
  tips: string | null;
  isBookmarked: boolean;
  createdAt: string;
}

interface MockDbState {
  users: MockUser[];
  resumes: MockResume[];
  questions: MockQuestion[];
  resumeHistory: unknown[];
}

export const mockDbState: MockDbState = {
  users: [],
  resumes: [],
  questions: [],
  resumeHistory: [],
};

export function resetMockDbState() {
  mockDbState.users = [];
  mockDbState.resumes = [];
  mockDbState.questions = [];
  mockDbState.resumeHistory = [];
}

// Helper to create mock user
export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  const now = new Date().toISOString();
  return {
    clerkUserId: `user_${Math.random().toString(36).substr(2, 9)}`,
    email: 'test@example.com',
    languagePreference: 'en',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// Helper to create mock resume
export function createMockResume(overrides: Partial<MockResume> = {}): MockResume {
  const now = new Date().toISOString();
  return {
    resumeId: `resume_${Math.random().toString(36).substr(2, 9)}`,
    clerkUserId: `user_${Math.random().toString(36).substr(2, 9)}`,
    title: 'Test Resume',
    content: null,
    version: 1,
    isActive: 1,
    fileUrl: null,
    aiFeedback: null,
    score: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// Helper to create mock question
export function createMockQuestion(overrides: Partial<MockQuestion> = {}): MockQuestion {
  const now = new Date().toISOString();
  return {
    questionId: `question_${Math.random().toString(36).substr(2, 9)}`,
    resumeId: `resume_${Math.random().toString(36).substr(2, 9)}`,
    clerkUserId: `user_${Math.random().toString(36).substr(2, 9)}`,
    questionText: 'What is your greatest strength?',
    category: 'behavioral',
    difficulty: 'medium',
    suggestedAnswer: null,
    tips: null,
    isBookmarked: false,
    createdAt: now,
    ...overrides,
  };
}

// Create a fully functional mock database
export function createMockDrizzleDb() {
  const mockDb = {
    select: vi.fn(() => ({
      from: vi.fn((table: { name?: string } | string) => {
        const tableName = typeof table === 'string' ? table :
          (table as { name?: string }).name || 'unknown';

        return {
          where: vi.fn(() => ({
            limit: vi.fn((num: number) => {
              const data = getTableData(tableName);
              return Promise.resolve(data.slice(0, num));
            }),
            orderBy: vi.fn(() => {
              const data = getTableData(tableName);
              return Promise.resolve(data);
            }),
          })),
          orderBy: vi.fn(() => Promise.resolve(getTableData(tableName))),
          limit: vi.fn((num: number) => Promise.resolve(getTableData(tableName).slice(0, num))),
        };
      }),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        onConflictDoNothing: vi.fn(() => Promise.resolve()),
        returning: vi.fn(() => Promise.resolve([])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve({ rowsAffected: 1 })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve({ rowsAffected: 1 })),
    })),
  };

  return mockDb;
}

function getTableData(tableName: string): unknown[] {
  switch (tableName) {
    case 'users':
      return mockDbState.users;
    case 'resumes':
      return mockDbState.resumes;
    case 'interview_questions':
    case 'questions':
      return mockDbState.questions;
    case 'resume_history':
      return mockDbState.resumeHistory;
    default:
      return [];
  }
}

// Mock for getDrizzleDB
export const mockGetDrizzleDB = vi.fn(() => createMockDrizzleDb());

// Mock for getR2Bucket
export const mockGetR2Bucket = vi.fn(() => ({
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(() => Promise.resolve({ objects: [], truncated: false })),
}));
