import { text, timestamp, serial, pgTable } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const helloWorld = pgTable("hello_world", {
  id: serial("id").primaryKey(),
  helloWorld: text("hello_world"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  modifiedAt: timestamp("modified_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type HelloWorldSelect = typeof helloWorld.$inferSelect;
export type HelloWorldInsert = typeof helloWorld.$inferInsert;
export const HelloWorldSelect = createSelectSchema(helloWorld);
export const HelloWorldInsert = createInsertSchema(helloWorld);
