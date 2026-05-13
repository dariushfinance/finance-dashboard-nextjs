# Handoff — Quantfoli Dev Sessions 2026-05-11/12

## The Mission

Building **Quantfoli** (quantfoli.com) — a Swiss portfolio analytics SaaS for self-directed investors.  
Stack: Next.js 14 · TypeScript · Tailwind · Supabase · Vercel.

**The founder trigger:** Mom imports her ZKB portfolio, pays CHF 15 via Stripe → `tier = pro` fires via webhook → LinkedIn title: "Founder & Developer — Quantfoli". That's the north star.

- Repo: https://github.com/dariushfinance/finance-dashboard-nextjs
- Live: **https://quantfoli.com** (domain live and on Vercel since 2026-05-11)
- Supabase: https://supabase.com/dashboard/project/hegdcutlpciaplhgzemm

---

## Current State (after all sessions)

### Infrastructure ✅
- Auth: Supabase Auth (since 2026-04-18)
- Stripe Checkout: integrated, webhook live (`/api/webhooks/stripe` → `tier = 'pro'`)
- Domain: quantfoli.com → Vercel (A `76.76.21.21` + CNAME `www → cname.vercel-dns.com`) — done 2026-05-11
- Supabase + Stripe URLs updated to quantfoli.com in codebase
- Pro Max tier: removed. Two tiers only: Free / Pro CHF 15/mo

### Stripe Live Mode ✅ (done 2026-05-12)
- Live keys set in Vercel: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRO_PRICE_ID`
- Live webhook endpoint: `https://www.quantfoli.com/api/webhooks/stripe`
- Customer portal configured in live mode
- Stripe public business info: name "Portfolio Intelligence", descriptor `QUANTFOLI.COM`, website `quantfoli.com`
- Privacy + Terms pages live at `/privacy` and `/terms` — linked in Stripe dashboard
- Support email: `dariush.tahajomi@gmail.com`
- Test payment of CHF 1 completed successfully with real card ✅
- Price ID in use: `price_1TWJ2gGqej9WyHe3OCKpuXnk` (CHF 1 test price — **change to CHF 15 before Mom test**)

### Features Live
- P&L with real-time prices (Yahoo Finance + Alpha Vantage fallback)
- S&P 500 benchmark (normalised)
- Sharpe, Beta, Alpha, annualised vol
- TWR history chart (chain-linked daily, not simple arithmetic — fixed 2026-05-11)
- Stress testing vs historical crashes
- Efficient Frontier (MPT, now with 30% per-asset cap — see below)
- Risk Tab: Rolling Vol Regime, Correlation Matrix, Monthly Returns Heatmap
- Multi-currency: USD, CHF, EUR, GBP, JPY — FX-aware returns for ZKB positions
- Broker parsers: Yuh, Neon, ZKB Depotauszug (ZKB added 2026-05-11)
- ISIN resolution via `/api/isin`
- Stock search with debounce
- Welcome modal fires once on upgrade (`?upgraded=1`)
- `/privacy` and `/terms` pages live (Swiss law, GDPR, no-investment-advice disclaimer)

### Pricing
```
FREE    CHF 0      Portfolio Tracker · P&L · EOD Prices · S&P Benchmark · All broker parsers
PRO     CHF 15/mo  Sharpe · Beta · Alpha · Efficient Frontier · Stress Testing
                   Full Fundamentals · Real-time Data · Multi-Currency · Risk Tab
```
Broker parsers deliberately free — they're the acquisition hook. Paywall activates after the first wow moment.

---

## What Was Built — Session 2026-05-11/12 (7 commits)

### 1. ZKB Depotauszug CSV Parser (`e16fbcd`)
- `lib/parsers/zkb.ts` — pure parser, semicolon-delimited, Windows-1252 encoding
- `components/ZkbImport.tsx` — ISIN resolution, per-row status, progress bar
- `components/Dashboard.tsx` — broker tabs changed to `['yuh', 'neon', 'zkb']`

**ZKB CSV format:**
```
"Bezeichnung";"ISIN";"Anz. Nom.";"Währung";"Datum";"Spesen CHF";"Marktkurs";"Einstandskurs";"Diff T";"Marktwert";"Einstandswert";"Bucherfolg CHF";"Gesamtrendite"
```
Export path: ZKB eBanking → Depot → Depotauszug → CSV herunterladen

### 2. CHF/USD FX-Aware Returns (`912482a`, `8e02c85`, `ce47cf2`)

**The problem:** ZKB shows AAPL at 8.39% (CHF-adjusted, USD depreciation baked in). Tool was showing 11.68% (pure USD return, FX drag invisible).

**Fix:** `buy_fx_rate` = historical CHF per USD at purchase = `Einstandswert / (shares × Einstandskurs)`

Required Supabase migration (run once):
```sql
ALTER TABLE portfolio ADD COLUMN IF NOT EXISTS buy_fx_rate NUMERIC;
```

**Files:** `lib/fx.ts` (getCHFperUSD/EUR, 15-min cache), `lib/parsers/zkb.ts`, `components/ZkbImport.tsx`, `app/api/portfolio/route.ts`

**Return formula (core):**
```typescript
const buy_chf     = row.buy_price * row.buy_fx_rate
const current_chf = current_price * tickerChfRate   // EUR/CHF for .AS/.DE, USD/CHF otherwise
const return_pct  = ((current_chf - buy_chf) / buy_chf) * 100
```

**Verified vs ZKB:**
| Position | ZKB | Tool |
|---|---|---|
| AAPL | 8.39% | 8.36% ✓ |
| IMAE.AS | -2.22% | -2.05% ✓ |
| DFEN.DE | -7.27% | -7.19% ✓ |
| IWDA.L | 2.55% | 2.50% ✓ |
| LMT | -17.43% | -17.45% ✓ |

~0.2% residual = live Yahoo price vs ZKB snapshot timing. Normal.

### 3. Frontier 30% Weight Cap + FIDLEG Compliance (session 2, `c1c5cde`)

**Optimizer fix:** `randomWeights()` now projects Dirichlet samples onto `[0, 0.30]^n ∩ simplex` via iterative clipping. `effectiveCap = max(0.30, 1/n)` handles small portfolios. No more "sell MSCI World 43%, pile 28% into defense ETF."

**Legal context (important):** The `RebalancePanel` component (trade table showing current% → target%, Δ weight, implied CHF shifts) was **commented out in a prior session** for CH FIDLEG/FINIG compliance — it was producing specific buy/sell instructions which constitutes investment advice. The Frontier tab now shows **Position Volatility Overview** (per-ticker annualised vol, factual observations only). The `RebalancePanel` code remains in `FrontierChart.tsx` but is commented with a legal note. Do not re-enable without legal review.

### 4. UTC Date Bug Fix (`c1c5cde`)

`buy_date` server validation used `new Date('2026-05-12') > new Date()` — TRUE before UTC midnight, causing all ZKB imports to fail for Swiss users exporting after 22:00 local time (before UTC midnight). Fixed: ISO string comparison with +1-day buffer.

---

## Architecture — Key Files

```
app/
  api/
    portfolio/route.ts    ← GET: FX-aware P&L + returns, lot consolidation
                            POST: insert with buy_fx_rate, +1d UTC date fix
                            DELETE: by ticker / id / clearAll
    frontier/route.ts     ← Markowitz MC, 30% cap, tickerVols in response
    isin/route.ts         ← ISIN → ticker via Yahoo Finance search
    fx/route.ts           ← Multi-currency FX rates (USD base)
    stripe/               ← checkout, portal, tier
    webhooks/stripe/      ← tier update via Supabase on payment

lib/
  fx.ts                   ← getCHFperUSD(), getCHFperEUR() — 15-min module cache
  parsers/
    zkb.ts                ← ZKB Depotauszug parser
    yuh.ts                ← Yuh Bank parser
    neon.ts               ← Neon Bank parser (check if /api/neon route exists — may be missing)
  yahoo.ts                ← getCurrentPrice(), getHistoricalPrices(), TWR, Sharpe, etc. STABLE
  stripe.ts               ← STRIPE_PRICE_PRO constant, tier helpers
  supabase.ts             ← server client + getAuthUser()

components/
  ZkbImport.tsx           ← ISIN resolution + row-by-row import UI
  FrontierChart.tsx       ← Position Volatility Overview (RebalancePanel commented out — FIDLEG)
  PortfolioTable.tsx      ← isRetPos uses ret >= 0 (not pnl)
  Dashboard.tsx           ← userTier flows down. Broker tabs: yuh/neon/zkb
  YuhImport.tsx / NeonImport.tsx
  UpgradeModal.tsx        ← 2-tier only (Free / Pro CHF 15). Do not add Pro Max back.
```

---

## Supabase Schema

```sql
-- Required (may already exist — check before running)
ALTER TABLE portfolio ADD COLUMN IF NOT EXISTS buy_fx_rate NUMERIC;

-- Full schema
CREATE TABLE IF NOT EXISTS portfolio (
  id          BIGSERIAL PRIMARY KEY,
  user_id     TEXT NOT NULL,
  ticker      TEXT NOT NULL,
  shares      REAL NOT NULL,
  buy_price   REAL NOT NULL,
  buy_date    TEXT NOT NULL,
  buy_fx_rate NUMERIC   -- NULL for Yuh/Neon/manual positions
);
```

---

## Bugs & Known Limitations

### Resolved
- `+-16.81%` display bug — `isRetPos` was using `pnl` sign instead of `ret` sign
- EUR tickers wrong return — `.AS`/`.DE` tickers now use `getCHFperEUR()` not `getCHFperUSD()`
- P&L positive / return negative — fixed by normalising through CHF → USD
- Frontier unconstrained weights — 30% cap via iterative projection
- ZKB import UTC date rejection — ISO string comparison with +1d buffer

### Open
1. **Markowitz expected returns = historical returns** — 2-year trailing returns as forward estimates is classic error maximisation. Fix: shrinkage toward equal-weight or CAPM prior. Medium-term.
2. **`buy_fx_rate` for non-ZKB positions** — Yuh/Neon/manual entries show FX-unadjusted returns. Acceptable since those brokers are mostly CHF-denominated.
3. **Supabase RLS not hardened** — Pro features gated in frontend only. A determined user can call `/api/frontier`, `/api/fundamentals` directly. Fix when user count justifies it.
4. **Fundamentals unreliable** — Alpha Vantage free tier (25 req/day) breaks at 3+ positions. Fix: Financial Modeling Prep ($14/mo) for Pro users. Sprint 2 item.
5. **Neon `/api/neon` route** — parser exists but API route may be missing. Verify before Mom test if she uses Neon.

---

## Next Steps — Priority Order

### 1. ⚡ Switch price to CHF 15 — DO THIS FIRST
The current live price is CHF 1 (test). Before Mom pays:
1. Stripe → Products → Pro → Add price → CHF 15/mo recurring
2. Copy the new `price_live_...` ID
3. Update `STRIPE_PRO_PRICE_ID` in Vercel env vars → redeploy

### 2. Mom Test — Founder Trigger
- Mom goes to quantfoli.com, signs up
- Imports ZKB CSV (Export: ZKB eBanking → Depot → Depotauszug → CSV)
- Stripe Checkout → CHF 15 → webhook fires → `tier = pro`
- If she gets through without help: UX passes the canary test
- **LinkedIn: "Founder & Developer — Quantfoli"**

### 3. Sprint 2 — Data Layer (1 week after Founder trigger)
- Financial Modeling Prep API for Pro fundamentals (replaces broken AV free tier)
- Polygon.io Starter for real-time prices ($29/mo)
- Cache layer: Vercel KV — expensive API calls 1x/hr max
- Free tier stays on Yahoo Finance EOD

### 4. Sprint 3 — More Broker Parsers (2–3 weeks)
Priority: Swissquote (largest Swiss userbase) → Saxo → Trade Republic → DEGIRO  
Each parser = one LinkedIn post + organic acquisition. "Why Swiss portfolio apps fail — and what I built instead."

### 5. Sprint 4 — LinkedIn Momentum
- Post #4: Data Quality Problem (draft ready in Obsidian `_Meine LinkedIn Posts`)
- Post #5 after v2/Founder: "3 weeks after 1700 views — what changed"
- Warm network (Lars Lang/Rothschild, Philipp Baumann/BofA, Nicola Peter/BCG, Frederick von Dobbeler/PE, Ronny Oberholzer/UBS + 3 others) already knows the tool. They're first-mover Pro candidates or multipliers.

### 6. Supabase RLS (after first 10 paying users)
Gate Risk Tab + Fundamentals at DB level. Current frontend-only gate is sufficient for MVP but not production-hardened.

### 7. Post-Matura / Pre-HSG
- What-if simulator ("if I add 100 NVDA, how does Sharpe change?") — strongest retention feature, no competitor has it
- VaR / CVaR implementation (already designed in Obsidian `Risk_Metrics`)
- Max Drawdown with duration + recovery time + underwater equity curve
- Product Hunt launch (when Free tier is polished and auth is solid)
- HSG Finance Club demo — warm room of 80 exactly-right users beats 10k Reddit impressions

---

## Context That Matters

- **Dariush, 18, Matura 2026, HSG St. Gallen start 2026.** Tool = proof of competence for the LinkedIn network. Founder title requires 1 paying user — not before, not after. Mom is the designed first user.
- **Competitor gap:** Parqet has no GARCH/vol regime, no AI advisor, no What-if simulator. Quantfoli's quant layer is real differentiation. The gap is distribution — fix via CH broker parsers + LinkedIn + HSG Finance Club.
- **Revenue model:** Break-even at 3–4 paying users (covers $43/mo data costs). 200 Pro users = CHF 3,000/mo. Realistic 18-month target post-HSG.
- **Free tier is permanent.** P&L, EOD prices, broker parsers always free. Paywall activates after the first wow moment — don't gate the acquisition hook.

---

## What NOT to Touch

- `lib/yahoo.ts` — TWR, Sharpe, Beta, Alpha, Sortino, VaR, CVaR helpers. Stable. Do not refactor.
- `app/api/webhooks/stripe/route.ts` — webhook logic is working. Only risk is missing live env vars (see blocker above).
- `components/UpgradeModal.tsx` — 2-tier only. Do not re-add Pro Max.
- `FrontierChart.tsx` RebalancePanel comments — leave commented. FIDLEG.

---

*Last updated: 2026-05-12. Commits pushed to main. Vercel auto-deploys on push.*
