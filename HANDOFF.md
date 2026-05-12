# Handoff — Quantfoli Dev Session 2026-05-11/12

## The Mission

Building **Quantfoli** (quantfoli.com) — a Swiss portfolio analytics SaaS for self-directed investors.
Stack: Next.js 14 · TypeScript · Tailwind · Supabase · Vercel.

**The founder trigger:** Mom imports her ZKB portfolio, pays CHF 15 via Stripe → `tier = pro` fires via webhook → Founder title goes on LinkedIn. That's the north star for every decision this session.

Repo: https://github.com/dariushfinance/finance-dashboard-nextjs  
Live: https://finance-dashboard-nextjs-one.vercel.app/ (will move to quantfoli.com)

---

## What This Session Built (5 commits)

### 1. ZKB Depotauszug CSV Parser (`e16fbcd`)

**Files created:**
- `lib/parsers/zkb.ts` — pure parser for ZKB's semicolon-delimited portfolio export
- `components/ZkbImport.tsx` — UI component with ISIN resolution, per-row status, progress bar

**Files modified:**
- `components/Dashboard.tsx` — replaced `['yuh', 'neon', 'csv']` broker tabs with `['yuh', 'neon', 'zkb']`, removed generic CSV import entirely

**ZKB CSV format handled:**
```
"Bezeichnung";"ISIN";"Anz. Nom.";"Währung";"Datum";"Spesen CHF";"Marktkurs";"Einstandskurs";"Diff T";"Marktwert";"Einstandswert";"Bucherfolg CHF";"Gesamtrendite"
```
- Encoding: Windows-1252 (tries latin1 first, falls back to UTF-8)
- Numbers: Swiss apostrophe thousands `21'859.24` and comma thousands `1,689.23` — both stripped
- Dates: `DD.MM.YYYY` → `YYYY-MM-DD`
- ISINs resolved via existing `/api/isin` endpoint (Yahoo Finance search)
- Export path: ZKB eBanking → Depot → Depotauszug → CSV

---

### 2. CHF/USD FX-Aware Return Calculation (`912482a`, `8e02c85`, `ce47cf2`)

**The problem:** ZKB shows AAPL return as 8.39% (CHF-adjusted, includes USD depreciation). The tool was showing 11.68% (pure USD price change, FX cancels out because both buy and current price use the same current rate).

**Root cause:** ZKB stores `Einstandswert` (total CHF cost). The tool was storing `Einstandskurs` (USD buy price) and comparing to current USD price — FX drag invisible.

**Solution:**

New column in Supabase `portfolio` table:
```sql
ALTER TABLE portfolio ADD COLUMN IF NOT EXISTS buy_fx_rate NUMERIC;
```
**⚠️ CRITICAL: This SQL must be run in Supabase dashboard if not already done.**

`buy_fx_rate` = historical CHF per USD at time of purchase = `Einstandswert / (shares × Einstandskurs)`
- AAPL example: `20170 / (96 × 262.08) = 0.8018`
- CHF positions (DFEN.DE, VUSD.L, etc.): `buy_fx_rate ≈ 1.0`

**Files created:**
- `lib/fx.ts` — exports `getCHFperUSD()` and `getCHFperEUR()` with 15-min module-level cache, Yahoo Finance USDCHF=X / EURCHF=X

**Files modified:**
- `lib/parsers/zkb.ts` — now parses `Einstandswert`, computes and exports `buy_fx_rate`
- `components/ZkbImport.tsx` — passes `buy_fx_rate` in POST body
- `app/api/portfolio/route.ts` — full FX-aware return/P&L logic (see below)
- `components/PortfolioTable.tsx` — fixed `isPos` sign bug (was using `pnl` sign for return % display → `+-16.81%`)

**Portfolio route return logic (the core formula):**
```typescript
// EUR-exchange tickers (.AS Amsterdam, .DE Xetra) → use EUR/CHF
// Everything else (US, London) → use USD/CHF
const tickerChfRate = isEurTicker(row.ticker) ? currentChfPerEur : currentChfPerUsd

if (row.buy_fx_rate && tickerChfRate > 0 && currentChfPerUsd > 0) {
  const buy_chf     = row.buy_price * row.buy_fx_rate      // e.g. 262.08 × 0.8018 = 210.10 CHF
  const current_chf = current_price * tickerChfRate        // e.g. 292.68 × 0.778  = 227.7 CHF
  const buy_usd     = buy_chf / currentChfPerUsd           // normalise to USD for frontend
  const cur_usd     = current_chf / currentChfPerUsd

  effective_buy_price     = buy_usd
  effective_current_price = cur_usd
  current_value           = shares * cur_usd
  pnl                     = shares * (cur_usd - buy_usd)
  return_pct              = ((current_chf - buy_chf) / buy_chf) * 100  // CHF return
}
```

**Result (verified against ZKB):**
| Position | ZKB | Tool (after fix) |
|---|---|---|
| AAPL | 8.39% | 8.36% ✓ |
| IMAE.AS | -2.22% | -2.05% ✓ |
| DFEN.DE | -7.27% | -7.19% ✓ |
| IWDA.L | 2.55% | 2.50% ✓ |
| LMT | -17.43% | -17.45% ✓ |

Remaining ~0.2% deviation = live Yahoo price vs ZKB snapshot timing. Normal.

---

### 3. Rebalancing Advisory Panel (`3dde925`)

**Files modified:**
- `components/FrontierChart.tsx` — added full `RebalancePanel` component + `userTier` prop
- `components/Dashboard.tsx` — passes `userTier` to `FrontierChart`

**What it shows (Pro users only):**
- Toggle: Max Sharpe | Min Vol target
- Sector shift chips (e.g. "Technology ↑ 10.8%")
- Trade table: current % → target %, Δ weight, implied CHF shift
- Turnover summary: total CHF + % of portfolio
- Disclaimer: illustrative, not personalised advice

**Known limitation flagged this session:** The unconstrained Markowitz optimizer produces absurd outputs — suggests reducing MSCI World by 43% and piling 28% into a defense ETF. This is the classic "error maximization" problem: historical returns as expected return inputs + no position constraints = concentrated garbage recommendations.

**Next step identified but NOT built yet:** Add max_weight constraint (e.g. 30% cap per position) to the frontier API optimizer. One parameter change in `app/api/frontier/route.ts`.

---

## Current Architecture — Key Files

```
app/
  api/
    portfolio/route.ts   ← Full FX-aware P&L + return logic. buy_fx_rate column required.
    frontier/route.ts    ← Markowitz optimizer. NEEDS max_weight constraint added.
    isin/route.ts        ← ISIN → ticker via Yahoo Finance search
    fx/route.ts          ← Multi-currency FX rates (USD base)
    stripe/              ← checkout, portal, tier
    webhooks/stripe/     ← tier update via Supabase on payment

lib/
  fx.ts                  ← getCHFperUSD(), getCHFperEUR() — 15-min cached
  parsers/
    zkb.ts               ← ZKB Depotauszug parser (NEW this session)
    yuh.ts               ← Yuh Bank parser (existing)
  yahoo.ts               ← getCurrentPrice(), getHistoricalPrices(), TWR, Sharpe, etc.
  stripe.ts              ← STRIPE_PRICE_PRO constant, tier helpers
  supabase.ts            ← server client + getAuthUser()

components/
  ZkbImport.tsx          ← NEW this session. ISIN resolution + row-by-row import UI.
  FrontierChart.tsx      ← RebalancePanel added (Pro only). userTier prop added.
  PortfolioTable.tsx     ← isRetPos fix for return sign display
  Dashboard.tsx          ← userTier flows down to FrontierChart. Broker tabs: yuh/neon/zkb.
  YuhImport.tsx          ← existing
  NeonImport.tsx         ← existing
```

---

## Supabase Schema — Required

`portfolio` table must have:
```sql
ALTER TABLE portfolio ADD COLUMN IF NOT EXISTS buy_fx_rate NUMERIC;
```
**If this column doesn't exist, all ZKB imports will fail silently (Supabase rejects unknown columns on insert).**

Existing columns (pre-session): `id`, `user_id`, `ticker`, `shares`, `buy_price`, `buy_date`

---

## Bugs & Blockers

### Solved this session
- **`+-16.81%` display bug** — `PortfolioTable` was using `pnl >= 0` to set the sign prefix on `return_pct`. Fixed to `ret >= 0`.
- **EUR tickers wrong return** — IMAE.AS (.AS = Amsterdam EUR) and DFEN.DE (.DE = Xetra EUR) were having `current_price_EUR × USD/CHF` applied. Fixed: detect EUR suffix tickers, use `getCHFperEUR()` instead.
- **P&L positive / return negative** — pnl used raw Yahoo EUR price vs CHF buy_price (different currencies). Fixed: normalize everything through CHF → back to USD so frontend conversion is consistent.

### Solved 2026-05-12 (session 2)
- **Frontier unconstrained weights** — Iterative Dirichlet projection onto `[0, 0.30]^n ∩ simplex`. No more "sell MSCI World 43%, pile 28% into defense ETF." `effectiveCap = max(0.30, 1/n)` handles small portfolios. `c1c5cde`.
- **ZKB import UTC date bug** — `new Date('2026-05-12') > new Date()` was TRUE before UTC midnight, so Swiss users exporting after 22:00 local time saw all ✗ (every row failed date validation). Fixed: ISO string comparison with +1-day buffer. `c1c5cde`.

### Open / Not Yet Fixed
1. **Markowitz expected returns = historical returns** — Using 2-year trailing returns as forward estimates is garbage. Proper fix: shrinkage toward CAPM or equal-weight prior. Medium-term, not urgent.
2. **`buy_fx_rate` for non-ZKB positions** — Yuh/Neon/manual entries don't set `buy_fx_rate`. FX drag not reflected. Acceptable for now.
3. **Supabase RLS** — Risk Tab + Fundamentals gated only in frontend. A motivated user can call the APIs directly. Fix: RLS policy on `portfolio` requiring `tier = pro` for those reads.

---

## Normalised Schema from ZKB Parser

```typescript
interface ZkbPosition {
  isin:        string   // "US0378331005"
  name:        string   // "Apple Inc. Registered Shares..."
  shares:      number   // 96
  buy_price:   number   // 262.08 (Einstandskurs, original currency)
  buy_fx_rate: number   // 0.8018 (CHF/USD at purchase = Einstandswert / shares / Einstandskurs)
  buy_date:    string   // "2026-01-16" (snapshot date, not actual trade date)
  currency:    string   // "USD" or "CHF" per ZKB
  fees_chf:    number   // 0.00
}
```

---

## Next Concrete Steps (Priority Order)

### 1. Mom test — Founder trigger ← NEXT
Once ZKB import is clean:
- Mom uploads her ZKB CSV
- She imports her positions
- She pays CHF 15 via Stripe
- Webhook fires → `tier = pro`
- **LinkedIn: "Founder & Developer — Quantfoli"**

### 4. Supabase RLS
Risk Tab + Fundamentals behind `tier = pro` at the DB level (currently gated only in frontend). Without RLS, a determined user can hit the APIs directly.

### 5. Domain DNS
quantfoli.com → Vercel (A record `76.76.21.21` + CNAME `www → cname.vercel-dns.com`). Stripe + Supabase URLs already updated to quantfoli.com in the codebase.

---

## Context That Matters

- Dariush is 18, Matura 2026, starting HSG St. Gallen in 2026. This tool is the proof of competence for the LinkedIn network already built (1700 views post, 8 IB/PE/BCG contacts from it).
- **Founder title requires 1 paying user.** Not before. Mom is the first tester by design — honest feedback + easy ZKB account = perfect canary.
- The ZKB parser is the **acquisition hook** — Swiss broker CSV import is broken everywhere. Quantfoli doing it right is the differentiator that gets organic distribution.
- Competitor gap: Parqet has no AI advisor, no What-if, no GARCH/vol regime. That's the moat.
- Free tier stays free forever (P&L, EOD prices, broker parsers). Paywall activates after the first Wow moment.

---

## What NOT to Touch

- `lib/yahoo.ts` — TWR, Sharpe, Beta, Alpha, Sortino, VaR, CVaR helpers. Stable.
- `app/api/webhooks/stripe/route.ts` — Stripe webhook is working. Live Stripe keys need to be in Vercel env vars (not yet done as of this session).
- `components/UpgradeModal.tsx` — Pro-only, 2-tier (Free / Pro), CHF 15/mo. Pro Max was removed in a prior session.

---

*Session ended 2026-05-12. All 5 commits pushed to main. Vercel auto-deploys on push.*
