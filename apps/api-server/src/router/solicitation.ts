import db from "@repo/database";
import { solicitations, topics, subtopics } from "@repo/database";
import { createTRPCRouter, procedure} from "trpc";
import { z } from "zod";
import { getTableColumns, eq, sql, like, and } from "drizzle-orm";

// Generalized solicitation search types
export const SolicitationSearchOptsSchema = z.object({
  limit: z.number().optional(),
  offset: z.number().optional(),
  // Optional filters
  id: z.number().optional(),
  keywords: z.string().optional(),
  agency: z.string().optional(),
})
export type SolicitationSearchOpts = z.infer<typeof SolicitationSearchOptsSchema>;
export type SolicitationSearchRes = Awaited<ReturnType<typeof solicitationRouter.search>>;

// Generalized topics search types
export const TopicsSearchOptsSchema = z.object({
  limit: z.number().optional(),
  offset: z.number().optional(),
  // Optional filters
  id: z.number().optional(),
  solicitationFK: z.number().optional(),
  keywords: z.string().optional(),
  solicitation: z.object({
    agency: z.string().optional(),
  }).optional(),
});
export type TopicsSearchOpts = z.infer<typeof TopicsSearchOptsSchema>;
export type TopicsSearchRes = Awaited<ReturnType<typeof solicitationRouter.searchTopics>>;

export const solicitationRouter = createTRPCRouter({
  search: procedure
    .input(SolicitationSearchOptsSchema)
    .query(async ({ input }) => {
      const { limit = 20, offset = 0, id, keywords, agency } = input;
      const conditions = [];

      // ID filter
      if (id) {
        conditions.push(eq(solicitations.id, id));
      }

      // Keyword search
      if (keywords) {
        conditions.push(like(sql`LOWER(${solicitations.solicitationTitle})`, `%${keywords.toLowerCase()}%`));
      }

      // Agency filter
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
    searchTopics: procedure
      .input(TopicsSearchOptsSchema)
      .query(async ({ input }) => {
        const { limit = 20, offset = 0, id, keywords, solicitationFK, solicitation } = input;
        const conditions = [];

        // ID filter
        if (id) {
          conditions.push(eq(topics.id, id));
        } 

        // Solicitation FK filter
        if (solicitationFK) {
          conditions.push(eq(topics.solicitationFK, solicitationFK));
        }

        // Keyword search
        if (keywords) {
          conditions.push(like(sql`LOWER(${topics.topicTitle})`, `%${keywords.toLowerCase()}%`));
        }

        // Solicitation filter
        if (solicitation) {
          // Agency filter
          if (solicitation.agency) {
            conditions.push(eq(solicitations.agency, solicitation.agency));
          }
          // For future expansion
        }

        const results = await db
          .select({
            ...getTableColumns(topics),
            solicitation: {
              ...getTableColumns(solicitations)
            }
          })
          .from(topics)
          .leftJoin(solicitations, eq(topics.solicitationFK, solicitations.id))
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .limit(limit)
          .offset(offset);
        return results;
      }),
});
