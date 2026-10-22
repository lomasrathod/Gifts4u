import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DemoView } from "@/components/GiftView";
import { getDesign } from "@/designs/registry";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const design = getDesign((await params).id);
  return design ? { title: `${design.name} demo`, description: design.tagline } : {};
}

export default async function DemoPage({ params }: { params: Promise<{ id: string }> }) {
  const design = getDesign((await params).id);
  if (!design) notFound();
  return <DemoView designId={design.id} name={design.name} content={design.demo} />;
}
