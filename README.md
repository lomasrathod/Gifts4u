# Giftvera

Personal digital gifts sent as a private link: a 3D island two to four people walk through together, or an animated letter that ends with a question. The buyer gets an email the moment the recipient answers.

## What's in it

| Area | What it does |
| --- | --- |
| Designs | `sunset-island` (3D, multiplayer), `kitty-letter`, `our-universe`, `memory-wall`. Each is a config in `src/designs/registry.ts` plus one renderer component. |
| Builder | Form with live phone preview, photo upload, AI "help me write it" interview, keepsake and delivery options. Draft is saved in the browser. |
| Checkout | Dodo Payments (merchant of record) with one pay-what-you-want product; the price is set per order in `src/lib/pricing.ts`. Without keys, a dev checkout simulates payment. |
| Pricing | One honest price per design, adjusted by country. A year online is included; "keep forever" is an upgrade. `BACK15` gives 15% off when a recipient makes one back. |
| After payment | Receipt + private edit link by email, optional scheduled email to the recipient, link share page. |
| Recipient | Gift page (`/g/<slug>`, noindex). Their answer and an optional written reply are emailed to the buyer. Then a "make one back" offer. |
| Edit | `/edit` emails fresh edit links. `/edit/<token>` changes words and photos, shows answers, upgrades to forever, or deletes the gift. |
| Realtime | `realtime/node-server.ts` locally, `realtime/worker.ts` (Cloudflare Durable Object) in production. Same protocol in `src/lib/realtime/protocol.ts`. Max 4 per room. |
| Jobs | `GET /api/cron/run` (Bearer `CRON_SECRET`) sends scheduled gifts and "goes offline next month" reminders. Run it every 5 minutes. |

## Run it locally

```bash
npm install
cp .env.example .env.local   # every key is optional for local use
npm run dev                  # web on :3000 and realtime on :8787
```

With no keys set: payments use the dev checkout, emails print to the terminal, photos go to `.data/uploads`, the AI writer uses a built-in template, and the database is `.data/giftvera.db`.

Try the 3D demo with two browser windows on `http://localhost:3000/demo/sunset-island?room=test`.

```bash
npm test          # unit tests (pricing, webhook signatures, realtime rooms, AI fallback)
npm run typecheck
npm run build
```

## Going live

1. **Database:** create a Turso (libSQL) database, set `DATABASE_URL` and `DATABASE_AUTH_TOKEN`, then `npm run db:push`.
2. **Payments:** in Dodo, create one one-time product with pay-what-you-want enabled. Set `DODO_API_KEY`, `DODO_PRODUCT_ID`, `DODO_ENV=live`, and add a webhook to `https://<your-domain>/api/webhooks/dodo` for `payment.succeeded`; put its secret in `DODO_WEBHOOK_SECRET`.
3. **Email:** verify your domain in Resend and set `RESEND_API_KEY` and `EMAIL_FROM`.
4. **Photos:** create an R2 bucket (private) and set the `R2_*` keys.
5. **AI writer:** set `ANTHROPIC_API_KEY`.
6. **Realtime:** `cd realtime && npx wrangler deploy`, then set `NEXT_PUBLIC_REALTIME_URL=wss://giftvera-realtime.<you>.workers.dev`.
7. **Web app:** deploy the Next.js app (Vercel, or Cloudflare with OpenNext). Set `APP_URL` to the public URL. Schedule `/api/cron/run` every 5 minutes.
8. Have a lawyer review `/legal` before launch.

## Adding a design

1. Add an entry to `designs` in `src/designs/registry.ts` (fields, photo slots, price, demo words, occasions).
2. Create `src/designs/<id>/Renderer.tsx` taking `RendererProps` (`content`, `mode`, `onAnswer`). Use `min-h-[var(--gift-h,100svh)]` for full-height screens so the preview frame works.
3. Register it in `src/designs/renderers.tsx` and draw its cover in `src/components/DesignCover.tsx`.

The builder, AI writer, checkout, gift page and edit page pick it up automatically.

## Known gaps

- Rate limiting is in memory, so it is per server instance. Move it to KV or Redis when running more than one instance.
- No human check (Turnstile) on the AI writer yet; it is rate limited per IP.
- The realtime server does not check that a room belongs to a paid gift. Rooms are only reachable through unguessable links.
- Translations, analytics and an admin dashboard are not built yet.
