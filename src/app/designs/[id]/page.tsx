import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { GiftBuilder } from "@/components/GiftBuilder";
import { Footer, Header } from "@/components/SiteChrome";
import { designs, getDesign } from "@/designs/registry";
import { checkoutOpen, paymentsEnabled } from "@/lib/env";
import { quote } from "@/lib/pricing";

export function generateStaticParams() {
  return designs.map((d) => ({ id: d.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const design = getDesign((await params).id);
  return design
    ? { title: design.name, description: design.tagline, openGraph: { images: [{ url: `/covers/${design.id}.jpg`, width: 1200, height: 900 }] } }
    : {};
}

export default async function DesignPage({ params }: { params: Promise<{ id: string }> }) {
  const design = getDesign((await params).id);
  if (!design) notFound();
  const h = await headers();
  const country = h.get("cf-ipcountry") ?? h.get("x-vercel-ip-country") ?? "US";
  const quotes = {
    year: quote({ usdCents: design.usdCents, kind: design.kind, keepsake: "year", country }),
    forever: quote({ usdCents: design.usdCents, kind: design.kind, keepsake: "forever", country }),
  };
  return (
    <>
      <Header />
      <GiftBuilder design={design} quotes={quotes} devCheckout={!paymentsEnabled} checkoutOpen={checkoutOpen} />
      <Footer />
    </>
  );
}
