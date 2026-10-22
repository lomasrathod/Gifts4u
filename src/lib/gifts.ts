import { and, eq, isNull, lte, isNotNull, gt } from "drizzle-orm";
import { getDesign } from "@/designs/registry";
import { getDb, schema } from "@/lib/db";
import type { Gift } from "@/lib/db/schema";
import { emails, sendEmail } from "@/lib/email";
import { hashSecret, newId, newSecret } from "@/lib/tokens";

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const { gifts, orders, answers } = schema;

const SCHEDULE_AHEAD_MS = 48 * 60 * 60 * 1000;

export function isOnline(gift: Gift, now = Date.now()) {
  return gift.status === "paid" && (gift.expiresAt === null || gift.expiresAt.getTime() > now);
}

export async function getGiftBySlug(slug: string) {
  const db = await getDb();
  return db.query.gifts.findFirst({ where: eq(gifts.slug, slug) });
}

/** Creates a single-use edit link for one gift and stores only its hash. */
async function issueEditToken(gift: Gift) {
  const db = await getDb();
  const token = newSecret();
  await db.update(gifts).set({ editTokenHash: hashSecret(token), updatedAt: new Date() }).where(eq(gifts.id, gift.id));
  return token;
}

export async function getGiftByEditToken(token: string) {
  const db = await getDb();
  return db.query.gifts.findFirst({ where: and(eq(gifts.editTokenHash, hashSecret(token)), eq(gifts.status, "paid")) });
}

/**
 * Marks an order paid. Idempotent: webhooks and return redirects may both call it.
 */
export async function completeOrder(orderId: string, providerRef?: string) {
  const db = await getDb();
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order || order.status === "paid") return order;
  const gift = await db.query.gifts.findFirst({ where: eq(gifts.id, order.giftId) });
  if (!gift) return order;

  await db.update(orders).set({ status: "paid", providerRef: providerRef ?? order.providerRef }).where(eq(orders.id, orderId));
  const now = new Date();

  if (order.kind === "upgrade") {
    await db.update(gifts).set({ keepsake: "forever", expiresAt: null, updatedAt: now }).where(eq(gifts.id, gift.id));
    return order;
  }

  await db
    .update(gifts)
    .set({
      status: "paid",
      paidAt: now,
      expiresAt: gift.keepsake === "forever" ? null : new Date(now.getTime() + YEAR_MS),
      updatedAt: now,
    })
    .where(eq(gifts.id, gift.id));

  const design = getDesign(gift.designId);
  const token = await issueEditToken(gift);
  await sendEmail(
    emails.receipt({ to: gift.buyerEmail, buyerName: gift.buyerName, slug: gift.slug, editToken: token, designName: design?.name ?? "gift" }),
  );
  if (gift.delivery === "email" && gift.recipientEmail && (!gift.sendAt || gift.sendAt.getTime() <= Date.now() + SCHEDULE_AHEAD_MS)) {
    await deliver({ ...gift, status: "paid" });
  }
  return order;
}

async function deliver(gift: Gift) {
  const db = await getDb();
  if (!gift.recipientEmail || gift.sentAt) return;
  const design = getDesign(gift.designId);
  // A future send time is handed to the email provider, which holds the email
  // until then. The daily cron hands over everything due in the next 48 hours.
  const later = gift.sendAt && gift.sendAt.getTime() > Date.now() + 60_000 ? gift.sendAt : undefined;
  await sendEmail({
    ...emails.delivery({ to: gift.recipientEmail, buyerName: gift.buyerName, slug: gift.slug, designName: design?.name ?? "gift" }),
    scheduledAt: later,
  });
  await db.update(gifts).set({ sentAt: new Date() }).where(eq(gifts.id, gift.id));
}

/** Runs from the daily cron: schedules upcoming gifts and sends expiry reminders. */
export async function runScheduledJobs(now = new Date()) {
  const db = await getDb();
  const horizon = new Date(now.getTime() + SCHEDULE_AHEAD_MS);
  const due = await db.query.gifts.findMany({
    where: and(eq(gifts.status, "paid"), eq(gifts.delivery, "email"), isNull(gifts.sentAt), isNotNull(gifts.sendAt), lte(gifts.sendAt, horizon)),
  });
  for (const g of due) await deliver(g);

  const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiring = await db.query.gifts.findMany({
    where: and(eq(gifts.status, "paid"), isNotNull(gifts.expiresAt), lte(gifts.expiresAt, soon), gt(gifts.expiresAt, now), isNull(gifts.expiryReminderSentAt)),
  });
  for (const g of expiring) {
    await sendEmail(emails.expiring({ to: g.buyerEmail, buyerName: g.buyerName, slug: g.slug, date: g.expiresAt!.toDateString() }));
    await db.update(gifts).set({ expiryReminderSentAt: now }).where(eq(gifts.id, g.id));
  }
  return { delivered: due.length, reminded: expiring.length };
}

export async function recordAnswer(gift: Gift, answer: string, note?: string) {
  const db = await getDb();
  await db.insert(answers).values({ id: newId(), giftId: gift.id, answer, note: note || null, createdAt: new Date() });
  if (gift.notifyAnswer) {
    await sendEmail(
      emails.answered({ to: gift.buyerEmail, recipient: (gift.content.fields.theirName || "They").trim(), answer, note, slug: gift.slug }),
    );
  }
}

export async function listAnswers(giftId: string) {
  const db = await getDb();
  return db.query.answers.findMany({ where: eq(answers.giftId, giftId), orderBy: (a, { desc }) => desc(a.createdAt) });
}

/** Emails fresh edit links for every paid gift on this address. Silent if none. */
export async function sendEditLinks(email: string) {
  const db = await getDb();
  const list = await db.query.gifts.findMany({ where: and(eq(gifts.buyerEmail, email.toLowerCase()), eq(gifts.status, "paid")) });
  if (!list.length) return;
  const links = [];
  for (const g of list) {
    links.push({ designName: getDesign(g.designId)?.name ?? "Gift", slug: g.slug, token: await issueEditToken(g) });
  }
  await sendEmail(emails.editLinks({ to: email, links }));
}

