# HANDOFF — Quantfoli
*Last updated: 2026-05-13 (session 4 end). Fresh Claude: read this entire file before touching anything.*

---

## The Mission

Building **Quantfoli** (quantfoli.com) — a Swiss portfolio analytics SaaS for self-directed investors.
Stack: Next.js 14 · TypeScript · Tailwind · Supabase · Vercel.

**The founder trigger:** Mom imports her ZKB portfolio, pays CHF 15 via Stripe → webhook fires → `tier = pro` → LinkedIn title: "Founder & Developer — Quantfoli".

- **Repo:** https://github.com/dariushfinance/finance-dashboard-nextjs
- **Live:** https://quantfoli.com (Vercel, auto-deploys on push to main)
- **Supabase:** https://supabase.com/dashboard/project/hegdcutlpciaplhgzemm
- **Stripe:** Live mode · webhook at `https://www.quantfoli.com/api/webhooks/stripe`

---

## Current Status — What Still Blocks the Founder Trigger

Only two manual steps remain. Everything in the codebase is done.

### 1. Set CHF 15 price in Stripe + update Vercel env var
```
Stripe dashboard → Products → "Quantfoli PRO" → the CHF 15 price was being created
at end of session. Once saved:
  → Copy the price ID (price_live_...)
  → Vercel → Project → Settings → Environment Variables
  → Update STRIPE_PRO_PRICE_ID = price_live_...
  → Save → Redeploy
```
Current price ID in use: `price_1TWJ2gGqej9WyHe3OCKpuXnk` (CHF 1 test — replace this)

### 2. Verify Supabase Site URL
```
Supabase dashboard → Project Settings → Authentication
  → Site URL: https://www.quantfoli.com
  → Redirect URLs: add https://www.quantfoli.com/**
```
Without this, email confirmation links may redirect to localhost.

---

## Business Readiness

| Layer | Status | Notes |
|---|---|---|
| Auth (signup / login) | ✅ | Email confirmation, middleware redirect, emailRedirectTo fixed |
| ZKB CSV import | ✅ | Tested, FX-aware, ISIN resolution working |
| Stripe checkout | ✅ | Live mode, Apple Pay + Google Pay + Klarna + card all enabled |
| Webhook → tier = pro | ✅ | Verified live with real card |
| Welcome modal after upgrade | ✅ | Polls 8× · also triggerable via `?welcome=1` |
| Branding | ✅ | Quantfoli everywhere — login, sidebar, footer, favicon |
| Legal pages | ✅ | /privacy + /terms public (no auth), linked in Stripe |
| CHF 15 price | ❌ | Being created in Stripe — needs env var update + redeploy |
| Supabase Site URL | ❌ | Verify it points to quantfoli.com |
| Fundamentals | ⚠️ | Alpha Vantage 25 req/day — breaks at 3+ positions. Sprint 2 fix. |
| Real-time prices | ⚠️ | Yahoo Finance EOD only. Fine for MVP. |
| RLS hardening | ⚠️ | Frontend-only gating. Fine for <10 users. |
| Markets tab | ⚠️ | Locked "Coming Soon" — no data source yet |

---

## Full Infrastructure

### Domain + Hosting
- `quantfoli.com` → Vercel (A `76.76.21.21`, CNAME `www → cname.vercel-dns.com`)
- Region: `fra1` (Frankfurt)
- Auto-deploys on every push to `main`

### Stripe (Live Mode)
- Vercel env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRO_PRICE_ID`
- Webhook: `https://www.quantfoli.com/api/webhooks/stripe`
- Business name: "Portfolio Intelligence" · descriptor: `QUANTFOLI.COM`
- Support email: `dariush.tahajomi@gmail.com`
- Customer portal: configured
- Payment methods: card · Apple Pay · Google Pay · Klarna · Amazon Pay (all auto-detected)
- **Price being set: CHF 15/mo recurring · tax included · "Quantfoli PRO"**

### Supabase
- Auth: email + password
- Tables: `portfolio`, `user_tiers`
- Service role key bypasses RLS for webhook writes
- **Site URL: must be set to `https://www.quantfoli.com`**

### Vercel Env Vars
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_PRO_PRICE_ID           ← UPDATE TO CHF 15 PRICE ID
ALPHA_VANTAGE_API_KEY
```

---

## Pricing

```
FREE    CHF 0      Portfolio tracker · P&L · EOD prices · S&P 500 benchmark
                   All broker CSV parsers (ZKB, Yuh, Neon) · Multi-currency

PRO     CHF 15/mo  Everything in Free +
                   Sharpe · Sortino · Beta · Alpha
                   Efficient Frontier (Markowitz MPT)
                   Stress Testing
                   Full Fundamentals (P/E, EV/EBITDA, FCF)
                   Risk Tab (Vol Regime · Correlation Matrix · Heatmap)
```

Broker parsers are free permanently — they are the acquisition hook.

---

## Architecture — Every Key File

```
app/
  layout.tsx                  ← title: Quantfoli, OG tags, fonts
  page.tsx                    ← renders <Dashboard />
  globals.css                 ← full design system (tokens, dark/light, components)
  icon.svg                    ← favicon: Q, indigo-violet gradient
  login/page.tsx              ← email+password auth · signUp passes emailRedirectTo
  privacy/page.tsx            ← PUBLIC — no auth required (Stripe compliance)
  terms/page.tsx              ← PUBLIC — no auth required (Stripe compliance)

  api/
    portfolio/route.ts        ← GET: FX-aware P&L · POST: insert · DELETE: by ticker/id/all
    frontier/route.ts         ← Markowitz MC, 30% weight cap, returns tickerVols
    isin/route.ts             ← ISIN → ticker via Yahoo Finance search
    fx/route.ts               ← FX rates, USD base, 15-min module cache
    history/route.ts          ← TWR time series
    benchmark/route.ts        ← S&P 500 normalised
    stress/route.ts           ← Historical crash scenarios
    fundamentals/route.ts     ← Alpha Vantage (unreliable at free tier)
    correlation/route.ts      ← Pearson correlation matrix
    dividends/route.ts        ← Dividend history
    markets/route.ts          ← Stub, no data source wired (tab is Coming Soon)
    prices/route.ts           ← Price endpoint
    search/route.ts           ← Ticker search
    neon/route.ts             ← Neon broker API route
    admin/verify/route.ts     ← Admin

    stripe/
      checkout/route.ts       ← Creates Checkout session · no payment_method_types
                                restriction → Apple Pay/Google Pay/Klarna auto-enabled
      portal/route.ts         ← Stripe Customer Portal
      tier/route.ts           ← GET tier from user_tiers
    webhooks/stripe/route.ts  ← checkout.session.completed · subscription.updated/deleted
                                · payment_failed → upserts user_tiers.tier

lib/
  fx.ts                       ← getCHFperUSD(), getCHFperEUR(), 15-min cache
  yahoo.ts                    ← getCurrentPrice(), TWR, Sharpe, Beta, Alpha, Sortino,
                                VaR, CVaR — STABLE. Do not refactor.
  stripe.ts                   ← getStripe(), PRICE_IDS, PLANS (2-tier only)
  supabase.ts                 ← getAuthUser(), createAuthClient(), createServerClient()
  supabase-browser.ts         ← createBrowserSupabase() for client components
  ticker-meta.ts              ← sector metadata, SECTOR_COLORS
  parsers/
    zkb.ts                    ← ZKB Depotauszug CSV parser (semicolon, Windows-1252)
    yuh.ts                    ← Yuh Bank parser
    neon.ts                   ← Neon Bank parser

components/
  Dashboard.tsx               ← Root client component. Auth, tier, positions, modals,
                                tab routing. Default import tab: zkb. Handles ?upgraded=1
                                (polls tier) and ?welcome=1 (direct modal open).
  UpgradeModal.tsx            ← 2-tier only. Do NOT add Pro Max.
  ProGate.tsx                 ← Blur + lock overlay. Lock icon: var(--pos), not var(--brand-green).
  ZkbImport.tsx               ← ISIN resolution + row-by-row import
  YuhImport.tsx / NeonImport.tsx
  FrontierChart.tsx           ← Efficient Frontier + weights table + VolatilityInsights.
                                RebalancePanel EXISTS but is commented out — FIDLEG.
                                Do not re-enable without legal review.
  PortfolioTable.tsx          ← isRetPos uses ret >= 0 (not pnl sign)
  RiskTab.tsx / StressTest.tsx / FundamentalsTable.tsx
  HistoryChart.tsx / BenchmarkChart.tsx / AllocationChart.tsx
  MarketsTab.tsx              ← Component exists, tab is locked Coming Soon
  [other tabs]

middleware.ts                 ← Auth redirect. Public (no auth): /login · /api/* · /privacy · /terms
vercel.json                   ← region: fra1 · no-store on /api/*
tailwind.config.ts            ← brand/bg/text color tokens
```

---

## Supabase Schema

```sql
CREATE TABLE IF NOT EXISTS portfolio (
  id          BIGSERIAL PRIMARY KEY,
  user_id     TEXT NOT NULL,
  ticker      TEXT NOT NULL,
  shares      REAL NOT NULL,
  buy_price   REAL NOT NULL,
  buy_date    TEXT NOT NULL,
  buy_fx_rate NUMERIC    -- NULL for Yuh/Neon/manual. Set for ZKB.
);

ALTER TABLE portfolio ADD COLUMN IF NOT EXISTS buy_fx_rate NUMERIC;

CREATE TABLE IF NOT EXISTS user_tiers (
  user_id                TEXT PRIMARY KEY,
  tier                   TEXT DEFAULT 'free',
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  subscription_status    TEXT,
  current_period_end     TIMESTAMPTZ,
  updated_at             TIMESTAMPTZ
);
```

---

## ZKB CSV Format

```
"Bezeichnung";"ISIN";"Anz. Nom.";"Währung";"Datum";"Spesen CHF";"Marktkurs";
"Einstandskurs";"Diff T";"Marktwert";"Einstandswert";"Bucherfolg CHF";"Gesamtrendite"
```
Export path: ZKB eBanking → Depot → Depotauszug → CSV herunterladen
Encoding: Windows-1252 (parser retries UTF-8 on failure)

**FX return formula:**
```typescript
const buy_fx_rate = Einstandswert / (shares × Einstandskurs)  // CHF per foreign unit at purchase
const buy_chf     = buy_price × buy_fx_rate
const current_chf = current_price × tickerChfRate             // getCHFperEUR() for .AS/.DE
const return_pct  = ((current_chf - buy_chf) / buy_chf) × 100
```
Verified accuracy ±0.2% vs ZKB statements (residual = live price vs snapshot timing).

---

## Everything Changed This Session (all commits)

### `8fd1a89` — Rebrand to Quantfoli + critical fixes
- "Portfolio Intelligence" → "Quantfoli" everywhere (sidebar, login, footer). Mark P → Q.
- `brand__tag` was hardcoded "Pro · v4.2" for all users → now shows actual tier dynamically
- Empty state: added "Import ZKB / Yuh / Neon" as primary CTA (previously only "Add position" — a non-technical user wouldn't connect that with CSV import)
- Default import tab: Yuh → ZKB
- ProGate lock icon was invisible: `var(--brand-green)` is a Tailwind token, not a CSS variable → fixed to `var(--pos)`
- `middleware.ts`: `/privacy` and `/terms` were behind auth — Stripe requires these to be publicly accessible → added `isPublicPage` check

### `a2af5eb` — Sidebar cleanup + FIDLEG
- Removed `<span className="kbd">{i+1}</span>` number badges from every nav item (looked cluttered)
- `RebalancePanel` in `FrontierChart.tsx` had been re-enabled for Pro users — shows specific implied CHF trade sizes ("sell IWDA.L 44% = −Fr. 169k") which is investment advice under CH FIDLEG/FINIG. Commented out again with legal note. `VolatilityInsights` (factual vol stats) stays visible.

### `ba2837b` — Email redirect fix
- `signUp()` now passes `emailRedirectTo: window.location.origin`
- Without this, Supabase falls back to its configured Site URL which may still be localhost

### `8dd9959` + `de0c900` — Markets Coming Soon
- TABS type extended with optional `tag?: string`
- Markets gets `tag: 'soon'` → amber pill in nav + 55% opacity
- Tab content replaced with lock card: "Markets — Coming Soon" + description
- `MarketsTab` component no longer rendered — no broken API calls

### `da623a8` — Demo welcome modal param
- Added `?welcome=1` URL param that directly opens the welcome modal without polling
- For video demo: set tier to 'pro' in Supabase → navigate to `quantfoli.com/?welcome=1` → modal fires instantly
- `?upgraded=1` (real Stripe flow) unchanged

### `7d87119` — Apple Pay / Google Pay / Klarna
- Removed `payment_method_types: ['card']` from `app/api/stripe/checkout/route.ts`
- When this field is absent, Stripe auto-detects all available payment methods per device
- Confirmed live: iPhone shows card · Apple Pay · Klarna · Amazon Pay
- Apple does NOT take a provision on web payments (that's App Store only)
- No domain certificate needed — we use Stripe Checkout (hosted on Stripe's domain), not Payment Element

---

## All Bugs Fixed (cumulative across all sessions)

| Bug | Cause | Fix |
|---|---|---|
| Return showing wrong sign (`+-16.81%`) | `isRetPos` checked `pnl` not `ret` | Fixed in `PortfolioTable.tsx` |
| EUR tickers wrong return | Used getCHFperUSD() for EUR tickers | `.AS`/`.DE` → getCHFperEUR() |
| ZKB AAPL showing 11.68% not 8.39% | FX drag not accounted for | `buy_fx_rate` column + CHF-normalised return |
| ZKB import fails after 22:00 Swiss time | UTC date comparison before midnight | +1d buffer in ISO string comparison |
| Frontier: "sell 44% MSCI World" | No weight cap in optimizer | 30% cap via iterative Dirichlet projection |
| ProGate lock icon invisible | `var(--brand-green)` not a CSS var | → `var(--pos)` |
| /privacy + /terms behind auth | No public page exception in middleware | Added `isPublicPage` check |
| Email confirmation → wrong redirect | No `emailRedirectTo` in signUp | Added `window.location.origin` |
| Sidebar numbers 1–12 on nav items | Hardcoded `<span class="kbd">` | Removed |
| RebalancePanel showing trade instructions | Got re-enabled after being blocked | Commented out again, FIDLEG note |
| Apple Pay not showing despite activated | `payment_method_types: ['card']` blocked it | Removed the restriction entirely |
| Welcome modal not firing for demo | useEffect doesn't re-run on client nav | Added `?welcome=1` direct trigger |

---

## Open Issues (not blocking founder trigger)

1. **Fundamentals unreliable** — Alpha Vantage 25 req/day. Breaks at 3+ positions. Sprint 2: Financial Modeling Prep ($14/mo).
2. **buy_fx_rate for non-ZKB positions** — Yuh/Neon/manual entries are FX-unadjusted. Acceptable (mostly CHF-denominated).
3. **RLS not hardened** — Pro features gated frontend-only. Fix after 10 paying users.
4. **Markowitz uses historical returns as forward estimates** — classic error maximisation. Future fix: shrinkage to equal-weight or CAPM prior.
5. **Markets tab stub** — MarketsTab component and /api/markets exist but have no live data. Polygon.io Starter ($29/mo) is the plan.

---

## What NOT to Touch

- **`lib/yahoo.ts`** — TWR, Sharpe, Beta, Sortino, VaR, CVaR. Stable. Do not refactor.
- **`app/api/webhooks/stripe/route.ts`** — Working in production. Do not change without end-to-end test.
- **`components/UpgradeModal.tsx`** — 2-tier only. Do NOT add Pro Max back.
- **`FrontierChart.tsx` RebalancePanel** — Leave commented. FIDLEG. Legal review required before re-enabling.
- **`app/globals.css`** — Design system stable. All CSS vars defined here. Check here before adding inline styles.

---

## Video Demo Flow (for LinkedIn post)

For recording the founder trigger without paying again:

```
1. Supabase → user_tiers → set your row to tier = 'free'
2. Record:
   - Empty state → click "Import ZKB / Yuh / Neon"
   - Upload ZKB CSV → ISINs resolve → import
   - Portfolio loads with FX-adjusted returns
   - Click a Pro tab (Risk / Frontier) → ProGate lock shows
   - Click "Upgrade to Pro" → Stripe opens (Apple Pay, Klarna, card visible)
3. Switch to Supabase tab (off camera) → set tier = 'pro'
4. Navigate to quantfoli.com/?welcome=1
5. Welcome modal fires → all Pro tabs unlock
```

---

## LinkedIn Post (ready to publish after founder trigger fires)

**Post the same day Mom pays or same day you record the demo.**

---

6 weeks ago I posted a portfolio dashboard. Today someone paid for it.

At 18, I just launched quantfoli.com — a live, paid SaaS product. Here's what changed since the April post:

**What I actually built (the technical diff):**

→ ZKB Depotauszug parser — Swiss-specific CSV import that auto-resolves ISINs to live tickers. ZKB is one of Switzerland's largest retail banks. Upload your export, positions appear in seconds.

→ FX-adjusted returns — ZKB showed AAPL at +8.39%. My tool was showing +11.68%. The delta is USD depreciation against CHF, which ZKB bakes in and my tool wasn't. Fixed by storing the historical CHF/USD rate at purchase date and normalising all returns through CHF. Accuracy after fix: ±0.2%.

→ Markowitz optimizer with a 30% per-asset weight cap — without the cap it told users to sell 44% of their MSCI World position. Fixed via iterative projection of Dirichlet samples onto the weight-constrained simplex.

→ FIDLEG compliance layer — I removed the implied trade-size table ("buy CHF 35k of AAPL") from the Efficient Frontier tab. Under Swiss law, specific buy/sell instructions in CHF constitute investment advice. Replaced with a volatility overview — factual, non-advisory.

→ Stripe live payments. CHF 15/mo, webhook → Supabase tier update. Not a demo.

**What still doesn't work:**

Fundamentals tab (P/E, EV/EBITDA, FCF Yield) breaks at 3+ positions. Alpha Vantage free tier is 25 calls/day. The first paying user's revenue funds the fix: Financial Modeling Prep API.

This is what build-in-public actually means. Revenue before perfect. Ship, charge, reinvest.

quantfoli.com — account needed, ZKB/Yuh/Neon import is free.

If you're in Swiss finance, self-directed investing, or fintech — try to break it. I want to know what's wrong.

\#quantfinance \#buildinpublic \#fintech \#swisstech

---

**Checklist before posting:** English ✅ · Age in first 2 lines ✅ · 5+ specific terms ✅ · Live link ✅ · One flaw named precisely ✅ · Swiss finance CTA ✅ · Post Tuesday–Thursday 07:30–09:00 or 17:30–19:00

---

## Next Steps — Priority Order

### 1. Manual: Set CHF 15 in Stripe + update Vercel STRIPE_PRO_PRICE_ID (BLOCKING)
See "Current Status" section at top.

### 2. Manual: Verify Supabase Site URL = quantfoli.com (BLOCKING for signup)

### 3. Record the demo video + publish LinkedIn post
Use the `?welcome=1` flow above. 90 seconds, same format as the April 30 post that got 1700 views.

### 4. Mom Test — The Founder Trigger
Full flow: sign up → confirm email → import ZKB CSV → upgrade → CHF 15 → webhook → tier = pro → LinkedIn title update.

### 5. Sprint 2 — Data Layer (after first revenue)
- Financial Modeling Prep API ($14/mo) — fix fundamentals tab
- Polygon.io Starter ($29/mo) — real-time prices for Pro
- Vercel KV — cache expensive calls 1×/hr per ticker
- Free tier stays on Yahoo Finance EOD

### 6. Sprint 3 — More Broker Parsers
Swissquote (largest Swiss retail broker) → Saxo → Trade Republic → DEGIRO
Follow pattern: `lib/parsers/zkb.ts` + `components/ZkbImport.tsx`
Each parser = one LinkedIn post.

### 7. Supabase RLS Hardening (after 10 paying users)
Gate Pro features at DB level, not just frontend.

### 8. Post-Matura Feature Roadmap
- What-if simulator ("if I add 100 NVDA, how does Sharpe change?") — no competitor has this
- Max Drawdown with duration + recovery time
- VaR/CVaR (already in lib/yahoo.ts, needs UI)
- HSG Finance Club demo
- Product Hunt launch

---

## Context

- **Dariush, 18, Matura 2026, HSG St. Gallen 2026.** Tool = proof of competence for LinkedIn network. Founder title requires 1 paying user. Mom is the designed first user.
- **Competitor gap:** Parqet has no vol regime, no frontier, no what-if. Quant layer is the differentiator. Gap is distribution.
- **Revenue model:** Break-even at 3–4 paying users (~$43/mo infra). 200 Pro users = CHF 3,000/mo.
- **Free tier permanent.** Broker parsers always free. Don't gate the acquisition hook.
- **FIDLEG:** Quantfoli is not investment advice. RebalancePanel stays commented. Any feature showing specific CHF buy/sell amounts needs legal review first.
