"use client";

import { httpBatchLink } from "@trpc/client";
import { createTRPCClient } from "@trpc/client";
import { useMemo } from "react";
import SuperJSON from "superjson";

import { AppRouter } from "@repo/api-server";

export function useAPI() {
  const api = useMemo(
    () =>
      createTRPCClient<AppRouter>({
        links: [
          httpBatchLink({
            url: `${process.env.NEXT_PUBLIC_API_SERVER_URL}/trpc`,
            transformer: SuperJSON,
          }),
        ],
      }),
    [],
  );

  return api;
}
