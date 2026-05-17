// Swiss trading cost model.
//
// All values are documented medians sourced for the /how-it-works methodology
// section. If any number changes, also update docs/BACKTESTING_LANDING_PAGE.md
// section B.3 — the page text and these constants must stay in sync.
//
// Citations:
//   - Commission 0.50%/side : Moneyland 2024–2025 broker comparison median
//                             (ZKB, Yuh, Saxo CH, IBKR CH retail tiers)
//   - Spread     0.10%/side : SIX-listed liquid ETF / SMI large-cap quote depth
//   - Stamp duty            : ESTV Stempelabgabe — 0.15% CH-domiciled, 0.30% foreign
//   - FX spread  0.50%      : ZKB/Yuh published retail FX spreads on non-CHF legs

import { stampDutyRate } from './universe'

export interface CostModel {
  commissionPerSide: number   // fraction of trade notional, each leg
  spreadPerSide:     number   // half-spread per leg
  fxSpreadPerSide:   number   // applied to non-CHF legs only (currently unused — placeholder for v2 FX-aware backtests)
  // stamp duty is sourced per-ticker via universe.stampDutyRate(ticker)
}

export const DEFAULT_COSTS: CostModel = {
  commissionPerSide: 0.0050,
  spreadPerSide:     0.0010,
  fxSpreadPerSide:   0.0050,
}

// Cost of a single trade for a given ticker, as a fraction of trade notional.
// Returns the round-trip cost when entering OR exiting a position; the engine
// applies it once per leg (a rebalance that increases a weight = one leg in,
// the corresponding decrease elsewhere = one leg out, both billed).
export function tradeCost(ticker: string, costs: CostModel = DEFAULT_COSTS): number {
  return costs.commissionPerSide + costs.spreadPerSide + stampDutyRate(ticker)
}

// Cost of rebalancing from `prev` weights to `next` weights, as a fraction of
// portfolio NAV. Turnover is defined as 0.5 * Σ |Δw|  (one-way). Per-ticker
// costs are weighted by |Δw| because heterogeneous instruments have different
// stamp duty rates.
export function rebalanceCost(
  prev: Record<string, number>,
  next: Record<string, number>,
  costs: CostModel = DEFAULT_COSTS,
): number {
  const tickers = new Set([...Object.keys(prev), ...Object.keys(next)])
  let total = 0
  for (const t of tickers) {
    const delta = Math.abs((next[t] ?? 0) - (prev[t] ?? 0))
    if (delta > 0) total += delta * tradeCost(t, costs)
  }
  return total
}

// Initial-purchase cost (no prior position).
export function entryCost(weights: Record<string, number>, costs: CostModel = DEFAULT_COSTS): number {
  let total = 0
  for (const [t, w] of Object.entries(weights)) {
    if (w > 0) total += w * tradeCost(t, costs)
  }
  return total
}
