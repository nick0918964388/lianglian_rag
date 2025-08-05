import { TRPCError } from '@trpc/server';
import { verifyJWT } from '../../../lib/auth/jwt';
import { userRepository } from '../../../lib/repositories/user.repository';
import type { User } from '@prisma/client';

// Extended context type with authenticated user
export interface AuthenticatedContext {
  user: Omit<User, 'passwordHash'>;
  userId: string;
}

/**
 * Authentication middleware for tRPC procedures
 * Validates JWT token and adds user information to context
 */
export async function authenticateUser(
  authHeader: string | undefined
): Promise<AuthenticatedContext> {
  // Check if authorization header exists
  if (!authHeader) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authorization header is required',
    });
  }

  // Extract token from Bearer format
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7)
    : authHeader;

  if (!token) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid authorization format. Expected: Bearer <token>',
    });
  }

  try {
    // Verify JWT token
    const payload = verifyJWT(token);
    
    if (!payload.userId || !payload.email) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid token payload',
      });
    }

    // Fetch current user from database to ensure they still exist and are active
    const user = await userRepository.findById(payload.userId);
    
    if (!user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User not found or account deactivated',
      });
    }

    // Verify email matches (additional security check)
    if (user.email !== payload.email) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Token payload does not match user data',
      });
    }

    // Remove password hash from user object
    const { passwordHash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      userId: user.id,
    };
  } catch (error) {
    // Handle JWT verification errors
    if (error instanceof TRPCError) {
      throw error;
    }

    // Handle JWT-specific errors
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Token has expired',
        });
      }
      
      if (error.message.includes('invalid')) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid token',
        });
      }
    }

    // Generic authentication error
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication failed',
    });
  }
}

/**
 * Helper function to extract authorization header from request
 */
export function getAuthorizationHeader(req: Request | undefined): string | undefined {
  if (!req) {
    return undefined;
  }

  // Try to get from Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    return authHeader;
  }

  // Fallback: try to get from custom header (for compatibility)
  return req.headers.get('x-authorization') || undefined;
}

/**
 * Create authenticated context for tRPC procedures
 * This function should be used in protected tRPC procedures
 */
export async function createAuthenticatedContext(
  req: Request | undefined
): Promise<AuthenticatedContext> {
  const authHeader = getAuthorizationHeader(req);
  return await authenticateUser(authHeader);
}

/**
 * Type guard to check if context has authenticated user
 */
export function isAuthenticatedContext(
  ctx: any
): ctx is { auth: AuthenticatedContext } {
  return ctx && ctx.auth && ctx.auth.user && ctx.auth.userId;
}

/**
 * Higher-order function to create protected tRPC procedures
 * Usage example:
 * 
 * const protectedProcedure = publicProcedure.use(withAuth);
 * 
 * const myProtectedRoute = protectedProcedure
 *   .query(({ ctx }) => {
 *     // ctx.auth.user is now available and typed
 *     return ctx.auth.user;
 *   });
 */
export const withAuth = async (opts: any) => {
  const { ctx, next } = opts;
  
  try {
    const authContext = await createAuthenticatedContext(ctx.req);
    
    // Add auth context to the existing context
    return next({
      ctx: {
        ...ctx,
        auth: authContext,
      },
    });
  } catch (error) {
    // Re-throw tRPC errors as-is
    if (error instanceof TRPCError) {
      throw error;
    }
    
    // Wrap other errors in tRPC error
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Authentication middleware failed',
      cause: error,
    });
  }
};