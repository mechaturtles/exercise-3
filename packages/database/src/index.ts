import { ExtractTablesWithRelations } from "drizzle-orm";
import { PgTransaction } from "drizzle-orm/pg-core";
import { drizzle, PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const {
  DATABASE_URL,
  DATABASE_PORT,
  DATABASE_USERNAME,
  DATABASE_PASSWORD,
  DATABASE_NAME,
} = process.env;

if (
  !DATABASE_URL ||
  !DATABASE_PORT ||
  !DATABASE_USERNAME ||
  !DATABASE_PASSWORD ||
  !DATABASE_NAME
) {
  throw new Error("Missing environment variable DATABASE_*");
}

const config = {
  host: DATABASE_URL,
  port: parseInt(DATABASE_PORT),
  username: DATABASE_USERNAME,
  password: DATABASE_PASSWORD,
  db: DATABASE_NAME,
  ssl: process.env.DATABASE_SSL_DISABLED !== "true" && {
    rejectUnauthorized: false,
  },
};

const db = drizzle(postgres(config));

// client
export default db;

// schema
export * from "./schema";

// drizzle
export * from "drizzle-orm";
export type Transaction = PgTransaction<
  PostgresJsQueryResultHKT,
  Record<string, never>,
  ExtractTablesWithRelations<Record<string, never>>
>;
