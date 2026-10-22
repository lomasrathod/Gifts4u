// Central place for configuration. Every integration has a local fallback,
// so the whole app runs with zero keys during development.
export const env = {
  appUrl:
    process.env.APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  // DATABASE_URL, or the POSTGRES_URL that the Vercel Supabase/Neon integrations add.
  databaseUrl: process.env.DATABASE_URL || process.env.POSTGRES_URL || undefined,
  dodoApiKey: process.env.DODO_API_KEY || undefined,
  dodoEnv: process.env.DODO_ENV === "live" ? "live" : "test",
  dodoProductId: process.env.DODO_PRODUCT_ID || undefined,
  dodoWebhookSecret: process.env.DODO_WEBHOOK_SECRET || undefined,
  resendApiKey: process.env.RESEND_API_KEY || undefined,
  emailFrom: process.env.EMAIL_FROM ?? "Giftvera <hello@giftvera.com>",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || undefined,
  blobToken: process.env.BLOB_READ_WRITE_TOKEN || undefined,
  cronSecret: process.env.CRON_SECRET || undefined,
};

export const isProduction = process.env.NODE_ENV === "production";
export const paymentsEnabled = Boolean(env.dodoApiKey && env.dodoProductId);
/** Real orders need real payments and a real database. Otherwise checkout is closed in production. */
export const checkoutOpen = !isProduction || (paymentsEnabled && Boolean(env.databaseUrl));
