import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LiveGiftView } from "@/components/GiftView";
import { getDesign } from "@/designs/registry";
import { getDb, schema } from "@/lib/db";
import { getGiftBySlug, isOnline } from "@/lib/gifts";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const gift = await getGiftBySlug((await params).slug);
  const from = gift?.status === "paid" ? gift.content.fields.yourName : null;
  return {
    title: from ? `${from} made you something` : "A gift for you",
    robots: { index: false, follow: false },
  };
}

export default async function GiftPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const gift = await getGiftBySlug(slug);
  if (!gift || gift.status === "draft") notFound();
  const design = getDesign(gift.designId);
  if (!design) notFound();

  if (!isOnline(gift)) {
    return (
      <main className="grid min-h-svh place-items-center bg-blush p-6 text-center">
        <div className="max-w-sm">
          <h1 className="font-display text-4xl">This gift is resting</h1>
          <p className="mt-3 text-muted">
            {gift.status === "deleted"
              ? "The person who made it has taken it down."
              : "Its year online has ended. The person who made it can bring it back from their edit link."}
          </p>
          <Link href="/" className="btn-primary mt-6">Make your own</Link>
        </div>
      </main>
    );
  }

  if (!gift.openedAt) {
    const db = await getDb();
    await db.update(schema.gifts).set({ openedAt: new Date() }).where(eq(schema.gifts.id, gift.id));
  }

  return <LiveGiftView slug={gift.slug} designId={design.id} content={gift.content} fromName={gift.content.fields.yourName ?? ""} />;
}
