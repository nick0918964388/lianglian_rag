import { initTRPC, TRPCError } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import { ZodError } from 'zod';
import superjson from 'superjson';

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

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  // TODO: Add authentication check here when NextAuth is integrated
  return next({
    ctx,
  });
});