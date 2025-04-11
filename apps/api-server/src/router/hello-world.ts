import { createTRPCRouter, procedure } from "trpc";
import { z } from "zod";

export const HelloWorldPingOpts = z.object({
  hello: z.string(),
});
export type HelloWorldPingOpts = z.infer<typeof HelloWorldPingOpts>;
export type HelloWorldPingRes = Awaited<
  ReturnType<typeof helloWorldRouter.ping>
>;

export const helloWorldRouter = createTRPCRouter({
  ping: procedure.input(HelloWorldPingOpts).query(async ({ input }) => {
    return {
      pong: input.hello,
    };
  }),
});
