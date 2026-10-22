import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  dialect: "turso",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "file:.data/giftvera.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
});
