import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-svh place-items-center p-6 text-center">
      <div>
        <h1 className="font-display text-5xl">Nothing here</h1>
        <p className="mt-3 text-muted">This link doesn&apos;t lead to a gift. Check it was copied in full.</p>
        <Link href="/" className="btn-primary mt-6">Go to Giftvera</Link>
      </div>
    </main>
  );
}
