import { initTRPC, TRPCError } from "@trpc/server";
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { Request, Response } from "express";
import superjson from "superjson";
import { ZodError } from "zod";

export type Context = {
  req: Request;
  res: Response;
};
export type Router = ReturnType<typeof createTRPCRouter>;

export const createContext = async (
  opts: CreateExpressContextOptions,
): Promise<Context> => {
  return opts;
};

export const t = initTRPC.context<Context>().create({
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

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

const errorHandler = t.middleware(
  async ({ next, path, input, getRawInput }) => {
    const res = await next();

    if (!res.ok) {
      const rawInput = await getRawInput();
      const timestamp = new Date();
      const statusCode = getHTTPStatusCodeFromError(res.error);
      const errorObject = {
        timestamp,
        env: process.env.NODE_ENV,
        path,
        input,
        rawInput: JSON.stringify(rawInput),
        statusCode,
        error: res.error,
      };

      console.error("Error Occured in TRPC:", errorObject);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      });
    }

    return res;
  },
);

export const procedure = t.procedure.use(timingMiddleware).use(errorHandler);
