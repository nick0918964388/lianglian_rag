import { initTRPC, TRPCError } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import { ZodError } from 'zod';
import superjson from 'superjson';
import { createAuthenticatedContext, type AuthenticatedContext } from './middleware/auth';

interface CreateContextOptions {
  req?: CreateNextContextOptions['req'];
  res?: CreateNextContextOptions['res'];
}

const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    req: opts.req,
    res: opts.res,
  };
};

export const createTRPCContext = (opts: CreateNextContextOptions) => {
  return createInnerTRPCContext({
    req: opts.req,
    res: opts.res,
  });
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;

export const publicProcedure = t.procedure;

/**
 * Protected procedure that requires authentication
 * Automatically adds authenticated user context
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  try {
    // Create authenticated context using our middleware
    const authContext = await createAuthenticatedContext(ctx.req as Request);
    
    // Continue with the authenticated context
    return next({
      ctx: {
        ...ctx,
        auth: authContext,
      },
    });
  } catch (error) {
    // Authentication middleware will throw appropriate tRPC errors
    throw error;
  }
});