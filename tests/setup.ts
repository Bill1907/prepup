import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Cloudflare context functions
vi.mock('@cloudflare/next-on-pages', () => ({
  getRequestContext: vi.fn(() => {
    throw new Error('Not in Cloudflare Workers environment');
  }),
}));

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: vi.fn(() => {
    throw new Error('Not in OpenNext environment');
  }),
}));

// Mock Clerk
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => Promise.resolve({ userId: null })),
  currentUser: vi.fn(() => Promise.resolve(null)),
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Global test utilities
declare global {
  // eslint-disable-next-line no-var
  var testDb: ReturnType<typeof createMockDb> | undefined;
  // eslint-disable-next-line no-var
  var testR2: ReturnType<typeof createMockR2> | undefined;
}

// Mock database factory
export function createMockDb() {
  const mockResults: Record<string, unknown[]> = {};

  return {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve(mockResults['select'] || [])),
          orderBy: vi.fn(() => Promise.resolve(mockResults['select'] || [])),
        })),
        orderBy: vi.fn(() => Promise.resolve(mockResults['select'] || [])),
        limit: vi.fn(() => Promise.resolve(mockResults['select'] || [])),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        onConflictDoNothing: vi.fn(() => Promise.resolve()),
        returning: vi.fn(() => Promise.resolve(mockResults['insert'] || [])),
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
    setMockResults: (key: string, results: unknown[]) => {
      mockResults[key] = results;
    },
  };
}

// Mock R2 bucket factory
export function createMockR2() {
  const files: Record<string, { data: ArrayBuffer; metadata?: Record<string, string> }> = {};

  return {
    get: vi.fn((key: string) => {
      const file = files[key];
      if (!file) return Promise.resolve(null);
      return Promise.resolve({
        key,
        size: file.data.byteLength,
        httpMetadata: {},
        customMetadata: file.metadata,
        arrayBuffer: () => Promise.resolve(file.data),
        text: () => Promise.resolve(new TextDecoder().decode(file.data)),
        json: () => Promise.resolve(JSON.parse(new TextDecoder().decode(file.data))),
      });
    }),
    put: vi.fn((key: string, data: ArrayBuffer, options?: { customMetadata?: Record<string, string> }) => {
      files[key] = { data, metadata: options?.customMetadata };
      return Promise.resolve({ key });
    }),
    delete: vi.fn((key: string) => {
      delete files[key];
      return Promise.resolve();
    }),
    list: vi.fn((options?: { prefix?: string }) => {
      const prefix = options?.prefix || '';
      const objects = Object.keys(files)
        .filter(key => key.startsWith(prefix))
        .map(key => ({ key, size: files[key].data.byteLength }));
      return Promise.resolve({ objects, truncated: false });
    }),
    _files: files, // For test inspection
  };
}

// Utility to reset mocks between tests
export function resetMocks() {
  vi.clearAllMocks();
  global.testDb = undefined;
  global.testR2 = undefined;
}
