import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import Cookies from 'js-cookie';
import { 
  storeToken, 
  getStoredToken, 
  isAuthenticated, 
  getCurrentUser, 
  clearToken, 
  getAuthToken 
} from './token-storage';

// Mock js-cookie
vi.mock('js-cookie');
const mockCookies = vi.mocked(Cookies);

// Mock JWT utilities
vi.mock('./jwt', () => ({
  verifyJWT: vi.fn(),
}));

import { verifyJWT } from './jwt';
const mockVerifyJWT = vi.mocked(verifyJWT);

describe('Token Storage Utilities', () => {
  const testUser = { userId: 'user-123', email: 'test@example.com' };
  const testToken = 'test-jwt-token';
  const testTokenData = { token: testToken, user: testUser };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('storeToken', () => {
    it('should store token with correct options in development', () => {
      process.env.NODE_ENV = 'development';
      
      storeToken(testToken, testUser);

      expect(mockCookies.set).toHaveBeenCalledWith(
        'auth-token',
        JSON.stringify(testTokenData),
        {
          expires: 1,
          secure: false, // Development mode
          sameSite: 'strict',
          path: '/',
        }
      );
    });

    it('should store token with secure flag in production', () => {
      process.env.NODE_ENV = 'production';
      
      storeToken(testToken, testUser);

      expect(mockCookies.set).toHaveBeenCalledWith(
        'auth-token',
        JSON.stringify(testTokenData),
        {
          expires: 1,
          secure: true, // Production mode
          sameSite: 'strict',
          path: '/',
        }
      );
    });

    it('should handle storage errors gracefully', () => {
      mockCookies.set.mockImplementation(() => {
        throw new Error('Storage failed');
      });

      expect(() => storeToken(testToken, testUser)).toThrow('Failed to store authentication token');
    });
  });

  describe('getStoredToken', () => {
    it('should return null when no token is stored', () => {
      mockCookies.get.mockReturnValue(undefined);

      const result = getStoredToken();

      expect(result).toBeNull();
      expect(mockCookies.get).toHaveBeenCalledWith('auth-token');
    });

    it('should return null and clear token when stored data is invalid JSON', () => {
      mockCookies.get.mockReturnValue('invalid-json');

      const result = getStoredToken();

      expect(result).toBeNull();
      expect(mockCookies.remove).toHaveBeenCalledWith('auth-token', { path: '/' });
    });

    it('should return null and clear token when token structure is invalid', () => {
      const invalidTokenData = { token: testToken }; // Missing user data
      mockCookies.get.mockReturnValue(JSON.stringify(invalidTokenData));

      const result = getStoredToken();

      expect(result).toBeNull();
      expect(mockCookies.remove).toHaveBeenCalledWith('auth-token', { path: '/' });
    });

    it('should return null and clear token when JWT verification fails', () => {
      mockCookies.get.mockReturnValue(JSON.stringify(testTokenData));
      mockVerifyJWT.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = getStoredToken();

      expect(result).toBeNull();
      expect(mockCookies.remove).toHaveBeenCalledWith('auth-token', { path: '/' });
    });

    it('should return null and clear token when JWT payload doesn\'t match stored user', () => {
      mockCookies.get.mockReturnValue(JSON.stringify(testTokenData));
      mockVerifyJWT.mockReturnValue({
        userId: 'different-user',
        email: 'different@example.com',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      });

      const result = getStoredToken();

      expect(result).toBeNull();
      expect(mockCookies.remove).toHaveBeenCalledWith('auth-token', { path: '/' });
    });

    it('should return token data when everything is valid', () => {
      mockCookies.get.mockReturnValue(JSON.stringify(testTokenData));
      mockVerifyJWT.mockReturnValue({
        userId: testUser.userId,
        email: testUser.email,
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      });

      const result = getStoredToken();

      expect(result).toEqual(testTokenData);
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no valid token exists', () => {
      mockCookies.get.mockReturnValue(undefined);

      const result = isAuthenticated();

      expect(result).toBe(false);
    });

    it('should return true when valid token exists', () => {
      mockCookies.get.mockReturnValue(JSON.stringify(testTokenData));
      mockVerifyJWT.mockReturnValue({
        userId: testUser.userId,
        email: testUser.email,
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      });

      const result = isAuthenticated();

      expect(result).toBe(true);
    });
  });

  describe('getCurrentUser', () => {
    it('should return null when no valid token exists', () => {
      mockCookies.get.mockReturnValue(undefined);

      const result = getCurrentUser();

      expect(result).toBeNull();
    });

    it('should return user data when valid token exists', () => {
      mockCookies.get.mockReturnValue(JSON.stringify(testTokenData));
      mockVerifyJWT.mockReturnValue({
        userId: testUser.userId,
        email: testUser.email,
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      });

      const result = getCurrentUser();

      expect(result).toEqual(testUser);
    });
  });

  describe('clearToken', () => {
    it('should remove the token cookie', () => {
      clearToken();

      expect(mockCookies.remove).toHaveBeenCalledWith('auth-token', { path: '/' });
    });
  });

  describe('getAuthToken', () => {
    it('should return null when no valid token exists', () => {
      mockCookies.get.mockReturnValue(undefined);

      const result = getAuthToken();

      expect(result).toBeNull();
    });

    it('should return token string when valid token exists', () => {
      mockCookies.get.mockReturnValue(JSON.stringify(testTokenData));
      mockVerifyJWT.mockReturnValue({
        userId: testUser.userId,
        email: testUser.email,
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      });

      const result = getAuthToken();

      expect(result).toBe(testToken);
    });
  });
});