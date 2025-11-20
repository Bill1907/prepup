import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL || ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/prepup-db.sqlite",
  },
  verbose: true,
  strict: true,
});

