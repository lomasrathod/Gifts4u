import { boolean, index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

export const gifts = pgTable(
  "gifts",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    designId: text("design_id").notNull(),
    content: jsonb("content").notNull().$type<GiftContent>(),
    status: text("status", { enum: ["draft", "paid", "deleted"] }).notNull().default("draft"),
    buyerName: text("buyer_name").notNull(),
    buyerEmail: text("buyer_email").notNull(),
    keepsake: text("keepsake", { enum: ["year", "forever"] }).notNull().default("year"),
    notifyAnswer: boolean("notify_answer").notNull().default(true),
    delivery: text("delivery", { enum: ["link", "email"] }).notNull().default("link"),
    recipientEmail: text("recipient_email"),
    sendAt: ts("send_at"),
    sentAt: ts("sent_at"),
    editTokenHash: text("edit_token_hash").notNull(),
    expiresAt: ts("expires_at"),
    expiryReminderSentAt: ts("expiry_reminder_sent_at"),
    paidAt: ts("paid_at"),
    openedAt: ts("opened_at"),
    createdAt: ts("created_at").notNull(),
    updatedAt: ts("updated_at").notNull(),
  },
  (t) => [index("gifts_buyer_email_idx").on(t.buyerEmail), index("gifts_send_at_idx").on(t.sendAt), index("gifts_edit_token_idx").on(t.editTokenHash)],
);

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  giftId: text("gift_id").notNull(),
  kind: text("kind", { enum: ["gift", "upgrade"] }).notNull(),
  amountCents: integer("amount_cents").notNull(),
  country: text("country").notNull(),
  discountCode: text("discount_code"),
  provider: text("provider", { enum: ["dodo", "dev"] }).notNull(),
  providerRef: text("provider_ref"),
  status: text("status", { enum: ["pending", "paid", "failed"] }).notNull().default("pending"),
  createdAt: ts("created_at").notNull(),
});

export const answers = pgTable("answers", {
  id: text("id").primaryKey(),
  giftId: text("gift_id").notNull(),
  answer: text("answer").notNull(),
  note: text("note"),
  createdAt: ts("created_at").notNull(),
});

export type GiftContent = { fields: Record<string, string>; photos: string[] };
export type Gift = typeof gifts.$inferSelect;
