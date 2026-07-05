# Setup Guide

Follow these steps to run the Sporty Girl Shop prototype locally.

## Prerequisites

- Node.js 20+
- npm
- A [Supabase](https://supabase.com) account
- A [Stripe](https://stripe.com) account (test mode)
- A [Resend](https://resend.com) account (for email notifications)
- An OpenAI or Anthropic API key (for AI condition scorecard)

## 1. Clone and install

```bash
cd "Sporty Girl Shop"
cp .env.example .env.local
npm install
```

## 2. Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project.
2. Wait for the database to provision.
3. Copy your **Project URL** and **anon public** key from Settings → API.
4. Copy your **service_role** key (keep this secret — server-side only).
5. Paste all three into `.env.local`.

## 3. Run database migrations and seed

1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started).
2. Link your project:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

3. Push the schema and seed data:

```bash
supabase db push
psql "$DATABASE_URL" -f supabase/seed.sql
```

Alternatively, run the SQL files manually in the Supabase SQL Editor:
- `supabase/migrations/001_initial_schema.sql`
- `supabase/seed.sql`

## 4. Configure Supabase Storage

In the Supabase dashboard → Storage:

1. Create a bucket named `listing-media` (public).
2. Add a policy allowing authenticated users to upload to their own folder.
3. Add a policy allowing public read access.

Or run the storage policies included in the migration file.

## 5. Configure Supabase Auth

In Supabase dashboard → Authentication → Providers:

1. Enable **Email** provider.
2. Set Site URL to `http://localhost:3000` (and your Vercel URL later).
3. Add redirect URLs: `http://localhost:3000/auth/callback`

## 6. Create a Stripe test-mode account

1. Go to [dashboard.stripe.com/register](https://dashboard.stripe.com/register).
2. Toggle **Test mode** on (top-right).
3. Copy your **Publishable key** and **Secret key** into `.env.local`.
4. Enable **Stripe Connect** (Settings → Connect settings) for seller payouts.
5. Enable **Stripe Tax** (Settings → Tax) — the integration point is wired in checkout.

### Stripe webhooks (local dev)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

For Connect events:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe-connect --events account.updated,transfer.created
```

Copy into `STRIPE_CONNECT_WEBHOOK_SECRET`.

## 7. Configure email (Resend)

1. Create a [Resend](https://resend.com) account.
2. Add and verify your sending domain (or use their sandbox for testing).
3. Copy your API key into `RESEND_API_KEY`.
4. Set `EMAIL_FROM` to a verified sender address.

## 8. Configure AI provider

Set `AI_PROVIDER` to `openai` or `anthropic` and add the corresponding API key.
The condition scorecard uses a vision-capable model. Price suggestions read from the local `comparable_listings` table (no external API in this pass).

## 9. Set admin access

Set `ADMIN_EMAILS` to your founder email(s), comma-separated:

```
ADMIN_EMAILS=you@example.com,co-founder@example.com
```

## 10. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 11. Deploy to Vercel

1. Push the repo to GitHub.
2. Import the project in [vercel.com](https://vercel.com).
3. Add all environment variables from `.env.example`.
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel domain.
5. Update Supabase Auth redirect URLs and Stripe webhook endpoints to point to production.

## Environment variable reference

| Variable | Description |
|----------|-------------|
| `APP_NAME` | Brand name shown in UI (default: "Sporty Girl Shop") |
| `COMMODITY_FEE_PERCENT` | Platform fee for commodity categories (default: 12) |
| `NICHE_FEE_PERCENT` | Platform fee for niche categories (default: 20) |
| `PROCESSING_FEE_PERCENT` | Stripe processing fee % passed to buyer (default: 2.9) |
| `PROCESSING_FEE_FLAT` | Stripe flat fee passed to buyer (default: 0.30) |
| `ADMIN_EMAILS` | Comma-separated founder emails for admin access |
| `TOS_VERSION` | Current Terms of Service version for acceptance tracking |

## Known simplifications (prototype pass)

- Commodity fee is flat 12% for all sellers — no sales-count tier discount yet.
- Price suggestions use seeded `comparable_listings` data — live API lookup is stubbed.
- Legal copy (ToS, disclaimers) is placeholder text pending lawyer review.
- Stripe Tax is integrated at the checkout API level but requires Stripe Tax to be enabled in your dashboard.
