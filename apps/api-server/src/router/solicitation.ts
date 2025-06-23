import db from "@repo/database";
import { solicitations } from "@repo/database/src/schema/solicitation";
import { createTRPCRouter, t } from "../trpc";
import { z } from "zod";
import { eq } from "drizzle-orm";

export const solicitationRouter = createTRPCRouter({
  getAll: t.procedure
    .input(z.object({
      limit: z.number().optional(),
      offset: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const limit = input?.limit || 20; // Default to 20 if no limit is provided
      const offset = input?.offset|| 0; // Default to 0 if no start is provided
      const solicitationsPage = await db
        .select()
        .from(solicitations)
        .limit(limit)
        .offset(offset);
      return solicitationsPage;
    }),
  getById: t.procedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input }) => {
      const solicitation = await db
        .select()
        .from(solicitations)
        .where(eq(solicitations.id, input.id))
        .then((rows) => rows[0]);
      return solicitation;
    }),
});
