# Landing Page Audit — 2026-05-17

> **Status:** Diagnosis only. No code changes proposed without explicit `build` / `push` from Dariush.
> **Data source:** Vercel Analytics last 24h — 540 visits, 70% CH, top pages `/` (292) and `/login` (209), `/register` not in top pages.
> **Live URLs reviewed:** Landing.tsx, LandingClient.tsx, app/page.tsx, app/login/page.tsx, components/UpgradeModal.tsx, app/globals.css.

---

## 🔴 CRITICAL FINDING — Fix in 10 minutes

**`/register` does not exist as a route.** A `Grep` of the entire codebase confirms: no `app/register/` directory, no `Link href="/register"`, no redirect rule pointing there. The analytics observation "`/register` <20 visits" is structurally inevitable — there's nothing to visit. Anyone typing `quantfoli.com/register` (e.g. from a bookmark, a shared link, or instinct because every SaaS has one) gets a 404 via middleware redirect.

**Worse:** every "create account" CTA on the landing page routes to `/login`, which **defaults to the Sign In tab** — not the Create Account tab. So a first-time visitor clicking "Start free" lands on a sign-in form they cannot use yet. They have to spot the "Create Account" tab, click it, and fill in name + email + password. Every extra click between intent and form is a measurable drop-off.

**Affected CTAs** (each one says signup intent, but routes to sign-in tab):

| Location | Copy | Routes to | Should route to |
|---|---|---|---|
| Hero primary | "Start free" | `/login` (Sign In tab) | `/login?tab=signup` |
| Pricing Free card | "Start free" | `/login` | `/login?tab=signup` |
| Pricing Pro card | "Get Pro" | `/login` | `/login?tab=signup&plan=pro` (then redirect to checkout post-confirm) |
| Pricing Advisor card | "Get Advisor" | `/login` | `/login?tab=signup&plan=advisor` (with the Advisor accept-gate flow) |
| Final CTA | "Create your account" | `/login` | `/login?tab=signup` |

**Recommended immediate fix (~10 min, ships before the rest of this audit is approved):**

1. Add `app/login/page.tsx` `useSearchParams()` to read `?tab=signup` and initialize `useState('signup')` when present.
2. Update every "create account" intent CTA on Landing.tsx + LandingClient.tsx to use `/login?tab=signup`.
3. Add `app/register/page.tsx` that does `redirect('/login?tab=signup', 'permanent')`. Captures all direct-traffic, bookmarks, and shares.
4. Add `/register` to the middleware public-routes list (same pattern as `/how-it-works` fix from this morning).

That alone should measurably move the funnel. Independent of the rest of the audit.

---

## SECTION A — Current State Diagnosis

### A.1 Hero section (components/Landing.tsx:116–166)

- **Headline:** "Institutional-grade portfolio analytics. Retail price." (Retail price in purple gradient)
- **Subheadline:** "Markowitz frontier, stress tests, Sharpe, Sortino, Beta, Alpha — on top of your real ZKB, Yuh or Neon portfolio. FX-aware to ±0.2%. From CHF 0."
- **Primary CTA:** "Start free →" (gradient button) → routes to `/login` (Sign In tab — WRONG)
- **Secondary CTA:** "See backtests" → routes to `/how-it-works` (correct, fixed this morning)
- **Above-the-fold visibility:** Padding is `96px 24px 56px`. On a 1080×1920 desktop the headline + subheadline + both CTAs render above the fold. On a 360×800 mobile viewport the headline takes ~280 px (responsive clamp) and the CTAs land at ~620 px — still above the typical mobile fold (~800 px) but tight. The hero chart visual loads BELOW the fold on mobile — that's fine.
- **Microcopy under CTAs:** "Free tier · No credit card · Cancel Pro anytime" — good, but small (12 px). Reads as fine-print rather than reassurance.
- **Status pill above headline:** "Built in Switzerland · for self-directed investors" — solid trust signal for the ICP, well-placed.

### A.2 Signup vs. Login UX (app/login/page.tsx)

- `/login` is a single page with two tabs: **Sign In** (default) and **Create Account**. Tab state lives in `useState`, no query-param init.
- **Visitor flow if they click "Start free" from the landing:**
  1. Land on `/login` Sign In tab.
  2. See email/password fields with placeholder "you@example.com".
  3. Realize they don't have an account.
  4. Notice the "Create Account" tab at the top (small, 13 px, only visually distinguished by an underline animation on active tab).
  5. Click the tab.
  6. Page re-renders with a Name field added above email.
  7. Fill in 3 fields, submit, see "Check your email to confirm".
- Number of clicks to "I submitted the form": **3** (landing CTA → login → switch tab → submit). Industry baseline for high-converting SaaS is **1–2** (landing → signup form → submit). One extra click in the friction-critical zone.
- **"Don't have an account?" path:** does NOT exist as a separate link. The only affordance is the tab switcher. No prose link like "Don't have an account? Create one →" — that pattern is standard and missing.
- **Could a user accidentally land on `/login` when they meant `/register`?** Yes, every single signup CTA does this. This is the root of the funnel leak.

### A.3 Value proposition clarity

- **5-second test for the ICP** (Swiss engineer, CHF 150k+ at ZKB/Yuh, knows what Sharpe means):
  - "Institutional-grade portfolio analytics. Retail price." → vague. Could be any roboadvisor.
  - "Markowitz frontier, stress tests, Sharpe, Sortino, Beta, Alpha — on top of your real ZKB, Yuh or Neon portfolio." → **this is the differentiator.** Strong. Names the math, names the Swiss brokers, says "your real" (i.e. import-driven, not paper portfolio).
  - "FX-aware to ±0.2%" → engineer signal. Numbers over adjectives. Good.
  - "From CHF 0" → reassurance. Good.
- **Problem:** the differentiator (ZKB/Yuh/Neon import + the math on real positions) is buried in the subheadline as a comma-separated list. The headline itself is generic. A skimmer reads only the H1 ("Institutional-grade portfolio analytics. Retail price.") and learns nothing differentiating.
- **The technical reader** still gets the message because they read the second line. But every percentage point of skimmers lost is lost conversion. The H1 should carry at least one specific differentiator.

### A.4 Pricing visibility

- **Visible without signup:** YES. The Pricing section (Landing.tsx:288–304) renders the full 3-tier table with monthly/yearly toggle directly on `/`. Good.
- **3 tiers visible:** YES — Free (CHF 0), Pro (CHF 15/mo or 150/yr), Advisor (CHF 50/mo or 500/yr).
- **Free tier labeling:** "Forever free" + "Cancel anytime from your Stripe customer portal · No refunds on partial periods." But the "No credit card needed" reassurance is BURIED in the hero microcopy ("Free tier · No credit card") — NOT repeated on the Free pricing card itself. That's a missed reassurance at the moment of pricing-decision.
- **Pro tier:** "Most Popular" badge, gold accent — good.
- **Advisor tier:** "Premium" badge, purple — good. But every Advisor CTA on the landing routes to `/login` (Sign In tab) without surfacing the mandatory Advisor T&C acceptance gate. That gate exists in `UpgradeModal.tsx` and is wired in `app/api/advisor/accept-disclaimer/route.ts`, but the landing-page Advisor button skips it. Post-signup, they'll hit the gate via UpgradeModal — but the friction is the same.

---

## SECTION B — Hypotheses for Why Conversion Is Low

Ranked by severity (BLOCK = stops most users; FRICTION = costs ~5–15% drop-off each; POLISH = cosmetic).

### B.1 [BLOCK] CTA-to-tab mismatch

- **Hypothesis:** Every "Start free / Get Pro / Get Advisor / Create your account" CTA lands users on the Sign In tab of `/login`. First-time visitors see a sign-in form, don't immediately spot the Create Account tab, and bounce.
- **Evidence:** 209 `/login` visits (71% of `/` visits made it through), but no signup metric to verify what fraction submit the form. Industry baseline is 40–60% submit-on-arrival. If we're well below that, this is the cause.
- **Severity:** BLOCK. The CTA promises a free signup and delivers a sign-in form. Classic conversion-killer.

### B.2 [BLOCK] No `/register` route

- **Hypothesis:** Direct traffic, bookmarks, link shares, and people who type `quantfoli.com/register` instinctively all 404 (or middleware-redirect). Lost conversions invisible in analytics because they bounce before generating a measurable event.
- **Evidence:** Codebase has zero `/register` references. Analytics shows `/register` not in top pages — consistent with "route does not exist".
- **Severity:** BLOCK for the subset of users who try the URL directly. Low base-rate but trivially fixable.

### B.3 [FRICTION] Generic H1 buries the differentiator

- **Hypothesis:** "Institutional-grade portfolio analytics. Retail price." sounds like Sharesight, Parqet, Wealthfront, every roboadvisor. The Swiss engineer ICP skims, gets no signal, leaves.
- **Evidence:** ICP is technically literate and skim-prone. They've seen 50 SaaS landings with the same H1 shape. Real differentiator ("on your actual ZKB depot") is in the H2 only.
- **Severity:** FRICTION. Costs the skim-driven half of arrivals.

### B.4 [FRICTION] No "Don't have an account?" link on /login

- **Hypothesis:** Visitor who DID intend to sign in but mis-clicked Create Account, or vice versa, has no prose link to switch. The tab switcher is the only path and it's visually understated.
- **Evidence:** Pattern matching to high-converting SaaS pages — almost all show a "Don't have an account? Sign up" or equivalent prose link below the submit button.
- **Severity:** FRICTION. Specifically hurts returning visitors who land on the wrong tab.

### B.5 [FRICTION] "No credit card" reassurance only in hero microcopy

- **Hypothesis:** By the time a user scrolls to Pricing, they've forgotten the "no credit card" line. Cold-skim from Pricing card sees CHF 0 but no payment-info reassurance. Some bounce on assumption of "they'll ask for a card eventually."
- **Evidence:** Standard SaaS pattern is to repeat the reassurance on the pricing card itself.
- **Severity:** FRICTION. Small but cumulative.

### B.6 [FRICTION] /how-it-works was 401-redirecting until ~30 min ago

- **Hypothesis:** Any visitor who clicked the new "See backtests" CTA between deploy of commit `0f74bfe` and `3c3851c` hit a `/login` redirect. That's potentially ~30 min of the analytics window for the new CTA. Confounds the "what's working" reading.
- **Evidence:** Middleware fix shipped as `3c3851c` after analytics snapshot was likely taken.
- **Severity:** FRICTION (temporal, now resolved). Worth noting so we don't over-correct on the next analytics read.

### B.7 [POLISH] Advisor CTAs skip the T&C acceptance gate

- **Hypothesis:** Anyone clicking "Get Advisor" from the landing pricing card lands on `/login`, not the Advisor T&C disclaimer that's required before checkout. They'll hit the gate later via UpgradeModal, but the FIDLEG defense is weaker than it could be — the landing page itself never surfaces the gate.
- **Evidence:** `components/Landing*.tsx` Advisor CTAs all `href="/login"`. The gate logic only lives in `UpgradeModal.tsx`.
- **Severity:** POLISH for conversion (won't fix funnel), legal-defense IMPROVEMENT (regulator screenshot of landing → no gate → arguably weaker than ideal). Worth bundling with the rest of the fix.

---

## SECTION C — Fix Proposal (ranked by impact)

Each item has expected impact assuming current `/` → `/login` funnel is the main leak.

### C.1 [SHIP IMMEDIATELY — 10 min] Fix the signup tab routing + add /register vanity route

**Files:**
- `app/login/page.tsx` — read `useSearchParams()`, init `tab` state from `?tab=signup`
- `app/register/page.tsx` (new) — `redirect('/login?tab=signup', 'permanent')`
- `middleware.ts` — add `/register` to `isPublicPage`
- `components/Landing.tsx` — change every "Start free / Create your account" `href="/login"` → `href="/login?tab=signup"`
- `components/LandingClient.tsx` — change Free / Pro / Advisor CTA `href="/login"` → `href="/login?tab=signup"` (with `&plan=pro` etc. as future-ready hooks, even if we don't wire them yet)

**Before:** "Start free" → /login (Sign In tab) → user has to switch tab → bounce risk
**After:** "Start free" → /login?tab=signup → form ready to fill

**Expected impact:** +10–25% on landing→form-submit conversion. Single biggest lever in this audit.
**Time:** 10 minutes.

### C.2 [HIGH — 15 min] Add "Don't have an account? Create one →" prose link on /login

**Files:** `app/login/page.tsx`

**Before:** Tab switcher only.
**After:** Below the submit button — context-aware prose link:
- On Sign In tab: "Don't have an account? **Create one →**"
- On Create Account tab: "Already have an account? **Sign in →**"

Clicking flips the tab without a page reload.

**Expected impact:** +3–8% on form completion (recovers users who landed on wrong tab).
**Time:** 15 minutes.

### C.3 [HIGH — 20 min] Rewrite H1 with a specific differentiator

**Files:** `components/Landing.tsx`

**Before:** "Institutional-grade portfolio analytics. Retail price."

**Three variants to A/B (pick one for v1):**

- **Variant A (differentiator-first, recommended):**
  "Markowitz, Sharpe, and stress tests — **on your actual ZKB depot.**"
  *(matches `/how-it-works` hero, reinforces a single brand voice across pages)*

- **Variant B (identity-led):**
  "The portfolio tool your quant friend uses."
  *(more memorable, less differentiation)*

- **Variant C (current + tweak):**
  "Institutional-grade portfolio analytics for your **ZKB and Yuh positions.**"
  *(minimal change, adds the Swiss-broker hook)*

Keep current subheadline and microcopy.

**Expected impact:** +5–15% on time-on-page and `/` → `/login` click-through from skim-driven arrivals (specifically the Swiss-engineer ICP who already searches in those terms).
**Time:** 20 minutes (write + ship).

### C.4 [MEDIUM — 10 min] Repeat "No credit card · Free forever" on the Free pricing card

**Files:** `components/LandingClient.tsx`

**Before:** Free card says "Forever free" only.
**After:** Add a small mono-font line under the price: "No credit card · Free forever for tracking."

Cosmetically minimal, reassurance-strong at the moment of decision.

**Expected impact:** +2–5% on pricing-section → CTA click-through.
**Time:** 10 minutes.

### C.5 [MEDIUM — 15 min] Add a "Don't have an account?" pattern + autofocus the Email field

**Files:** `app/login/page.tsx`

- On the Create Account tab, autofocus the Name field on mount.
- On the Sign In tab, autofocus the Email field on mount.
- Use `autoFocus` prop, no JS gymnastics.

**Expected impact:** marginal on conversion, meaningful on time-to-submit. Polish-tier.
**Time:** 15 min.

### C.6 [LOW — defer] Wire `?plan=pro|advisor` query param into /login → post-signup auto-checkout

This is genuinely valuable but a bigger lift (needs Supabase auth-state-change listener that reads the param after email-confirm and triggers Stripe checkout). Defer to a separate session — it's a 1–2 hr build, not a 15-min fix.

### C.7 [LOW — defer] Surface Advisor T&C accept-gate on the landing Advisor CTA

Two paths:
- (a) Open `UpgradeModal` inline on landing instead of routing to `/login`. Cleanest UX, decent lift.
- (b) Add an interstitial `/advisor-signup` page that shows the gate before sending to `/login?tab=signup&plan=advisor`. Worse UX.

Recommend (a), but it requires lifting `UpgradeModal` out of its Dashboard-only context. ~1 hr. Defer.

---

## SECTION D — What NOT to Change

These are working and changing them risks regression:

1. **`/opengraph-image` (purple gradient OG card)** — verified live, branded, used by WhatsApp/LinkedIn previews. Don't touch.
2. **Status pill: "Built in Switzerland · for self-directed investors"** — strong trust signal for the ICP. Keep.
3. **Stats strip (6+ Risk metrics · 3 Swiss brokers · 7 Currencies · ±0.2% FX accuracy)** — numbers-over-adjectives, exactly right for the ICP. Keep.
4. **About / The Team section with founder bio + "skin in the game" framing** — turns the 18-year-old-solo-founder fact from a liability into a credibility lever. Don't soften it.
5. **3-tier pricing table on the landing itself (not behind login)** — already correct; don't move it behind a CTA.
6. **`data-tier` cascade via `--accent*` tokens in `app/globals.css`** — the Pro gold / Advisor purple flow that makes the tiers feel like distinct products. Don't break it.
7. **`ADVISOR_TERMS_VERSION = v1.1-2026-05-16` cross-references** — every legal surface ties to this constant. Don't hardcode the string anywhere new.
8. **FIDLEG-compliant language already in place** — "From CHF 0", "Markowitz frontier", "Stress test", "Cancel anytime", "No refunds on partial periods". No "you would have earned", no "guaranteed returns", no imperatives. Don't regress.
9. **"Sign in" nav button gradient** — clear primary action, well-balanced against the secondary nav links. Don't downgrade.
10. **`Reveal` + `lp-blob` ambient styling** — the brand-defining visual polish. Don't strip in the name of "minimalism".

---

## Recommended execution order

1. **Now (10 min):** Ship C.1. Single-commit fix. Resolves the structural leak.
2. **+1 hour:** Ship C.2 + C.4 together. Both `/login` cosmetic, low risk.
3. **+1 day:** Ship C.3 (H1 rewrite). Wait long enough to read C.1's impact on analytics first.
4. **Next session:** Tackle C.6 + C.7 as a planned 2-hour block, or defer until paying users > 5.

Total surface area for C.1–C.5: ~70 minutes of focused work. Expected aggregate funnel lift: +20–50% on landing→form-submit.

---

**Awaiting caveman feedback. Say `ship C.1` to fire the immediate fix, or `build` to do C.1–C.5 in one bundled PR.**
