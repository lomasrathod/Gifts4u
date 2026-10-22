import { Footer, Header } from "@/components/SiteChrome";

export const metadata = { title: "Terms, privacy and refunds" };

export default function Legal() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl space-y-10 px-4 py-14 leading-relaxed">
        <p className="text-sm text-muted">
          Plain-language summary. Have a lawyer review this before launch; it is a starting point, not legal advice.
        </p>
        <section id="terms" className="scroll-mt-24">
          <h1 className="font-display text-4xl">Terms</h1>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li>You buy a digital gift: a private web page or 3D world with the words and photos you add. Nothing is shipped.</li>
            <li>You pay once. There is no subscription. Payments are handled by Dodo Payments as merchant of record.</li>
            <li>Every gift stays online for one year from payment. &ldquo;Keep it forever&rdquo; keeps it online for as long as Giftvera runs.</li>
            <li>You must be 18 or older, or have a parent or guardian buy for you.</li>
            <li>You are responsible for what you write and upload. Don&apos;t upload anything you don&apos;t have the right to share, or anything hateful or illegal. We remove gifts that break this rule.</li>
            <li>The AI writer can make mistakes. Read everything before you pay.</li>
          </ul>
        </section>
        <section id="privacy" className="scroll-mt-24">
          <h2 className="font-display text-3xl">Privacy</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li>We store your name, email, the gift&apos;s words and photos, and your recipient&apos;s answer.</li>
            <li>Gift links are random and hidden from search engines. Anyone with the link can open the gift.</li>
            <li>Photos are stored privately and served only through your gift&apos;s link.</li>
            <li>If you use the AI writer, what you type is sent to our AI provider (Anthropic) to write the text. It isn&apos;t used to train their models.</li>
            <li>Chat in the 3D worlds is not saved.</li>
            <li>Delete your gift any time from your edit link. Ask us to delete everything else at hello@giftvera.com.</li>
          </ul>
        </section>
        <section id="refunds" className="scroll-mt-24">
          <h2 className="font-display text-3xl">Refunds</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li>Changed your mind? Full refund within 7 days of paying, as long as nobody has answered the gift yet.</li>
            <li>If your gift doesn&apos;t work and we can&apos;t fix it, you get a full refund, any time in its first year.</li>
            <li>Write to hello@giftvera.com with the email you paid with. Refunds arrive in 5 to 10 business days.</li>
          </ul>
        </section>
      </main>
      <Footer />
    </>
  );
}
