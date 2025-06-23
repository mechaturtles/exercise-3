import { createCallerFactory, createTRPCRouter } from "../trpc";

import { helloWorldRouter } from "./hello-world";
import { solicitationRouter } from "./solicitation";

export const router = createTRPCRouter({
  helloWorld: helloWorldRouter,
  solicitation: solicitationRouter,
});

export type AppRouter = typeof router;

export const createCaller = createCallerFactory(router);
