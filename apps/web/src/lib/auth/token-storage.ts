import Cookies from 'js-cookie';
import { verifyJWT } from './jwt';

const TOKEN_KEY = 'auth-token';
const TOKEN_EXPIRY_DAYS = 1; // Token expires in 1 day, matching JWT expiration

export interface StoredToken {
  token: string;
  user: {
    userId: string;
    email: string;
  };
}

/**
 * Store JWT token securely in cookies
 * Uses httpOnly-like security by storing in secure cookies when possible
 */
export function storeToken(token: string, user: { userId: string; email: string }): void {
  try {
    const tokenData: StoredToken = { token, user };
    
    // Store in cookie with security options
    Cookies.set(TOKEN_KEY, JSON.stringify(tokenData), {
      expires: TOKEN_EXPIRY_DAYS,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict', // CSRF protection
      path: '/', // Available site-wide
    });
  } catch (error) {
    console.error('Failed to store token:', error);
    throw new Error('Failed to store authentication token');
  }
}

/**
 * Retrieve and validate stored JWT token
 * Returns null if token is invalid, expired, or doesn't exist
 */
export function getStoredToken(): StoredToken | null {
  try {
    const storedData = Cookies.get(TOKEN_KEY);
    
    if (!storedData) {
      return null;
    }

    let tokenData: StoredToken;
    try {
      tokenData = JSON.parse(storedData);
    } catch (parseError) {
      console.warn('Invalid token data format, clearing token');
      clearToken();
      return null;
    }
    
    // Validate token structure with more comprehensive checks
    if (!tokenData || 
        typeof tokenData !== 'object' ||
        !tokenData.token || 
        typeof tokenData.token !== 'string' ||
        !tokenData.user?.userId || 
        !tokenData.user?.email ||
        typeof tokenData.user.userId !== 'string' ||
        typeof tokenData.user.email !== 'string') {
      console.warn('Invalid token structure, clearing token');
      clearToken();
      return null;
    }

    // Verify JWT token is still valid
    const payload = verifyJWT(tokenData.token);
    
    // Ensure payload matches stored user data
    if (payload.userId !== tokenData.user.userId || payload.email !== tokenData.user.email) {
      console.warn('Token payload mismatch, clearing token');
      clearToken();
      return null;
    }

    return tokenData;
  } catch (error) {
    // Token is invalid or expired, clear it
    console.warn('Token validation failed:', error);
    clearToken();
    return null;
  }
}

/**
 * Check if user is currently authenticated
 */
export function isAuthenticated(): boolean {
  return getStoredToken() !== null;
}

/**
 * Get current user information if authenticated
 */
export function getCurrentUser(): { userId: string; email: string } | null {
  const tokenData = getStoredToken();
  return tokenData?.user || null;
}

/**
 * Clear stored authentication token
 */
export function clearToken(): void {
  Cookies.remove(TOKEN_KEY, { path: '/' });
}

/**
 * Get raw JWT token for API requests
 */
export function getAuthToken(): string | null {
  const tokenData = getStoredToken();
  return tokenData?.token || null;
}

/**
 * Check if token is close to expiration (within 15 minutes)
 * Useful for implementing token refresh logic
 */
export function isTokenNearExpiry(): boolean {
  try {
    const tokenData = getStoredToken();
    if (!tokenData) return false;

    const payload = verifyJWT(tokenData.token);
    const now = Math.floor(Date.now() / 1000);
    const timeToExpiry = payload.exp - now;
    
    // Return true if token expires within 15 minutes (900 seconds)
    return timeToExpiry <= 900 && timeToExpiry > 0;
  } catch (error) {
    return false;
  }
}