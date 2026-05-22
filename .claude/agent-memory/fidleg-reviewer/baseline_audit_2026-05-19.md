---
name: fidleg-baseline-audit-2026-05-19
description: Baseline FIDLEG compliance audit results for Quantfoli — zero violations found
metadata:
  type: project
---

**Date:** May 19, 2026  
**Status:** ✅ Compliant — zero critical/high/medium violations

## Key Findings

- **Critical violations:** 0
- **High-risk violations:** 0
- **Medium-risk violations:** 0
- **Low-risk observations:** 2 (both contextual, non-binding)

## Compliant Surfaces

All user-facing copy audited across `app/` and `components/` directories (76 files total):
- Landing pages: ✅ No investment advice language
- Blog content: ✅ Educational only, no prescriptive guidance
- Advisor Terms: ✅ Exemplary — explicitly disavows personalized advice, requires affirmative acceptance
- Backtest disclaimer: ✅ "Past performance" caveat present, simulated framing consistent
- CTA/pricing: ✅ Neutral conversion copy, no performance claims

## Low-Risk Observations (No Action Required)

1. **SamplePortfolioCard line 168** — "lists instruments that would add cross-sectional variation" comes close to directional guidance, but context (pure model explanation + explicit disclaimers) prevents FIDLEG violation

2. **Verdict labels** — "Model returned higher/lower Sharpe" uses color coding (pos/neg) which could visually mislead if not paired with "simulated/backtested" caveat. Current implementation compliant; monitor for visual evolution.

## Preventive Patterns

**Forbidden phrases:**
- "you would have earned", "you should", "outperformed", "guaranteed return", "best investment"

**Safe patterns:**
- "The model computed", "Historical simulation shows", "Past performance does not predict", "This is mathematical output, not a recommendation"

## High-Touch Surfaces for Future Review

1. Advisor monthly report template — verify never prescribes specific trades
2. Blog posts — watch for slippage into "readers should invest in bonds"
3. Email marketing — resist historical outperformance framing
4. New product tiers — require compliance review before launch

## Full Report

See: `docs/FIDLEG_AUDIT.md`
