import "dotenv";
import type { Config } from "drizzle-kit";

const {
  DATABASE_URL,
  DATABASE_PORT,
  DATABASE_USERNAME,
  DATABASE_PASSWORD,
  DATABASE_NAME,
} = process.env;

const dbCredentials =
  DATABASE_URL &&
  DATABASE_PORT &&
  DATABASE_USERNAME &&
  DATABASE_PASSWORD &&
  DATABASE_NAME
    ? {
        url: `postgresql://${DATABASE_USERNAME}:${DATABASE_PASSWORD}@${DATABASE_URL}:${DATABASE_PORT}/${DATABASE_NAME}`,
      }
    : undefined;

export default {
  dialect: "postgresql",
  schema: "./src/schema",
  out: "./drizzle",
  dbCredentials,
} satisfies Config;
