import { describe, it, expect } from 'vitest';

describe('Utility Functions', () => {
  describe('R2 File Key Generation', () => {
    it('should generate correct R2 file key format', () => {
      const generateR2Key = (
        userId: string,
        resumeId: string,
        filename: string
      ) => {
        return `resumes/${userId}/${resumeId}/${filename}`;
      };

      const key = generateR2Key('user_abc123', 'resume_xyz789', 'document.pdf');
      expect(key).toBe('resumes/user_abc123/resume_xyz789/document.pdf');
    });

    it('should handle special characters in filename', () => {
      const sanitizeFilename = (filename: string) => {
        return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      };

      const result = sanitizeFilename('my resume (2024).pdf');
      expect(result).toBe('my_resume__2024_.pdf');
    });
  });

  describe('UUID Generation Pattern', () => {
    it('should generate valid UUID-like IDs', () => {
      const generateId = (prefix: string) => {
        return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
      };

      const resumeId = generateId('resume');
      expect(resumeId).toMatch(/^resume_[a-z0-9]{9}$/);

      const userId = generateId('user');
      expect(userId).toMatch(/^user_[a-z0-9]{9}$/);
    });
  });

  describe('Date Formatting', () => {
    it('should format dates to ISO string', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const isoString = date.toISOString();

      expect(isoString).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should generate current timestamp', () => {
      const now = new Date().toISOString();
      const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

      expect(now).toMatch(isoDateRegex);
    });
  });

  describe('Score Validation', () => {
    it('should validate score is within 0-100 range', () => {
      const validateScore = (score: number): boolean => {
        return score >= 0 && score <= 100;
      };

      expect(validateScore(0)).toBe(true);
      expect(validateScore(50)).toBe(true);
      expect(validateScore(100)).toBe(true);
      expect(validateScore(-1)).toBe(false);
      expect(validateScore(101)).toBe(false);
    });

    it('should clamp score to valid range', () => {
      const clampScore = (score: number): number => {
        return Math.max(0, Math.min(100, score));
      };

      expect(clampScore(-10)).toBe(0);
      expect(clampScore(150)).toBe(100);
      expect(clampScore(75)).toBe(75);
    });
  });

  describe('JSON Parsing Safety', () => {
    it('should safely parse valid JSON', () => {
      const safeParseJSON = <T>(json: string | null): T | null => {
        if (!json) return null;
        try {
          return JSON.parse(json) as T;
        } catch {
          return null;
        }
      };

      const validJson = '{"score": 85, "summary": "Good resume"}';
      const result = safeParseJSON<{ score: number; summary: string }>(validJson);

      expect(result).not.toBeNull();
      expect(result?.score).toBe(85);
    });

    it('should handle null JSON input', () => {
      const safeParseJSON = <T>(json: string | null): T | null => {
        if (!json) return null;
        try {
          return JSON.parse(json) as T;
        } catch {
          return null;
        }
      };

      const result = safeParseJSON(null);
      expect(result).toBeNull();
    });

    it('should handle invalid JSON gracefully', () => {
      const safeParseJSON = <T>(json: string | null): T | null => {
        if (!json) return null;
        try {
          return JSON.parse(json) as T;
        } catch {
          return null;
        }
      };

      const invalidJson = 'not valid json {';
      const result = safeParseJSON(invalidJson);
      expect(result).toBeNull();
    });
  });

  describe('Presigned URL Generation Logic', () => {
    it('should construct correct R2 endpoint URL', () => {
      const constructR2Url = (
        bucketName: string,
        accountId: string,
        fileKey: string
      ) => {
        return `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${fileKey}`;
      };

      const url = constructR2Url(
        'prepup-files',
        'account123',
        'resumes/user_abc/resume_xyz/doc.pdf'
      );

      expect(url).toBe(
        'https://prepup-files.account123.r2.cloudflarestorage.com/resumes/user_abc/resume_xyz/doc.pdf'
      );
    });

    it('should add expiration query parameter', () => {
      const addExpiration = (url: string, expiresIn: number) => {
        const urlObj = new URL(url);
        urlObj.searchParams.set('X-Amz-Expires', expiresIn.toString());
        return urlObj.toString();
      };

      const baseUrl = 'https://bucket.account.r2.cloudflarestorage.com/file.pdf';
      const signedUrl = addExpiration(baseUrl, 3600);

      expect(signedUrl).toContain('X-Amz-Expires=3600');
    });
  });

  describe('Error Message Extraction', () => {
    it('should extract message from Error object', () => {
      const getErrorMessage = (error: unknown): string => {
        if (error instanceof Error) {
          return error.message;
        }
        return 'Unknown error occurred';
      };

      const error = new Error('Database connection failed');
      expect(getErrorMessage(error)).toBe('Database connection failed');
    });

    it('should handle string errors', () => {
      const getErrorMessage = (error: unknown): string => {
        if (error instanceof Error) {
          return error.message;
        }
        if (typeof error === 'string') {
          return error;
        }
        return 'Unknown error occurred';
      };

      expect(getErrorMessage('Something went wrong')).toBe('Something went wrong');
    });

    it('should handle unknown error types', () => {
      const getErrorMessage = (error: unknown): string => {
        if (error instanceof Error) {
          return error.message;
        }
        if (typeof error === 'string') {
          return error;
        }
        return 'Unknown error occurred';
      };

      expect(getErrorMessage(123)).toBe('Unknown error occurred');
      expect(getErrorMessage(null)).toBe('Unknown error occurred');
      expect(getErrorMessage(undefined)).toBe('Unknown error occurred');
    });
  });

  describe('Content Type Detection', () => {
    it('should detect PDF content type', () => {
      const getContentType = (filename: string): string => {
        const ext = filename.split('.').pop()?.toLowerCase();
        const types: Record<string, string> = {
          pdf: 'application/pdf',
          doc: 'application/msword',
          docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          txt: 'text/plain',
        };
        return types[ext || ''] || 'application/octet-stream';
      };

      expect(getContentType('resume.pdf')).toBe('application/pdf');
      expect(getContentType('resume.docx')).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      expect(getContentType('unknown.xyz')).toBe('application/octet-stream');
    });
  });

  describe('Array Utilities', () => {
    it('should safely get first element', () => {
      const getFirst = <T>(arr: T[]): T | undefined => arr[0];

      expect(getFirst([1, 2, 3])).toBe(1);
      expect(getFirst([])).toBeUndefined();
    });

    it('should filter null/undefined values', () => {
      const filterNullish = <T>(arr: (T | null | undefined)[]): T[] => {
        return arr.filter((item): item is T => item != null);
      };

      const input = [1, null, 2, undefined, 3];
      const result = filterNullish(input);

      expect(result).toEqual([1, 2, 3]);
    });
  });
});
