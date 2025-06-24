import db from "@repo/database";
import { solicitations } from "@repo/database";
import { createTRPCRouter, procedure} from "trpc";
import { z } from "zod";
import { eq } from "drizzle-orm";

export const SolicitationGetAllOpts = z.object({
  limit: z.number().optional(),
  offset: z.number().optional(),
});
export type SolicitationGetAllOpts = z.infer<typeof SolicitationGetAllOpts>;

export const SolicitationGetByIdOpts = z.object({
  id: z.number(),
});
export type SolicitationGetByIdOpts = z.infer<typeof SolicitationGetByIdOpts>;

export type SolicitationGetAllRes = Awaited<ReturnType<typeof solicitationRouter.getAll>>;
export type SolicitationGetByIdRes = Awaited<ReturnType<typeof solicitationRouter.getById>>;


export const solicitationRouter = createTRPCRouter({
  getAll: procedure
    .input(SolicitationGetAllOpts)
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
  getById: procedure
    .input(SolicitationGetByIdOpts)
    .query(async ({ input }) => {
      const solicitation = await db
        .select()
        .from(solicitations)
        .where(eq(solicitations.id, input.id))
        .then((rows) => rows[0]);
      return solicitation;
    }),
});
