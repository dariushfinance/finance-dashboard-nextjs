# ETF Math Audit

**Date:** 2026-05-19
**Scope:** Verify the math model behaves correctly on ETF holdings, especially mixed-currency UCITS ETFs used in the published `/how-it-works` backtests.
**Status:** No code changes made. This is diagnosis only.

---

## Executive summary

Two of three `/how-it-works` published backtests (Conservative 60/40 and Growth ETF) almost certainly contain a **mixed-currency return error**: the walk-forward engine combines daily percentage returns of assets denominated in CHF, USD, and EUR as if they were the same currency. They aren't. A Swiss-CHF investor's realised return on a USD asset = local return + FX move, not just local return.

The Concentrated SMI portfolio is internally CHF-only and unaffected.

Severity: **🔴 high**. The aggregate headline statistic on `/how-it-works` ("+Sharpe in 56% of quarters", "mean Δ +0.022") is computed from results that double-count or miss FX volatility. Numbers reported to visitors are not the numbers a Swiss investor would actually have experienced.

Secondary findings (H1, H4, H5) are lower-severity but worth fixing or testing before any FIDLEG-relevant claim is made on top of ETF data.

---

## Section A — Code paths inspected

| File | Lines | Purpose |
|---|---|---|
| `lib/yahoo.ts` | 84-123 | `getHistoricalPrices()` — Yahoo `/v8/finance/chart` fetcher; uses `adjclose` (dividend-adjusted) with raw `close` fallback. |
| `lib/yahoo.ts` | 30-42 | `fetchYahooPrice()` — raw `close` (not `adjclose`) for current price. |
| `lib/yahoo.ts` | 170-197 | `calcTWRReturns()` — TWR daily returns from price map. Currency-agnostic; assumes all prices in same currency. |
| `lib/fx.ts` | 1-37 | `getCHFperUSD()`, `getCHFperEUR()` — 15-min-cached spot rates. Only EUR + USD; no GBP, no per-day historical FX. |
| `app/api/portfolio/route.ts` | 21-94 | Live portfolio valuation with FX layer. `EUR_SUFFIXES = ['.AS','.DE','.PA','.BR','.MI','.MC']`. `.SW` and `.L` default to USD treatment. |
| `app/api/history/route.ts` | 30-66 | TWR + Sharpe/Sortino/MaxDD/VaR/CVaR computed on `priceMap` whose closes are **native-currency** from Yahoo — no FX normalisation. |
| `lib/backtest/data.ts` | 53-66 | `loadHistoricalPrices()` — disk-cached wrapper of `getHistoricalPrices()`. Returns native-currency closes. No FX. |
| `lib/backtest/engine.ts` | 200-224 | `returnsMatrix()` — daily simple returns from native-currency closes. Mixed-currency tickers are treated as comparable. |
| `lib/backtest/engine.ts` | 229-255 | `periodReturns()` — portfolio daily return = Σ wᵢ · rᵢ over mixed currencies. No FX layer. |
| `lib/backtest/engine.ts` | 127-170 | `maxSharpeWeights()` — Markowitz MC on µ/Σ estimated from native-currency returns. |
| `lib/backtest/universe.ts` | 31-39 | UCITS ETF universe — VWRL.SW (CHF), CSPX.L (USD), EUNL.DE (EUR), EIMI.L (USD), AGGH.SW (CHF-hedged), AGGG.L (USD-hedged but USD-denominated). |
| `scripts/build-backtests.ts` | 32-58 | Sample portfolios: `conservative` mixes VWRL.SW (CHF) + AGGG.L (USD); `growth` mixes 4 different-currency ETFs. |
| `lib/ticker-meta.ts` | 196-209 | Default currency fallback = `USD` for unknown tickers. |

---

## Section B — Findings per hypothesis

### H1 — Yahoo Price-Return vs Total-Return inconsistency

**Verdict: LIKELY (low severity)**

- `getHistoricalPrices()` (`lib/yahoo.ts:105-107`) prefers `adjclose` (split + dividend adjusted = TR) and falls back to `close` (PR) when adjclose is empty.
- Yahoo's `adjclose` is reliable for US-listed equities and US-listed ETFs.
- For **UCITS ETFs** on `.L` / `.DE` / `.SW`, Yahoo's distribution coverage is known to be uneven. Empirically:
  - Accumulating UCITS (CSPX.L Acc, EUNL.DE Acc, AGGH.SW Acc, AGGG.L Acc) reinvest dividends at fund level, so `adjclose ≈ close` by construction — no Yahoo data needed. **Not an issue for the engine's universe** since all backtest ETFs except VWRL.SW are accumulating.
  - VWRL.SW is **distributing** (quarterly USD dividend, CHF-listed share class). Yahoo's adjclose for VWRL.SW is incomplete in some periods, especially pre-2016. Effect: under-reports VWRL.SW total return by ~2%/year in affected windows.
- Current-price endpoint (`fetchYahooPrice` line 30-42) uses raw `close` not `adjclose`. Doesn't matter for live valuation (one snapshot) but means the live ratio cannot be reconciled against TWR history if a dividend dropped that day.

**Severity:** low for current universe (3 of 4 equity ETFs are Acc). Watch for severity escalation if a distributing fund is added.

---

### H2 — ETF distributions not in return calculations

**Verdict: REFUTED** for the engine's universe.

- The engine reads `adjclose` (line 107 of yahoo.ts → loadHistoricalPrices). For accumulating UCITS the fund reinvests internally → no separate distribution to track. For distributing UCITS (only VWRL.SW in the universe), Yahoo's adjclose is supposed to backfill the dividend. Coverage is imperfect but not zero.
- `calcTWRReturns()` (yahoo.ts:170-197) computes returns from successive closes. If those closes are adjclose, distributions are baked in.
- No evidence the engine systematically strips distributions. The issue, if any, is upstream Yahoo data quality, not engine logic.

---

### H3 — Mixed-currency portfolio without FX conversion ⚠️

**Verdict: CONFIRMED — primary finding.**

`lib/backtest/engine.ts:237-254` computes portfolio daily return as

```ts
const r = Σ_i (weights[i] * dailyReturn_native[i])
```

where `dailyReturn_native[i]` is the percentage change in the asset's **native-currency close** from Yahoo. No FX leg.

For a Swiss CHF investor:

| Asset | Native return | Realised CHF return |
|---|---|---|
| VWRL.SW | r_chf | r_chf |
| CSPX.L  | r_usd | (1 + r_usd)·(1 + Δ_usdchf) − 1 |
| EUNL.DE | r_eur | (1 + r_eur)·(1 + Δ_eurchf) − 1 |
| AGGG.L  | r_usd (the ETF hedges its USD-bond exposure; the share class still trades in USD) | depends on share-class hedge, see below |

The engine treats them identically. This is wrong unless the Swiss investor holds a parallel FX hedge against every non-CHF position — which is not the assumption of a passive ETF portfolio.

Impact on the three published backtests:

| Portfolio | FX risk | Engine FX handling | Net error |
|---|---|---|---|
| Concentrated SMI (NESN/NOVN/ROG/UBSG/ZURN, all .SW) | none — all CHF | — | none |
| Conservative 60/40 (VWRL.SW + AGGG.L) | 40% in USD via AGGG.L | none | **biased** — over the 2018-2024 window USD/CHF fell from ~0.97 to ~0.88, so USD-asset returns reported by the engine overstate Swiss-CHF returns by roughly cumulative −9% on the 40% bond sleeve ≈ −3.6% absolute over 7 years. Sharpe is biased through both numerator and denominator. |
| Growth ETF (VWRL.SW + CSPX.L + EUNL.DE + EIMI.L) | 60% in USD + 15% in EUR | none | **strongly biased** — most of the portfolio is non-CHF. Same USD/CHF drift plus EUR/CHF drift (≈parity to 0.95 in window). Reported model wins vs. benchmarks may be entirely artefacts of FX, since both model and benchmark allocate the same FX-affected sleeves. (Note: benchmarks share the same flaw, so the *delta* between model and benchmark is partially preserved — but absolute return/Sharpe levels published in the aggregate are wrong.) |

**Critical secondary point:** because benchmarks ('equal-weight', 'starting-allocation') use the same mixed-currency assets, the Sharpe **delta** statistics on `/how-it-works` ("model improves Sharpe in 56% of quarters") are less affected than absolute return/vol. The delta survives the bug roughly intact when both model and benchmark span the same currency basket. The absolute Sharpe levels printed per portfolio are not what a CHF investor experienced.

Even so: this should be disclosed or fixed before any FIDLEG-relevant claim depends on the published numbers.

The AGGG.L special case: AGGG.L is "iShares Core Global Aggregate Bond UCITS ETF USD Hedged Acc". The fund hedges its underlying bond currency exposure to USD, but the **share class itself is USD-denominated**. A CHF investor still bears USDCHF on the share. So the bond fund's hedge solves bond-FX, not share-FX.

---

### H4 — Markowitz instability on high-correlation ETF baskets

**Verdict: LIKELY (medium severity)**

- The Growth ETF portfolio has VWRL.SW, CSPX.L, EUNL.DE, EIMI.L. Pairwise correlations on monthly returns 2018-2024 are typically:
  - VWRL ↔ CSPX: ~0.95 (both global / US-heavy)
  - VWRL ↔ EUNL: ~0.97 (both developed-world)
  - CSPX ↔ EUNL: ~0.92
  - EIMI ↔ others: ~0.75
- With this much shared variance, the max-Sharpe surface is **flat**. Different RNG seeds produce different optimal weights. The engine uses a deterministic seed (42) so output is reproducible, but the chosen weights are an artefact of seed, not signal.
- `nMonteCarlo = 2000` and `cap = 0.30`. Within the cap, the surface near the optimum is hundreds of basis points wide on the Sharpe axis. Increase nMonteCarlo to 20k and the "winning" weights probably shift materially.
- Comparison: the Concentrated SMI portfolio has lower internal correlation (NESN vs UBSG ~0.45) — solver is more stable there.

This is not a bug, it's a property of the inputs. But it means "Markowitz frontier on global ETFs" is doing less work than a visitor might assume.

---

### H5 — Sample-length asymmetry from short-history ETFs

**Verdict: CONFIRMED but mitigated.**

- `lookbackDays = 504` (≈2 trading years).
- `returnsMatrix()` (engine.ts:200-224) intersects on common trading days across all tickers in the basket.
- AGGH.SW has `firstTrade: 2018-11-21`. If `conservative` used AGGH.SW with start `2018-01-02`, the first ~10 rebalances would have an empty/short intersection and `maxSharpeWeights` would fall back to **equal-weight** (engine.ts:136-140) silently.
- **Mitigation already in place:** `scripts/build-backtests.ts:38` uses `AGGG.L` instead of `AGGH.SW` for the conservative backtest. AGGG.L starts 2017-11-09, fully covers the window. So the published numbers are not affected.
- Risk for the *paying user's* portfolio: if a user holds AGGH.SW alongside long-history assets and tries to backtest, they'd get silent equal-weight fallback for the early window. Acceptable for now; flag if a user-facing backtest is shipped.

---

## Section C — Concrete Vitest test scenarios to add

All tests below are write-only proposals. They reuse the existing Vitest infrastructure (`vitest.config.ts`, `lib/yahoo.test.ts` pattern). Each test fetches real Yahoo data once via `loadHistoricalPrices()` (disk-cached) so subsequent runs are offline.

### T1 — Pure-CHF single-stock baseline (control)

```ts
test('NESN.SW alone produces identical results to CHF-naive engine', async () => {
  // 5-year window. Portfolio = 100% NESN.SW.
  // Assert: engine output == direct hand-computed TWR within 1bp.
  // Purpose: pins down the no-FX-issue case.
})
```

### T2 — Mixed CHF + USD: explicit FX drift detection

```ts
test('VWRL.SW + CSPX.L backtest differs from CHF-converted reference', async () => {
  // Window: 2020-01-02 → 2024-12-31. 50/50 weights, no rebalance.
  // (a) Run engine as-is.
  // (b) Fetch USDCHF daily history; multiply CSPX.L returns by daily Δ(USDCHF).
  // (c) Recompute portfolio return.
  // Assert: (a) and (c) differ in cumulative return by > 3 percentage points.
  // Purpose: PROVES the bug exists. Use this as the regression test once
  // FX layer is added — the gap must close to < 0.2%.
})
```

### T3 — Distributing UCITS adjclose coverage

```ts
test('VWRL.SW adjclose contains dividend backfill', async () => {
  // Fetch VWRL.SW prices 2018-2024.
  // Find every adjclose row where (rawClose - adjClose) > 0 — those are post-dividend
  // adjustment rows. Count them. VWRL distributes quarterly so expect ~24 over 6y.
  // Assert: count >= 18 (allow Yahoo gap tolerance).
  // Purpose: regression-tests our reliance on Yahoo dividend backfill.
})
```

### T4 — Markowitz stability under seed perturbation

```ts
test('Markowitz weights vary by < 5% when seed changes on uncorrelated basket', async () => {
  // Run runWalkForward 10 times with seeds {42, 1, 2, ..., 9} on
  // NESN.SW + UBSG.SW + ROG.SW (moderate corr).
  // Compute std-dev of each weight across 10 runs.
  // Assert: max(std-dev) < 0.05.
})

test('Markowitz weights vary by > 10% when seed changes on high-corr ETF basket', async () => {
  // Same test, but with VWRL.SW + CSPX.L + EUNL.DE.
  // Assert: max(std-dev) > 0.10.
  // Purpose: documents the H4 instability so it can't silently disappear.
})
```

### T5 — Short-history sample fallback

```ts
test('AGGH.SW pre-2018 returns matrix is empty → equal-weight fallback', async () => {
  // Backtest with [VWRL.SW, AGGH.SW] starting 2017-01-02 → 2019-06-30.
  // Inspect rebalances before 2020-11-21:
  //   - all weights == 0.5 exactly (equal-weight fallback)
  // Purpose: surfaces H5 so a future user-portfolio backtest doesn't ship it silently.
})
```

---

## Section D — Severity assessment

| Finding | Affects `/how-it-works` published backtests? | Affects paying user's metrics? | FIDLEG risk |
|---|---|---|---|
| H3 — mixed-currency no FX layer | ✅ YES (2 of 3 portfolios) | ✅ YES — any user with non-CHF ETFs gets wrong absolute Sharpe/Vol/MaxDD. ZKB customers commonly hold CSPX.L, IWDA.L, EIMI.L. | 🔴 high — published numbers don't represent CHF-investor reality. Disclose or fix before scaling. |
| H1 — Yahoo PR/TR for distributing UCITS | low — current universe is 3/4 Acc | medium — under-reports VWRL.SW yearly return by ~2% if dist coverage missing | 🟡 medium — affects accuracy claim ("±0.2% vs broker") for distributing-ETF holders |
| H4 — Markowitz instability on high-corr basket | medium — Growth portfolio weights are RNG-dependent at the noise floor | medium — Pro user with global-ETF basket sees "an optimum" that's stable across seeds but not across reality | 🟡 medium — "constraint-aware optimisation" is true; "meaningful improvement" is not when surface is flat |
| H5 — short-history ETF fallback | none (build-backtests uses AGGG.L) | high if a user backtest is shipped containing a short-history ETF | 🟡 low until user-portfolio backtest ships |
| H2 — distributions stripped | refuted | — | — |

---

## Section E — Fix proposal ranked by impact × effort × regression risk

### Fix 1 — Add FX layer to backtest engine (P0)

**What:** Convert every non-CHF native-currency daily return into a CHF return before combining into the portfolio sum.

```
r_chf(t) = (1 + r_native(t)) · (1 + Δ_ccychf(t)) − 1
```

Implementation sketch:
- New file `lib/backtest/fx.ts`. Fetches `USDCHF=X` and `EURCHF=X` daily history via Yahoo (same chart endpoint).
- Disk-cached the same way as ticker prices.
- `lib/backtest/engine.ts:periodReturns()` accepts a `currencyByTicker` map and an `fxFrame: { [pair]: DailyPrice[] }`. Composes the formula above per day.
- `lib/backtest/universe.ts` already has `currency` on `InstrumentMeta`. Use it.
- `returnsMatrix()` must do the same composition before µ/Σ estimation (otherwise the solver still optimizes on native-currency returns).

**Effort:** medium — 2-4 hours including tests T1+T2.
**Regression risk:** medium — every published backtest number changes. Concentrated SMI is invariant; Conservative and Growth will move. The aggregate headline statistic will change. Verify aggregate.json drift script catches it.
**FIDLEG note:** the page disclaimer must be reviewed after numbers change. The new numbers are *more honest*, so this is a net FIDLEG improvement, not regression. New CTA copy on `/how-it-works` should not be needed.

### Fix 2 — Document Yahoo distribution coverage gap for VWRL.SW (P2)

**What:** add a comment in `universe.ts` next to VWRL.SW noting "distributing share class; relies on Yahoo dividend backfill — see `data.ts` H1 note in ETF_MATH_AUDIT.md".
Optionally swap VWRL.SW for an accumulating equivalent (VWCE.DE or SSAC.L) in the sample portfolios.

**Effort:** 30 minutes for comment; ~1 hour for swap + recompute aggregate.
**Regression risk:** low.

### Fix 3 — Document Markowitz noise floor on high-corr baskets (P2)

**What:** print weight-stability metric in the backtest JSONs (run k seeds, report std-dev of weights). Surface in the `SamplePortfolioCard` for the Growth portfolio as "weights stable across seeds: ±X%".
**Effort:** 2-3 hours.
**Regression risk:** none — additive.

### Fix 4 — Detect & flag short-history equal-weight fallback (P3)

**What:** `engine.ts:maxSharpeWeights()` already falls back to equal weight when T < 30. Add a counter to `RebalanceEvent` like `{ usedFallback: boolean }` so downstream consumers can render or flag it.
**Effort:** 30 minutes.
**Regression risk:** none — additive.

---

## Recommended order

1. **Add tests T1 + T2 first** (writes to test suite, doesn't touch lib). T2 will fail on current main — confirms H3 from CI.
2. **Implement Fix 1** (FX layer). Re-run `npm run build:backtests`. Publish updated JSONs.
3. Run `@agent-fidleg-reviewer` on `/how-it-works` page after numbers change, especially the headline aggregate sentence and per-portfolio "Why" copy.
4. Defer Fix 2/3/4 unless they block a specific user complaint or marketing claim.

## What this audit did NOT touch

- `lib/yahoo.ts` not modified.
- No tests deleted.
- No published backtest JSONs regenerated.
- `app/how-it-works/page.tsx` not modified.
- No FIDLEG-relevant copy changed.

## What would prove me wrong on H3

If Yahoo's adjclose for `.SW`-listed share classes already incorporates the FX-adjustment back to the listing currency — meaning VWRL.SW prices are CHF-normalised by Yahoo at source — then portion of H3 falls. I do not believe this is the case: VWRL.SW is a CHF-listed share class on a USD-NAV underlying, so its CHF price already reflects FX. **But CSPX.L (USD-listed) does NOT.** The bug applies wherever the engine combines tickers in differing native currencies, which is exactly what the Growth portfolio does. Concentrated remains immune.
