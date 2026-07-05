# [Brand Name — TBD]: Technical Build Spec & Prototype Brief

Single-source document for building a v1 prototype. Written for use with Cursor, v0, and GitHub. Synthesizes: Business Concept Brief, Strategic & Investor Review, Side Business Income Model, and The RealReal Feature Audit.

## 1. One-Paragraph Product Summary

A resale marketplace for girls'/women's sports equipment and apparel, positioned as premium and aspirational (RealReal/Nike/ASOS-caliber presentation) rather than utilitarian (SidelineSwap/Poshmark/eBay-style). Sellers submit photos/video against a fixed template; an AI pipeline generates a condition scorecard and suggested price; the seller approves or declines, and approved listings go live immediately. No platform-held inventory — sellers ship their own items, DIY-label style (Etsy/Amazon model). Commodity categories are fee-matched to SidelineSwap (~10-12%); niche/high-ticket categories (fencing, equestrian, golf-tech) carry a modest premium (~18-20%).

## 2. Target User & Core Use Cases

**Primary user (seller/buyer overlap):** parents of competitive/recreational girl athletes, ages 8-16, plus the athletes themselves (11+) as active browsers/influencers.

**Core use case 1 (sell):** submit photos → get AI scorecard + price → approve → item goes live → ships on sale.

**Core use case 2 (buy):** browse/filter by sport & category → save items/searches → get notified on price drops, restocks, and new arrivals matching saved criteria → buy.

## 3. MVP Scope (Prototype — Build This First)

Do not build the full feature set below in v1. This is the actual prototype scope, mapped to the rollout plan already agreed (Business Concept Brief, Section 13, Phases 0-4):

### In scope for prototype:

- User accounts (buyer/seller, can be same account)
- Listing creation flow: photo/video upload → AI scorecard + price suggestion → seller approve/decline → publish
- Browse/search with filters: sport, category, price, size, condition tier
- Basic "Watchlist" (heart/save item)
- Saved Search (save filter combination, see new matches)
- Simple checkout (Stripe), with platform fee logic applied at the two tiers (commodity vs. niche — see Section 6)
- Seller payout tracking
- Basic email notifications (price drop on watchlisted item, new match on saved search)
- Admin view for the founder to see all listings/transactions (manual override capability while trust in AI is still being established)

### Explicitly out of scope for prototype (Stage 2+, per the roadmap):

- First Look-style paid subscription tier
- Full personalization/recommendation engine ("AI profiling") — v1 uses simple rule-based matching (saved search/watchlist), not ML-driven curation
- Demand/pattern analytics dashboard for sellers (Insights Center equivalent)
- SMS notifications
- Physical/in-person anything (collection events, store views)
- Multi-region tax complexity beyond a standard sales-tax service integration

## 4. Feature Spec (Full List, Prioritized)

| # | Feature | Priority | Inspired by | Notes |
|---|---------|----------|-------------|-------|
| 1 | Seller listing flow (photo/video upload → AI scorecard → approve) | P0 (MVP) | Original concept | Core differentiator vs. SidelineSwap's manual listing |
| 2 | AI Condition Scorecard | P0 (MVP) | — | See Section 5 for exact spec |
| 3 | AI Price Suggestion | P0 (MVP) | Handbag Estimator | v1 = comparable-listing lookup, NOT a trained model (no transaction data yet) |
| 4 | Browse/filter (sport, category, price, size, condition) | P0 (MVP) | Standard e-commerce + condition-tier filter | Condition tiers: Pristine / Excellent / Very Good / Good (reuse TRR's exact 4-tier language) |
| 5 | Watchlist ("Obsessions" equivalent) | P0 (MVP) | TRR Obsessions | Heart icon, dedicated tab |
| 6 | Saved Search | P0 (MVP) | TRR Saved Searches | Notify on new matching listings |
| 7 | Checkout + two-tier fee logic | P0 (MVP) | SidelineSwap fee match | See Section 6 |
| 8 | Email notifications (price drop, new match, sold) | P0 (MVP) | TRR triggered emails | Start simple; behavioral targeting is P2 |
| 9 | Seller ToS + condition/authenticity disclaimer acceptance | P0 (MVP) | Legal requirement | Must be lawyer-drafted before real transactions |
| 10 | New Arrivals feed | P1 | TRR twice-daily drops | v1 can just be "sorted by newest" |
| 11 | Progressive automatic markdown | P1 | TRR markdown mechanic | Simple time-based percentage decay per category |
| 12 | Waitlist for sold items | P1 | TRR Waitlist | Notify if a similar item is relisted |
| 13 | Push notifications (mobile) | P1 | TRR | Requires native app or PWA; web-only prototype can substitute email |
| 14 | Reconsign prompts | P2 | TRR Reconsign | Trigger off category-specific "growth curve" timing |
| 15 | Impact Report (Young Achiever Fund $ redirected) | P2 | TRR Impact Report | Ties directly to the mission |
| 16 | Seller Insights Dashboard (demand/pattern analytics) | P2 | TRR Insights Center | Post-MVP feature |
| 17 | Personalized recommendation engine ("AI profiling") | P2/P3 | TRR ML personalization | Needs real behavioral data to train against |
| 18 | Paid early-access membership | P3 | TRR First Look | Defer until free-tier engagement is proven |

## 5. AI Components — Exact Spec

### 5.1 AI Condition Scorecard

**Input:** seller-submitted photos (multiple angles, per a fixed required-shot template) + optional short video

**Output:** a condition tier (Pristine / Excellent / Very Good / Good) + a short generated description of visible wear

**Critical constraint:** this is a cosmetic/visible-wear assessment only. It must never be marketed or coded as a safety inspection or authenticity certification. For safety-relevant categories (helmets, saddles, harnesses), the flow must require an additional seller disclosure checklist ("has this item ever been in a fall/impact/crash," etc.) separate from the AI output.

**v1 implementation:** a vision-capable LLM API call (e.g., Claude or GPT-4V) prompted against the fixed photo template, returning structured JSON (`condition_tier`, `visible_wear_notes`, `flagged_concerns`). This does not require training a custom model for v1.

### 5.2 AI Price Suggestion

**v1 (no transaction history yet):** pull comparable sold-listing data from public sources (eBay sold listings, SidelineSwap where visible) for the same category/brand/condition tier, and suggest a price range.

**v2 (once real transaction data exists):** retrain toward the platform's own sold-price history.

**Output to seller:** a suggested price range + the comparable listings it was based on (builds seller trust in the number).

### 5.3 AI Pattern/Demand Analytics — P2, not MVP

Aggregate search, watchlist, and sales data to surface category-level trends to sellers and to the founder for merchandising decisions. Explicitly a post-MVP feature.

## 6. Fee Logic Spec

| Category type | Examples | Platform fee |
|---------------|----------|--------------|
| Commodity | Spikes, cleats, protective gear | 10-12% (match SidelineSwap; lower after 6+ sales, mirroring their tiering) |
| Niche/high-ticket | Fencing kits, equestrian tack, golf-tech, ski/snowboard | 18-20% |

Plus, on all transactions: standard payment processing (2.9% + $0.30), passed through to the buyer or absorbed per founder's decision.

**Build note:** category-to-fee-tier mapping should be a configurable table/lookup, not hardcoded — fee tiers and specific rates are stated as planning assumptions in the financial model and will likely be adjusted after the pilot.

## 7. Data Model (Sketch)

```
User { id, name, email, role[buyer/seller/both], created_at }
Listing { id, seller_id, category, sport, price, suggested_price_range, condition_tier, ai_notes, photos[], status[draft/live/sold/removed], fee_tier, created_at, price_history[] }
Watchlist { user_id, listing_id, created_at }
SavedSearch { user_id, filters (json), created_at }
Transaction { id, listing_id, buyer_id, seller_id, sale_price, platform_fee, processing_fee, payout_amount, status, created_at }
Notification { user_id, type[price_drop/new_match/sold/restock], payload, sent_at }
Category { id, name, sport, fee_tier[commodity/niche] }
```

## 8. Recommended Tech Stack

- **Frontend:** Next.js (App Router) + Tailwind
- **Backend/DB:** Supabase (Postgres + auth + storage)
- **Payments:** Stripe (Connect for seller payouts, Stripe Tax for marketplace-facilitator sales tax)
- **Image storage:** Supabase Storage
- **AI calls:** Anthropic or OpenAI API (vision-capable) for condition scorecard; server-side comparable-listing lookup for pricing
- **Hosting:** Vercel
- **Repo structure:** standard Next.js app router layout; this spec lives at `/docs/PRD.md`

## 9. Brand & Design Direction

**Feel:** premium, slick, aspirational — reference points are The RealReal, Nike, Puma, ASOS. Explicitly not SidelineSwap/Poshmark/eBay's utilitarian, cluttered, DIY feel.

**Mechanics that create the "premium" feel at low cost:** consistent AI-standardized photo presentation, no price negotiation/haggling, a clean 4-tier condition badge system, a genuine "new arrivals" concept.

## 10. Success Metrics to Instrument From Day One

1. Repeat seller rate
2. Sell-through rate by category
3. Dispute/return rate
4. Organic share/waitlist growth vs. paid reach
5. Contribution margin per category tier

Build basic event tracking for these from the prototype stage.

## 11. Legal/Compliance Build Requirements

- Seller ToS + condition/authenticity liability disclaimer — acceptance flow (checkbox, timestamp, version tracking) should be built now.
- Sales tax: integrate Stripe Tax rather than hand-rolling.
- Safety-category disclosure checklist (Section 5.1) is a build requirement.
