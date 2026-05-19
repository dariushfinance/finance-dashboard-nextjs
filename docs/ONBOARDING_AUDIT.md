# ONBOARDING AUDIT — landing → first paywall

**Date:** 2026-05-19
**Auditor:** Claude (Opus 4.7)
**Scope:** Path from `/` (anonymous) → first paywall encounter, against the principle "user must see real math on their own data before any Pro modal."

---

## Section A — Current user journey (step-by-step)

| # | Route / action | What renders | Gating decision | File:line |
|---|---|---|---|---|
| 1 | Anonymous visitor hits `/` | `app/page.tsx` server-renders `<Landing />` (auth check returns no user) | Public | `app/page.tsx:18-19` |
| 2 | Clicks "Start free" / "Create your account" | Hard nav → `/login?tab=signup` | Public | `components/Landing.tsx` (CTAs from session 10 fix) |
| 3 | Middleware lets `/login` through | No redirect | Public | `middleware.ts:27-29` |
| 4 | `app/login/page.tsx` reads `?tab=signup` → init tab = signup, autofocus Name field | Form: Name, Email, Password | Public | `app/login/page.tsx:10-12, 158` |
| 5 | Submit → `supabase.auth.signUp()` with `emailRedirectTo = origin/` → success message "Check your email to confirm, then sign in." | Inline confirmation msg, NO redirect | n/a | `app/login/page.tsx:30-39` |
| 6 | User confirms via email, returns to `/` | Supabase session set → `app/page.tsx` returns `<Dashboard />` | Authed | `app/page.tsx:19` |
| 7 | Dashboard mounts | Topbar, sidebar with **"Upgrade to Pro" CTA always visible**, empty-state card ("No positions yet. Import your broker CSV or add positions manually.") | Free tier set on mount via `/api/stripe/tier` → `'free'` default | `components/Dashboard.tsx:285-317, 449-466, 591-607` |
| 8 | User clicks "Import ZKB / Yuh / Neon" → Import modal opens, defaults to ZKB tab | `<ZkbImport />` / `<YuhImport />` / `<NeonImport />` | Public to all tiers | `components/Dashboard.tsx:687-732` |
| 9 | User uploads CSV → parse → ISIN resolution → POST `/api/portfolio` → modal closes → `fetchPortfolio()` repopulates | Positions render in Overview tab | Public to all tiers | `components/ZkbImport.tsx` + `Dashboard.tsx:339-349` |
| 10 | Overview tab shows: `MetricsRow` (total value, invested, P&L, return %), `PortfolioTable`, `AllocationChart` — all on user's real CSV data with FX-aware values in CHF (or chosen ccy) | **FREE** | `Dashboard.tsx:610-625` |
| 11 | User clicks tabs: Holdings, History, Benchmark, Dividends, Cashflows | All render on real data | **FREE** | `Dashboard.tsx:626-629, 645-646` |
| 12 | User clicks Risk / Stress / Frontier tab | **`<ProGate>` wrapper renders blurred content + lock card "Risk Analytics — Pro only" + button "Upgrade to Pro — CHF 15/mo"** | **PAYWALL** (frontend only) | `Dashboard.tsx:630-644`, `components/ProGate.tsx:19-67` |
| 13 | Clicks any Upgrade button (sidebar, ProGate card, or feature blocked) | `<UpgradeModal>` opens with 3-card pricing layout | Modal | `Dashboard.tsx:742-747`, `UpgradeModal.tsx` |

### Frontend-only gating note

Per HANDOFF.md §10: **RLS not strictly enforced on `portfolio` / `user_tiers`** — the Pro check is `userTier === 'free' ? <ProGate>… : <RiskTab>`. A user who flips local state could bypass the gate; backend APIs (`/api/risk`, `/api/frontier`, `/api/stress`) are NOT gated server-side. Not a conversion problem, but worth flagging.

---

## Section B — The first value moment

### What counts as a value moment for the ICP (Swiss engineer, CHF 150k+ at ZKB)

In rough order of strength:
1. **Strong:** Sharpe / Sortino / Beta / Alpha computed on his actual positions. This is what he came for.
2. **Strong:** Markowitz efficient frontier with his tickers as input.
3. **Medium:** FX-adjusted total value matching his ZKB statement to ±0.2% (validation that the parser works).
4. **Medium:** History chart / benchmark-vs-S&P on his real positions.
5. **Weak:** Allocation pie chart, P&L number. Commoditized — every banking app shows this.

### Where the value moment occurs in the current flow

**Step 10** — Overview tab, immediately after CSV import succeeds. The user sees:
- Total value in CHF (FX-aware to ±0.2%) — **medium-strength value moment**.
- P&L absolute + % — weak.
- Allocation chart — weak.
- Holdings table — weak.
- (One click later) History chart, benchmark — medium.

### Time from CSV upload to first value moment

- **~2-3 seconds** (network latency for ISIN resolution + Yahoo price fetch) from clicking "Import" submit to seeing populated Overview tab.
- **Zero extra clicks** — they land on Overview by default.

### What's between CSV upload and first metric

Nothing — the import modal closes and Overview repopulates automatically. This part is clean.

### Honest weakness

The free value moment is **portfolio-tracker-grade**, not **quant-grade**. The ICP did NOT sign up for a tracker — every Swiss bank app already shows him total value and allocation. He signed up because the landing page promised Sharpe, Sortino, Beta, Markowitz, stress tests. **None of those compute on his data until he pays.** He sees that the parser works; he does NOT see that the math works.

---

## Section C — Where the paywall actually triggers

### Inventory of paywall surfaces

| # | Surface | File:line | Trigger | What user sees | Value moment hit yet? |
|---|---|---|---|---|---|
| C1 | **Sidebar "Upgrade to Pro" button** (always visible, free tier) | `Dashboard.tsx:449-466` | Mounts immediately on login, **before CSV import** | Persistent gradient button in left sidebar | NO — fires before they've imported anything |
| C2 | **Risk tab `<ProGate>`** | `Dashboard.tsx:630-634` + `ProGate.tsx` | Click "Risk" tab | Blurred Risk content + lock card "Risk Analytics — Pro only" + "Upgrade to Pro — CHF 15/mo" CTA | Depends on tab order. If user clicks Risk first, NO. |
| C3 | **Stress tab `<ProGate>`** | `Dashboard.tsx:635-639` | Click "Stress Test" tab | Same blur + lock card pattern, label "Stress Testing — Pro only" | Same — depends on click order |
| C4 | **Frontier tab `<ProGate>`** | `Dashboard.tsx:640-644` | Click "Frontier" tab | Same — "Efficient Frontier — Pro only" | Same |
| C5 | **Sidebar tier badge** ("Free · v1.0") | `Dashboard.tsx:411` | Always | Informational, no CTA. Soft signal only. | n/a |
| C6 | **`<UpgradeModal>`** | `Dashboard.tsx:742-747` + `UpgradeModal.tsx` | Opens on click from C1/C2/C3/C4 or `?upgraded=1`/`?welcome=1` query | 3-card pricing modal with Free/Pro/Advisor | Only fires on user-initiated click |

### Key observation

There is **no time-based, scroll-based, or import-completion-triggered paywall**. Every paywall in the dashboard is **either passive (sidebar button) or click-gated (tab → ProGate)**. No modal auto-fires.

That's the structurally good news. The structurally bad news is C1 (sidebar) and the fact that the highest-signal tabs for the ICP (Risk, Frontier, Stress) are all behind ProGate the instant they click them.

---

## Section D — Verdict

### Binary answer

**YES — the user hits a value moment before any forced paywall fires.**

No modal blocks them. The Overview tab populates with their real data the moment the import completes, with zero clicks and no paywall interception.

### But the value moment is structurally weak for the ICP

The math the ICP signed up for (Sharpe, Sortino, Beta, Markowitz, stress test) is **100% Pro-gated**. The free tier shows:
- Portfolio tracker math (value, P&L, allocation, history, benchmark vs S&P, dividends, cashflows)
- FX-aware multi-currency display
- All three Swiss broker imports

That's a strong tracker. It is NOT proof that "the math" works on his data. A 42-year-old engineer who came in via `/how-it-works` (which sells backtests, Sharpe, frontier) and lands on a Sharpe-less dashboard is going to ask the legitimate question: "okay, but does YOUR Sharpe match what I'd compute myself?" — and the answer is "pay CHF 15 to find out."

### Persistent sidebar CTA fires before value moment

`Dashboard.tsx:449-466` — the "Upgrade to Pro" button renders the millisecond the dashboard mounts, while the user is still staring at the "No positions yet" empty state. It's not a modal, but it IS the first paywall surface the user sees, and it sees them before they've imported a single position. Not fatal — it's passive — but it's there.

### Tradeoff that exists

Showing even one Pro metric on free user's real data (e.g. portfolio Sharpe in the MetricsRow) would deliver the actual value moment but **directly cannibalizes Pro**. Sharpe is the single most-defensible free metric you could leak; it's also the headline reason engineers pay. Pick one.

---

## Section E — Concrete fix proposals

Ranked by impact. **All are recommendations — do not implement until Dariush approves.**

### E1 — Add ONE free Pro-grade metric to the Overview MetricsRow on real data

**The fix:** Compute portfolio-level **Sharpe ratio (1Y, vs CHF cash rate)** and add it as a 5th tile in `MetricsRow`. Keep Sortino, Beta, Alpha, vol-regime, drawdown all Pro-gated. The Risk tab stays Pro.

- **Files:** `components/MetricsRow.tsx`, `Dashboard.tsx` (pass-through), `lib/yahoo.ts` (Sharpe is already computed for the Pro Risk tab — extract the existing function, do NOT reimplement).
- **Why this specific metric:** Sharpe is the one number a Swiss engineer recognizes and trusts. Seeing his portfolio's Sharpe on the Overview tab — without paying — converts the value moment from "you parsed my CSV" to "you can do the math". Everything else they're paying for (Sortino regime, frontier, stress) is still locked.
- **Cannibalization risk:** REAL. If Sharpe alone is enough for him, he never upgrades. Mitigation: 1Y window only (Pro gets 1M / 3M / 1Y / 3Y), no benchmark-relative version (Beta/Alpha stay locked), no drilldown chart (locked).
- **Expected impact on conversion:** likely +activation rate (people stop bouncing pre-import because the landing finally pays off), uncertain effect on free→Pro. Net direction probably positive at current scale (≤2 paying users) where activation > LTV-leak.
- **Time:** 1-2h.
- **Risk to existing payers:** none. Pure additive.

### E2 — Hide the persistent sidebar "Upgrade to Pro" CTA until user has at least one position

**The fix:** In `Dashboard.tsx:449-466`, wrap the Upgrade button in `positions.length > 0 && userTier === 'free' && …`. Pre-import, show nothing or just the user card.

- **Why:** First impression of a free dashboard should be "let me load my data", not "pay me". The ICP is technically literate — he will find the upgrade path on his own once he sees the value moment.
- **Cannibalization risk:** trivial. The user who would have clicked it pre-import is the impulse-buyer who hasn't seen the product — the lowest-quality conversion.
- **Expected impact:** small but right-directional.
- **Time:** 5 min.
- **Risk to existing payers:** none. Existing payers see "Manage plan" not "Upgrade".

### E3 — In the ProGate card, show a **preview number** computed on the user's real data

**The fix:** When `RiskTab` / `FrontierChart` / `StressTest` are ProGate-blocked, compute and show ONE teaser number in the lock card. E.g. "Your portfolio's 1Y Sharpe is **0.84** — see Sortino, rolling vol regime, correlation matrix, and 3-window comparison with Pro."

- **Why:** This converts the ProGate from "wall" to "demo". The user sees the math worked on his data, and is paying for *more of it*, not for *whether it works at all*. Classic SaaS activation pattern (Linear, Notion, Stripe Dashboard all do this).
- **Files:** `ProGate.tsx` (accept a `teaserMetric` prop), `Dashboard.tsx` (compute and pass per-tab).
- **Cannibalization risk:** moderate. Overlaps with E1 in spirit. If you do E1, E3 becomes weaker (Sharpe already visible on Overview). Pick E1 OR E3, not both.
- **Expected impact:** likely strongest single fix.
- **Time:** 3-4h (compute the cheap teaser numbers for all 3 tabs).
- **Risk to existing payers:** none.

### E4 — Auto-open `UpgradeModal` on first ProGate click, OR open `/how-it-works` deep-linked to the relevant section

**Skipped intentionally.** This is "when the paywall fires" in the wrong direction (more aggressive, not less). Flagging it only so it's not added later by accident.

### Recommendation

Ship **E2 alone first** (5 min, zero risk). Then run analytics for 7 days.

Then decide between **E1** (one free Pro metric on Overview) and **E3** (teaser number inside ProGate). E3 is the higher-leverage fix; E1 is the lower-risk fix. Do not ship both — they'd cannibalize each other.

### What NOT to change

Per the audit prompt, no changes to:
- Pricing (CHF 15/mo / CHF 150/yr — out of scope)
- Tier structure (Free/Pro/Advisor — out of scope)
- Paywall copy ("Pro only", "Upgrade to Pro — CHF 15/mo" — out of scope)

Also do NOT touch:
- `lib/yahoo.ts` (math, 36 passing tests, per HANDOFF.md §6)
- The signup funnel (session 10 already fixed it)
- `/how-it-works` (recently shipped, performing)

---

## Summary

| Question | Answer |
|---|---|
| Forced paywall before value moment? | **No.** |
| Persistent passive paywall (sidebar CTA) before value moment? | **Yes** (`Dashboard.tsx:449`). Fixable in 5 min (E2). |
| Strong value moment for the ICP before Pro modal? | **No.** Free tier = tracker. Pro tier = quant math. He sees CSV parsed correctly but not Sharpe-on-his-data. |
| Recommended highest-leverage fix | **E3** — teaser number inside each ProGate lock card. |
| Recommended safest first fix | **E2** — hide sidebar Upgrade CTA pre-import. |
| Should anything be done immediately, no questions asked? | **E2 only.** Zero risk, zero cannibalization, 5 min. Everything else needs Dariush's call. |

---

**End of audit. Waiting for caveman feedback before touching any code.**
