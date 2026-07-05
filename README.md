# Sporty Girl Shop

Premium resale marketplace prototype for girls' and women's sports equipment and apparel.

## Quick start

```bash
cp .env.example .env.local
npm install
npm run dev
```

See **[SETUP.md](./SETUP.md)** for full Supabase, Stripe, and email configuration.

## Documentation

- **[docs/PRD.md](./docs/PRD.md)** — Product spec and source of truth for scope decisions
- **[SETUP.md](./SETUP.md)** — Environment setup and deployment guide

## Tech stack

- **Next.js 15** (App Router) + Tailwind CSS
- **Supabase** — Postgres, Auth, Storage
- **Stripe** — Checkout, Connect payouts, Tax integration point
- **OpenAI / Anthropic** — AI condition scorecard (vision)
- **Resend** — Email notifications
- **Vercel** — Hosting

## MVP features (P0)

- User accounts (buyer/seller)
- Listing flow: photos → AI scorecard → price suggestion → approve/decline → publish
- Safety disclosure checklist (separate from AI, for high-risk categories)
- Browse/search with filters (sport, category, price, size, condition)
- Watchlist and saved searches with email notifications
- Stripe checkout with two-tier fee logic
- Seller payout tracking via Stripe Connect
- Admin view with manual overrides and dispute flagging
- ToS acceptance flow with version tracking
- Analytics instrumentation for 5 success metrics

## Project structure

```
src/
├── app/                  # Next.js App Router pages and API routes
├── components/           # UI components
├── lib/
│   ├── admin/isAdmin.ts  # Single admin access check (ADMIN_EMAILS)
│   ├── ai/               # Condition scorecard
│   ├── analytics/        # Event tracking
│   ├── config/           # APP_NAME, fees, photo requirements
│   ├── fees/             # Fee calculation
│   ├── pricing/          # Comparable listing price suggestion
│   ├── stripe/           # Checkout, Connect, Tax
│   └── supabase/         # Client/server Supabase helpers
docs/
└── PRD.md                # Product requirements
supabase/
├── migrations/           # Database schema
└── seed.sql              # Categories, fee config, mock comps
```

## Known simplifications

- Flat 12% commodity fee (no sales-count tier discount)
- Price suggestions from seeded `comparable_listings` table (live API stubbed)
- Legal copy is placeholder pending lawyer review
