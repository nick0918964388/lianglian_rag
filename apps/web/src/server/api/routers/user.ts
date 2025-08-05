import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { userRepository } from '../../../lib/repositories/user.repository';
import { TRPCError } from '@trpc/server';

// Input validation schemas
const updateProfileSchema = z.object({
  email: z.string().email().optional(),
  // Add other profile fields as needed
});

export const userRouter = createTRPCRouter({
  /**
   * Get current user profile
   * Protected endpoint that requires authentication
   */
  getProfile: protectedProcedure
    .query(async ({ ctx }) => {
      // User is automatically available from auth middleware
      const { user } = ctx.auth;
      
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      };
    }),

  /**
   * Update current user profile
   * Protected endpoint that requires authentication
   */
  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx.auth;
      
      try {
        // Check if email is being updated and if it's already taken
        if (input.email) {
          const existingUser = await userRepository.findByEmail(input.email);
          if (existingUser && existingUser.id !== userId) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'Email address is already in use',
            });
          }
        }

        // Update user profile
        const updatedUser = await userRepository.update(userId, {
          ...(input.email && { email: input.email }),
          updatedAt: new Date(),
        });

        if (!updatedUser) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }

        return {
          success: true,
          message: 'Profile updated successfully',
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update profile',
        });
      }
    }),

  /**
   * Delete current user account
   * Protected endpoint that requires authentication
   */
  deleteAccount: protectedProcedure
    .mutation(async ({ ctx }) => {
      const { userId } = ctx.auth;
      
      try {
        const deletedUser = await userRepository.delete(userId);
        
        if (!deletedUser) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }

        return {
          success: true,
          message: 'Account deleted successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete account',
        });
      }
    }),

  /**
   * Get user statistics (example of another protected endpoint)
   * Protected endpoint that requires authentication
   */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const { user } = ctx.auth;
      
      // This is a simple example - in a real app you might aggregate data from multiple sources
      return {
        success: true,
        stats: {
          userId: user.id,
          memberSince: user.createdAt,
          lastLogin: new Date(), // Would be tracked in a real app
          // Add other stats as needed
          datasetsCount: 0, // Placeholder - would query actual datasets
          queriesCount: 0,  // Placeholder - would query actual queries
        },
      };
    }),

  /**
   * Test endpoint to verify authentication is working
   * Protected endpoint that requires authentication
   */
  testAuth: protectedProcedure
    .query(async ({ ctx }) => {
      const { user, userId } = ctx.auth;
      
      return {
        success: true,
        message: 'Authentication successful',
        authenticatedUser: {
          id: userId,
          email: user.email,
          authTime: new Date(),
        },
      };
    }),
});