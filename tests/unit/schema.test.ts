import { describe, it, expect } from 'vitest';
import {
  subscriptionTierEnum,
  questionCategoryEnum,
  difficultyEnum,
  sessionStatusEnum,
  subscriptionStatusEnum,
  paymentProviderEnum,
} from '@/lib/db/schema';

describe('Schema Enums', () => {
  describe('subscriptionTierEnum', () => {
    it('should contain valid subscription tiers', () => {
      expect(subscriptionTierEnum).toEqual(['free', 'premium', 'pro']);
    });

    it('should have exactly 3 tiers', () => {
      expect(subscriptionTierEnum.length).toBe(3);
    });
  });

  describe('questionCategoryEnum', () => {
    it('should contain all question categories', () => {
      expect(questionCategoryEnum).toEqual([
        'behavioral',
        'technical',
        'system_design',
        'leadership',
        'problem_solving',
        'company_specific',
      ]);
    });

    it('should have 6 categories', () => {
      expect(questionCategoryEnum.length).toBe(6);
    });

    it('should include behavioral category', () => {
      expect(questionCategoryEnum).toContain('behavioral');
    });

    it('should include technical category', () => {
      expect(questionCategoryEnum).toContain('technical');
    });
  });

  describe('difficultyEnum', () => {
    it('should contain easy, medium, hard', () => {
      expect(difficultyEnum).toEqual(['easy', 'medium', 'hard']);
    });

    it('should have exactly 3 difficulty levels', () => {
      expect(difficultyEnum.length).toBe(3);
    });
  });

  describe('sessionStatusEnum', () => {
    it('should contain valid session statuses', () => {
      expect(sessionStatusEnum).toEqual(['in_progress', 'completed', 'paused']);
    });

    it('should have 3 status options', () => {
      expect(sessionStatusEnum.length).toBe(3);
    });
  });

  describe('subscriptionStatusEnum', () => {
    it('should contain valid subscription statuses', () => {
      expect(subscriptionStatusEnum).toEqual(['active', 'cancelled', 'expired']);
    });
  });

  describe('paymentProviderEnum', () => {
    it('should contain valid payment providers', () => {
      expect(paymentProviderEnum).toEqual(['toss_payments', 'kakao_pay', 'paddle']);
    });

    it('should include Korean payment providers', () => {
      expect(paymentProviderEnum).toContain('toss_payments');
      expect(paymentProviderEnum).toContain('kakao_pay');
    });
  });
});

describe('Schema Type Safety', () => {
  it('should enforce type safety for subscription tier', () => {
    const validTier: (typeof subscriptionTierEnum)[number] = 'free';
    expect(['free', 'premium', 'pro']).toContain(validTier);
  });

  it('should enforce type safety for question category', () => {
    const validCategory: (typeof questionCategoryEnum)[number] = 'behavioral';
    expect(questionCategoryEnum).toContain(validCategory);
  });

  it('should enforce type safety for difficulty', () => {
    const validDifficulty: (typeof difficultyEnum)[number] = 'medium';
    expect(difficultyEnum).toContain(validDifficulty);
  });
});
