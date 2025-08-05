import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth, AuthProvider, type User } from './auth-context';

// Mock token storage utilities
vi.mock('../lib/auth/token-storage', () => ({
  storeToken: vi.fn(),
  clearToken: vi.fn(),
  getCurrentUser: vi.fn(),
  isAuthenticated: vi.fn(),
}));

import { 
  storeToken, 
  clearToken, 
  getCurrentUser, 
  isAuthenticated as checkIsAuthenticated 
} from '../lib/auth/token-storage';

const mockStoreToken = vi.mocked(storeToken);
const mockClearToken = vi.mocked(clearToken);
const mockGetCurrentUser = vi.mocked(getCurrentUser);
const mockCheckIsAuthenticated = vi.mocked(checkIsAuthenticated);

describe('Auth Context', () => {
  const testUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const testToken = 'test-jwt-token';

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to unauthenticated state
    mockCheckIsAuthenticated.mockReturnValue(false);
    mockGetCurrentUser.mockReturnValue(null);
  });

  describe('Initial State', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Initially should be loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should initialize as authenticated when valid token exists', async () => {
      mockCheckIsAuthenticated.mockReturnValue(true);
      mockGetCurrentUser.mockReturnValue({
        userId: testUser.id,
        email: testUser.email,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Wait for initialization
      await act(async () => {
        // Trigger initialization
        result.current.initialize();
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(expect.objectContaining({
        id: testUser.id,
        email: testUser.email,
      }));
      expect(result.current.isLoading).toBe(false);
    });

    it('should initialize as unauthenticated when no valid token exists', async () => {
      mockCheckIsAuthenticated.mockReturnValue(false);
      mockGetCurrentUser.mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        result.current.initialize();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Login Action', () => {
    it('should successfully login and update state', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        result.current.login(testToken, testUser);
      });

      expect(mockStoreToken).toHaveBeenCalledWith(testToken, {
        userId: testUser.id,
        email: testUser.email,
      });
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(testUser);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle login errors gracefully', async () => {
      mockStoreToken.mockImplementation(() => {
        throw new Error('Storage failed');
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await expect(async () => {
        await act(async () => {
          result.current.login(testToken, testUser);
        });
      }).rejects.toThrow('Storage failed');

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Logout Action', () => {
    it('should successfully logout and clear state', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // First login
      await act(async () => {
        result.current.login(testToken, testUser);
      });

      // Then logout
      await act(async () => {
        result.current.logout();
      });

      expect(mockClearToken).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Loading State Management', () => {
    it('should update loading state', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', async () => {
      mockCheckIsAuthenticated.mockImplementation(() => {
        throw new Error('Auth check failed');
      });

      // Mock console.error to avoid test output noise
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        result.current.initialize();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Auth initialization failed:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('Store Integration', () => {
    it('should work without AuthProvider (direct store access)', () => {
      const { result } = renderHook(() => useAuth());

      // Should still work without provider (fallback to direct store access)
      expect(result.current).toBeDefined();
      expect(result.current.login).toBeDefined();
      expect(result.current.logout).toBeDefined();
      expect(result.current.initialize).toBeDefined();
      expect(result.current.setLoading).toBeDefined();
    });

    it('should provide consistent state across multiple hook calls', async () => {
      const { result: result1 } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });
      const { result: result2 } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        result1.current.login(testToken, testUser);
      });

      // Both hooks should see the same state
      expect(result1.current.isAuthenticated).toBe(result2.current.isAuthenticated);
      expect(result1.current.user).toEqual(result2.current.user);
    });
  });
});