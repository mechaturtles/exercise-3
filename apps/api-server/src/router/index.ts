import { createCallerFactory, createTRPCRouter } from "../trpc";

import { helloWorldRouter } from "./hello-world";

export const router = createTRPCRouter({
  helloWorld: helloWorldRouter,
});

export type AppRouter = typeof router;

export const createCaller = createCallerFactory(router);
