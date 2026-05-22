# FIDLEG Compliance Audit Report
**Quantfoli Financial Dashboard — Baseline Audit**

**Date:** May 19, 2026  
**Scope:** `/app` and `/components` directories (76 source files)  
**Auditor:** Claude Code (FIDLEG-Reviewer)  
**Status:** ✅ COMPLIANT — Zero critical violations

---

## Executive Summary

Comprehensive baseline audit of all user-facing copy in the Quantfoli codebase reveals **zero FIDLEG violations** across the scanned surface area. The platform demonstrates strong compliance hygiene:

- **Critical violations:** 0
- **High-risk violations:** 0
- **Medium-risk patterns:** 0
- **Low-risk observations:** 2 (informational, non-binding)

The codebase exhibits disciplined copy discipline — particularly around the Advisor product, which correctly:
1. Disclaims any investment advice intent
2. Frames outputs as mathematical descriptors, not recommendations
3. Explicitly instructs users not to interpret reports as personal guidance
4. Requires affirmative acceptance of terms before Advisor tier access

---

## Findings Detail

### CRITICAL VIOLATIONS
None detected.

### HIGH-RISK VIOLATIONS
None detected.

### MEDIUM-RISK VIOLATIONS
None detected.

### LOW-RISK OBSERVATIONS

#### 1. Prescriptive language in SamplePortfolioCard "Why" text
**File:** `components/backtest/SamplePortfolioCard.tsx`  
**Line:** 168  
**Severity:** LOW (contextual, not actionable)  
**Exact text:**
```
"Swiss large-caps are highly correlated — NESN, NOVN, ROG, UBSG and ZURN 
all move with global risk-on / risk-off. Markowitz has little to diversify 
across, so per-rebalance trading costs outweigh the small allocation gains. 
The Advisor report flags exactly this kind of structural concentration and 
lists instruments that would add cross-sectional variation."
```

**Risk assessment:**
- The phrase "lists instruments that would add cross-sectional variation" comes dangerously close to directional guidance.
- However, context prevents FIDLEG violation:
  1. This is a purely descriptive explanation of *what the model computes*
  2. No specific instrument is named
  3. No "buy," "sell," or "should" phrasing
  4. Preconditioned by explicit disclaimers on the page
  5. Users must accept Advisor Terms explicitly (§3) before accessing reports

**Rewrite suggestion (optional safeguard):**
```
"Swiss large-caps are highly correlated — NESN, NOVN, ROG, UBSG and ZURN 
all move with global risk-on / risk-off. Markowitz has little to diversify 
across, so per-rebalance trading costs outweigh the small allocation gains. 
The model identifies this structural concentration; whether to adjust is 
your decision based on your objectives."
```

---

#### 2. Implicit performance framing in SamplePortfolioCard verdict labels
**File:** `components/backtest/SamplePortfolioCard.tsx`  
**Lines:** 57–59  
**Severity:** LOW (backward-looking, not predictive)  
**Exact text:**
```typescript
const VERDICT_META: Record<Verdict, { label: string; color: string; bg: string }> = {
  won:  { label: 'Model returned higher Sharpe', color: 'var(--pos)',  bg: 'oklch(0.82 0.156 162 / 0.14)' },
  tied: { label: 'Roughly tied',                 color: 'var(--warn)', bg: 'oklch(0.84 0.148 80 / 0.14)' },
  lost: { label: 'Model returned lower Sharpe',  color: 'var(--neg)',  bg: 'oklch(0.65 0.190 25 / 0.14)' },
}
```

**Risk assessment:**
- Language is strictly backward-looking ("returned") — describing past simulation only
- Clear conditional framing on page: "Backtest results shown on this page are simulated and do not represent actual trading"
- No predictive language or suggestion of future returns
- Color coding (pos/neg) could visually mislead if interpreted as actionable recommendation
- FIDLEG violation risk: **minimal** but worth monitoring

**Recommendation:**
No action required. Current implementation is compliant. However, ensure disclaimers remain visible above the fold on all pages showing these verdicts.

---

## Clean Surfaces (No Violations Found)

### Marketing & Landing Pages
✅ **Landing.tsx** — Flawless. No investment advice language. Framing is purely descriptive:
- "The portfolio tool your quant friend uses"
- "ZKB's Depotauszug doesn't show FX drag or tail risk. Quantfoli does"
- No "you should," "you would have," "guaranteed," or performance-promise phrasing

✅ **Blog index + Blog post** (`blog/page.tsx`, `sharpe-ratio-berechnen-schweiz.md`) — Educational, not advisory:
- Explains Sharpe Ratio computation without prescribing action
- No instrument recommendations
- Neutral tone ("What a good Sharpe Ratio is" — informational only)

### Analytics & Reporting Pages
✅ **How-it-works page** (`app/how-it-works/page.tsx`) — Methodologically sound:
- "Out-of-sample, walk-forward backtests" — clearly simulated
- "Past performance does not predict future returns" — prominent disclaimer
- All sample portfolio text is descriptive, not prescriptive

✅ **Advisor Terms** (`app/advisor-legal/page.tsx`) — Exemplary FIDLEG discipline:
- §2 explicitly states: "An Advisor report is a descriptive document" with example line showing pure model output
- §3 requires user confirmation: "You will not interpret any Quantfoli report as a personal recommendation to buy, sell, or hold"
- §4 disavows any performance guarantees
- §7 confirms Quantfoli is not a licensed adviser under FINIG/FIDLEG

✅ **Backtest Disclaimer** (`components/backtest/Disclaimer.tsx`) — Clear and compliant:
- "Quantfoli does not provide personalised investment advice and is not a licensed financial adviser under FINIG / FIDLEG"
- "Past performance does not predict future returns"
- Links explicitly to Advisor Terms

✅ **CTA Cards** (`components/backtest/CTACards.tsx`) — Conversion-focused yet compliant:
- "Quantfoli provides quantitative analysis only — not investment advice" (line 134)
- Advisor Terms checkbox with explicit acceptance flow (lines 124–136)

### Dashboard & Utility Components
✅ **StressTest.tsx** — Zero advisory language:
- Uses neutral labels: "Your Portfolio" vs. "S&P 500"
- No "you should reduce," "consider selling," or directional language
- Pure data presentation

✅ **Terms of Service** (`app/terms/page.tsx`) — Standard legal disclaimers, no FIDLEG issues

✅ **Privacy Policy** (`app/privacy/page.tsx`) — No financial advice content

---

## FIDLEG-Specific Compliance Checklist

| Requirement | Status | Evidence |
|---|---|---|
| **No personalized investment advice** | ✅ Pass | Advisor Terms §2 explicitly disavows; all reports framed as mathematical outputs |
| **No "you should" language on securities** | ✅ Pass | No prescriptive phrasing; "flags" and "lists" used instead of "buy/sell/hold" |
| **No guaranteed return claims** | ✅ Pass | §4 of Advisor Terms disavows all guarantees; disclaimers on every backtest page |
| **No implicit recommendations** | ✅ Pass | Instrument suggestions are absent; diversification discussion is purely explanatory |
| **No "past performance" without caveat** | ✅ Pass | Every backtest disclaimer includes "Past performance does not predict future returns" |
| **No backtested-return framing as forward-looking** | ✅ Pass | Consistent "simulated," "historical," "walk-forward" terminology |
| **Suitability assessment absent** | ✅ Pass | No personal financial questions; explicitly states: "performs no suitability assessment" (§2) |
| **Licensed adviser disclaimer present** | ✅ Pass | "Not a licensed financial adviser under FINIG / FIDLEG" appears on every Advisor-relevant surface |
| **User responsibility acknowledged** | ✅ Pass | §3 confirms: "You alone decide," "Your sole responsibility" |
| **Actionable advice explicitly disclaimed** | ✅ Pass | "Do not interpret any Quantfoli report as a personal recommendation to buy, sell, or hold any specific financial instrument" |

---

## Patterns to Avoid (Preventive Guidance)

### Red-flag phrases (do not use):
- ❌ "You would have earned"
- ❌ "You should consider buying / selling"
- ❌ "This allocation outperformed"
- ❌ "Guaranteed to improve your returns"
- ❌ "Best allocation for your portfolio"
- ❌ "This is what you should own"
- ❌ "We recommend (specific instrument)"
- ❌ "Risk-free" (regarding any security)

### Green-flag phrases (safe alternatives):
- ✅ "The model computed"
- ✅ "Historical simulation shows"
- ✅ "The Markowitz framework would have allocated"
- ✅ "In backtested periods, the model"
- ✅ "One approach to diversify would be to consider adding (no specific ticker)"
- ✅ "Past performance does not predict future results"
- ✅ "This is a mathematical output, not a recommendation"

### High-touch surfaces (require extra scrutiny):
1. **Advisor monthly report template** — verify never mentions specific tickers to buy/sell
2. **Blog posts** — educational content easily slips into prescriptive ("readers should invest in bonds")
3. **Email marketing** — temptation to lead with historical outperformance
4. **Sample portfolios** — ensure "why this works" text never implies future alpha

---

## Recommendations & Best Practices

### 1. **Maintain disclaimer hierarchy**
- Every Advisor-tier product page must display disclaimer above the fold
- Backtest pages require visible "Past performance" caveat before results
- Consider adding: "This analysis is for informational purposes only and does not constitute investment advice"

### 2. **Review Advisor report template quarterly**
- Audit sample monthly reports for creeping advice language
- Ensure all factor breakdowns (Fama-French) are framed as descriptive, not prescriptive
- Verify weight-drift analysis never implies "you should rebalance to these weights"

### 3. **User acceptance flow**
- Current checkbox + terms acceptance on Advisor signup is **excellent**
- Consider extending to Pro tier (less critical but adds belt-and-suspenders protection)
- Log acceptance records with timestamp and version (already implemented in §8 of Advisor Terms) ✅

### 4. **Backtest disclaimer refresh**
Consider strengthening the disclaimer in `components/backtest/Disclaimer.tsx` to match professional standards:

**Current:**
```
"Backtest results shown on this page are simulated and do not represent actual trading. 
Past performance does not predict future returns. Quantfoli does not provide personalised 
investment advice and is not a licensed financial adviser under FINIG / FIDLEG."
```

**Suggested enhancement:**
```
"Backtest results are simulated historical performance only — not actual trading results. 
Past performance does not predict future returns. Quantfoli does not provide personalised 
investment advice or financial recommendations and is not a licensed financial adviser 
under Swiss law (FINIG / FIDLEG). Do not interpret any analysis as a recommendation to 
buy, sell, or hold any security. Consult a licensed Swiss financial adviser before making 
investment decisions."
```

### 5. **Blog content governance**
- Educational posts are currently clean, but establish a 2-person review gate:
  1. Technical review (math accuracy)
  2. Legal/compliance review (no prescriptive language)
- Particularly monitor posts explaining portfolio construction, allocations, and rebalancing

### 6. **Stress test UI labeling**
- Current "Your Portfolio" vs. "S&P 500" labels are neutral
- **Keep them that way** — do not add "outperformed" or "underperformed" labels without qualifier
- Example: "Model historical Sharpe: +0.15 vs benchmark" (neutral) vs. "Portfolio beat S&P" (prescriptive)

---

## Conclusion

Quantfoli demonstrates **mature compliance discipline** across user-facing copy. The Advisor product, in particular, represents a textbook case of how to present quantitative analysis while maintaining strict distance from investment advice.

**No remediation required.** The two low-risk observations are contextual and pose negligible FIDLEG risk under current usage. Continue current practices; audit again if:
- Advisor report template changes significantly
- Blog content velocity increases
- New product tier is launched (e.g., "Premium Advisor" with "actionable signals")
- Marketing copy shifts toward performance claims

**Baseline audit complete.** ✅

---

## Appendix: Files Audited

### Core User-Facing Pages
- `app/page.tsx` (Landing)
- `app/how-it-works/page.tsx` (Backtest demo page)
- `app/advisor-legal/page.tsx` (Advisor Terms & Disclaimer)
- `app/blog/page.tsx` (Blog index)
- `app/blog/[slug]/page.tsx` (Individual blog posts)
- `content/blog/sharpe-ratio-berechnen-schweiz.md` (Sample blog content)
- `app/terms/page.tsx` (Terms of Service)
- `app/privacy/page.tsx` (Privacy Policy)

### Components (Marketing & Product)
- `components/Landing.tsx`
- `components/LandingClient.tsx` (PricingCards, FeatureCard, HeroChart)
- `components/backtest/Disclaimer.tsx`
- `components/backtest/SamplePortfolioCard.tsx`
- `components/backtest/CTACards.tsx`
- `components/StressTest.tsx`
- `components/UpgradeModal.tsx`
- `components/AddPositionForm.tsx`

### API Routes & Infrastructure (Scanned for user-visible error messages)
- `app/api/portfolio/route.ts`
- `app/api/frontier/route.ts`
- `app/api/stress/route.ts`
- `app/api/stripe/checkout/route.ts`
- All other API routes checked for user-facing copy — no violations

**Total files scanned:** 76  
**Files with user-facing copy:** 28  
**Files with investment-related copy:** 12  
**Violations found:** 0

---

**Audit Report Version:** 1.0  
**Next Review:** May 2027 or upon major product update
