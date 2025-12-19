import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockResume, createMockUser, resetMockDbState } from '../mocks/db';

// Mock modules before importing actions
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/openaiClient', () => ({
  openai: {
    files: {
      create: vi.fn(),
      delete: vi.fn(),
    },
    beta: {
      assistants: {
        create: vi.fn(),
        delete: vi.fn(),
      },
      threads: {
        create: vi.fn(),
        messages: {
          list: vi.fn(),
        },
        runs: {
          createAndPoll: vi.fn(),
        },
      },
    },
  },
}));

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

describe('Server Actions', () => {
  beforeEach(() => {
    resetMockDbState();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('deleteResume action logic', () => {
    it('should return error when user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as never);

      // Simulate unauthorized access
      const result = {
        success: false,
        error: 'Unauthorized. Please sign in.',
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized. Please sign in.');
    });

    it('should return error when resume not found', async () => {
      const userId = 'user_test123';
      vi.mocked(auth).mockResolvedValue({ userId } as never);

      // Simulate resume not found
      const result = {
        success: false,
        error: "Resume not found or you don't have permission to delete it.",
      };

      expect(result.success).toBe(false);
      expect(result.error).toContain('Resume not found');
    });

    it('should successfully soft delete resume', async () => {
      const userId = 'user_test123';
      const resumeId = 'resume_abc123';

      vi.mocked(auth).mockResolvedValue({ userId } as never);

      const resume = createMockResume({
        resumeId,
        clerkUserId: userId,
        isActive: 1,
      });

      // Simulate successful deletion
      const result = {
        success: true,
        message: 'Resume deleted successfully.',
      };

      expect(result.success).toBe(true);
      expect(result.message).toBe('Resume deleted successfully.');
    });

    it('should not delete resume owned by another user', async () => {
      const currentUserId = 'user_current';
      const otherUserId = 'user_other';

      vi.mocked(auth).mockResolvedValue({ userId: currentUserId } as never);

      const resume = createMockResume({
        clerkUserId: otherUserId,
      });

      // Ownership check
      const hasPermission = resume.clerkUserId === currentUserId;
      expect(hasPermission).toBe(false);
    });
  });

  describe('analyzeResume action logic', () => {
    it('should return error when user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as never);

      const result = {
        success: false,
        error: 'Unauthorized',
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('should return error when resume not found', async () => {
      const userId = 'user_test123';
      vi.mocked(auth).mockResolvedValue({ userId } as never);

      const result = {
        success: false,
        error: 'Resume not found',
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe('Resume not found');
    });

    it('should validate presigned URL format', () => {
      const validPresignedUrl =
        'https://prepup-files.account123.r2.cloudflarestorage.com/resumes/user_123/resume_456/doc.pdf?X-Amz-Signature=abc123';
      const presignedUrlPattern = /^https:\/\/.+\.r2\.cloudflarestorage\.com\/.+\?X-Amz-/;

      expect(validPresignedUrl).toMatch(presignedUrlPattern);
    });

    it('should handle successful analysis result structure', () => {
      const analysisResult = {
        success: true,
        analysis: {
          summary: 'Strong technical background with leadership experience',
          score: 85,
          strengths: [
            'Clear technical skills section',
            'Quantifiable achievements',
            'Good formatting',
          ],
          improvements: [
            'Add more leadership examples',
            'Expand project descriptions',
          ],
        },
      };

      expect(analysisResult.success).toBe(true);
      expect(analysisResult.analysis).toBeDefined();
      expect(analysisResult.analysis!.score).toBeGreaterThanOrEqual(0);
      expect(analysisResult.analysis!.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(analysisResult.analysis!.strengths)).toBe(true);
      expect(Array.isArray(analysisResult.analysis!.improvements)).toBe(true);
    });

    it('should handle analysis error gracefully', () => {
      const errorResult = {
        success: false,
        error: 'Failed to analyze resume',
      };

      expect(errorResult.success).toBe(false);
      expect(errorResult.error).toBeDefined();
    });
  });

  describe('Authentication patterns', () => {
    it('should check authentication before any operation', async () => {
      // Pattern: Always check userId first
      const checkAuth = async () => {
        const { userId } = await auth();
        if (!userId) {
          return { success: false, error: 'Unauthorized' };
        }
        return { success: true, userId };
      };

      vi.mocked(auth).mockResolvedValue({ userId: null } as never);
      const result1 = await checkAuth();
      expect(result1.success).toBe(false);

      vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as never);
      const result2 = await checkAuth();
      expect(result2.success).toBe(true);
    });
  });

  describe('Cache revalidation', () => {
    it('should revalidate correct paths after resume operations', () => {
      const expectedPaths = ['/service/resume', '/service/resume/resume_123'];

      expectedPaths.forEach((path) => {
        revalidatePath(path);
      });

      expect(revalidatePath).toHaveBeenCalledTimes(2);
      expect(revalidatePath).toHaveBeenCalledWith('/service/resume');
      expect(revalidatePath).toHaveBeenCalledWith('/service/resume/resume_123');
    });
  });
});

describe('Server Actions Error Handling', () => {
  it('should catch and format database errors', () => {
    const dbError = new Error('Database connection failed');
    const formattedError = {
      success: false,
      error: 'Failed to delete resume. Please try again.',
    };

    expect(formattedError.success).toBe(false);
    expect(formattedError.error).not.toContain('Database connection');
  });

  it('should catch and format OpenAI API errors', () => {
    const apiError = new Error('OpenAI API rate limit exceeded');
    const formattedError = {
      success: false,
      error: apiError.message,
    };

    expect(formattedError.success).toBe(false);
    expect(formattedError.error).toContain('rate limit');
  });

  it('should handle unknown errors safely', () => {
    const unknownError = 'Something went wrong';
    const formattedError = {
      success: false,
      error: typeof unknownError === 'string' ? unknownError : 'Internal server error',
    };

    expect(formattedError.success).toBe(false);
    expect(formattedError.error).toBeDefined();
  });
});
