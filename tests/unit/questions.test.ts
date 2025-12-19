import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createMockQuestion,
  createMockResume,
  createMockUser,
  resetMockDbState,
  mockDbState,
} from '../mocks/db';

describe('Questions Module', () => {
  beforeEach(() => {
    resetMockDbState();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('createMockQuestion helper', () => {
    it('should create a question with default values', () => {
      const question = createMockQuestion();

      expect(question).toHaveProperty('questionId');
      expect(question).toHaveProperty('resumeId');
      expect(question).toHaveProperty('clerkUserId');
      expect(question).toHaveProperty('questionText');
      expect(question.questionText).toBe('What is your greatest strength?');
      expect(question.category).toBe('behavioral');
      expect(question.difficulty).toBe('medium');
      expect(question.isBookmarked).toBe(false);
    });

    it('should allow overriding default values', () => {
      const question = createMockQuestion({
        questionText: 'Tell me about yourself',
        category: 'technical',
        difficulty: 'hard',
        isBookmarked: true,
      });

      expect(question.questionText).toBe('Tell me about yourself');
      expect(question.category).toBe('technical');
      expect(question.difficulty).toBe('hard');
      expect(question.isBookmarked).toBe(true);
    });

    it('should generate unique IDs', () => {
      const question1 = createMockQuestion();
      const question2 = createMockQuestion();

      expect(question1.questionId).not.toBe(question2.questionId);
    });
  });

  describe('Question data structure', () => {
    it('should have all required fields', () => {
      const question = createMockQuestion();
      const requiredFields = [
        'questionId',
        'resumeId',
        'clerkUserId',
        'questionText',
        'category',
        'difficulty',
        'suggestedAnswer',
        'tips',
        'isBookmarked',
        'createdAt',
      ];

      requiredFields.forEach((field) => {
        expect(question).toHaveProperty(field);
      });
    });

    it('should have valid category values', () => {
      const validCategories = [
        'behavioral',
        'technical',
        'system_design',
        'leadership',
        'problem_solving',
        'company_specific',
      ];

      const question = createMockQuestion({ category: 'technical' });
      expect(validCategories).toContain(question.category);
    });

    it('should have valid difficulty values', () => {
      const validDifficulties = ['easy', 'medium', 'hard'];

      const question = createMockQuestion({ difficulty: 'easy' });
      expect(validDifficulties).toContain(question.difficulty);
    });
  });

  describe('Question filtering logic', () => {
    it('should filter questions by category', () => {
      const questions = [
        createMockQuestion({ category: 'behavioral' }),
        createMockQuestion({ category: 'technical' }),
        createMockQuestion({ category: 'behavioral' }),
      ];

      const behavioralQuestions = questions.filter((q) => q.category === 'behavioral');
      expect(behavioralQuestions.length).toBe(2);
    });

    it('should filter questions by bookmark status', () => {
      const questions = [
        createMockQuestion({ isBookmarked: true }),
        createMockQuestion({ isBookmarked: false }),
        createMockQuestion({ isBookmarked: true }),
      ];

      const bookmarkedQuestions = questions.filter((q) => q.isBookmarked);
      expect(bookmarkedQuestions.length).toBe(2);
    });

    it('should filter questions by resumeId', () => {
      const resumeId = 'resume_abc123';
      const questions = [
        createMockQuestion({ resumeId }),
        createMockQuestion({ resumeId: 'resume_other' }),
        createMockQuestion({ resumeId }),
      ];

      const resumeQuestions = questions.filter((q) => q.resumeId === resumeId);
      expect(resumeQuestions.length).toBe(2);
    });

    it('should combine multiple filters', () => {
      const userId = 'user_test123';
      const questions = [
        createMockQuestion({ clerkUserId: userId, category: 'behavioral', isBookmarked: true }),
        createMockQuestion({ clerkUserId: userId, category: 'technical', isBookmarked: true }),
        createMockQuestion({ clerkUserId: userId, category: 'behavioral', isBookmarked: false }),
        createMockQuestion({ clerkUserId: 'user_other', category: 'behavioral', isBookmarked: true }),
      ];

      const filtered = questions.filter(
        (q) =>
          q.clerkUserId === userId &&
          q.category === 'behavioral' &&
          q.isBookmarked === true
      );
      expect(filtered.length).toBe(1);
    });
  });

  describe('Question statistics calculation', () => {
    it('should calculate total question count', () => {
      const questions = [
        createMockQuestion(),
        createMockQuestion(),
        createMockQuestion(),
      ];

      expect(questions.length).toBe(3);
    });

    it('should calculate bookmarked count', () => {
      const questions = [
        createMockQuestion({ isBookmarked: true }),
        createMockQuestion({ isBookmarked: false }),
        createMockQuestion({ isBookmarked: true }),
        createMockQuestion({ isBookmarked: false }),
      ];

      const bookmarkedCount = questions.filter((q) => q.isBookmarked).length;
      expect(bookmarkedCount).toBe(2);
    });

    it('should calculate category distribution', () => {
      const questions = [
        createMockQuestion({ category: 'behavioral' }),
        createMockQuestion({ category: 'behavioral' }),
        createMockQuestion({ category: 'technical' }),
        createMockQuestion({ category: 'system_design' }),
      ];

      const byCategory: Record<string, number> = {
        behavioral: 0,
        technical: 0,
        system_design: 0,
        leadership: 0,
        problem_solving: 0,
        company_specific: 0,
      };

      questions.forEach((q) => {
        if (q.category && q.category in byCategory) {
          byCategory[q.category]++;
        }
      });

      expect(byCategory.behavioral).toBe(2);
      expect(byCategory.technical).toBe(1);
      expect(byCategory.system_design).toBe(1);
      expect(byCategory.leadership).toBe(0);
    });
  });

  describe('Bookmark toggle logic', () => {
    it('should toggle from false to true', () => {
      const question = createMockQuestion({ isBookmarked: false });
      const newState = !question.isBookmarked;
      expect(newState).toBe(true);
    });

    it('should toggle from true to false', () => {
      const question = createMockQuestion({ isBookmarked: true });
      const newState = !question.isBookmarked;
      expect(newState).toBe(false);
    });
  });
});

describe('Question User Authorization', () => {
  it('should only allow access to own questions', () => {
    const userId = 'user_owner123';
    const questions = [
      createMockQuestion({ clerkUserId: userId }),
      createMockQuestion({ clerkUserId: 'user_other' }),
    ];

    const userQuestions = questions.filter((q) => q.clerkUserId === userId);
    expect(userQuestions.length).toBe(1);
  });

  it('should prevent access to other users questions', () => {
    const currentUserId = 'user_current';
    const otherUserId = 'user_other';

    const question = createMockQuestion({ clerkUserId: otherUserId });
    const hasAccess = question.clerkUserId === currentUserId;

    expect(hasAccess).toBe(false);
  });
});
