// Central place for configuration. Every integration has a local fallback,
// so the whole app runs with zero keys during development.
export const env = {
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  databaseUrl: process.env.DATABASE_URL ?? "file:.data/giftvera.db",
  databaseAuthToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  dodoApiKey: process.env.DODO_API_KEY || undefined,
  dodoEnv: process.env.DODO_ENV === "live" ? "live" : "test",
  dodoProductId: process.env.DODO_PRODUCT_ID || undefined,
  dodoWebhookSecret: process.env.DODO_WEBHOOK_SECRET || undefined,
  resendApiKey: process.env.RESEND_API_KEY || undefined,
  emailFrom: process.env.EMAIL_FROM ?? "Giftvera <hello@giftvera.com>",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || undefined,
  r2: {
    accountId: process.env.R2_ACCOUNT_ID || undefined,
    accessKeyId: process.env.R2_ACCESS_KEY_ID || undefined,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || undefined,
    bucket: process.env.R2_BUCKET || undefined,
  },
  cronSecret: process.env.CRON_SECRET || undefined,
};

export const paymentsEnabled = Boolean(env.dodoApiKey && env.dodoProductId);
