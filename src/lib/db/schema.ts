import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const gifts = sqliteTable(
  "gifts",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    designId: text("design_id").notNull(),
    // JSON: { fields: Record<string,string>, photos: string[] }
    content: text("content", { mode: "json" }).notNull().$type<GiftContent>(),
    status: text("status", { enum: ["draft", "paid", "deleted"] }).notNull().default("draft"),
    buyerName: text("buyer_name").notNull(),
    buyerEmail: text("buyer_email").notNull(),
    keepsake: text("keepsake", { enum: ["year", "forever"] }).notNull().default("year"),
    notifyAnswer: integer("notify_answer", { mode: "boolean" }).notNull().default(true),
    delivery: text("delivery", { enum: ["link", "email"] }).notNull().default("link"),
    recipientEmail: text("recipient_email"),
    sendAt: integer("send_at", { mode: "timestamp_ms" }),
    sentAt: integer("sent_at", { mode: "timestamp_ms" }),
    editTokenHash: text("edit_token_hash").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
    expiryReminderSentAt: integer("expiry_reminder_sent_at", { mode: "timestamp_ms" }),
    paidAt: integer("paid_at", { mode: "timestamp_ms" }),
    openedAt: integer("opened_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("gifts_buyer_email_idx").on(t.buyerEmail), index("gifts_send_at_idx").on(t.sendAt)],
);

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  giftId: text("gift_id").notNull(),
  kind: text("kind", { enum: ["gift", "upgrade"] }).notNull(),
  amountCents: integer("amount_cents").notNull(),
  country: text("country").notNull(),
  discountCode: text("discount_code"),
  provider: text("provider", { enum: ["dodo", "dev"] }).notNull(),
  providerRef: text("provider_ref"),
  status: text("status", { enum: ["pending", "paid", "failed"] }).notNull().default("pending"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const answers = sqliteTable("answers", {
  id: text("id").primaryKey(),
  giftId: text("gift_id").notNull(),
  answer: text("answer").notNull(),
  note: text("note"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export type GiftContent = { fields: Record<string, string>; photos: string[] };
export type Gift = typeof gifts.$inferSelect;
