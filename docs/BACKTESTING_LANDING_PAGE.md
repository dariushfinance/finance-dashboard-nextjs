# Backtesting Landing Page — Specification

> **Status:** Draft v1 — 2026-05-17. Awaiting Dariush approval before any code is touched.
> **Owner:** Quantfoli (Dariush Tahajomi)
> **Tier targeting:** Advisor visual identity (purple `--accent*` tier), conversion CTAs to both Pro and Advisor.
> **Legal frame:** FIDLEG-compliant, descriptive-only. Cross-references Advisor T&Cs `lib/advisor-terms.ts` (current version `v1.1-2026-05-16`).
> **Do not** start code integration (Section E) before this spec is signed off.

---

## SECTION A — Strategic Rationale

Historical backtesting is the single most convincing demonstration of value Quantfoli can ship. For the real ICP (engineer/quant-adjacent Swiss male, 30–55, six-figure portfolio at ZKB/Yuh, technically literate), a feature description is weaker than a chart showing Sharpe improvement on a portfolio shape that looks like theirs.

It is also the highest-risk content surface on the entire product:

- **Lookahead bias** makes any naive backtest trivially "great." A reader who understands portfolio theory will spot a fitted curve in five seconds and write off the entire brand on contact.
- **Cherry-picking** only winning periods destroys credibility permanently with the exact technical audience Quantfoli targets. Word-of-mouth in this segment dies fast on a single "obviously fitted" reaction.
- **FIDLEG / FINIG exposure.** Wording like "you would have earned X% more" reads as implicit personal investment advice under Swiss law. At <10 Advisor users today this risk is small in practice — but the page is the highest-traffic surface and the first thing a regulator would screenshot.

**The methodology IS the marketing.** This document specifies, in order: how to backtest without cheating (Section B), how to lay out the page so the methodology is visible before the results (Section C), and the exact language rules every line of copy must follow (Section D). Section F (already drafted) governs voice and tagline. Section E lists the code work — to be executed only after this spec is approved.

Risk vs. reward tradeoff explicitly accepted: shipping a slow, careful, openly-self-critical backtest page is worth more than a fast, polished, FOMO-driving one — for this ICP, in this jurisdiction, at this stage.

---

## SECTION B — Methodology Requirements (no cheating)

Every backtest displayed on this page MUST satisfy all six rules below. The page itself must state these rules in the methodology section (Section C point 2), so the reader sees the constraints before the results.

### B.1 Out-of-sample only

Model fitted on data up to date T. Performance measured strictly on data with timestamp `> T`. No peeking forward, no parameter tuning on the evaluation window. Implementation: every call into the backtest engine takes an explicit `asOf: Date` and the engine must reject (assert, not silently filter) any data row with `timestamp >= asOf`.

### B.2 Walk-forward testing

The model is re-fitted on a rolling schedule (quarterly by default — configurable: monthly, quarterly, semi-annual). At each rebalance date T:

1. Take all available history with `timestamp < T`.
2. Compute the model (Markowitz weights, covariance estimation, etc.).
3. Apply the weights going forward.
4. Measure realized performance over the following period until T+1 rebalance.
5. Record the result.
6. Move T forward, repeat.

This produces N independent out-of-sample observations, not one fitted curve. The page reports the distribution of those N observations, not a single number.

### B.3 Realistic costs

Every realized return is reported **net of**:

| Cost | Default value | Source |
|---|---|---|
| Trading commission (Swiss broker) | 0.50% per trade-side | Moneyland 2024–2025 broker comparison median for ZKB / Yuh / Saxo retail |
| Bid-ask spread (liquid ETF / SMI large-cap) | 0.10% per trade-side | Public quote-depth observation, SIX-listed names |
| Swiss stamp duty (Umsatzabgabe) | 0.15% on Swiss-domiciled, 0.30% on foreign-domiciled | ESTV Stempelabgabe schedule |
| FX cost (when applicable) | 0.50% spread on non-CHF legs | ZKB/Yuh published FX spreads |

These are stored as constants in `lib/backtest.ts` with a citation comment. Costs are subtracted on the gross-to-net conversion for every simulated trade, and turnover is itself a tracked output metric so the cost impact can be audited.

### B.4 Show ALL backtests, not only winners

Every walk-forward observation, winning and losing, is included in the aggregate statistics. The headline summary on the page must take the form:

> "In X% of N quarterly rebalances, the model improved Sharpe by an average of +Y. In the remaining (100−X)% it underperformed by an average of −Z."

Honest negative cases (regime-change periods: COVID March 2020, 2022 rate-shock, post-SVB March 2023) are called out explicitly. Cherry-picking detection: a CI test (Section E.6) flags any commit that adds a published statistic without a corresponding `n=` sample size and a `worst-case` field.

### B.5 Multiple benchmark portfolios

Every backtest is compared against at least three benchmarks:

1. **Buy-and-hold market-cap weighted** (SMI for Swiss, SPX for US, MSCI World for global) — passive, "do nothing" baseline.
2. **Equal-weighted** rebalanced on the same schedule — controls for the "rebalancing alone" effect independent of optimization.
3. **User's actual starting allocation** rebalanced on the same schedule — answers the realistic question: "if I had held my current allocation for 10 years instead of model weights, how would it have compared?"

All four series (model + 3 benchmarks) are shown on the same axis. The reader gets to see the model lose on the chart, not just in a footnote.

### B.6 Documented data sources

Page must surface (in a footer or methodology link) the exact data sources:

- Prices: Yahoo Finance EOD via existing `lib/yahoo.ts` utilities (do NOT modify the math; only add caching).
- Risk-free rate: `RISK_FREE_ANNUAL = 0.04` constant (already in `lib/yahoo.ts`). If a time-varying rate is used in v2, source it (e.g. SNB 3-month SARON).
- FX rates: existing `lib/fx.ts`.
- Universe: SMI components + a curated list of Swiss-broker-accessible ETFs (VWRL, EUNL, CSPX, VT, BND, AGGH, gold/CHF-hedge variants). The full list is published on the page so readers can replicate.

---

## SECTION C — Landing Page Structure

### C.0 Visual identity

- Use Advisor tier accents — purple `--accent*` palette via `<div data-tier="advisor">` wrapper on the page shell. Pattern is identical to `components/Dashboard.tsx` (see `app/globals.css` lines 437–443).
- Reuse `components/LegalLayout.tsx` typography conventions (Inter, gradient title) for the disclaimer block.
- Charts reuse the recharts setup from `components/FrontierChart.tsx` (tooltips, color tokens, mono-font axes). Do NOT introduce a second chart library.

### C.1 Route — DECISION REQUIRED

Two candidates, both server-rendered:

- **`/how-it-works`** — broader, future-proof slug. Lets us later expand to "how-it-works/markowitz", "how-it-works/stress-tests" without re-routing.
- **`/backtests`** — narrower, SEO-tighter for the specific search intent ("backtest portfolio Switzerland", "Sharpe backtest CHF").

**Recommendation:** `/how-it-works` as the canonical route, with `/backtests` as a 308-redirect alias. This captures both audiences and the OG share URL stays stable.

→ **Dariush to confirm before E.5.**

### C.2 Layout (top → bottom)

#### 1. Hero section

- **Headline (Variant C, per Section F):** "Markowitz, Sharpe, and stress tests — on your actual ZKB depot."
- **Sub-headline (one sentence, plain methodology):** "Backtested out-of-sample on Swiss-broker-accessible instruments, 2014–2024, net of Swiss trading costs and stamp duty."
- **Hero visual:** large interactive chart, full-width on desktop, ~360 px tall. Reuses `FrontierChart.tsx` recharts patterns. Series:
  - Model-weighted portfolio cumulative net return (purple, Advisor accent).
  - Buy-and-hold market-cap benchmark (neutral grey).
  - Equal-weighted benchmark (`--ink-3`).
  - Rebalance dates marked as vertical reference lines (`<ReferenceLine>` from recharts) so the walk-forward cadence is visible.
- **Hover tooltip:** mono font, identical style to `FrontierChart.tsx` tooltip — shows date, model NAV, benchmark NAV, and the Sharpe delta computed on the trailing year window.

#### 2. Methodology section (prominent — NOT buried)

Comes directly after the hero, before any aggregate stats. Five bullet points, each a direct restatement of Section B rules in user-facing language:

- "Out-of-sample only. The model at date T sees no data from after T."
- "Walk-forward. Re-fitted every quarter on the data available at that moment, then frozen for the following 90 days."
- "Net of costs. 0.50% commission, 0.10% spread, 0.15% Swiss stamp duty subtracted on every simulated trade."
- "All backtests shown. Losing periods are reported alongside winning ones — see aggregate statistics below."
- "Three benchmarks. Each model run is compared against market-cap, equal-weighted, and a buy-and-hold version of the same starting allocation."

Closing link: "Full technical methodology →" → `/how-it-works/methodology` (out of scope for v1, can 404 until written; preferable to link a stub than to omit the affordance).

#### 3. Aggregate statistics block

This is the screenshot-quotable artifact called out in Section F. Designed as a single self-contained `<section>` with a "Copy link" button (anchor-link to `#aggregate-stats`).

Layout: 4-up grid on desktop, stacked on mobile. Each cell shows one statistic with its `n=` sample size:

```
┌─────────────────────────────┬─────────────────────────────┐
│ +Sharpe in X% of quarters   │ Average Sharpe delta: +0.Y  │
│ n = 40 rebalances           │ (median: +0.Z)              │
├─────────────────────────────┼─────────────────────────────┤
│ Vol reduced in W% of cases  │ Worst-period underperf: −A% │
│ Avg reduction: −V%          │ Period: 2020-Q1 (COVID)     │
└─────────────────────────────┴─────────────────────────────┘
```

Numbers are computed at build time (or fetched from a `/api/backtests/aggregate` route — see E.4) and the actual values must NOT be hand-typed.

Below the grid: a small honest-disclosure paragraph: "In periods following major regime changes (e.g. COVID March 2020, 2022 rate shock), the model has historically underperformed the buy-and-hold benchmark. Walk-forward optimization adapts after the regime change, not during it."

#### 4. Three sample portfolios

Each is its own card, each with a permalink (`#portfolio-conservative`, `#portfolio-growth`, `#portfolio-concentrated`) and its own OG card route (Section E.5).

| # | Persona | Starting allocation |
|---|---|---|
| 1 | **Conservative 60/40 Swiss investor** | 60% VT / 40% AGGH (or AGGS), CHF-hedged where available |
| 2 | **Growth-oriented ETF portfolio** | 50% VWRL · 20% CSPX · 15% EIMI · 15% SMMCHA |
| 3 | **Single-stock-heavy retail (most common ZKB profile)** | 25% NESN.SW · 25% NOVN.SW · 20% ROG.SW · 15% UBSG.SW · 15% cash. Derived from the empirical distribution of the existing ZKB parser sample. |

Per portfolio:

- Starting allocation table (ticker, weight).
- Model-suggested rebalancing trajectory over 10 years (small sparkline of weight drift).
- Cumulative-return chart: model net of costs vs. each of the 3 benchmarks.
- Ending statistics table: Sharpe, Vol, Sortino, MaxDD, Total return (all four series). Metric definitions reuse `lib/yahoo.ts` functions: `calcSharpeAndVol`, `calcSortino`, `calcMaxDrawdown`.
- Honest summary line: "Model improved Sharpe in P of Q rebalance periods. Worst quarter: <date>, underperformed by R%."

#### 5. CTA section

Two CTAs side-by-side, both reusing existing Stripe checkout endpoints (`/api/stripe/checkout` with `plan: 'pro' | 'pro_yearly' | 'advisor' | 'advisor_yearly'`). Yearly default selected (matches `UpgradeModal.tsx` default).

- **Left card (Pro):** "Run the analysis on your own portfolio." CHF 15/mo or CHF 150/yr. Wires `pro_yearly` price ID by default with a small monthly/yearly toggle.
- **Right card (Advisor):** "Get monthly walk-forward reports on your portfolio." CHF 50/mo or CHF 500/yr. Re-uses the Advisor T&C acceptance gate (`advisorAccepted` checkbox + `POST /api/advisor/accept-disclaimer`) from `UpgradeModal.tsx`. **Reuse, don't duplicate** — extract the checkbox + accept-call into a shared `<AdvisorAcceptGate>` component if cleaner; otherwise import `UpgradeModal` patterns directly.

Visually: Pro card uses gold accent (`#C89B3C`), Advisor card uses purple Advisor accent — identical color treatment to `UpgradeModal.tsx`.

#### 6. Mandatory disclaimer block

Full-width, before the footer, ALWAYS visible without scrolling on desktop (use a sticky-bottom approach on mobile that expands by default on first visit, then collapses to a small banner; LocalStorage key `quantfoli:backtest-disclaimer:dismissed`).

Verbatim copy:

> **Backtest disclaimer.** Backtest results shown on this page are simulated and do not represent actual trading. Past performance does not predict future returns. Quantfoli does not provide personalised investment advice and is not a licensed financial adviser under FINIG / FIDLEG. Backtested performance does not account for tax effects beyond Swiss stamp duty, behavioural execution differences, slippage during fast markets, or extreme market dislocations. Full Advisor terms: [Advisor Terms & Disclaimer (v1.1-2026-05-16)](/advisor-legal).

Rendered using `LegalLayout`-style typography (gradient purple title bar, mono version stamp). The Advisor Terms link must hard-code the version slug from `ADVISOR_TERMS_VERSION` (imported, not duplicated as a string).

---

## SECTION D — FIDLEG-Compliant Language Rules

Every line of copy on this page must pass the rules below. A CI test (Section E.6) enforces them by lexing every string literal in the page's `.tsx` files and failing the build if a forbidden token appears outside an explicit `// eslint-allow-fidleg` comment block.

### D.1 Allowed phrasings (descriptive — facts about the model)

- "The model would have computed a different weighting than market-cap."
- "Historical Sharpe of the model-weighted portfolio: 1.10. Benchmark Sharpe: 0.82."
- "In 73% of quarters, model rebalancing reduced realized volatility."
- "Net of 0.50% commission, 0.10% spread, 0.15% Swiss stamp duty."
- "The model underperformed the buy-and-hold benchmark in 2020-Q1 by 2.8%."

### D.2 Forbidden phrasings (prescriptive — implying the user should act)

- ❌ "You would have earned X% more." → Use: "The model-weighted portfolio's cumulative return was X% above the benchmark over this period."
- ❌ "Investors who used the model would have outperformed." → Use: "Model-weighted portfolios outperformed in X% of measured periods."
- ❌ "You should rebalance your portfolio." → Use: "The model's suggested weights at <date> were …"
- ❌ "Recommended allocation." → Use: "Model-computed allocation."
- ❌ "Better returns." → Use specific numbers with a benchmark reference.
- ❌ Any second-person imperative ("Buy", "Sell", "Rebalance", "Switch to", "Move into").

### D.3 Lint enforcement

Forbidden token list (case-insensitive, word-boundary match): `you would have earned`, `you would earn`, `outperformed` (only flagged when paired with `you`/`your` within 30 chars), `you should`, `recommended` (in the context of a portfolio action), `we recommend`, `buy now`, `sell now`. The lint test is a vitest spec that walks the page's component tree and asserts no match. False positives can be silenced with an inline `// eslint-allow-fidleg: <reason>` comment placed immediately above the literal — used sparingly and reviewed in PR.

### D.4 Cross-reference

Match the tone of §2 of `lib/advisor-terms.ts` rendered Advisor Terms — descriptive, third-person, no imperatives. If a new phrasing on this page would be inconsistent with that document, update the Advisor Terms first (bump `ADVISOR_TERMS_VERSION`) — never weaken the legal doc to match the marketing.

---

## SECTION E — Code Integration Tasks (execute ONLY after spec approval)

> **Do not start any of these tasks until Dariush has approved Sections A–D and the route decision in C.1.**

Estimated total effort: ~6–10 hours of focused work, split roughly: data pipeline 1h, engine + tests 3–4h, sample-portfolio runs 1h, frontend 2–3h, lint/safeguards 1h.

### E.1 Data pipeline — historical price cache

- New file: `lib/backtest/data.ts`.
- Function: `loadHistoricalPrices(tickers: string[], from: Date, to: Date): Promise<PriceFrame>` where `PriceFrame` is a typed columnar table keyed by ticker → daily close array.
- Uses existing `lib/yahoo.ts` `getHistoricalPrices`. **Do NOT modify `lib/yahoo.ts`** — wrap it.
- Cache layer: writes JSON to `data/backtests-cache/<ticker>.json` (gitignored — add `data/` to `.gitignore`). Cache key includes from/to dates. TTL: 7 days (EOD data, daily refresh is overkill for a marketing page).
- Universe constant (the curated 2014–2024 ticker list from Section B.6): `lib/backtest/universe.ts`. Exports `SMI_LARGE`, `SWISS_ACCESSIBLE_ETFS`, `BENCHMARKS`. Each ticker annotated with its first-trade-date (so the engine can skip rebalance dates where a ticker did not yet exist).

### E.2 Walk-forward engine — `lib/backtest/engine.ts`

- Public API:
  ```ts
  export interface WalkForwardParams {
    startDate:       Date
    endDate:         Date
    rebalanceFreq:   'monthly' | 'quarterly' | 'semi-annual'
    instruments:     string[]
    startingWeights: Record<string, number>   // for the user-allocation benchmark
    benchmarks:      Array<'market-cap' | 'equal-weight' | 'starting-allocation'>
    costs?:          Partial<CostModel>       // overrides for defaults
  }
  export interface WalkForwardResult {
    rebalances:  RebalanceEvent[]              // length N
    series:      { model: NavSeries; benchmarks: Record<string, NavSeries> }
    aggregate:   AggregateStats                // Sharpe-delta distribution, vol-delta dist, worst case
  }
  export function runWalkForward(params: WalkForwardParams): Promise<WalkForwardResult>
  ```
- **Critical invariant** (comment block at top of file, capitalised):
  ```
  // ────────────────────────────────────────────────────────────────────
  // LOOKAHEAD-BIAS GUARD. At every rebalance date T, this function must
  // ONLY consume price data with timestamp < T. Any code path that
  // touches `prices.filter(p => p.date >= T)` is a bug. Two assertions
  // enforce this at runtime; do not weaken them to "fix" a test.
  // ────────────────────────────────────────────────────────────────────
  ```
- Internal: at each `T`, slice the `PriceFrame` to `< T`, pass to the optimizer (reuses `/api/frontier` math or extracts the Markowitz core into `lib/markowitz.ts` if cleaner — propose in PR).
- Cost model: pure function `applyCosts(trade: Trade): number` returning net cash flow. Unit tests cover each cost component independently.

### E.3 Lookahead-bias test — `lib/backtest/engine.test.ts`

Mandatory test (per the further-instructions doc):

```ts
it('changes results when input data is shifted by 1 day', () => {
  const baseResult    = runWalkForwardSync(BASE_FIXTURE)
  const shiftedResult = runWalkForwardSync({ ...BASE_FIXTURE, prices: shiftByOneDay(BASE_FIXTURE.prices) })
  // If results are identical, the engine is using data from the future.
  expect(baseResult.aggregate.sharpeDeltaMean)
    .not.toBeCloseTo(shiftedResult.aggregate.sharpeDeltaMean, 6)
})
```

Follows the existing `lib/yahoo.test.ts` patterns (vitest, fixture-driven, deterministic seed for any Monte Carlo paths). Other tests: cost-model correctness, benchmark-replication correctness on a hand-calculated 3-instrument 2-rebalance toy example.

### E.4 Output generation

Two output paths, propose both — Dariush picks:

- **Option A: static JSON.** `pnpm run build:backtests` script regenerates `public/backtests/conservative.json`, `growth.json`, `concentrated.json`, `aggregate.json`. Page reads via `fetch('/backtests/<id>.json')` (edge-cached by Vercel, zero compute cost per pageview).
- **Option B: API route.** `app/api/backtests/[id]/route.ts` runs the backtest on-demand with strong cache headers (`s-maxage=86400, stale-while-revalidate=604800`). Higher cold-start cost, but allows querystring overrides (different starting allocation, different date range) — useful for v2.

**Recommendation: A for v1.** Faster page, deterministic, easier to verify in code review (the JSON is checked into git, so any change is visible in the diff). Add B in v2 if the "try-on-your-own-portfolio" flow needs server-side compute.

### E.5 Frontend — route, server component, OG cards

- Route: `app/how-it-works/page.tsx` (server component, default export). Plus `app/backtests/page.tsx` exporting a `redirect('/how-it-works', 'permanent')`.
- Top-level wrapper: `<main data-tier="advisor">` so the `--accent*` cascade hits the Advisor purple palette.
- Client islands for interactivity:
  - `components/backtest/HeroChart.tsx` — interactive recharts NAV chart with hover tooltip and benchmark toggle.
  - `components/backtest/SamplePortfolioCard.tsx` — accepts a portfolio key, fetches the matching JSON, renders weights table + sparkline + ending-stats table.
  - `components/backtest/CopyLinkButton.tsx` — small client component for the `#aggregate-stats` and per-portfolio permalinks.
- OG image routes:
  - `app/how-it-works/opengraph-image.tsx` — uses `next/og` `ImageResponse`, edge runtime, renders the headline aggregate stat ("+0.15 Sharpe in 73% of quarters · 2014–2024 · net of Swiss costs"). Pattern matches existing `app/opengraph-image.tsx`.
  - `app/how-it-works/[portfolio]/opengraph-image.tsx` — per-portfolio OG cards (matches the permalinks from C.2.4).
- Update `app/sitemap.ts` to add `/how-it-works` (priority 0.9, weekly).
- Update `app/layout.tsx` metadata: nothing — the route's own `generateMetadata` overrides.
- Mobile: disclaimer collapsed-but-default-expanded behaviour uses a small `useEffect` + LocalStorage.

### E.6 Critical safeguards

- **FIDLEG copy lint test:** new file `lib/backtest/fidleg-lint.test.ts`. Walks `app/how-it-works/**/*.tsx` and `components/backtest/**/*.tsx`, parses string literals via the TypeScript compiler API, asserts no forbidden token. Allow-list via `// eslint-allow-fidleg: <reason>` comment above the literal.
- **Lookahead-bias comment block** at top of every file under `lib/backtest/`. Per E.2.
- **Build-time consistency check:** a small script (`scripts/verify-backtest-jsons.ts`, runs in `pnpm build`) that re-computes the aggregate stats from the per-portfolio JSONs and asserts they match `public/backtests/aggregate.json`. Catches drift between sample-portfolio runs and the headline numbers.
- **Disclaimer presence test:** `app/how-it-works/page.test.tsx` (or RTL test) asserts the page renders the exact disclaimer string from Section C.2.6 and the literal `ADVISOR_TERMS_VERSION` value. Bumping the version without updating the page fails CI.

### E.7 Suggested PR sequencing

1. PR 1 — data pipeline + universe constants + cache (no UI). Reviewable in isolation.
2. PR 2 — engine + lookahead test + cost model tests. Math-only, reviewable as a unit.
3. PR 3 — sample portfolio runs, JSON generation script, build-time consistency check.
4. PR 4 — page route, hero chart, methodology section, sample-portfolio cards, CTAs, disclaimer.
5. PR 5 — FIDLEG lint test, OG cards, sitemap update.

Each PR is independently shippable and can be rolled back without breaking the others. Per Dariush's session-7 preference (single-bundled commit), this can also be collapsed to a single PR — flagged for decision at PR-time.

---

## SECTION F — Brand Voice & Tagline

Positioning: Quantfoli is the tool a quant would use — built for
people who understand portfolio theory but don't want to maintain
an Excel sheet about it.

This is NOT a finfluencer product. NOT a beginner tool. NOT a
gamified app. The voice is technical, dry, confident, and assumes
the reader knows what Sharpe ratio means without explanation.

### Primary tagline (test 3 variants on the page)

Variant A — Identity-led:
"The portfolio tool your quant friend uses."

Variant B — Capability-led:
"See your portfolio the way a quant would."

Variant C — Differentiator-led:
"Markowitz, Sharpe, and stress tests — on your actual ZKB depot."

Implementation: Use Variant C in the hero (highest information
density, FIDLEG-safe, instantly differentiates from Parqet/Sharesight).
Use Variant A in the meta description and OG card subline (memorable,
word-of-mouth-friendly). Variant B as fallback for social posts.

### Voice rules across all page copy

- Assume the reader knows the math. Don't explain Sharpe ratio
  inline. Link to a glossary instead.
- No hype words. No "revolutionary", "powerful", "next-gen",
  "AI-powered".
- Numbers over adjectives. "+0.15 Sharpe in 73% of quarters"
  beats "significantly improved performance".
- Acknowledge limits openly. The methodology section calling out
  underperformance cases is itself a brand statement.
- Swiss-specific where possible. "ZKB depot", "CHF-normalized",
  "FIDLEG-compliant" — these are credibility markers for the ICP.

### Word-of-mouth design (for later, but build the page to support it)

The page should be shareable as a single artifact. The aggregate
statistics section (Section C point 3) should be quotable in one
screenshot — formatted so an engineer can paste it in a WhatsApp
to a friend with the caption "look at this".

Concrete implementations:
- Open Graph image must show the headline aggregate stat, not
  generic branding
- Each sample portfolio (Section C point 4) gets a permalink with
  its own OG card
- "Copy link" button next to each statistic block

Do NOT add testimonials, user logos, or "loved by X investors"
sections until ≥10 paying users exist. Empty social proof is
worse than no social proof for this ICP.

---

## Open decisions for Dariush

Before any code starts:

1. **Route choice (C.1):** `/how-it-works` (recommended) or `/backtests`? Or both with one redirecting to the other?
2. **Output strategy (E.4):** static JSON (recommended for v1) or API route?
3. **PR sequencing (E.7):** 5 small PRs or 1 bundled PR (per session-7 preference)?
4. **Sample-portfolio #3 (concentrated retail):** anonymised allocation derived from the existing ZKB parser sample is the cleanest source — confirm OK to use, or hand-pick a synthetic profile instead?
5. **Methodology link target (C.2.2):** stub `/how-it-works/methodology` for v1, or omit the affordance until v2 is written?
6. **Costs (B.3):** numbers are documented defaults — anything you want adjusted before we hard-code them?

Once these are answered, Section E becomes a self-contained implementation plan.

---

**End of spec. Awaiting caveman feedback (`good` / `bad` / `change X` / `start E`).**
