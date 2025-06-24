import db from "@repo/database";
import { solicitations } from "@repo/database";
import { createTRPCRouter, procedure} from "trpc";
import { z } from "zod";
import { eq, sql, like, and } from "drizzle-orm";

// Generalized search types
export const SolicitationSearchOptsSchema = z.object({
  limit: z.number().optional(),
  offset: z.number().optional(),
  // Optional filters
  keywords: z.string().optional(),
  agency: z.string().optional(),
})
export type SolicitationSearchOpts = z.infer<typeof SolicitationSearchOptsSchema>;
export type SolicitationSearchRes = Awaited<ReturnType<typeof solicitationRouter.search>>;

export const solicitationRouter = createTRPCRouter({
  search: procedure
    .input(SolicitationSearchOptsSchema)
    .query(async ({ input }) => {
      const { limit = 20, offset = 0, keywords, agency } = input;

      const conditions = [];

      // Keyword search
      if (keywords) {
        conditions.push(like(sql`LOWER(${solicitations.solicitationTitle})`, `%${keywords.toLowerCase()}%`));
      }

      if (agency) {
        conditions.push(eq(solicitations.agency, agency));
      }

      const results = await db.query.solicitations.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        limit,
        offset,
      });

      return results;
    }),
});
