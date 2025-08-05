import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { signJWT, verifyJWT, decodeJWT, JWT_ERROR_MESSAGES, type JWTPayload } from './jwt';

describe('JWT Utilities', () => {
  const originalEnv = process.env.JWT_SECRET;
  const testSecret = 'test-jwt-secret-key-for-testing';
  
  const testPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: 'user-123',
    email: 'test@example.com',
  };

  beforeAll(() => {
    process.env.JWT_SECRET = testSecret;
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalEnv;
  });

  describe('signJWT', () => {
    it('should sign a JWT token with valid payload', async () => {
      const token = await signJWT(testPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts separated by dots
    });

    it('should throw error when JWT_SECRET is missing', async () => {
      delete process.env.JWT_SECRET;
      
      await expect(signJWT(testPayload)).rejects.toThrow(JWT_ERROR_MESSAGES.SECRET_MISSING);
      
      process.env.JWT_SECRET = testSecret; // Restore for other tests
    });

    it('should include user data in token payload', async () => {
      const token = await signJWT(testPayload);
      const decoded = decodeJWT(token);
      
      expect(decoded).toBeDefined();
      expect(decoded!.userId).toBe(testPayload.userId);
      expect(decoded!.email).toBe(testPayload.email);
      expect(decoded!.iat).toBeDefined(); // issued at time
      expect(decoded!.exp).toBeDefined(); // expiration time
    });
  });

  describe('verifyJWT', () => {
    it('should verify and decode a valid JWT token', async () => {
      const token = await signJWT(testPayload);
      const decoded = await verifyJWT(token);
      
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('should throw error for invalid token (wrong signature)', async () => {
      // Create a properly formatted JWT but with invalid signature
      const validToken = await signJWT(testPayload);
      const tokenParts = validToken.split('.');
      const invalidToken = tokenParts[0] + '.' + tokenParts[1] + '.invalid-signature';
      
      await expect(verifyJWT(invalidToken)).rejects.toThrow(JWT_ERROR_MESSAGES.TOKEN_INVALID);
    });

    it('should throw error for malformed token', async () => {
      const malformedToken = 'not-a-jwt-token';
      
      await expect(verifyJWT(malformedToken)).rejects.toThrow(JWT_ERROR_MESSAGES.TOKEN_MALFORMED);
    });

    it('should throw error when JWT_SECRET is missing', async () => {
      const token = await signJWT(testPayload);
      delete process.env.JWT_SECRET;
      
      await expect(verifyJWT(token)).rejects.toThrow(JWT_ERROR_MESSAGES.SECRET_MISSING);
      
      process.env.JWT_SECRET = testSecret; // Restore for other tests
    });

    it('should throw error for token signed with different secret', async () => {
      const token = await signJWT(testPayload);
      process.env.JWT_SECRET = 'different-secret';
      
      await expect(verifyJWT(token)).rejects.toThrow(JWT_ERROR_MESSAGES.TOKEN_INVALID);
      
      process.env.JWT_SECRET = testSecret; // Restore for other tests
    });
  });

  describe('decodeJWT', () => {
    it('should decode a valid JWT token without verification', async () => {
      const token = await signJWT(testPayload);
      const decoded = decodeJWT(token);
      
      expect(decoded).toBeDefined();
      expect(decoded!.userId).toBe(testPayload.userId);
      expect(decoded!.email).toBe(testPayload.email);
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.jwt.token';
      const decoded = decodeJWT(invalidToken);
      
      expect(decoded).toBeNull();
    });

    it('should return null for malformed token', () => {
      const malformedToken = 'not-a-jwt-token';
      const decoded = decodeJWT(malformedToken);
      
      expect(decoded).toBeNull();
    });

    it('should decode token even with wrong secret (no verification)', async () => {
      const token = await signJWT(testPayload);
      process.env.JWT_SECRET = 'different-secret';
      
      const decoded = decodeJWT(token);
      
      expect(decoded).toBeDefined();
      expect(decoded!.userId).toBe(testPayload.userId);
      expect(decoded!.email).toBe(testPayload.email);
      
      process.env.JWT_SECRET = testSecret; // Restore for other tests
    });
  });

  describe('Token expiration', () => {
    it('should include expiration time in token', async () => {
      const token = await signJWT(testPayload);
      const decoded = decodeJWT(token);
      
      expect(decoded!.exp).toBeDefined();
      expect(decoded!.iat).toBeDefined();
      
      // Token should expire in 24 hours (86400 seconds)
      const expirationTime = decoded!.exp! - decoded!.iat!;
      expect(expirationTime).toBe(86400); // 24 hours in seconds
    });
  });

  describe('Token payload structure', () => {
    it('should maintain consistent payload structure', async () => {
      const token = await signJWT(testPayload);
      const decoded = await verifyJWT(token);
      
      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('email');
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
      
      expect(typeof decoded.userId).toBe('string');
      expect(typeof decoded.email).toBe('string');
      expect(typeof decoded.iat).toBe('number');
      expect(typeof decoded.exp).toBe('number');
    });
  });
});