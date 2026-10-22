import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-display text-2xl font-semibold tracking-tight">
          gift<span className="text-rose">vera</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-4">
          <Link href="/#designs" className="rounded-full px-3 py-2 hover:bg-blush">Designs</Link>
          <Link href="/#how" className="hidden rounded-full px-3 py-2 hover:bg-blush sm:block">How it works</Link>
          <Link href="/edit" className="rounded-full px-3 py-2 hover:bg-blush">Edit your gift</Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-muted sm:flex-row sm:justify-between">
        <div>
          <div className="font-display text-lg text-ink">gift<span className="text-rose">vera</span></div>
          <p className="mt-1 max-w-xs">Personal gifts you send as a private link. Nothing to ship, nothing to install.</p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/legal#terms">Terms</Link>
          <Link href="/legal#privacy">Privacy</Link>
          <Link href="/legal#refunds">Refunds</Link>
          <a href="mailto:hello@giftvera.com">hello@giftvera.com</a>
        </div>
      </div>
    </footer>
  );
}
