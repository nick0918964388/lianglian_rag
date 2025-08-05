import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTRPCMsw } from 'msw-trpc';
import { TRPCError } from '@trpc/server';
import { authRouter } from './auth';

// Mock the dependencies
vi.mock('../../../lib/repositories/user.repository', () => ({
  UserRepository: {
    findByEmail: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../../../lib/auth/password', () => ({
  PasswordUtils: {
    validatePasswordStrength: vi.fn(),
    hash: vi.fn(),
  },
}));

import { UserRepository } from '../../../lib/repositories/user.repository';
import { PasswordUtils } from '../../../lib/auth/password';

const mockUserRepository = vi.mocked(UserRepository);
const mockPasswordUtils = vi.mocked(PasswordUtils);

describe('authRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register procedure', () => {
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

      // Create caller
      const caller = authRouter.createCaller({});
      
      const result = await caller.register(validInput);

      expect(result.success).toBe(true);
      expect(result.message).toBe('User registered successfully');
      expect(result.user).toEqual({
        id: 'user_123',
        email: 'test@example.com',
        createdAt: mockUser.createdAt,
      });

      // Verify method calls
      expect(mockPasswordUtils.validatePasswordStrength).toHaveBeenCalledWith(validInput.password);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(validInput.email);
      expect(mockPasswordUtils.hash).toHaveBeenCalledWith(validInput.password);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: validInput.email,
        passwordHash: 'hashed_password',
      });
    });

    it('should throw error for invalid email format', async () => {
      const caller = authRouter.createCaller({});
      
      await expect(caller.register({
        email: 'invalid-email',
        password: 'StrongPass123!',
      })).rejects.toMatchObject({
        code: 'BAD_REQUEST',
      });
    });

    it('should throw error for short password', async () => {
      const caller = authRouter.createCaller({});
      
      await expect(caller.register({
        email: 'test@example.com',
        password: 'short',
      })).rejects.toMatchObject({
        code: 'BAD_REQUEST',
      });
    });

    it('should throw error for weak password', async () => {
      mockPasswordUtils.validatePasswordStrength.mockReturnValue({
        isValid: false,
        errors: ['Password must contain at least one uppercase letter'],
      });

      const caller = authRouter.createCaller({});
      
      await expect(caller.register({
        email: 'test@example.com',
        password: 'weakpassword123',
      })).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Password does not meet strength requirements',
      });
    });

    it('should throw conflict error for existing user', async () => {
      mockPasswordUtils.validatePasswordStrength.mockReturnValue({
        isValid: true,
        errors: [],
      });
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      const caller = authRouter.createCaller({});
      
      await expect(caller.register(validInput)).rejects.toMatchObject({
        code: 'CONFLICT',
        message: 'User with this email already exists',
      });
    });

    it('should handle repository errors gracefully', async () => {
      mockPasswordUtils.validatePasswordStrength.mockReturnValue({
        isValid: true,
        errors: [],
      });
      mockUserRepository.findByEmail.mockRejectedValue(new Error('Database error'));

      const caller = authRouter.createCaller({});
      
      await expect(caller.register(validInput)).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred during registration',
      });
    });

    it('should handle password hashing errors', async () => {
      mockPasswordUtils.validatePasswordStrength.mockReturnValue({
        isValid: true,
        errors: [],
      });
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordUtils.hash.mockRejectedValue(new Error('Hashing failed'));

      const caller = authRouter.createCaller({});
      
      await expect(caller.register(validInput)).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred during registration',
      });
    });

    it('should handle user creation errors', async () => {
      mockPasswordUtils.validatePasswordStrength.mockReturnValue({
        isValid: true,
        errors: [],
      });
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordUtils.hash.mockResolvedValue('hashed_password');
      mockUserRepository.create.mockRejectedValue(new Error('Creation failed'));

      const caller = authRouter.createCaller({});
      
      await expect(caller.register(validInput)).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred during registration',
      });
    });

    it('should preserve TRPC errors from repository', async () => {
      mockPasswordUtils.validatePasswordStrength.mockReturnValue({
        isValid: true,
        errors: [],
      });
      mockUserRepository.findByEmail.mockRejectedValue(new TRPCError({
        code: 'FORBIDDEN',
        message: 'Access denied',
      }));

      const caller = authRouter.createCaller({});
      
      await expect(caller.register(validInput)).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: 'Access denied',
      });
    });
  });
});