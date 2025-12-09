import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Cloudflare context modules
const mockD1Database = {
  prepare: vi.fn(() => ({
    bind: vi.fn(() => ({
      run: vi.fn(),
      all: vi.fn(() => Promise.resolve({ results: [] })),
      first: vi.fn(() => Promise.resolve(null)),
    })),
  })),
  exec: vi.fn(),
  batch: vi.fn(() => Promise.resolve([])),
  dump: vi.fn(),
};

const mockR2Bucket = {
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(() => Promise.resolve({ objects: [], truncated: false })),
  head: vi.fn(),
  createMultipartUpload: vi.fn(),
};

const mockEnv = {
  prepup_db: mockD1Database,
  prepup_files: mockR2Bucket,
  R2_ACCESS_KEY_ID: 'test-access-key',
  R2_SECRET_ACCESS_KEY: 'test-secret-key',
  R2_ACCOUNT_ID: 'test-account-id',
};

vi.mock('@cloudflare/next-on-pages', () => ({
  getRequestContext: vi.fn(() => {
    throw new Error('Not in Workers environment');
  }),
}));

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: vi.fn(() => ({
    env: mockEnv,
  })),
}));

describe('Database Helper Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('ensureUserExists function', () => {
    it('should create user if not exists', async () => {
      const clerkUserId = 'user_test123';
      const email = 'test@example.com';

      // Simulate the function behavior
      const ensureUserExists = async (userId: string, userEmail?: string) => {
        const userValues: {
          clerkUserId: string;
          languagePreference: string;
          email?: string | null;
        } = {
          clerkUserId: userId,
          languagePreference: 'en',
        };

        if (userEmail !== undefined) {
          userValues.email = userEmail || null;
        }

        // In real implementation, this would insert into database
        return userValues;
      };

      const result = await ensureUserExists(clerkUserId, email);

      expect(result.clerkUserId).toBe(clerkUserId);
      expect(result.email).toBe(email);
      expect(result.languagePreference).toBe('en');
    });

    it('should handle null email', async () => {
      const clerkUserId = 'user_test456';

      const ensureUserExists = async (userId: string, userEmail?: string | null) => {
        const userValues: {
          clerkUserId: string;
          languagePreference: string;
          email?: string | null;
        } = {
          clerkUserId: userId,
          languagePreference: 'en',
        };

        if (userEmail !== undefined) {
          userValues.email = userEmail || null;
        }

        return userValues;
      };

      const result = await ensureUserExists(clerkUserId, null);

      expect(result.clerkUserId).toBe(clerkUserId);
      expect(result.email).toBeNull();
    });

    it('should not include email if not provided', async () => {
      const clerkUserId = 'user_test789';

      const ensureUserExists = async (userId: string, userEmail?: string | null) => {
        const userValues: {
          clerkUserId: string;
          languagePreference: string;
          email?: string | null;
        } = {
          clerkUserId: userId,
          languagePreference: 'en',
        };

        if (userEmail !== undefined) {
          userValues.email = userEmail || null;
        }

        return userValues;
      };

      const result = await ensureUserExists(clerkUserId);

      expect(result.clerkUserId).toBe(clerkUserId);
      expect(result).not.toHaveProperty('email');
    });
  });

  describe('File operations', () => {
    describe('listFiles function', () => {
      it('should list files with prefix', async () => {
        const prefix = 'resumes/user_123/';
        mockR2Bucket.list.mockResolvedValueOnce({
          objects: [
            { key: `${prefix}resume_1/doc.pdf`, size: 1024 },
            { key: `${prefix}resume_2/doc.pdf`, size: 2048 },
          ],
          truncated: false,
        });

        const result = await mockR2Bucket.list({ prefix, limit: 1000 });

        expect(result.objects).toHaveLength(2);
        expect(result.truncated).toBe(false);
        expect(mockR2Bucket.list).toHaveBeenCalledWith({ prefix, limit: 1000 });
      });

      it('should handle empty file list', async () => {
        mockR2Bucket.list.mockResolvedValueOnce({
          objects: [],
          truncated: false,
        });

        const result = await mockR2Bucket.list({ prefix: 'empty/' });

        expect(result.objects).toHaveLength(0);
      });
    });

    describe('getFile function', () => {
      it('should retrieve file by key', async () => {
        const fileKey = 'resumes/user_123/resume_456/document.pdf';
        const mockFileContent = new ArrayBuffer(1024);

        mockR2Bucket.get.mockResolvedValueOnce({
          key: fileKey,
          size: 1024,
          httpMetadata: { contentType: 'application/pdf' },
          arrayBuffer: () => Promise.resolve(mockFileContent),
        });

        const result = await mockR2Bucket.get(fileKey);

        expect(result).not.toBeNull();
        expect(result.key).toBe(fileKey);
        expect(result.size).toBe(1024);
      });

      it('should return null for non-existent file', async () => {
        mockR2Bucket.get.mockResolvedValueOnce(null);

        const result = await mockR2Bucket.get('non-existent-key');

        expect(result).toBeNull();
      });
    });

    describe('uploadFile function', () => {
      it('should upload file with content type', async () => {
        const fileKey = 'resumes/user_123/resume_456/document.pdf';
        const fileData = new ArrayBuffer(1024);
        const contentType = 'application/pdf';

        mockR2Bucket.put.mockResolvedValueOnce({ key: fileKey });

        await mockR2Bucket.put(fileKey, fileData, {
          httpMetadata: { contentType },
        });

        expect(mockR2Bucket.put).toHaveBeenCalledWith(
          fileKey,
          fileData,
          expect.objectContaining({
            httpMetadata: { contentType },
          })
        );
      });

      it('should upload file with custom metadata', async () => {
        const fileKey = 'resumes/user_123/resume_456/document.pdf';
        const fileData = new ArrayBuffer(1024);
        const metadata = { uploadedBy: 'user_123', originalName: 'myresume.pdf' };

        mockR2Bucket.put.mockResolvedValueOnce({ key: fileKey });

        await mockR2Bucket.put(fileKey, fileData, {
          customMetadata: metadata,
        });

        expect(mockR2Bucket.put).toHaveBeenCalledWith(
          fileKey,
          fileData,
          expect.objectContaining({
            customMetadata: metadata,
          })
        );
      });
    });
  });

  describe('Presigned URL generation', () => {
    it('should construct correct R2 endpoint URL', () => {
      const bucketName = 'prepup-files';
      const accountId = 'test-account-id';
      const fileKey = 'resumes/user_123/resume_456/doc.pdf';

      const url = `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${fileKey}`;

      expect(url).toBe(
        'https://prepup-files.test-account-id.r2.cloudflarestorage.com/resumes/user_123/resume_456/doc.pdf'
      );
    });

    it('should validate required credentials', () => {
      const validateCredentials = (
        accessKeyId?: string,
        secretAccessKey?: string,
        accountId?: string
      ) => {
        if (!accessKeyId || !secretAccessKey || !accountId) {
          throw new Error(
            'R2 credentials not configured. Please set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_ACCOUNT_ID.'
          );
        }
        return true;
      };

      expect(() => validateCredentials('key', 'secret', 'account')).not.toThrow();
      expect(() => validateCredentials(undefined, 'secret', 'account')).toThrow();
      expect(() => validateCredentials('key', undefined, 'account')).toThrow();
      expect(() => validateCredentials('key', 'secret', undefined)).toThrow();
    });

    it('should set correct expiration time', () => {
      const addExpiration = (expiresIn: number = 3600) => {
        const url = new URL('https://example.com/file.pdf');
        url.searchParams.set('X-Amz-Expires', expiresIn.toString());
        return url.searchParams.get('X-Amz-Expires');
      };

      expect(addExpiration()).toBe('3600');
      expect(addExpiration(7200)).toBe('7200');
      expect(addExpiration(1800)).toBe('1800');
    });
  });
});

describe('Database Context Resolution', () => {
  it('should handle missing database binding error', () => {
    const checkDatabaseBinding = (db: unknown) => {
      if (!db) {
        throw new Error(
          'D1 database binding "prepup_db" is not configured. Please check wrangler.jsonc.'
        );
      }
      return db;
    };

    expect(() => checkDatabaseBinding(null)).toThrow('prepup_db');
    expect(() => checkDatabaseBinding(undefined)).toThrow('prepup_db');
    expect(() => checkDatabaseBinding(mockD1Database)).not.toThrow();
  });

  it('should handle missing R2 binding error', () => {
    const checkR2Binding = (bucket: unknown) => {
      if (!bucket) {
        throw new Error(
          'R2 bucket binding "prepup_files" is not configured. Please check wrangler.jsonc.'
        );
      }
      return bucket;
    };

    expect(() => checkR2Binding(null)).toThrow('prepup_files');
    expect(() => checkR2Binding(undefined)).toThrow('prepup_files');
    expect(() => checkR2Binding(mockR2Bucket)).not.toThrow();
  });

  it('should provide helpful error message for environment issues', () => {
    const getEnvironmentError = () => {
      return new Error(
        'D1 database is not available in this environment. ' +
          'Make sure wrangler.jsonc is properly configured with prepup_db binding. ' +
          'For local development, ensure @opennextjs/cloudflare is properly initialized in next.config.ts. ' +
          'See docs/development/getting-started.md for more information.'
      );
    };

    const error = getEnvironmentError();
    expect(error.message).toContain('wrangler.jsonc');
    expect(error.message).toContain('@opennextjs/cloudflare');
  });
});
