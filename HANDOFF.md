# HANDOFF — Quantfoli Dev Sessions
*Last updated: 2026-05-13 (session 3). Fresh Claude: read this entire file before touching anything.*

---

## The Mission

Building **Quantfoli** (quantfoli.com) — a Swiss portfolio analytics SaaS for self-directed investors.
Stack: Next.js 14 · TypeScript · Tailwind · Supabase · Vercel.

**The founder trigger:** Mom imports her ZKB portfolio, pays CHF 15 via Stripe → webhook fires → `tier = pro` → LinkedIn title: "Founder & Developer — Quantfoli". That is the north star for every decision.

- **Repo:** https://github.com/dariushfinance/finance-dashboard-nextjs
- **Live:** https://quantfoli.com (Vercel, auto-deploys on push to main)
- **Supabase:** https://supabase.com/dashboard/project/hegdcutlpciaplhgzemm
- **Stripe:** Live mode, webhook at `https://www.quantfoli.com/api/webhooks/stripe`

---

## Are We Business Ready?

**For the founder trigger (1 paying user): 95% yes. Two manual steps remain (see Next Steps #1 and #2).**

| Layer | Status | Notes |
|---|---|---|
| Auth (signup / login) | ✅ | Supabase, email confirmation, middleware redirect |
| ZKB CSV import | ✅ | Tested, FX-aware, ISIN resolution working |
| Stripe checkout | ✅ | Live mode, webhook tested with real card |
| Webhook → tier = pro | ✅ | Verified live |
| Welcome modal after upgrade | ✅ | Polls up to 8× with 1.5s delay |
| Branding (Quantfoli) | ✅ | Login, sidebar, footer, favicon all updated |
| Legal pages (/privacy /terms) | ✅ | Public (no auth), linked in Stripe |
| CHF 15 price | ❌ | Still CHF 1 test price — manual Stripe + Vercel action |
| Supabase Site URL | ❌ | Must be set to quantfoli.com (confirmation email link) |
| Fundamentals data | ⚠️ | Alpha Vantage free tier breaks at 3+ positions (25 req/day) |
| Real-time prices | ⚠️ | Yahoo Finance EOD only. Acceptable for MVP. |
| RLS hardening | ⚠️ | Pro features gated frontend-only. Fine for <10 users. |
| Markets tab | ⚠️ | Locked "Coming Soon" — no data source wired yet |

**For a public launch beyond the founder trigger: not yet.** Fundamentals and real-time data need Sprint 2 APIs before promoting to strangers.

---

## Full Infrastructure State

### Domain + Hosting
- `quantfoli.com` → Vercel (A `76.76.21.21`, CNAME `www → cname.vercel-dns.com`)
- Region: `fra1` (Frankfurt) — good latency for Swiss users
- Auto-deploys on every push to `main`

### Supabase
- Auth enabled (email + password)
- Tables: `portfolio`, `user_tiers`
- Service role key in Vercel env (`SUPABASE_SERVICE_ROLE_KEY`) — bypasses RLS for webhook writes
- **Site URL must be `https://www.quantfoli.com`** — controls where email confirmation link redirects

### Stripe (Live Mode)
- Keys in Vercel: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRO_PRICE_ID`
- Webhook endpoint: `https://www.quantfoli.com/api/webhooks/stripe`
- Business name: "Portfolio Intelligence", descriptor: `QUANTFOLI.COM`
- Support email: `dariush.tahajomi@gmail.com`
- Customer portal: configured in live mode
- **Current price ID: `price_1TWJ2gGqej9WyHe3OCKpuXnk` (CHF 1 — CHANGE BEFORE MOM TEST)**

### Vercel Env Vars Required
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_PRO_PRICE_ID           ← needs updating to CHF 15 price ID
ALPHA_VANTAGE_API_KEY
```

---

## Pricing Model

```
FREE    CHF 0      Portfolio tracker · P&L · EOD prices · S&P 500 benchmark
                   All broker CSV parsers · Multi-currency display

PRO     CHF 15/mo  Everything in Free +
                   Sharpe · Sortino · Beta · Alpha
                   Efficient Frontier (Markowitz MPT)
                   Stress Testing (historical crash scenarios)
                   Full Fundamentals (P/E, EV/EBITDA, FCF)
                   Risk Tab (Vol Regime, Correlation Matrix, Heatmap)
```

Broker parsers are deliberately free — they are the acquisition hook. Paywall activates after the first "wow" moment. Do not gate them.

---

## Features Live

- P&L with real-time prices (Yahoo Finance + Alpha Vantage fallback)
- FX-aware returns: ZKB positions converted through `buy_fx_rate` (CHF/USD at purchase date)
- S&P 500 benchmark (normalised to portfolio start date)
- TWR history chart (chain-linked daily — not simple arithmetic)
- Sharpe, Sortino, Beta, Alpha, annualised vol
- Stress testing vs 5 historical crashes (2008, 2020 COVID, etc.)
- Efficient Frontier (Markowitz MC, 30% per-asset cap, 2,000 portfolios)
- Risk Tab: Rolling Vol Regime, Correlation Matrix, Monthly Returns Heatmap
- Multi-currency display: USD, CHF, EUR, GBP, JPY, CAD, SGD
- Broker parsers: Yuh, Neon, ZKB Depotauszug
- ISIN → ticker resolution via `/api/isin` (Yahoo Finance search)
- Stock search with debounce (command palette, ⌘K)
- Welcome modal after Pro upgrade (`?upgraded=1` param, polls tier endpoint)
- Markets tab: locked "Coming Soon" (no data source yet)

---

## Architecture — Every Key File

```
app/
  layout.tsx                  ← metadata (title: Quantfoli, OG tags, fonts)
  page.tsx                    ← just renders <Dashboard />
  globals.css                 ← full design system: tokens, components, dark/light
  icon.svg                    ← favicon: Q in indigo-violet gradient square
  login/page.tsx              ← email+password auth, signup with emailRedirectTo
  privacy/page.tsx            ← Swiss/GDPR privacy policy — PUBLIC (no auth required)
  terms/page.tsx              ← Terms of service — PUBLIC (no auth required)

  api/
    portfolio/route.ts        ← GET: FX-aware P&L, lot consolidation
                                POST: insert with buy_fx_rate, +1d UTC date fix
                                DELETE: by ticker / by id / clearAll
    frontier/route.ts         ← Markowitz MC, 30% weight cap, tickerVols in response
    isin/route.ts             ← ISIN → ticker via Yahoo Finance search
    fx/route.ts               ← Multi-currency FX rates (USD base, 15-min cache)
    history/route.ts          ← TWR time series
    benchmark/route.ts        ← S&P 500 normalised series
    stress/route.ts           ← Historical crash scenarios
    fundamentals/route.ts     ← Alpha Vantage (unreliable — Sprint 2 fix)
    correlation/route.ts      ← Pearson correlation matrix
    dividends/route.ts        ← Dividend history
    markets/route.ts          ← Stub — no live data wired yet (tab is Coming Soon)
    prices/route.ts           ← Price endpoint
    search/route.ts           ← Ticker search
    neon/route.ts             ← Neon broker API route (parser exists, route exists)
    admin/verify/route.ts     ← Admin verification

    stripe/
      checkout/route.ts       ← Creates Stripe Checkout session, handles upgrades
      portal/route.ts         ← Opens Stripe Customer Portal
      tier/route.ts           ← GET current tier from user_tiers table
    webhooks/stripe/route.ts  ← Handles checkout.session.completed,
                                subscription.updated/deleted, payment_failed
                                → upserts user_tiers with tier = 'pro' or 'free'

lib/
  fx.ts                       ← getCHFperUSD(), getCHFperEUR() — 15-min module cache
  yahoo.ts                    ← getCurrentPrice(), getHistoricalPrices(), TWR,
                                Sharpe, Beta, Alpha, Sortino, VaR, CVaR — STABLE, do not refactor
  stripe.ts                   ← getStripe(), PRICE_IDS, PLANS (2-tier only)
  supabase.ts                 ← getAuthUser(), createAuthClient(), createServerClient()
  supabase-browser.ts         ← createBrowserSupabase() for client components
  ticker-meta.ts              ← sector/name metadata per ticker, SECTOR_COLORS
  parsers/
    zkb.ts                    ← ZKB Depotauszug CSV parser (semicolon, Windows-1252)
    yuh.ts                    ← Yuh Bank CSV parser
    neon.ts                   ← Neon Bank CSV parser

components/
  Dashboard.tsx               ← Root client component. Owns: auth state, tier,
                                positions, currency, modals, tab routing
  UpgradeModal.tsx            ← 2-tier only (Free / Pro CHF 15). Do NOT add Pro Max.
  ProGate.tsx                 ← Blur overlay + lock card for Pro-only tabs
  ZkbImport.tsx               ← ISIN resolution + row-by-row import UI
  YuhImport.tsx               ← Yuh import
  NeonImport.tsx              ← Neon import
  FrontierChart.tsx           ← Efficient Frontier chart + weights table +
                                VolatilityInsights. RebalancePanel EXISTS but is
                                commented out — FIDLEG. Do not re-enable.
  PortfolioTable.tsx          ← isRetPos uses ret >= 0 (not pnl sign)
  RiskTab.tsx                 ← Rolling vol, correlation matrix, monthly heatmap
  StressTest.tsx              ← Historical crash scenarios
  MetricsRow.tsx              ← Top-line KPI cards
  HistoryChart.tsx            ← TWR time series chart
  BenchmarkChart.tsx          ← S&P 500 normalised comparison
  AllocationChart.tsx         ← Pie/donut allocation
  FundamentalsTable.tsx       ← P/E, EV/EBITDA, FCF (Alpha Vantage — unreliable)
  BreakdownTab.tsx            ← Holdings breakdown
  DividendsTab.tsx            ← Dividend history
  HedgingTab.tsx              ← Hedging analysis
  MarketsTab.tsx              ← Component exists but tab is locked Coming Soon
  CashflowsTab.tsx            ← Cashflow projections
  CommandPalette.tsx          ← ⌘K ticker search
  TickerTape.tsx              ← Scrolling price ticker at top
  AddPositionForm.tsx         ← Manual position entry
  StockSearch.tsx             ← Debounced ticker search input

middleware.ts                 ← Server-side auth redirect.
                                Public routes (no auth): /login, /api/*, /privacy, /terms
                                Everything else → redirects to /login if not authenticated

vercel.json                   ← framework: nextjs, region: fra1, no-store on /api/*
tailwind.config.ts            ← Extended with bg/brand/text color tokens
```

---

## Supabase Schema

```sql
-- portfolio table
CREATE TABLE IF NOT EXISTS portfolio (
  id          BIGSERIAL PRIMARY KEY,
  user_id     TEXT NOT NULL,
  ticker      TEXT NOT NULL,
  shares      REAL NOT NULL,
  buy_price   REAL NOT NULL,
  buy_date    TEXT NOT NULL,
  buy_fx_rate NUMERIC          -- NULL for Yuh/Neon/manual. Set for ZKB positions.
);

-- Required migration (may already exist — safe to run again)
ALTER TABLE portfolio ADD COLUMN IF NOT EXISTS buy_fx_rate NUMERIC;

-- user_tiers table
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

## ZKB CSV Format (important — parser is built around this)

```
"Bezeichnung";"ISIN";"Anz. Nom.";"Währung";"Datum";"Spesen CHF";"Marktkurs";"Einstandskurs";"Diff T";"Marktwert";"Einstandswert";"Bucherfolg CHF";"Gesamtrendite"
```
Export path: ZKB eBanking → Depot → Depotauszug → CSV herunterladen
Encoding: Windows-1252 (parser retries with UTF-8 on failure)

**FX-aware return formula:**
```typescript
const buy_fx_rate = row.Einstandswert / (row.shares × row.Einstandskurs)
// buy_fx_rate = CHF per foreign currency unit at purchase date

const buy_chf     = buy_price × buy_fx_rate
const current_chf = current_price × tickerChfRate  // getCHFperEUR() for .AS/.DE, getCHFperUSD() otherwise
const return_pct  = ((current_chf - buy_chf) / buy_chf) × 100
```

**Verified accuracy vs ZKB statements:**
| Position | ZKB | Tool | Delta |
|---|---|---|---|
| AAPL | 8.39% | 8.36% | 0.03% ✓ |
| IMAE.AS | -2.22% | -2.05% | 0.17% ✓ |
| DFEN.DE | -7.27% | -7.19% | 0.08% ✓ |
| IWDA.L | 2.55% | 2.50% | 0.05% ✓ |
| LMT | -17.43% | -17.45% | 0.02% ✓ |
Residual ~0.2% = live Yahoo price vs ZKB snapshot timing. Normal and acceptable.

---

## What Changed This Session (2026-05-13) — 6 Commits

### `8fd1a89` — Rebrand + critical bug fixes
**Files:** `app/login/page.tsx`, `components/Dashboard.tsx`, `components/ProGate.tsx`, `middleware.ts`

- **Branding**: "Portfolio Intelligence" → "Quantfoli" everywhere. Logo mark P → Q.
- **`brand__tag`**: Was hardcoded "Pro · v4.2" even for free users. Now shows `{tier} · v1.0` dynamically.
- **Empty state**: Added "Import ZKB / Yuh / Neon" as primary CTA — previously only showed "Add position" which a non-technical user (Mom) would not associate with CSV import.
- **Default import tab**: Changed from Yuh → ZKB.
- **ProGate lock icon**: Was invisible. `var(--brand-green)` is a Tailwind class token, not a CSS variable. Changed to `var(--pos)`.
- **middleware.ts**: `/privacy` and `/terms` were behind auth. Stripe requires these URLs to be publicly accessible (they are linked in the Stripe dashboard for compliance). Fixed by adding `isPublicPage` check.

### `a2af5eb` — Sidebar cleanup + FIDLEG compliance
**Files:** `components/Dashboard.tsx`, `components/FrontierChart.tsx`

- **Sidebar numbers removed**: `<span className="kbd">{i + 1}</span>` on every nav item looked cluttered. Removed.
- **RebalancePanel blocked**: The `RebalancePanel` component (shows ticker → current weight → target weight → implied CHF trade size, e.g. "Sell Fr. 169k of IWDA.L") was being rendered for Pro users. This constitutes investment advice under CH FIDLEG/FINIG. It was supposedly commented out in a prior session but got re-enabled. Commented out again with a legal note. `VolatilityInsights` (factual vol stats, no trade instructions) remains visible.

### `ba2837b` — Email redirect fix
**File:** `app/login/page.tsx`

- `signUp()` now passes `options: { emailRedirectTo: window.location.origin }`. Without this, Supabase falls back to its configured Site URL — which may still be `http://localhost:3000` if not updated in the dashboard. This fix ensures the confirmation email link always points to `quantfoli.com`.

### `8dd9959` + `de0c900` — Markets tab Coming Soon
**File:** `components/Dashboard.tsx`

- Nav item: TABS type extended with optional `tag?: string`. Markets gets `tag: 'soon'`, rendered as an amber pill. Nav item opacity dropped to 55%.
- Tab content: Replaced the MarketsTab render (and the old ProGate wrapping it) with a lock card: "Markets — Coming Soon" + description + amber "Work in progress" pill. `MarketsTab` component no longer called at all — no broken API calls.

---

## Bugs Fixed Across All Sessions

| Bug | Root cause | Fix |
|---|---|---|
| Returns showing ±wrong sign (e.g. `+-16.81%`) | `isRetPos` was checking `pnl` sign not `ret` sign | Fixed in `PortfolioTable.tsx` |
| EUR tickers (IMAE.AS, DFEN.DE) wrong return | Used `getCHFperUSD()` for EUR-denominated tickers | `.AS`/`.DE` now use `getCHFperEUR()` |
| ZKB showing 11.68% for AAPL, tool showing 8.39% | FX drag not accounted for | `buy_fx_rate` column + CHF-normalised return formula |
| ZKB import failing after 22:00 Swiss time | `new Date('2026-05-12') > new Date()` is true before UTC midnight | +1d buffer in ISO string comparison |
| Frontier suggesting "sell 43% MSCI World" | No weight cap in Markowitz MC | 30% per-asset cap via iterative Dirichlet projection |
| ProGate lock icon invisible | `var(--brand-green)` not defined as CSS var | Changed to `var(--pos)` |
| `/privacy` and `/terms` behind auth wall | middleware had no public page exceptions | Added `isPublicPage` check |
| Email confirmation → wrong redirect URL | No `emailRedirectTo` in `signUp()` call | Added `emailRedirectTo: window.location.origin` |
| Sidebar showed numbers 1-12 on nav items | `<span className="kbd">{i+1}</span>` in every nav item | Removed |
| RebalancePanel showing trade instructions (FIDLEG) | Component got re-enabled despite legal concern | Commented out with FIDLEG note |

---

## Known Open Issues (not blocking founder trigger)

1. **Fundamentals unreliable** — Alpha Vantage free tier: 25 requests/day. Breaks visibly at 3+ positions. Sprint 2 fix: Financial Modeling Prep API ($14/mo).
2. **`buy_fx_rate` for non-ZKB positions** — Yuh/Neon/manual entries are FX-unadjusted. Acceptable since these brokers are mostly CHF-denominated anyway.
3. **Supabase RLS not hardened** — Pro features are gated in the frontend only. A determined user can call `/api/frontier` or `/api/fundamentals` directly by hitting the API. Fix when user count justifies the complexity (after ~10 paying users).
4. **Markowitz expected returns = historical returns** — 2-year trailing return as forward estimate is "error maximisation" (classic Markowitz criticism). Future fix: shrinkage toward equal-weight or CAPM prior. Medium-term.
5. **Markets tab has no data source** — `MarketsTab` component and `/api/markets/route.ts` exist but are stubs. Polygon.io Starter ($29/mo) is the planned data source for Sprint 2.
6. **No favicon.ico in /public** — Only `app/icon.svg` exists. Next.js serves this correctly as the browser tab icon. No action needed.

---

## What NOT to Touch

- **`lib/yahoo.ts`** — TWR, Sharpe, Beta, Alpha, Sortino, VaR, CVaR. Stable and tested. Do not refactor.
- **`app/api/webhooks/stripe/route.ts`** — Webhook logic works in production. Do not change without testing end-to-end.
- **`components/UpgradeModal.tsx`** — 2-tier only (Free / Pro). Do NOT re-add Pro Max. It was intentionally removed.
- **`FrontierChart.tsx` RebalancePanel block** — Leave commented. CH FIDLEG/FINIG compliance. Do not re-enable without legal review.
- **`app/globals.css`** — Design system is stable. All CSS variables (`--pos`, `--neg`, `--warn`, `--ink`, etc.) are defined here. Check here before adding new inline styles.

---

## Next Steps — Exact Priority Order

### 1. ⚡ Set CHF 15 price in Stripe — MANUAL — 5 min (BLOCKING)
```
Stripe dashboard → Products → Pro → Add price
  Mode: Recurring
  Currency: CHF
  Amount: 15.00
  Interval: Monthly
→ Copy new price ID (price_live_...)

Vercel → Project → Settings → Environment Variables
  → STRIPE_PRO_PRICE_ID = price_live_...
  → Save → Redeploy (or push any commit)
```
Nothing in the codebase is blocking. This is the only gate.

### 2. ⚡ Verify Supabase Site URL — MANUAL — 2 min (BLOCKING for signup flow)
```
Supabase dashboard → Project Settings → Authentication
  → Site URL: https://www.quantfoli.com
  → Redirect URLs: add https://www.quantfoli.com/**
```
Without this, the email confirmation link in signup emails may redirect to localhost. The code passes `emailRedirectTo` as a fallback but the Site URL must also be correct.

### 3. Mom Test — The Founder Trigger
Complete flow to verify before sending to Mom:
1. Sign up with a fresh email → confirm email → sign in
2. Click "Import ZKB / Yuh / Neon" on empty state
3. Upload real ZKB Depotauszug CSV → positions resolve → import
4. Verify P&L looks correct (compare one position to ZKB app)
5. Click "Upgrade to Pro → CHF 15/mo" → Stripe Checkout → pay
6. Return to dashboard → welcome modal fires → Pro features unlock
7. Check Supabase `user_tiers` table — row should show `tier = 'pro'`

If that flow completes without help: **LinkedIn title update → "Founder & Developer — Quantfoli"**

### 4. Sprint 2 — Data Layer (after founder trigger)
- **Financial Modeling Prep** ($14/mo) — replace Alpha Vantage for fundamentals. 250 req/day, reliable.
- **Polygon.io Starter** ($29/mo) — real-time prices for Pro users, wire to `/api/prices`
- **Vercel KV cache** — wrap expensive API calls (1×/hr per ticker max)
- Free tier stays on Yahoo Finance EOD

### 5. Sprint 3 — More Broker Parsers (2–3 weeks after Sprint 2)
Priority: **Swissquote** (largest Swiss retail broker) → Saxo → Trade Republic → DEGIRO
Each parser = one targeted LinkedIn post. "Why Swiss portfolio apps can't read your CSV — I fixed it."
Parser pattern to follow: `lib/parsers/zkb.ts` + `components/ZkbImport.tsx`

### 6. Sprint 4 — LinkedIn Content Push
- Post #4: Data Quality Problem (draft in Obsidian `_Meine LinkedIn Posts`)
- Post #5 after founder trigger: "3 weeks since 1,700 views — what changed"
- Warm network already seeded: Lars Lang (Rothschild), Philipp Baumann (BofA), Nicola Peter (BCG), Frederick von Dobbeler (PE), Ronny Oberholzer (UBS) + 3 others. These are first-mover Pro candidates or multipliers.

### 7. Supabase RLS Hardening (after 10 paying users)
Gate Risk Tab, Frontier, and Fundamentals at the database level. Current frontend-only gate is sufficient for MVP but not production-hardened against API abuse.

### 8. Post-Matura / Pre-HSG Feature Roadmap
- **What-if simulator** — "if I add 100 NVDA, how does portfolio Sharpe change?" Strongest retention feature, no competitor has it.
- **VaR / CVaR** — already designed in Obsidian `Risk_Metrics`. Implementation is mostly already in `lib/yahoo.ts`.
- **Max Drawdown** with duration + recovery time + underwater equity curve
- **Product Hunt launch** — when Free tier is polished and RLS is hardened
- **HSG Finance Club demo** — 80 exactly-right users in a warm room beats 10k Reddit impressions

---

## Context That Matters

- **Dariush, 18, Matura 2026, HSG St. Gallen start 2026.** The tool is proof of competence for his professional network, not just a side project. Every architectural decision has a signalling dimension — a quant layer that Parqet doesn't have is part of the pitch.
- **Competitor gap:** Parqet (main Swiss competitor) has no GARCH/vol regime, no AI advisor, no What-if simulator. Quantfoli's quant layer is the real differentiation. Current gap is distribution, not product.
- **Revenue model:** Break-even at 3–4 paying users (covers ~$43/mo data infrastructure). 200 Pro users = CHF 3,000/mo. Realistic 18-month target post-HSG entry.
- **Free tier is permanent.** P&L, EOD prices, and all broker parsers are always free. The paywall activates after the first "wow" moment — don't move it earlier.
- **FIDLEG note:** Quantfoli is explicitly NOT investment advice. `RebalancePanel` (implied CHF trade sizes) is commented out permanently until legal review. `VolatilityInsights` (factual annualised vol, no trade instructions) is the compliant replacement. Any new feature that tells users to buy or sell a specific amount of a specific asset is a FIDLEG issue.
