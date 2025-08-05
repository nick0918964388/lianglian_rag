import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { signJWT } from './jwt';

describe('JWT Input Validation (Senior Developer Refactoring)', () => {
  const originalEnv = process.env.JWT_SECRET;
  const testSecret = 'test-jwt-secret-for-validation-tests';
  
  beforeAll(() => {
    process.env.JWT_SECRET = testSecret;
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalEnv;
  });

  describe('signJWT input validation', () => {
    it('should reject null payload', async () => {
      await expect(signJWT(null as any)).rejects.toThrow('Invalid payload: payload must be an object');
    });

    it('should reject undefined payload', async () => {
      await expect(signJWT(undefined as any)).rejects.toThrow('Invalid payload: payload must be an object');
    });

    it('should reject string payload', async () => {
      await expect(signJWT('invalid' as any)).rejects.toThrow('Invalid payload: payload must be an object');
    });

    it('should reject payload without userId', async () => {
      await expect(signJWT({ email: 'test@example.com' } as any)).rejects.toThrow('Invalid payload: userId is required and must be a non-empty string');
    });

    it('should reject payload with empty userId', async () => {
      await expect(signJWT({ userId: '', email: 'test@example.com' })).rejects.toThrow('Invalid payload: userId is required and must be a non-empty string');
    });

    it('should reject payload with whitespace-only userId', async () => {
      await expect(signJWT({ userId: '   ', email: 'test@example.com' })).rejects.toThrow('Invalid payload: userId is required and must be a non-empty string');
    });

    it('should reject payload without email', async () => {
      await expect(signJWT({ userId: 'user-123' } as any)).rejects.toThrow('Invalid payload: email is required and must be a non-empty string');
    });

    it('should reject payload with empty email', async () => {
      await expect(signJWT({ userId: 'user-123', email: '' })).rejects.toThrow('Invalid payload: email is required and must be a non-empty string');
    });

    it('should reject payload with whitespace-only email', async () => {
      await expect(signJWT({ userId: 'user-123', email: '   ' })).rejects.toThrow('Invalid payload: email is required and must be a non-empty string');
    });

    it('should accept valid payload', async () => {
      const token = await signJWT({ userId: 'user-123', email: 'test@example.com' });
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });
  });
});