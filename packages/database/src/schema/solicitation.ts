import { text, integer, serial, pgTable } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const solicitations = pgTable("solicitations", {
  id: serial("id").primaryKey(), // Local PK, don't trust external
  solicitationId: text("solicitation_id"), // External ID 
  solicitationTitle: text("solicitation_title"),
  solicitationNumber: text("solicitation_number"),
  program: text("program"),
  phase: text("phase"),
  agency: text("agency"),
  branch: text("branch"),
  solicitationYear: text("solicitation_year"),
  releaseDate: text("release_date"),
  openDate: text("open_date"),
  closeDate: text("close_date"),
});

export type SolicitationSelect = typeof solicitations.$inferSelect;
export type SolicitationInsert = typeof solicitations.$inferInsert;
export const SolicitationSelectSchema = createSelectSchema(solicitations);
export const SolicitationInsertSchema = createInsertSchema(solicitations);

export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  solicitationFK: integer("solicitation_fk").references(() => solicitations.id), // FK reference to local solicitations id
  topicTitle: text("topic_title"),
  topicNumber: text("topic_number"),
  branch: text("branch"),
  topicOpenDate: text("topic_open_date"),
  topicClosedDate: text("topic_closed_date"),
  topicDescription: text("topic_description"),
  sbirTopicLink: text("sbir_topic_link"),
});

export type TopicSelect = typeof topics.$inferSelect;
export type TopicInsert = typeof topics.$inferInsert;
export const TopicSelectSchema = createSelectSchema(topics);
export const TopicInsertSchema = createInsertSchema(topics);


export const subtopics = pgTable("subtopics", {
  id: serial("id").primaryKey(),
  topicFK: integer("topic_fk").references(() => topics.id), // FK reference to local topics id
  subtopicTitle: text("subtopic_title"),
  branch: text("branch"),
  subtopicNumber: text("subtopic_number"),
  subtopicDescription: text("subtopic_description"),
  sbirSubtopicLink: text("sbir_subtopic_link"),
});

export type SubtopicSelect = typeof subtopics.$inferSelect;
export type SubtopicInsert = typeof subtopics.$inferInsert;
export const SubtopicSelectSchema = createSelectSchema(subtopics);
export const SubtopicInsertSchema = createInsertSchema(subtopics);