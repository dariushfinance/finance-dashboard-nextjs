# PROGATE REDESIGN — Blurred-preview pattern

**Date:** 2026-05-19
**Author:** Claude (Opus 4.7)
**Status:** SPEC — awaiting Dariush approval before code changes.
**Related:** `docs/ONBOARDING_AUDIT.md` (drove this — see §E3)

---

## 1. Goal

Convert the Pro paywall from a **wall** (full content blurred behind a lock card) to a **demo** — the user sees the tab title, one headline number computed on his real positions, and a blurred preview of the rest. The Pro CTA is now contextual ("see the full analysis"), not gatekeeping ("you cannot see anything").

This is the **E3** fix from `ONBOARDING_AUDIT.md`. Plus **E2** (hide sidebar Upgrade CTA pre-import) bundled in the same commit.

---

## 2. Files affected

| File | Change |
|---|---|
| `components/ProGate.tsx` | New API: accepts `headlineMetric` slot + `featureName`. Lock card moves to the side / corner; headline metric stays clear; everything between is blurred. |
| `components/Dashboard.tsx` | Wrap Risk / Stress / Frontier in new ProGate with per-tab headline-metric slot. Hide sidebar Upgrade button when `positions.length === 0`. |
| `components/RiskTab.tsx` | No change to math. Export `computePortfolioVol21d()` + reuse existing Sharpe calc so the headline number is from the same code path as the Pro tab. |
| `components/StressTest.tsx` | Export `computeWorstHistoricalDrawdown()` (or extract from existing logic) so the headline number is the real worst-scenario number for THIS portfolio. |
| `components/FrontierChart.tsx` | Export `computeCurrentPortfolioPoint()` so the (Return, Volatility) coordinates shown for free are identical to the point plotted in the Pro chart. |
| `app/globals.css` | No new tokens needed — reuse existing `--accent-pro` / `--accent-glow` (the existing tier theming already supplies this). |

---

## 3. ProGate component — new API

```tsx
interface Props {
  /** Tab/feature name. Used in CTA copy. */
  featureName: string

  /**
   * The one number visible to free users. Must be computed on the user's
   * actual portfolio data, not a demo. Rendered above/before the blurred zone.
   */
  headlineMetric: React.ReactNode

  /**
   * The full Pro content. Rendered behind the blur.
   */
  children: React.ReactNode

  /** Open upgrade modal. */
  onUpgrade: () => void
}
```

### Layout

```
┌──────────────────────────────────────────────────────────┐
│  [Tab title — clear]                                      │
│  [Headline metric block — clear, single number]           │
│  ──────────────────────────────────────────────────       │
│  [blurred chart / table / scatter — filter: blur(8px)]    │
│         ┌──────────────────────────────┐                  │
│         │  Pro upgrade CTA card        │                  │
│         │  (centered overlay on blur)  │                  │
│         └──────────────────────────────┘                  │
└──────────────────────────────────────────────────────────┘
```

- Tab title + headline metric: rendered OUTSIDE the blurred wrapper, fully crisp.
- Blurred zone: the full Pro tab content, `filter: blur(8px)`, `pointer-events: none`, `user-select: none`, `opacity: 0.55`.
- CTA card: absolute-positioned, centered on the blurred zone only (not over the headline). Uses `--accent-pro` gold via existing tier tokens.

### Blur is CSS-only

No server-side hiding. The Pro content is rendered with the same data, just visually obscured. Implication: when the user upgrades, the blur is removed instantly on tier-change → no reload, no flicker, no data refetch.

This is the same pattern as the existing ProGate but with the headline slot promoted above the blur.

---

## 4. Per-tab headline numbers

All numbers are descriptive metrics computed on the user's positions. None contain prescriptive language, recommendations, or buy/sell hints. See §6 for FIDLEG compliance.

### 4.1 Risk tab

Two numbers, side by side:

| Label | Value | Source |
|---|---|---|
| **Volatility (21d annualised)** | e.g. `14.2%` | Existing `rollingAnnualisedVol(returns, 21)` in `RiskTab.tsx:12-20` — take last value. |
| **Sharpe ratio (1Y)** | e.g. `0.84` | Existing `lib/yahoo.ts` portfolio-Sharpe code path used by the full Risk tab. |

**Copy under the numbers:**
> 21-day rolling annualised volatility of your portfolio's daily returns. Sharpe over the trailing 1Y, vs. 0% risk-free (CHF cash rate placeholder).

No "you should", no "outperformed", no "recommended". Just what the number is.

### 4.2 Stress Test tab

| Label | Value | Source |
|---|---|---|
| **Worst historical drawdown** | e.g. `−42.3%` (scenario: `2008 GFC`) | Existing stress-test simulation results — take the most negative scenario's drawdown for this portfolio. |

**Copy under the number:**
> Largest peak-to-trough loss your current allocation would have shown across the historical stress scenarios. Past data, not a forecast.

### 4.3 Frontier tab

| Label | Value | Source |
|---|---|---|
| **Your portfolio** | `Return: 9.1% · Volatility: 13.4%` | Existing frontier-point computation in `FrontierChart.tsx`. Same numbers, presented as text instead of as a dot on a scatter. |

**Copy under the coordinates:**
> Your current allocation's annualised expected return and volatility, computed from trailing returns of your held positions.

The Markowitz frontier chart itself stays blurred.

---

## 5. Sidebar CTA fix (E2)

`Dashboard.tsx:449-466` — wrap the Upgrade button:

```tsx
{userTier === 'free' && positions.length === 0 ? null : (
  <button …>{upgradeButtonLabel}</button>
)}
```

Existing payers (`userTier === 'pro' | 'advisor'`) keep their "Manage plan" button visible regardless of position count.

---

## 6. FIDLEG compliance

Per `docs/FIDLEG_AUDIT.md` and the recent FIDLEG fixes (`beb8656`, `acbe3a9`):

- ❌ FORBIDDEN: "you would have earned", "you should buy", "outperformed", "guaranteed", "recommended"
- ✅ ALLOWED: descriptive metrics ("volatility is X%", "drawdown was Y%"), neutral framing ("past data, not a forecast"), explanatory copy

### Strings introduced by this redesign (auditable list)

| # | String | Surface | Verdict |
|---|---|---|---|
| F1 | `"Volatility (21d annualised)"` | Risk headline label | descriptive metric label — OK |
| F2 | `"Sharpe ratio (1Y)"` | Risk headline label | descriptive metric label — OK |
| F3 | `"21-day rolling annualised volatility of your portfolio's daily returns. Sharpe over the trailing 1Y, vs. 0% risk-free (CHF cash rate placeholder)."` | Risk subcopy | factual definition — OK |
| F4 | `"Worst historical drawdown"` | Stress headline label | descriptive metric label — OK |
| F5 | `"Largest peak-to-trough loss your current allocation would have shown across the historical stress scenarios. Past data, not a forecast."` | Stress subcopy | factual + explicit non-forecast disclaimer — OK |
| F6 | `"Your portfolio"` + `"Historical-neab return: X% · Volatility: Y%"` | Frontier headline | descriptive coordinates — OK |
| F7 | `"Your current allocation's annualised historical-mean return and volatility, computed from trailing returns of your held positions."` | Frontier subcopy | factual definition — OK |
| F8 | `"Unlock full Risk dashboard · Pro CHF 15/mo"` | CTA button | feature-name + price, no advice claim — OK |
| F9 | `"Unlock full Stress Test · Pro CHF 15/mo"` | CTA button | same — OK |
| F10 | `"See full Frontier analysis · Pro CHF 15/mo"` | CTA button | same — OK |
| F11 | `"Five more risk metrics, regime detection, and per-position correlation matrix with Pro."` | Risk CTA card subcopy | feature description, no advice — OK |
| F12 | `"All historical scenarios, per-scenario position attribution, and worst-month rolling distribution with Pro."` | Stress CTA card subcopy | feature description, no advice — OK |
| F13 | `"Full efficient frontier with constraint-aware Markowitz optimisation and per-portfolio Sharpe distribution with Pro."` | Frontier CTA card subcopy | feature description, no advice — OK |

**Watch out:** the word "expected return" in F6/F7 is technically the historical-mean estimate used in the Markowitz solver, not a forecast. FIDLEG-safer phrasing might be `"historical-mean return"` if the reviewer flags it. Will defer to fidleg-reviewer.

Linter coverage: `lib/backtest/fidleg-lint.test.ts` currently walks `app/how-it-works/**` and `components/backtest/**`. It does NOT cover `components/{ProGate,RiskTab,StressTest,FrontierChart,Dashboard}.tsx`. **Recommend** extending the lint test glob in the same commit so future regressions are caught.

---

## 7. Out of scope

- Pricing changes (no)
- New tier (no)
- Backend RLS enforcement of Pro features (deferred per HANDOFF.md §10 — frontend gating only, same as today)
- Advisor-tier behavior — Advisor sees full content same as Pro
- Mobile-specific layout tweaks — assume current responsive grid works; verify in dev after build

---

## 8. Implementation order

1. Spec approval (this doc) — **waiting**
2. Extend `lib/backtest/fidleg-lint.test.ts` glob to cover new files
3. Refactor `components/ProGate.tsx` with new `headlineMetric` slot
4. Wire Risk tab: extract vol/Sharpe headline computation, render in slot
5. Wire Stress tab: extract worst-drawdown + scenario name
6. Wire Frontier tab: extract current-portfolio point
7. Update `Dashboard.tsx` sidebar CTA conditional (E2)
8. `npm test` (51 → 51+ tests should pass)
9. `npm run build` (verify SSR boundary not broken — ProGate is client-only)
10. `npm run dev` → manual smoke test with a known free-tier account
11. Run `@agent-fidleg-reviewer` over the changed files
12. Show diff to Dariush. **Wait for explicit `push`.**

---

## 9. Risks

| Risk | Mitigation |
|---|---|
| Headline metric on free tier cannibalises Pro conversions | Strict scope: ONE/TWO numbers per tab, no historical chart, no per-position drilldown, no benchmark comparison, no regime label. Pro still ships the depth. |
| Computing the headline metric on every Dashboard render is expensive | The math already runs (the Pro tab is mounted behind the blur). No extra compute. |
| `expected return` framing trips FIDLEG | Pre-empt with fidleg-reviewer pass on this spec; rephrase to `historical-mean return` if flagged. |
| Blur is visually weak on some browsers (especially older Safari) | Acceptable — failure mode is "user sees Pro content fully" which is fine since the CTA card still overlays. Defensive backup: `backdrop-filter: blur` as fallback. |
| Mobile layout breaks (two headline tiles side by side) | Verify in dev; collapse to stacked on `<768px`. |

---

**End of v1 spec. Per-chart refinement appended below (2026-05-19).**

---

## 10. Per-chart paywall refinement (v2 — 2026-05-19)

### 10.1 Motivation

The shipped ProGate (`ad28b62`) treats each Pro-gated tab as **one blurred surface with one CTA**. Each Pro tab actually contains multiple distinct visualizations. A user looking at the Risk tab sees:

- 6 stat boxes (top row)
- Rolling Volatility chart
- Correlation Matrix heatmap
- Monthly Returns Calendar

…all blurred under a single "Unlock full Risk dashboard" CTA. The CTA says "with Pro you get more risk metrics" but does not say WHICH metric is behind WHICH visualization.

Refinement: apply blur + Pro CTA **per chart** instead of per tab. Each CTA describes what THAT specific visualization unlocks.

### 10.2 Constraint (preserves v1 guarantee)

The v1 "headline metric outside blur" guarantee must survive. At least ONE crisp real-data number per tab still renders above any blur, identical to current.

### 10.3 Per-chart inventory

#### Risk tab (`components/RiskTab.tsx`)
Distinct visualizations found in current file:

| # | Chart / block | Source line | Headline-metric eligible? |
|---|---|---|---|
| R1 | 6 stat boxes top row (Vol 21d, Sharpe 1Y, Sortino, MaxDD, VaR, CVaR) | already partially exposed via `RiskHeadline` | YES — already free-tier on the 2 of 6 most relevant |
| R2 | Rolling Volatility chart | 171-256 | NO — full chart is the Pro unlock |
| R3 | Correlation Matrix heatmap | 258-343 | NO — Pro |
| R4 | Monthly Returns Calendar | 345-end | NO — Pro |

#### Stress Test tab (`components/StressTest.tsx`)
| # | Chart / block | Source line | Headline-metric eligible? |
|---|---|---|---|
| S1 | Worst-scenario name + max drawdown | exposed via `StressHeadline` | YES — already free-tier |
| S2 | Scenario card 1 (dot-com / 2000) | 167 (`scenarios.map`) | NO — Pro |
| S3 | Scenario card 2 (GFC / 2008) | same | NO — Pro |
| S4 | Scenario card 3 (COVID / 2020) | same | NO — Pro |
| S5 | Scenario card 4 (2022 inflation) | same | NO — Pro |

Per-scenario position attribution is rendered INSIDE each ScenarioCard (per-position contribution to scenario loss). Hence per-card CTA covers it.

#### Frontier tab (`components/FrontierChart.tsx`)
| # | Chart / block | Source line | Headline-metric eligible? |
|---|---|---|---|
| F1 | Current portfolio (Return, Volatility) point | exposed via `FrontierHeadline` | YES — already free-tier (as text) |
| F2 | Efficient Frontier scatter (Monte Carlo cloud + frontier curve + current portfolio dot) | 357+ | NO — Pro |
| F3 | `VolatilityInsights` block — rebalancing-target weights + per-asset vol contribution | 71-end, rendered at 505 | NO — Pro |

### 10.4 Per-chart CTA copy (FIDLEG-safe, awaiting `@agent-fidleg-reviewer` pass)

Each chart gets its own CTA card overlaying its own blurred surface. Copy follows the v1 §6 FIDLEG rule set: descriptive feature names, no advice claims, no "you would have", no "outperformed", no "recommended."

| Chart | CTA headline | CTA subcopy | Notes |
|---|---|---|---|
| R2 Rolling Volatility | `"Rolling volatility regime — Pro"` | `"21d annualised volatility across the trailing 12 months. Shows the regime shifts your headline number averages out."` | "Spot" → "Shows" per fidleg-reviewer 2026-05-20 |
| R3 Correlation Matrix | `"Per-position correlation matrix — Pro"` | `"Pairwise daily-return correlation across every position. Identifies pairs with > 0.8 co-movement."` | Pure descriptive |
| R4 Monthly Returns Calendar | `"Monthly returns calendar — Pro"` | `"TWR for every month since first position. Heatmap green/red by realised return."` | Descriptive |
| S2 Scenario card (dot-com) | `"2000 dot-com scenario — Pro"` | `"Daily returns of your current allocation replayed against the 2000-2002 dot-com drawdown. Past data, not a forecast."` | Repeats v1 "past data, not a forecast" disclaimer per card |
| S3 Scenario card (GFC) | `"2008 GFC scenario — Pro"` | `"Daily returns of your current allocation replayed against the 2008 financial-crisis window. Past data, not a forecast."` | Same |
| S4 Scenario card (COVID) | `"2020 COVID scenario — Pro"` | `"Daily returns of your current allocation replayed against the Feb-Apr 2020 COVID drawdown. Past data, not a forecast."` | Same |
| S5 Scenario card (2022) | `"2022 inflation scenario — Pro"` | `"Daily returns of your current allocation replayed against the 2022 rate-hike drawdown. Past data, not a forecast."` | Same |
| F2 Frontier scatter | `"Efficient frontier with Markowitz — Pro"` | `"Monte Carlo cloud of weight allocations subject to per-asset cap. Frontier curve fitted through the convex hull."` | "Constraint-aware" replaced with "subject to per-asset cap" — more concrete |
| F3 VolatilityInsights | `"Rebalancing weights and per-asset volatility contribution — Pro"` | `"Computed target weights from the frontier solver plus each asset's marginal contribution to portfolio volatility."` | "Suggested" → "Computed" per fidleg-reviewer 2026-05-20 |

### 10.5 FIDLEG pre-review — completed 2026-05-20

`@agent-fidleg-reviewer` reviewed all 9 strings. Verdict:
- **7 of 9 PASS** as originally written (R3, R4, S2, S3, S4, S5, F2).
- **2 rewrites applied** (already in §10.4 table above):
  - R2 subcopy: `"Spot the regime shifts"` → `"Shows the regime shifts"` (action verb → observation verb).
  - F3 subcopy: `"Suggested target weights"` → `"Computed target weights"` (recommendation → computation).

Table §10.4 is **shippable to spec-approval** post-edits. Zero remaining FIDLEG risk.
Reviewer also recommends extending `lib/backtest/fidleg-lint.test.ts` `SCAN_FILES` to include `ProChart.tsx` once it exists (already noted in §10.6 step 4).

### 10.6 Implementation plan (when approved)

1. Run `@agent-fidleg-reviewer` over the 9 new strings (this spec, §10.4 table). Apply any rewrites.
2. Refactor `ProGate.tsx` to support **per-child** wrapping: a new component `ProChart` that takes its own `featureName`, `featureSubcopy`, `ctaLabel` and wraps a single child in the blur+CTA pattern. The outer `ProGate` still owns the headline.
3. Wrap each Pro-gated chart in a `ProChart` instead of letting `ProGate` blur the whole tab. Pseudocode:
   ```tsx
   <ProGate featureName="Risk" headlineMetric={<RiskHeadline … />}>
     <RiskTab>
       <ProChart name="Rolling volatility regime" sub="…">
         <RollingVolatilityChart … />
       </ProChart>
       <ProChart name="Per-position correlation matrix" sub="…">
         <CorrelationMatrix … />
       </ProChart>
       …
     </RiskTab>
   </ProGate>
   ```
   Free-tier user: each chart has its own CTA card. Pro-tier: ProChart no-ops (renders child directly).
4. Extend `lib/backtest/fidleg-lint.test.ts` `SCAN_FILES` to include the new `ProChart.tsx`.
5. Manual smoke test against a free-tier and Pro-tier account.
6. Run `@agent-fidleg-reviewer` over the shipped code (post-impl pass).

### 10.7 Risks

| Risk | Mitigation |
|---|---|
| Visual density — 9 small CTA cards instead of 3 large ones — looks busy. | Each per-chart CTA card is smaller (smaller font, single-line subcopy, gold accent stripe only). Headline CTA per tab is removed once per-chart pattern lands; user pays for any chart through any of the 3 per-tab CTAs. |
| Free user feels "more locked" because every chart now has its own CTA. | Counter: the user sees more specifically what they're missing per chart. Per-chart CTAs convert better than per-tab in standard SaaS A/B data. |
| FIDLEG slips through on one of 9 strings. | Pre- and post-impl `@agent-fidleg-reviewer` pass (same as v1). |
| Mobile layout: 4 stacked scenario cards each with their own CTA card = a lot of vertical scroll on Stress Test. | Acceptable — the alternative (one big CTA at top) is what v1 already shipped. Mobile users already scroll. |

### 10.8 Out of scope for v2

- No new Pro features being added — only repackaging the existing ones with finer-grained CTA copy.
- No tier changes.
- Free-tier headline metrics from v1 are unchanged.

### 10.9 Approval gate

Per-chart spec sits waiting for:
1. `@agent-fidleg-reviewer` pre-pass over §10.4 strings.
2. Caveman approval from Dariush.

Then code lands per §10.6.

**End of v2 spec.**
