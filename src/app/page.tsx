import { headers } from "next/headers";
import Link from "next/link";
import { DesignGrid } from "@/components/DesignGrid";
import { Footer, Header } from "@/components/SiteChrome";
import { designs } from "@/designs/registry";
import { countryFactor, foreverUpgradeCents, formatUsd, quote } from "@/lib/pricing";

export default async function Home() {
  const h = await headers();
  const country = h.get("cf-ipcountry") ?? h.get("x-vercel-ip-country") ?? "US";
  const prices = Object.fromEntries(
    designs.map((d) => [d.id, formatUsd(quote({ usdCents: d.usdCents, kind: d.kind, keepsake: "year", country }).totalCents)]),
  );
  const adjusted = countryFactor(country) < 1;

  return (
    <>
      <Header />
      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-b from-blush to-transparent blur-2xl" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:pt-20 lg:grid-cols-[1.05fr_1fr]">
            <div>
              <p className="animate-rise text-sm font-semibold uppercase tracking-[0.2em] text-rose">Digital gifts with your words in them</p>
              <h1 className="animate-rise mt-4 font-display text-5xl leading-[1.04] sm:text-7xl" style={{ animationDelay: ".05s" }}>
                Gifts you open <em className="text-rose">together.</em>
              </h1>
              <p className="animate-rise mt-6 max-w-xl text-lg text-muted sm:text-xl" style={{ animationDelay: ".1s" }}>
                Your words and photos become a 3D world you walk through together, or an animated letter that ends with your
                question. Ready in ten minutes. Sent as a private link.
              </p>
              <div className="animate-rise mt-8 flex flex-wrap gap-3" style={{ animationDelay: ".15s" }}>
                <Link href="#designs" className="btn-primary">Choose a design</Link>
                <Link href="/demo/our-museum" className="btn-ghost">Walk the museum with someone →</Link>
              </div>
              <ul className="mt-10 grid gap-3 text-sm sm:grid-cols-3">
                {["A full year online, included", "Get told when they answer", "No account, no app"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-rose/10 text-rose">✓</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="animate-rise relative mx-auto w-full max-w-lg pb-10" style={{ animationDelay: ".2s" }} aria-hidden>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/covers/our-museum.jpg" alt="" className="aspect-[4/3] w-full -rotate-2 rounded-[28px] object-cover shadow-2xl shadow-rose/20 ring-1 ring-black/5" />
              <div className="absolute -bottom-2 -right-2 w-[38%] rotate-3 overflow-hidden rounded-[26px] border-[6px] border-ink bg-ink shadow-2xl sm:-right-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/covers/sakura-night.jpg" alt="" className="aspect-[9/16] w-full object-cover" />
              </div>
              <div className="absolute -left-3 bottom-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-black/5 sm:-left-8">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-rose/10 text-lg">💌</span>
                <span className="text-sm leading-tight">
                  <b className="block">Maya said yes 💛</b>
                  <span className="text-muted">You get an email the moment they answer</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        <section id="designs" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12">
          <h2 className="font-display text-4xl">Pick a design</h2>
          <p className="mt-2 mb-8 text-muted">Every design has a free demo. Open it before you buy.</p>
          <DesignGrid designs={designs} prices={prices} />
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                t: "Spend an evening in it",
                d: "Most gifts get opened in a minute. Our 3D worlds are shared: you both walk the same island at the same time, from different cities, and chat while you explore.",
              },
              {
                t: "Know when they say yes",
                d: "The gift ends with your question. When they answer, we email you right away, with anything they wrote back. You can turn this off.",
              },
              {
                t: "Stuck on the words?",
                d: "Answer five quick questions about the two of you. Our writer drafts every line in your tone. You read and change anything before you pay.",
              },
            ].map((f) => (
              <div key={f.t} className="card p-6">
                <h3 className="font-display text-2xl">{f.t}</h3>
                <p className="mt-2 text-muted">{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12">
          <h2 className="font-display text-4xl">How it works</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              ["Choose a design", "Open the demo first. It is the real thing with sample words."],
              ["Add your words and photos", "Type them, or let the writer draft them from a short interview. The preview updates as you type."],
              ["Send the private link", "Get the link straight away, or we email it to them at the time you pick. You can edit it later."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink font-display text-lg text-white">{i + 1}</span>
                <div>
                  <h3 className="text-lg font-semibold">{t}</h3>
                  <p className="text-muted">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="card grid gap-8 p-8 md:grid-cols-2">
            <div>
              <h2 className="font-display text-4xl">One honest price</h2>
              <p className="mt-3 text-muted">
                Pay once. Your gift stays online for a full year. If you want it to last, keep it forever for a small extra
                fee. No subscriptions, no fake &ldquo;was&rdquo; prices.
              </p>
              {adjusted && (
                <p className="mt-3 text-sm text-muted">Prices are adjusted for your country ({country}).</p>
              )}
            </div>
            <ul className="divide-y divide-line">
              {designs.map((d) => (
                <li key={d.id} className="flex items-center justify-between py-3">
                  <span>
                    {d.name} <span className="text-sm text-muted">· {d.kind === "world" ? "3D" : "animated"}</span>
                  </span>
                  <span className="text-right">
                    <span className="font-semibold">{prices[d.id]}</span>
                    <span className="block text-xs text-muted">
                      forever +{formatUsd(quote({ usdCents: foreverUpgradeCents(d.kind), kind: d.kind, keepsake: "year", country }).totalCents)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-12">
          <h2 className="font-display text-4xl">Questions</h2>
          <div className="mt-6 divide-y divide-line">
            {[
              ["Do they need an app or an account?", "No. They open the link in any browser. The 3D worlds work on phones, tablets and computers from the last few years."],
              ["Can we really be in the 3D world at the same time?", "Yes. Up to four people can open the same link at once. You see each other walking around and can chat."],
              ["Can I change it after I pay?", "Yes. We email you a private edit link. Change the words or photos any time, and see their answer there too."],
              ["What happens after a year?", "We email you a month before. You can keep it forever with one small payment, or let it go offline."],
              ["Who can see my photos?", "Only people with the link. Gift pages are hidden from search engines, and photos are stored privately."],
              ["What if something goes wrong?", "If the gift doesn't work and we can't fix it, you get your money back. Changed your mind? You get a full refund within 7 days of paying, as long as they haven't answered it yet."],
            ].map(([q, a]) => (
              <details key={q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-medium">
                  {q}
                  <span className="text-rose transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-muted">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
