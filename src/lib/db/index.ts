import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { mkdirSync } from "node:fs";
import { env } from "@/lib/env";
import * as schema from "./schema";

// Tables are created on first use so local development needs no migration step.
// Keep this in sync with schema.ts (drizzle-kit push does the same for production).
const BOOTSTRAP = `
CREATE TABLE IF NOT EXISTS gifts (
  id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, design_id TEXT NOT NULL, content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', buyer_name TEXT NOT NULL, buyer_email TEXT NOT NULL,
  keepsake TEXT NOT NULL DEFAULT 'year', notify_answer INTEGER NOT NULL DEFAULT 1,
  delivery TEXT NOT NULL DEFAULT 'link', recipient_email TEXT, send_at INTEGER, sent_at INTEGER,
  edit_token_hash TEXT NOT NULL, expires_at INTEGER, expiry_reminder_sent_at INTEGER, paid_at INTEGER, opened_at INTEGER,
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS gifts_buyer_email_idx ON gifts (buyer_email);
CREATE INDEX IF NOT EXISTS gifts_send_at_idx ON gifts (send_at);
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY, gift_id TEXT NOT NULL, kind TEXT NOT NULL, amount_cents INTEGER NOT NULL,
  country TEXT NOT NULL, discount_code TEXT, provider TEXT NOT NULL, provider_ref TEXT,
  status TEXT NOT NULL DEFAULT 'pending', created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS answers (
  id TEXT PRIMARY KEY, gift_id TEXT NOT NULL, answer TEXT NOT NULL, note TEXT, created_at INTEGER NOT NULL
);
`;

function makeDb() {
  if (env.databaseUrl.startsWith("file:")) mkdirSync(".data", { recursive: true });
  const client = createClient({ url: env.databaseUrl, authToken: env.databaseAuthToken });
  const ready = client.executeMultiple(BOOTSTRAP);
  return { db: drizzle(client, { schema }), ready };
}

const globalForDb = globalThis as unknown as { __gv?: ReturnType<typeof makeDb> };
const instance = (globalForDb.__gv ??= makeDb());

export async function getDb() {
  await instance.ready;
  return instance.db;
}

export { schema };
