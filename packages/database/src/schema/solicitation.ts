import { text, integer, varchar, date, serial, pgTable } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const solicitations = pgTable("solicitations", {
  id: serial("id").primaryKey(), // Local PK, don't trust external
  solicitationId: integer("solicitation_id"), // External ID, unknown constraints
  solicitationTitle: text("solicitation_title").notNull(), // Officially 1-255 chars, but don't trust it
  solicitationNumber: varchar("solicitation_number", { length: 50 }), // Doc lies, this is more than 20 chars, ex: "HHS-2025-ACL-NIDILRR-BISB-0109"
  program: text("program"), // SBIR, STTR, or BOTH
  phase: varchar("phase", { length: 20 }), // Doc lies, phase is Phase I, Phase II, or BOTH
  agency: varchar("agency", { length: 6 }), // Officially 2-4 chars, ex: DOD
  branch: varchar("branch", { length: 6 }), // Officially 2-4 chars, ex: "USAF"
  solicitationYear: integer("solicitation_year"), // ex: 2024
  // Dates are YYYY/MM/DD format
  // ex: 1967/07/18
  releaseDate: date("release_date"),
  openDate: date("open_date"),
  closeDate: date("close_date"),
  applicationDueDate: date("application_due_date").array(), // Doc lies, this is an array of dates and not a single date
  occurrence_number: varchar("occurrence_number", { length: 2 }), // Offically length of 2, "A sequence number given to the solicitation for that agency/program/year combination"
  solicitationAgencyURL: text("solicitation_agency_url"), // Any length
  currentStatus: text("current_status"), // current status is 4-6 chars: Open, Closed, or Future but not mandatory
});

export type SolicitationSelect = typeof solicitations.$inferSelect;
export type SolicitationInsert = typeof solicitations.$inferInsert;
export const SolicitationSelectSchema = createSelectSchema(solicitations);
export const SolicitationInsertSchema = createInsertSchema(solicitations);

export const topics = pgTable("topics", {
  id: serial("id").primaryKey(), 
  solicitationFK: integer("solicitation_fk").references(() => solicitations.id), // FK reference to local solicitations id
  topicTitle: text("topic_title"), // Doc lies, officially mandatory 0-255 chars but is nullable and longer in practice
  topicNumber: varchar("topic_number", { length: 60 }), // Doc lies, offically 0-15 chars but is longer in practice ex: RF-HL-26-014
  branch: varchar("branch", { length: 6 }), // Officially 2-4 chars, ex: "USAF"
  // Dates are YYYY/MM/DD format
  // ex: 1967/07/18
  topicOpenDate: date("topic_open_date"),
  topicClosedDate: date("topic_closed_date"),
  topicDescription: text("topic_description"), // Any length
  sbirTopicLink: text("sbir_topic_link"), // Any length
});

export type TopicSelect = typeof topics.$inferSelect;
export type TopicInsert = typeof topics.$inferInsert;
export const TopicSelectSchema = createSelectSchema(topics);
export const TopicInsertSchema = createInsertSchema(topics);


export const subtopics = pgTable("subtopics", {
  id: serial("id").primaryKey(),
  topicFK: integer("topic_fk").references(() => topics.id), // FK reference to local topics id
  subtopicTitle: text("subtopic_title").notNull(), // Doc lies, officially 0-255 chars but is longer in practice
  branch: varchar("branch", { length: 6 }), // Officially 2-4 chars, ex: "USAF"
  subtopicNumber: varchar("subtopic_number", { length: 20 }), // Offically 0-15 chars, alphanumeric
  subtopicDescription: text("subtopic_description"), // Any length
  sbirSubtopicLink: text("sbir_subtopic_link"), // Any length
});

export type SubtopicSelect = typeof subtopics.$inferSelect;
export type SubtopicInsert = typeof subtopics.$inferInsert;
export const SubtopicSelectSchema = createSelectSchema(subtopics);
export const SubtopicInsertSchema = createInsertSchema(subtopics);