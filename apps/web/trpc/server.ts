import "server-only";

import { cache } from "react";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import SuperJSON from "superjson";

import { type AppRouter } from "@repo/api-server";

const api = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${process.env.NEXT_PUBLIC_API_SERVER_URL}/trpc`,
      transformer: SuperJSON,
    }),
  ],
});

const cachedApi = new Proxy(api, {
  get(target, prop) {
    const original = target[prop as keyof typeof target];
    if (typeof original === "object" && original !== null) {
      return new Proxy(original, {
        get(target, prop) {
          const method = target[prop as keyof typeof target];
          if (typeof method === "function") {
            return cache(method);
          }
          return method;
        },
      });
    }
    return original;
  },
});

export { cachedApi as api };
