import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createMockResume,
  createMockUser,
  resetMockDbState,
} from '../mocks/db';

describe('Resume Module', () => {
  beforeEach(() => {
    resetMockDbState();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('createMockResume helper', () => {
    it('should create a resume with default values', () => {
      const resume = createMockResume();

      expect(resume).toHaveProperty('resumeId');
      expect(resume).toHaveProperty('clerkUserId');
      expect(resume).toHaveProperty('title');
      expect(resume.title).toBe('Test Resume');
      expect(resume.version).toBe(1);
      expect(resume.isActive).toBe(1);
    });

    it('should allow overriding default values', () => {
      const resume = createMockResume({
        title: 'My Professional Resume',
        version: 3,
        isActive: 0,
        score: 85,
      });

      expect(resume.title).toBe('My Professional Resume');
      expect(resume.version).toBe(3);
      expect(resume.isActive).toBe(0);
      expect(resume.score).toBe(85);
    });

    it('should generate unique IDs', () => {
      const resume1 = createMockResume();
      const resume2 = createMockResume();

      expect(resume1.resumeId).not.toBe(resume2.resumeId);
    });
  });

  describe('Resume data structure', () => {
    it('should have all required fields', () => {
      const resume = createMockResume();
      const requiredFields = [
        'resumeId',
        'clerkUserId',
        'title',
        'content',
        'version',
        'isActive',
        'fileUrl',
        'aiFeedback',
        'score',
        'createdAt',
        'updatedAt',
      ];

      requiredFields.forEach((field) => {
        expect(resume).toHaveProperty(field);
      });
    });

    it('should have timestamps in ISO format', () => {
      const resume = createMockResume();
      const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

      expect(resume.createdAt).toMatch(isoDateRegex);
      expect(resume.updatedAt).toMatch(isoDateRegex);
    });
  });

  describe('Resume active status filtering', () => {
    it('should identify active resumes', () => {
      const resumes = [
        createMockResume({ isActive: 1 }),
        createMockResume({ isActive: 0 }),
        createMockResume({ isActive: 1 }),
      ];

      const activeResumes = resumes.filter((r) => r.isActive === 1);
      expect(activeResumes.length).toBe(2);
    });

    it('should identify soft-deleted resumes', () => {
      const resumes = [
        createMockResume({ isActive: 1 }),
        createMockResume({ isActive: 0 }),
        createMockResume({ isActive: 0 }),
      ];

      const deletedResumes = resumes.filter((r) => r.isActive === 0);
      expect(deletedResumes.length).toBe(2);
    });
  });

  describe('Resume ownership validation', () => {
    it('should validate resume belongs to user', () => {
      const userId = 'user_owner123';
      const resume = createMockResume({ clerkUserId: userId });

      const belongsToUser = resume.clerkUserId === userId;
      expect(belongsToUser).toBe(true);
    });

    it('should reject access to other users resume', () => {
      const currentUserId = 'user_current';
      const otherUserId = 'user_other';

      const resume = createMockResume({ clerkUserId: otherUserId });
      const hasAccess = resume.clerkUserId === currentUserId;

      expect(hasAccess).toBe(false);
    });

    it('should filter resumes by userId', () => {
      const userId = 'user_test123';
      const resumes = [
        createMockResume({ clerkUserId: userId }),
        createMockResume({ clerkUserId: 'user_other1' }),
        createMockResume({ clerkUserId: userId }),
        createMockResume({ clerkUserId: 'user_other2' }),
      ];

      const userResumes = resumes.filter((r) => r.clerkUserId === userId);
      expect(userResumes.length).toBe(2);
    });
  });

  describe('Resume AI feedback', () => {
    it('should store AI feedback as JSON string', () => {
      const aiFeedback = {
        summary: 'Strong technical background',
        score: 85,
        strengths: ['Technical skills', 'Clear formatting'],
        improvements: ['Add more metrics', 'Expand leadership section'],
      };

      const resume = createMockResume({
        aiFeedback: JSON.stringify(aiFeedback),
        score: aiFeedback.score,
      });

      expect(resume.aiFeedback).toBe(JSON.stringify(aiFeedback));
      expect(resume.score).toBe(85);
    });

    it('should parse AI feedback JSON correctly', () => {
      const aiFeedback = {
        summary: 'Excellent resume',
        score: 90,
        strengths: ['Strong experience'],
        improvements: ['Minor formatting'],
      };

      const resume = createMockResume({
        aiFeedback: JSON.stringify(aiFeedback),
      });

      const parsedFeedback = JSON.parse(resume.aiFeedback!);
      expect(parsedFeedback.summary).toBe('Excellent resume');
      expect(parsedFeedback.score).toBe(90);
      expect(parsedFeedback.strengths).toHaveLength(1);
    });

    it('should handle null AI feedback', () => {
      const resume = createMockResume({ aiFeedback: null });
      expect(resume.aiFeedback).toBeNull();
    });
  });

  describe('Resume score validation', () => {
    it('should accept valid scores (0-100)', () => {
      const validScores = [0, 50, 100, 75, 23];

      validScores.forEach((score) => {
        const resume = createMockResume({ score });
        expect(resume.score).toBe(score);
        expect(resume.score).toBeGreaterThanOrEqual(0);
        expect(resume.score).toBeLessThanOrEqual(100);
      });
    });

    it('should handle null score', () => {
      const resume = createMockResume({ score: null });
      expect(resume.score).toBeNull();
    });
  });

  describe('Resume versioning', () => {
    it('should start at version 1', () => {
      const resume = createMockResume();
      expect(resume.version).toBe(1);
    });

    it('should increment versions correctly', () => {
      const versions = [1, 2, 3, 4, 5];
      const resumes = versions.map((version) => createMockResume({ version }));

      resumes.forEach((resume, index) => {
        expect(resume.version).toBe(versions[index]);
      });
    });
  });

  describe('Resume file URL handling', () => {
    it('should store file URL', () => {
      const fileUrl = 'https://example.com/resumes/user_123/resume_456/document.pdf';
      const resume = createMockResume({ fileUrl });

      expect(resume.fileUrl).toBe(fileUrl);
    });

    it('should handle null file URL', () => {
      const resume = createMockResume({ fileUrl: null });
      expect(resume.fileUrl).toBeNull();
    });

    it('should validate R2 file key pattern', () => {
      const r2FileKey = 'resumes/user_abc123/resume_xyz789/document.pdf';
      const r2Pattern = /^resumes\/user_\w+\/resume_\w+\/.+$/;

      expect(r2FileKey).toMatch(r2Pattern);
    });
  });
});

describe('Resume User Operations', () => {
  describe('createMockUser helper', () => {
    it('should create a user with default values', () => {
      const user = createMockUser();

      expect(user).toHaveProperty('clerkUserId');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('languagePreference');
      expect(user.languagePreference).toBe('en');
    });

    it('should allow overriding default values', () => {
      const user = createMockUser({
        email: 'custom@example.com',
        languagePreference: 'ko',
      });

      expect(user.email).toBe('custom@example.com');
      expect(user.languagePreference).toBe('ko');
    });
  });

  describe('User-Resume relationship', () => {
    it('should link resume to user correctly', () => {
      const user = createMockUser();
      const resume = createMockResume({ clerkUserId: user.clerkUserId });

      expect(resume.clerkUserId).toBe(user.clerkUserId);
    });

    it('should allow multiple resumes per user', () => {
      const user = createMockUser();
      const resumes = [
        createMockResume({ clerkUserId: user.clerkUserId, title: 'Resume 1' }),
        createMockResume({ clerkUserId: user.clerkUserId, title: 'Resume 2' }),
        createMockResume({ clerkUserId: user.clerkUserId, title: 'Resume 3' }),
      ];

      const userResumes = resumes.filter((r) => r.clerkUserId === user.clerkUserId);
      expect(userResumes.length).toBe(3);
    });
  });
});
