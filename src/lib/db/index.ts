import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

// Tables are created on first use, so a fresh database (Supabase, Neon, any Postgres)
// needs no migration step. Keep this in sync with schema.ts.
const BOOTSTRAP = `
CREATE TABLE IF NOT EXISTS gifts (
  id text PRIMARY KEY, slug text NOT NULL UNIQUE, design_id text NOT NULL, content jsonb NOT NULL,
  status text NOT NULL DEFAULT 'draft', buyer_name text NOT NULL, buyer_email text NOT NULL,
  keepsake text NOT NULL DEFAULT 'year', notify_answer boolean NOT NULL DEFAULT true,
  delivery text NOT NULL DEFAULT 'link', recipient_email text, send_at timestamptz, sent_at timestamptz,
  edit_token_hash text NOT NULL, expires_at timestamptz, expiry_reminder_sent_at timestamptz,
  paid_at timestamptz, opened_at timestamptz, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS gifts_buyer_email_idx ON gifts (buyer_email);
CREATE INDEX IF NOT EXISTS gifts_send_at_idx ON gifts (send_at);
CREATE INDEX IF NOT EXISTS gifts_edit_token_idx ON gifts (edit_token_hash);
CREATE TABLE IF NOT EXISTS orders (
  id text PRIMARY KEY, gift_id text NOT NULL, kind text NOT NULL, amount_cents integer NOT NULL,
  country text NOT NULL, discount_code text, provider text NOT NULL, provider_ref text,
  status text NOT NULL DEFAULT 'pending', created_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS answers (
  id text PRIMARY KEY, gift_id text NOT NULL, answer text NOT NULL, note text, created_at timestamptz NOT NULL
);
`;

type Db = ReturnType<typeof drizzlePg<typeof schema>>;

async function makeDb(): Promise<Db> {
  if (env.databaseUrl) {
    // prepare:false keeps it compatible with transaction-mode poolers (Supabase, Neon).
    const client = postgres(env.databaseUrl, { prepare: false, max: 5 });
    await client.unsafe(BOOTSTRAP);
    return drizzlePg(client, { schema });
  }
  // No database configured: an embedded Postgres (PGlite) on local disk.
  // Fine for development and demos; production checkout stays closed in this mode.
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const dir = process.env.VERCEL ? "/tmp/gifts4u-db" : ".data/pglite";
  const client = new PGlite(dir);
  await client.exec(BOOTSTRAP);
  return drizzle(client, { schema }) as unknown as Db;
}

const g = globalThis as unknown as { __gvDb?: Promise<Db> };

export function getDb(): Promise<Db> {
  g.__gvDb ??= makeDb().catch((err) => {
    g.__gvDb = undefined;
    throw err;
  });
  return g.__gvDb;
}

export { schema };
