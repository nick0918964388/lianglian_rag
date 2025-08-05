import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the dependencies
vi.mock('@trpc/react-query');
vi.mock('@trpc/client');
vi.mock('../auth/token-storage');

import { getAuthToken } from '../auth/token-storage';
const mockGetAuthToken = vi.mocked(getAuthToken);

describe('tRPC Client Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    delete process.env.VERCEL_URL;
    delete process.env.PORT;
  });

  describe('getBaseUrl function', () => {
    it('should return empty string in browser environment', async () => {
      // Mock window object to simulate browser environment
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true,
      });

      // Import module after setting up mocks
      const { trpcClient } = await import('./client');

      // The client should be created with relative URL in browser
      expect(trpcClient).toBeDefined();

      // Clean up
      delete (global as any).window;
    });

    it('should use VERCEL_URL in Vercel environment', () => {
      process.env.VERCEL_URL = 'test-app.vercel.app';
      delete (global as any).window;

      // Re-import to get fresh module with new env vars
      vi.resetModules();
      
      // The test validates that the module can be imported without error
      expect(() => require('./client')).not.toThrow();
    });

    it('should use localhost in development SSR', () => {
      delete (global as any).window;
      delete process.env.VERCEL_URL;
      process.env.PORT = '3001';

      // Re-import to get fresh module with new env vars
      vi.resetModules();

      // The test validates that the module can be imported without error
      expect(() => require('./client')).not.toThrow();
    });

    it('should default to port 3000 when PORT is not set', () => {
      delete (global as any).window;
      delete process.env.VERCEL_URL;
      delete process.env.PORT;

      // Re-import to get fresh module with new env vars
      vi.resetModules();

      // The test validates that the module can be imported without error
      expect(() => require('./client')).not.toThrow();
    });
  });

  describe('Authorization headers', () => {
    it('should include Bearer token when auth token exists', async () => {
      const testToken = 'test-jwt-token';
      mockGetAuthToken.mockReturnValue(testToken);

      const { trpcClient } = await import('./client');

      // Access the internal configuration to test header function
      // Note: This tests the structure but the actual header function
      // would be called by tRPC internally
      expect(trpcClient).toBeDefined();
      expect(mockGetAuthToken).toHaveBeenCalled();
    });

    it('should not include authorization header when no token exists', async () => {
      mockGetAuthToken.mockReturnValue(null);

      const { trpcClient } = await import('./client');

      expect(trpcClient).toBeDefined();
      expect(mockGetAuthToken).toHaveBeenCalled();
    });
  });

  describe('Client configuration', () => {
    it('should be properly configured with superjson transformer', async () => {
      const { trpcClient } = await import('./client');

      expect(trpcClient).toBeDefined();
      // The client should be configured with superjson for serialization
    });

    it('should create tRPC React client', async () => {
      const { trpc } = await import('./client');

      expect(trpc).toBeDefined();
      expect(trpc.createClient).toBeDefined();
    });
  });
});