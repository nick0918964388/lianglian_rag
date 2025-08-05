import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { UserService, type LoginUserInput } from './user.service';
import { userRepository as mockUserRepository } from '../repositories/user.repository';
import { PasswordUtils } from '../auth/password';
import { ERROR_MESSAGES } from '../auth/constants';
import { User } from '@prisma/client';

// Mock the dependencies
vi.mock('../repositories/user.repository', () => ({
  userRepository: {
    findByEmail: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../auth/password', () => ({
  PasswordUtils: {
    verify: vi.fn(),
    hash: vi.fn(),
    validatePasswordStrength: vi.fn(),
  },
}));

describe('UserService - Login Functionality', () => {
  const originalEnv = process.env.JWT_SECRET;
  const testSecret = 'test-jwt-secret-for-login-tests';

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

  const loginInput: LoginUserInput = {
    email: 'test@example.com',
    password: 'password123',
  };

  describe('loginUser', () => {
    it('should login user successfully with valid credentials', async () => {
      // Mock repository response
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);
      // Mock password verification
      vi.mocked(PasswordUtils.verify).mockResolvedValue(true);

      const result = await UserService.loginUser(loginInput);

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
      expect(result.user).toBeDefined();
      expect(result.user!.id).toBe(mockUser.id);
      expect(result.user!.email).toBe(mockUser.email);
      expect(result.user).not.toHaveProperty('passwordHash'); // Should not include password hash
      expect(result.errors).toBeUndefined();

      // Verify repository and password utils were called correctly
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(loginInput.email);
      expect(PasswordUtils.verify).toHaveBeenCalledWith(loginInput.password, mockUser.passwordHash);
    });

    it('should fail login with non-existent user', async () => {
      // Mock repository to return null (user not found)
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);

      const result = await UserService.loginUser(loginInput);

      expect(result.success).toBe(false);
      expect(result.token).toBeUndefined();
      expect(result.user).toBeUndefined();
      expect(result.errors).toEqual([ERROR_MESSAGES.INVALID_CREDENTIALS]);

      // Verify repository was called but password verification was not
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(loginInput.email);
      expect(PasswordUtils.verify).not.toHaveBeenCalled();
    });

    it('should fail login with invalid password', async () => {
      // Mock repository response
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);
      // Mock password verification to fail
      vi.mocked(PasswordUtils.verify).mockResolvedValue(false);

      const result = await UserService.loginUser(loginInput);

      expect(result.success).toBe(false);
      expect(result.token).toBeUndefined();
      expect(result.user).toBeUndefined();
      expect(result.errors).toEqual([ERROR_MESSAGES.INVALID_CREDENTIALS]);

      // Verify both repository and password utils were called
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(loginInput.email);
      expect(PasswordUtils.verify).toHaveBeenCalledWith(loginInput.password, mockUser.passwordHash);
    });

    it('should handle repository errors gracefully', async () => {
      // Mock repository to throw an error
      vi.mocked(mockUserRepository.findByEmail).mockRejectedValue(new Error('Database error'));

      const result = await UserService.loginUser(loginInput);

      expect(result.success).toBe(false);
      expect(result.token).toBeUndefined();
      expect(result.user).toBeUndefined();
      expect(result.errors).toEqual([ERROR_MESSAGES.LOGIN_ERROR]);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(loginInput.email);
    });

    it('should handle password verification errors gracefully', async () => {
      // Mock repository response
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);
      // Mock password verification to throw an error
      vi.mocked(PasswordUtils.verify).mockRejectedValue(new Error('Password verification error'));

      const result = await UserService.loginUser(loginInput);

      expect(result.success).toBe(false);
      expect(result.token).toBeUndefined();
      expect(result.user).toBeUndefined();
      expect(result.errors).toEqual([ERROR_MESSAGES.LOGIN_ERROR]);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(loginInput.email);
      expect(PasswordUtils.verify).toHaveBeenCalledWith(loginInput.password, mockUser.passwordHash);
    });

    it('should handle JWT secret missing error', async () => {
      // Mock repository response
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);
      // Mock password verification
      vi.mocked(PasswordUtils.verify).mockResolvedValue(true);
      
      // Remove JWT secret
      delete process.env.JWT_SECRET;

      const result = await UserService.loginUser(loginInput);

      expect(result.success).toBe(false);
      expect(result.token).toBeUndefined();
      expect(result.user).toBeUndefined();
      expect(result.errors).toEqual([ERROR_MESSAGES.LOGIN_ERROR]);

      // Restore JWT secret for other tests
      process.env.JWT_SECRET = testSecret;
    });

    it('should log errors in development environment', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const originalNodeEnv = process.env.NODE_ENV;
      
      // Set to development mode
      vi.stubEnv('NODE_ENV', 'development');
      
      // Mock repository to throw an error
      vi.mocked(mockUserRepository.findByEmail).mockRejectedValue(new Error('Test error'));

      await UserService.loginUser(loginInput);

      expect(consoleSpy).toHaveBeenCalledWith('Error logging in user:', expect.any(Error));

      // Cleanup
      consoleSpy.mockRestore();
      vi.unstubAllEnvs();
      if (originalNodeEnv) {
        process.env.NODE_ENV = originalNodeEnv;
      }
    });

    it('should not log errors in production environment', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const originalNodeEnv = process.env.NODE_ENV;
      
      // Set to production mode
      vi.stubEnv('NODE_ENV', 'production');
      
      // Mock repository to throw an error
      vi.mocked(mockUserRepository.findByEmail).mockRejectedValue(new Error('Test error'));

      await UserService.loginUser(loginInput);

      expect(consoleSpy).not.toHaveBeenCalled();

      // Cleanup
      consoleSpy.mockRestore();
      vi.unstubAllEnvs();
      if (originalNodeEnv) {
        process.env.NODE_ENV = originalNodeEnv;
      }
    });
  });

  describe('JWT Token Generation', () => {
    it('should generate valid JWT token structure', async () => {
      // Mock repository response
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);
      // Mock password verification
      vi.mocked(PasswordUtils.verify).mockResolvedValue(true);

      const result = await UserService.loginUser(loginInput);

      expect(result.success).toBe(true);
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

  describe('Data Security', () => {
    it('should not return password hash in user object', async () => {
      // Mock repository response
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser);
      // Mock password verification
      vi.mocked(PasswordUtils.verify).mockResolvedValue(true);

      const result = await UserService.loginUser(loginInput);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user).not.toHaveProperty('passwordHash');
      
      // But should have other user properties
      expect(result.user!.id).toBe(mockUser.id);
      expect(result.user!.email).toBe(mockUser.email);
      expect(result.user!.createdAt).toEqual(mockUser.createdAt);
      expect(result.user!.updatedAt).toEqual(mockUser.updatedAt);
    });
  });
});