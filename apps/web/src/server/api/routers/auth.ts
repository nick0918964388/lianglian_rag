import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { userRepository } from '../../../lib/repositories/user.repository';
import { PasswordUtils } from '../../../lib/auth/password';
import { PASSWORD_CONFIG, EMAIL_CONFIG, ERROR_MESSAGES } from '../../../lib/auth/constants';
import { signJWT } from '../../../lib/auth/jwt';

const registerInputSchema = z.object({
  email: z
    .string()
    .trim()
    .email(ERROR_MESSAGES.INVALID_EMAIL)
    .min(1, ERROR_MESSAGES.EMAIL_REQUIRED)
    .max(EMAIL_CONFIG.MAX_LENGTH, ERROR_MESSAGES.EMAIL_TOO_LONG)
    .toLowerCase(),
  password: z
    .string()
    .min(PASSWORD_CONFIG.MIN_LENGTH, ERROR_MESSAGES.PASSWORD_TOO_SHORT)
    .max(PASSWORD_CONFIG.MAX_LENGTH, ERROR_MESSAGES.PASSWORD_TOO_LONG),
});

const registerOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    createdAt: z.date(),
  }).optional(),
});

const loginInputSchema = z.object({
  email: z
    .string()
    .trim()
    .email(ERROR_MESSAGES.INVALID_EMAIL)
    .min(1, ERROR_MESSAGES.EMAIL_REQUIRED)
    .max(EMAIL_CONFIG.MAX_LENGTH, ERROR_MESSAGES.EMAIL_TOO_LONG)
    .toLowerCase(),
  password: z
    .string()
    .min(1, ERROR_MESSAGES.PASSWORD_REQUIRED),
});

const loginOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  token: z.string().optional(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    createdAt: z.date(),
  }).optional(),
});

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(registerInputSchema)
    .output(registerOutputSchema)
    .mutation(async ({ input }) => {
      const { email, password } = input;

      // Validate password strength
      const passwordValidation = PasswordUtils.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: ERROR_MESSAGES.PASSWORD_STRENGTH_ERROR,
          cause: passwordValidation.errors,
        });
      }

      try {
        // Check if user already exists
        const existingUser = await userRepository.findByEmail(email);
        if (existingUser) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: ERROR_MESSAGES.USER_EXISTS,
          });
        }

        // Hash password
        const passwordHash = await PasswordUtils.hash(password);

        // Create user
        const newUser = await userRepository.create({
          email,
          passwordHash,
        });

        return {
          success: true,
          message: ERROR_MESSAGES.REGISTRATION_SUCCESS,
          user: {
            id: newUser.id,
            email: newUser.email,
            createdAt: newUser.createdAt,
          },
        };
      } catch (error) {
        // Re-throw TRPC errors
        if (error instanceof TRPCError) {
          throw error;
        }

        // Handle unexpected errors
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: ERROR_MESSAGES.REGISTRATION_ERROR,
          cause: error,
        });
      }
    }),

  login: publicProcedure
    .input(loginInputSchema)
    .output(loginOutputSchema)
    .mutation(async ({ input }) => {
      const { email, password } = input;

      try {
        // Find user by email
        const user = await userRepository.findByEmail(email);
        if (!user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: ERROR_MESSAGES.INVALID_CREDENTIALS,
          });
        }

        // Verify password
        const isPasswordValid = await PasswordUtils.verify(password, user.passwordHash);
        if (!isPasswordValid) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: ERROR_MESSAGES.INVALID_CREDENTIALS,
          });
        }

        // Generate JWT token
        const token = await signJWT({
          userId: user.id,
          email: user.email,
        });

        return {
          success: true,
          message: ERROR_MESSAGES.LOGIN_SUCCESS,
          token,
          user: {
            id: user.id,
            email: user.email,
            createdAt: user.createdAt,
          },
        };
      } catch (error) {
        // Re-throw TRPC errors
        if (error instanceof TRPCError) {
          throw error;
        }

        // Handle unexpected errors
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: ERROR_MESSAGES.LOGIN_ERROR,
          cause: error,
        });
      }
    }),
});