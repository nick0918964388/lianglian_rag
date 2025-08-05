import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { TRPCError } from '@trpc/server';
import { authRouter } from './auth';
import { userRepository as mockUserRepository } from '../../../lib/repositories/user.repository';
import { PasswordUtils } from '../../../lib/auth/password';
import { ERROR_MESSAGES } from '../../../lib/auth/constants';
import { User } from '@prisma/client';

// Mock the dependencies
vi.mock('../../../lib/repositories/user.repository', () => ({
  userRepository: {
    findByEmail: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../../../lib/auth/password', () => ({
  PasswordUtils: {
    verify: vi.fn(),
    hash: vi.fn(),
    validatePasswordStrength: vi.fn(),
  },
}));

describe('AuthRouter - Login Endpoint', () => {
  const originalEnv = process.env.JWT_SECRET;
  const testSecret = 'test-jwt-secret-for-auth-router-tests';

  beforeAll(() => {
    process.env.JWT_SECRET = testSecret;
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalEnv;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const createCaller = () => {
    const ctx = { req: undefined, res: undefined };
    return authRouter.createCaller(ctx);
  };

  describe('login mutation', () => {
    it('should login successfully with valid credentials', async () => {
      // Mock repository response
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);
      // Mock password verification
      vi.mocked(PasswordUtils.verify).mockResolvedValue(true);

      const caller = createCaller();
      const result = await caller.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe(ERROR_MESSAGES.LOGIN_SUCCESS);
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
      expect(result.user).toBeDefined();
      expect(result.user!.id).toBe(mockUser.id);
      expect(result.user!.email).toBe(mockUser.email);
      expect(result.user!.createdAt).toEqual(mockUser.createdAt);

      // Verify repository and password utils were called
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(PasswordUtils.verify).toHaveBeenCalledWith('password123', mockUser.passwordHash);
    });

    it('should fail login with non-existent user', async () => {
      // Mock repository to return null (user not found)
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);

      const caller = createCaller();

      await expect(caller.login({
        email: 'nonexistent@example.com',
        password: 'password123',
      })).rejects.toThrowError(TRPCError);

      try {
        await caller.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        const trpcError = error as TRPCError;
        expect(trpcError.code).toBe('UNAUTHORIZED');
        expect(trpcError.message).toBe(ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(PasswordUtils.verify).not.toHaveBeenCalled();
    });

    it('should fail login with invalid password', async () => {
      // Mock repository response
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);
      // Mock password verification to fail
      vi.mocked(PasswordUtils.verify).mockResolvedValue(false);

      const caller = createCaller();

      await expect(caller.login({
        email: 'test@example.com',
        password: 'wrongpassword',
      })).rejects.toThrowError(TRPCError);

      try {
        await caller.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        const trpcError = error as TRPCError;
        expect(trpcError.code).toBe('UNAUTHORIZED');
        expect(trpcError.message).toBe(ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(PasswordUtils.verify).toHaveBeenCalledWith('wrongpassword', mockUser.passwordHash);
    });

    it('should handle repository errors gracefully', async () => {
      // Mock repository to throw an error
      vi.mocked(mockUserRepository.findByEmail).mockRejectedValue(new Error('Database error'));

      const caller = createCaller();

      await expect(caller.login({
        email: 'test@example.com',
        password: 'password123',
      })).rejects.toThrowError(TRPCError);

      try {
        await caller.login({
          email: 'test@example.com',
          password: 'password123',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        const trpcError = error as TRPCError;
        expect(trpcError.code).toBe('INTERNAL_SERVER_ERROR');
        expect(trpcError.message).toBe(ERROR_MESSAGES.LOGIN_ERROR);
      }
    });

    it('should handle JWT generation errors gracefully', async () => {
      // Mock repository response
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);
      // Mock password verification
      vi.mocked(PasswordUtils.verify).mockResolvedValue(true);
      
      // Remove JWT secret to cause JWT generation error
      delete process.env.JWT_SECRET;

      const caller = createCaller();

      await expect(caller.login({
        email: 'test@example.com',
        password: 'password123',
      })).rejects.toThrowError(TRPCError);

      try {
        await caller.login({
          email: 'test@example.com',
          password: 'password123',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        const trpcError = error as TRPCError;
        expect(trpcError.code).toBe('INTERNAL_SERVER_ERROR');
        expect(trpcError.message).toBe(ERROR_MESSAGES.LOGIN_ERROR);
      }

      // Restore JWT secret for other tests
      process.env.JWT_SECRET = testSecret;
    });
  });

  describe('input validation', () => {
    it('should validate email format', async () => {
      const caller = createCaller();

      await expect(caller.login({
        email: 'invalid-email',
        password: 'password123',
      })).rejects.toThrowError();
    });

    it('should require email field', async () => {
      const caller = createCaller();

      await expect(caller.login({
        email: '',
        password: 'password123',
      })).rejects.toThrowError();
    });

    it('should require password field', async () => {
      const caller = createCaller();

      await expect(caller.login({
        email: 'test@example.com',
        password: '',
      })).rejects.toThrowError();
    });

    it('should handle long email addresses', async () => {
      const caller = createCaller();
      const longEmail = 'a'.repeat(250) + '@example.com'; // Exceeds EMAIL_CONFIG.MAX_LENGTH

      await expect(caller.login({
        email: longEmail,
        password: 'password123',
      })).rejects.toThrowError();
    });

    it('should normalize email to lowercase', async () => {
      // Mock repository response
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);
      // Mock password verification
      vi.mocked(PasswordUtils.verify).mockResolvedValue(true);

      const caller = createCaller();
      await caller.login({
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
      });

      // Should call repository with lowercase email
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should trim email whitespace', async () => {
      // Mock repository response
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);
      // Mock password verification
      vi.mocked(PasswordUtils.verify).mockResolvedValue(true);

      const caller = createCaller();
      await caller.login({
        email: '  test@example.com  ',
        password: 'password123',
      });

      // Should call repository with trimmed email
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    });
  });

  describe('JWT token structure', () => {
    it('should generate valid JWT token structure', async () => {
      // Mock repository response
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);
      // Mock password verification
      vi.mocked(PasswordUtils.verify).mockResolvedValue(true);

      const caller = createCaller();
      const result = await caller.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.token).toBeDefined();
      
      // JWT should have 3 parts separated by dots
      const tokenParts = result.token!.split('.');
      expect(tokenParts).toHaveLength(3);
      
      // Each part should be non-empty
      tokenParts.forEach(part => {
        expect(part.length).toBeGreaterThan(0);
      });
    });
  });

  describe('security considerations', () => {
    it('should use same error message for non-existent user and wrong password', async () => {
      const caller = createCaller();

      // Test non-existent user
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
      
      let error1: TRPCError | null = null;
      try {
        await caller.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        });
      } catch (error) {
        error1 = error as TRPCError;
      }

      // Test wrong password
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);
      vi.mocked(PasswordUtils.verify).mockResolvedValue(false);
      
      let error2: TRPCError | null = null;
      try {
        await caller.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        });
      } catch (error) {
        error2 = error as TRPCError;
      }

      // Both should return the same error message for security
      expect(error1?.message).toBe(ERROR_MESSAGES.INVALID_CREDENTIALS);
      expect(error2?.message).toBe(ERROR_MESSAGES.INVALID_CREDENTIALS);
      expect(error1?.code).toBe('UNAUTHORIZED');
      expect(error2?.code).toBe('UNAUTHORIZED');
    });
  });
});