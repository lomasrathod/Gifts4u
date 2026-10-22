import { env } from "@/lib/env";

type Mail = { to: string; subject: string; text: string; html?: string };

/** Sends through Resend when configured; otherwise logs the email (dev). */
export async function sendEmail(mail: Mail): Promise<void> {
  if (!env.resendApiKey) {
    console.log(`\n[email] to=${mail.to}\nsubject: ${mail.subject}\n${mail.text}\n`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.resendApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.emailFrom, to: mail.to, subject: mail.subject, text: mail.text, html: mail.html }),
  });
  if (!res.ok) throw new Error(`Email failed (${res.status}): ${await res.text()}`);
}

const giftUrl = (slug: string) => `${env.appUrl}/g/${slug}`;
const editUrl = (token: string) => `${env.appUrl}/edit/${token}`;

export const emails = {
  receipt: (o: { to: string; buyerName: string; slug: string; editToken: string; designName: string }) => ({
    to: o.to,
    subject: `Your ${o.designName} gift is ready`,
    text: `Hi ${o.buyerName},

Your gift is ready. Here is the private link to send:
${giftUrl(o.slug)}

To change the words or photos later, or to see their answer, use your private edit link:
${editUrl(o.editToken)}

Keep this email. Anyone with the edit link can change the gift.

Giftvera`,
  }),

  delivery: (o: { to: string; buyerName: string; slug: string; designName: string }) => ({
    to: o.to,
    subject: `${o.buyerName} made something for you`,
    text: `${o.buyerName} made you a ${o.designName}.

Open it here (best with sound on):
${giftUrl(o.slug)}

Giftvera`,
  }),

  answered: (o: { to: string; recipient: string; answer: string; note?: string | null; slug: string }) => {
    const reply = o.answer === "reply";
    return {
      to: o.to,
      subject: reply ? `${o.recipient} wrote back 💌` : o.answer === "yes" ? `${o.recipient} said yes 💛` : `${o.recipient} answered your gift`,
      text: `${reply ? `${o.recipient} wrote back to you:` : `${o.recipient} answered your gift: "${o.answer}".`}${o.note ? `\n\n"${o.note}"` : ""}

${giftUrl(o.slug)}

Giftvera`,
    };
  },

  editLinks: (o: { to: string; links: { designName: string; slug: string; token: string }[] }) => ({
    to: o.to,
    subject: "Your Giftvera edit links",
    text: `Here are the edit links for your gifts. Each one works until you request new ones.

${o.links.map((l) => `${l.designName} (${giftUrl(l.slug)})\nEdit: ${editUrl(l.token)}`).join("\n\n")}

If you did not ask for this, you can ignore it.

Giftvera`,
  }),

  expiring: (o: { to: string; buyerName: string; slug: string; editToken?: string; date: string }) => ({
    to: o.to,
    subject: "Your gift goes offline next month",
    text: `Hi ${o.buyerName},

The gift at ${giftUrl(o.slug)} stays online until ${o.date}.
To keep it online forever, open your edit link and choose "Keep it forever".
If you lost your edit link, request a new one at ${env.appUrl}/edit.

Giftvera`,
  }),
};
