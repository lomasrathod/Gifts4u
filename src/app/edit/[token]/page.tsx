import Link from "next/link";
import { GiftEditor } from "@/components/GiftEditor";
import { Header } from "@/components/SiteChrome";
import { getDesign } from "@/designs/registry";
import { getGiftByEditToken, listAnswers } from "@/lib/gifts";
import { countryFactor, foreverUpgradeCents, formatUsd, friendly } from "@/lib/pricing";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit your gift", robots: { index: false } };

export default async function EditTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const gift = await getGiftByEditToken(token);
  if (!gift) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-md px-4 py-20 text-center">
          <h1 className="font-display text-4xl">This link has expired</h1>
          <p className="mt-3 text-muted">Edit links stop working when a newer one is sent.</p>
          <Link href="/edit" className="btn-primary mt-6">Get a new link</Link>
        </main>
      </>
    );
  }
  const design = getDesign(gift.designId)!;
  const answers = await listAnswers(gift.id);
  const h = await headers();
  const country = h.get("cf-ipcountry") ?? h.get("x-vercel-ip-country") ?? "US";
  const upgradePrice = formatUsd(friendly(foreverUpgradeCents(design.kind) * countryFactor(country)));

  return (
    <>
      <Header />
      <GiftEditor
        token={token}
        design={design}
        slug={gift.slug}
        initial={gift.content}
        notifyAnswer={gift.notifyAnswer}
        keepsake={gift.keepsake}
        expiresAt={gift.expiresAt?.toISOString() ?? null}
        upgradePrice={upgradePrice}
        answers={answers.map((a) => ({ answer: a.answer, note: a.note, at: a.createdAt.toISOString() }))}
      />
    </>
  );
}
