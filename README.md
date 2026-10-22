# Giftvera

Personal digital gifts sent as a private link: shared 3D worlds you walk through together, and animated letters that end with a question. The buyer is told when the recipient answers.

## Designs

| Design | Kind | Price |
| --- | --- | --- |
| Sunset Island | 3D, up to 4 people at once | $39.99 |
| Our Museum | 3D, up to 4 people at once | $29.99 |
| Paris Together | animated letter | $14.99 |
| Our Universe | animated letter | $14.99 |
| Sakura Night | animated letter | $12.99 |
| Memory Wall | animated letter | $12.99 |
| Kitty Letter | animated letter | $9.99 |

Every gift includes one year online; "keep it forever" is a one-time add-on. Prices adjust by country, and `BACK15` gives 15% off (offered to recipients who want to "make one back").

## Stack

| Part | What |
| --- | --- |
| App | Next.js 16 (App Router), React 19, TypeScript, Tailwind 4 |
| Database | Postgres through Drizzle. PGlite (in-process) when no `DATABASE_URL` is set. Tables are created on first use. |
| Photos | Vercel Blob, private store, served only through `/api/media/[key]` |
| 3D | react-three-fiber. Shared engine in `src/designs/shared/world/` |
| Multiplayer | Supabase Realtime (broadcast + presence) in production, `realtime/node-server.ts` locally. Same messages either way (`src/lib/realtime/`). Max 4 per room. |
| Payments | Dodo Payments, one pay-what-you-want product, amount set per order, webhook at `/api/webhooks/dodo` |
| Email | Resend. Scheduled gifts use Resend's `scheduled_at`; a daily Vercel Cron hands over anything due in the next 48 hours and sends expiry reminders. |
| AI writer | Claude, with a template fallback |

## Run locally

```bash
npm install
npm run dev        # web on :3000 and the realtime server on :8787
npm test           # unit tests
npm run build
```

No keys are needed locally. Checkout is a fake "simulate payment" page, emails print to the terminal, photos go to `.data/uploads`, the database lives in `.data/pglite`.

## Deploy on Vercel

1. Import the GitHub repo into Vercel (framework: Next.js, no settings to change).
2. **Database:** Storage → add Supabase (or Neon) from the Marketplace and connect it to the project. This sets `POSTGRES_URL`.
3. **Photos:** Storage → create a Blob store (private) and connect it. This sets `BLOB_READ_WRITE_TOKEN`.
4. **Multiplayer:** in Supabase → Project Settings → API, copy the URL and the anon/publishable key into `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. **Payments:** in Dodo, create one one-time "pay what you want" product. Set `DODO_API_KEY`, `DODO_PRODUCT_ID`, `DODO_ENV`, and add a webhook to `https://YOUR-DOMAIN/api/webhooks/dodo` for `payment.succeeded`; put its secret in `DODO_WEBHOOK_SECRET`.
6. **Email:** verify your domain in Resend, set `RESEND_API_KEY` and `EMAIL_FROM`.
7. **AI writer:** set `ANTHROPIC_API_KEY`.
8. Set `CRON_SECRET` to a long random string and `APP_URL` to your domain, then redeploy.

Until step 2 and step 5 are done, the site is fully browsable with working demos, and checkout shows "opens very soon" instead of taking money.

## Layout

```
src/app/            pages and API routes
src/designs/        one folder per design, plus registry.ts (fields, prices, demo text)
src/designs/shared/ shared helpers; world/ is the 3D engine (players, HUD, room, particles)
src/lib/            db, payments, email, pricing, AI writer, storage, realtime client
realtime/           local multiplayer server for development
```
