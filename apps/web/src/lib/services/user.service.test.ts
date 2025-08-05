import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from './user.service';

// Mock the dependencies
vi.mock('../repositories/user.repository', () => ({
  UserRepository: {
    findByEmail: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../auth/password', () => ({
  PasswordUtils: {
    validatePasswordStrength: vi.fn(),
    hash: vi.fn(),
    verify: vi.fn(),
  },
}));

import { UserRepository } from '../repositories/user.repository';
import { PasswordUtils } from '../auth/password';

const mockUserRepository = vi.mocked(UserRepository);
const mockPasswordUtils = vi.mocked(PasswordUtils);

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerUser', () => {
    const validInput = {
      email: 'test@example.com',
      password: 'StrongPass123!',
    };

    const mockUser = {
      id: 'user_123',
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should register a user successfully', async () => {
      // Setup mocks
      mockPasswordUtils.validatePasswordStrength.mockReturnValue({
        isValid: true,
        errors: [],
      });
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordUtils.hash.mockResolvedValue('hashed_password');
      mockUserRepository.create.mockResolvedValue(mockUser);

      const result = await UserService.registerUser(validInput);

      expect(result.success).toBe(true);
      expect(result.user).toEqual({
        id: 'user_123',
        email: 'test@example.com',
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
      expect(result.errors).toBeUndefined();

      // Verify method calls
      expect(mockPasswordUtils.validatePasswordStrength).toHaveBeenCalledWith(validInput.password);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(validInput.email);
      expect(mockPasswordUtils.hash).toHaveBeenCalledWith(validInput.password);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: validInput.email,
        passwordHash: 'hashed_password',
      });
    });

    it('should reject registration with weak password', async () => {
      mockPasswordUtils.validatePasswordStrength.mockReturnValue({
        isValid: false,
        errors: ['Password must be at least 8 characters long'],
      });

      const result = await UserService.registerUser({
        email: 'test@example.com',
        password: 'weak',
      });

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(['Password must be at least 8 characters long']);
      expect(result.user).toBeUndefined();

      // Should not proceed to check existing user or create user
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should reject registration for existing user', async () => {
      mockPasswordUtils.validatePasswordStrength.mockReturnValue({
        isValid: true,
        errors: [],
      });
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await UserService.registerUser(validInput);

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(['User with this email already exists']);
      expect(result.user).toBeUndefined();

      // Should not proceed to create user
      expect(mockPasswordUtils.hash).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should handle unexpected errors gracefully', async () => {
      mockPasswordUtils.validatePasswordStrength.mockReturnValue({
        isValid: true,
        errors: [],
      });
      mockUserRepository.findByEmail.mockRejectedValue(new Error('Database error'));

      // Mock console.error and NODE_ENV to test development logging
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const result = await UserService.registerUser(validInput);

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(['An unexpected error occurred during registration']);
      expect(result.user).toBeUndefined();

      expect(consoleSpy).toHaveBeenCalledWith('Error registering user:', expect.any(Error));
      
      // Restore environment and console
      process.env.NODE_ENV = originalEnv;
      consoleSpy.mockRestore();
    });
  });

  describe('authenticateUser', () => {
    const mockUser = {
      id: 'user_123',
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should authenticate user with correct credentials', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockPasswordUtils.verify.mockResolvedValue(true);

      const result = await UserService.authenticateUser('test@example.com', 'correct_password');

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockPasswordUtils.verify).toHaveBeenCalledWith('correct_password', 'hashed_password');
    });

    it('should return null for non-existent user', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result = await UserService.authenticateUser('nonexistent@example.com', 'password');

      expect(result).toBeNull();
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(mockPasswordUtils.verify).not.toHaveBeenCalled();
    });

    it('should return null for incorrect password', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockPasswordUtils.verify.mockResolvedValue(false);

      const result = await UserService.authenticateUser('test@example.com', 'wrong_password');

      expect(result).toBeNull();
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockPasswordUtils.verify).toHaveBeenCalledWith('wrong_password', 'hashed_password');
    });

    it('should handle unexpected errors gracefully', async () => {
      mockUserRepository.findByEmail.mockRejectedValue(new Error('Database error'));

      // Mock console.error and NODE_ENV to test development logging
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const result = await UserService.authenticateUser('test@example.com', 'password');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Error authenticating user:', expect.any(Error));
      
      // Restore environment and console
      process.env.NODE_ENV = originalEnv;
      consoleSpy.mockRestore();
    });
  });
});