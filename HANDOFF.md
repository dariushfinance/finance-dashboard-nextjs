# HANDOFF — Quantfoli (Sessions 8 → 10)

**Date last touched:** 2026-05-17
**Branch:** `main`
**Last commit:** `7e33e72` — universalise hero H1, keep Swiss specificity in subhead
**Deployment:** Vercel auto-deploys from `main`. Live at https://quantfoli.com / https://www.quantfoli.com
**DNS:** Cloudflare (nameservers `adrian.ns.cloudflare.com`, `norm.ns.cloudflare.com`). Migrated in session 8.
**Owner:** Dariush Tahajomi (`dariush.tahajomi@gmail.com`), 18, HSG St. Gallen 2027, Einzelunternehmen in Schaffhausen.

> Read this file end-to-end before touching anything. Older session content (1–7) is in git history. Sessions 8 + 9 + 10 all happened on 2026-05-17 and are documented below in execution order.

---

## 1. What Quantfoli is

A Swiss-focused portfolio analytics SaaS for self-directed investors.

**Stack:** Next.js 14 (App Router) · TypeScript · Supabase (Postgres + Auth) · Stripe · Vercel (Frankfurt) · Resend (transactional email) · Cloudflare (DNS) · Sentry (error monitoring, dormant)

**Tiers:**
- **Free** — CHF 0: tracker, EOD prices (Yahoo Finance), S&P 500 benchmark, Swiss broker CSV import, multi-currency display.
- **Pro** — CHF 15/mo · CHF 150/yr (≈17% off). Markowitz frontier, stress tests, full risk metrics.
- **Advisor** — CHF 50/mo · CHF 500/yr. Pro + monthly walk-forward report on user's actual portfolio.

**Defensible differentiator:** Markowitz frontier + historical stress test + Sharpe/Sortino/Beta/Alpha on top of FX-aware ZKB/Yuh/Neon CSV imports, accurate to ±0.2% vs. the broker statement. No Swiss retail competitor ships this combo.

**Real ICP:** engineer/quant-adjacent Swiss male, 30–55, six-figure portfolio at ZKB/Yuh, technically literate, frustrated by Swiss bank reporting. Mom is the "designed first user" for usability — NOT product-market fit.

**Owner legal status:** Einzelunternehmen Schaffhausen. Not registered in Handelsregister (only required > CHF 100k turnover/year). Not MWST-registered. Currently invisible to FINMA — at current scale (1–2 paying users) no regulatory action is realistic.

---

## 2. The big picture goal of this work block

The further-instructions doc (`C:/AI_System/further instructions.txt`) defined two deliverables for sessions 9–10:

- **PRIORITY 1** — Spec + ship `/how-it-works`, a backtesting landing page that uses honest walk-forward backtests as the central marketing artifact. Methodology IS the marketing.
- **PRIORITY 2** — `docs/MARKETING_PLAN.md` scaffolding doc (mostly empty tables for Dariush to fill in via his own research; Claude in advisory role afterwards).

**Status:** Priority 1 is fully shipped + live. The signup funnel that feeds it was diagnosed as broken (audit doc `docs/LANDING_AUDIT.md`) and fix items C.1–C.5 are all shipped + live. Priority 2 has NOT been started yet — that's the immediate next deliverable.

---

## 3. Session 10 (2026-05-17 evening) — Landing-page audit + signup-funnel fix

### What triggered it

Dariush dropped fresh Vercel Analytics (last 24h, ~540 visits): 70% Swiss, top pages `/` (292) + `/login` (209), `/register` NOT in top pages (<20 visits). Asked for a landing audit with diagnosis + fix proposal before any code change.

### Audit output

`docs/LANDING_AUDIT.md` written first, no code. Sections:
- A — current hero / signup UX / value-prop / pricing state
- B — 7 hypotheses ranked BLOCK / FRICTION / POLISH with evidence
- C — 7 fixes ranked by impact + time
- D — 10 things working that should NOT be touched

**The critical finding (top of audit):** `/register` doesn't exist as a route AT ALL. Codebase has zero `/register` references. AND every signup-intent CTA on the landing routes to `/login`, which defaults to the Sign In tab — so a first-time visitor clicking "Start free" lands on a sign-in form they cannot use. Three extra clicks before the form is even fillable. That was the structural leak the analytics were measuring.

### Fixes shipped

| Commit | Fix | Scope |
|---|---|---|
| `b563343` | **C.1 — signup funnel** | `?tab=signup` query param → init tab; new `app/register/page.tsx` permanent-redirects to `/login?tab=signup`; middleware allows `/register`; all 5 "Start free / Create your account / Get Pro / Get Advisor" CTAs across `Landing.tsx` + `LandingClient.tsx` now use `/login?tab=signup` (pricing cards also append `&plan=pro` / `&plan=advisor` as future hooks). |
| `cb1be91` | **C.2–C.5 — polish** | Prose tab-switcher link below submit button ("Don't have an account? Create one →" / "Already have an account? Sign in →"), `autoFocus` on Email (Sign In tab) and Name (Create Account tab), Free pricing card gets green mono reassurance "No credit card · No trial expiry". |
| `cb1be91` | **C.3 — first H1 swap** | Tried "Markowitz, Sharpe, and stress tests — on your actual ZKB depot." (matched `/how-it-works` hero). |
| `7e33e72` | **H1 swap #2** | Dariush pushed back — too narrow for non-CH traffic, arbitrary among the 3 importers. Swapped to **"The portfolio tool your quant friend uses."** Subhead carries the Swiss specificity: "Institutional-grade analytics on your actual ZKB, Yuh or Neon positions. FX-aware to ±0.2%. Six risk metrics, one efficient frontier, four crisis stress tests. From CHF 0." `/how-it-works` keeps its ZKB-specific hero (deeper funnel, specificity helps). |

### Items in the audit deferred to a later session

- **C.6** — Wire `?plan=pro|advisor` query param into a post-signup auto-checkout flow. Needs a Supabase auth-state-change listener that reads the param after email-confirm and triggers Stripe checkout. ~1–2 hour build, deliberately deferred.
- **C.7** — Surface the Advisor T&C accept-gate from `UpgradeModal.tsx` on the landing-page Advisor CTA. Cleanest path is to open `UpgradeModal` inline from landing (requires lifting it out of its Dashboard-only context). ~1 hour, deferred.

### What to watch in analytics over the next 24–48h

- `/` → `/login` click-through rate (should stay ~70%+)
- `/register` appearing in top pages (proves the vanity route is catching real direct/bookmark traffic)
- Drop in `/login` bounce rate (proxy for "landed on wrong tab" leak being fixed)
- If you want hard conversion numbers, instrument a `signup_submit` event in `/login/page.tsx` next — Vercel Analytics supports `track()` calls.

---

## 4. Session 9 (2026-05-17 daytime) — Backtesting landing page

### What was built

`/how-it-works` — a fully server-rendered Advisor-purple page that uses honest walk-forward backtests as marketing. Spec was approved first (`docs/BACKTESTING_LANDING_PAGE.md`), then code shipped in one bundled commit (`cbf10de`).

### Engine layer (`lib/backtest/`)

| File | Purpose |
|---|---|
| `universe.ts` | Curated SMI large-caps (NESN, NOVN, ROG, UBSG, ZURN, ABBN) + Swiss-broker-accessible UCITS ETFs (VWRL, CSPX, EUNL, EIMI, AGGH, AGGG) + benchmark indices. Each annotated with `firstTrade` date and `domicile` for stamp-duty (CH = 0.15%, foreign = 0.30%). |
| `data.ts` | `loadHistoricalPrices()` wrapping `lib/yahoo.ts` `getHistoricalPrices()` with a 7-day disk JSON cache at `data/backtests-cache/` (gitignored). Single chokepoint: `pricesBefore(frame, ticker, asOf)` is the only function the engine uses to read history. |
| `costs.ts` | `tradeCost`, `entryCost`, `rebalanceCost`. Constants: 0.50% commission + 0.10% spread + 0.15% (CH) / 0.30% (foreign) stamp duty per leg, 0.50% FX spread (currently unused — placeholder for v2). Cited in file header; if numbers change, update `docs/BACKTESTING_LANDING_PAGE.md` §B.3 in the same commit. |
| `engine.ts` | `runWalkForward()`. Mulberry32 deterministic RNG (seed: 42 default). Markowitz Monte Carlo solver (private copy — does NOT reuse `app/api/frontier/route.ts` to keep request paths uncoupled). Lookahead-bias runtime assertion + comment block at top of file. |
| `engine.test.ts` | 13 tests. Two lookahead-bias regression tests: weak (shift in-window prices, output MUST change) + strong (mutate only post-`endDate` prices, output MUST be identical). Determinism, cap correctness (incl. infeasible-cap fallback), cost-model sanity. |
| `fidleg-lint.test.ts` | Walks every `.tsx` under `app/how-it-works/` and `components/backtest/`, fails on forbidden prescriptive phrasing. Allow-list via `// eslint-allow-fidleg: <reason>`. Plus disclaimer-presence + `ADVISOR_TERMS_VERSION` wiring assertion. |

### Generation scripts (`scripts/`)

| File | Purpose |
|---|---|
| `build-backtests.ts` | Runs 3 sample portfolios (Conservative 60/40, Growth ETF, Concentrated SMI) through the engine and writes `public/backtests/{conservative,growth,concentrated,aggregate}.json`. Run with `npm run build:backtests`. |
| `verify-backtest-jsons.ts` | Re-derives aggregate from per-portfolio JSONs, fails on drift. **Wired into `npm run build`** as a precheck — `next build` will not start if the aggregate is stale. |

### Page + components

| File | Purpose |
|---|---|
| `app/how-it-works/page.tsx` | Server component, `<main data-tier="advisor">` for the purple `--accent*` cascade. Hero (chart of concentrated portfolio), methodology section, screenshot-quotable aggregate-stats block with copy-link button, three sample-portfolio cards, dual Pro/Advisor CTA, disclaimer importing `ADVISOR_TERMS_VERSION` from `lib/advisor-terms.ts`. |
| `app/backtests/page.tsx` | 308 permanent redirect to `/how-it-works` (SEO-tight alias). |
| `app/how-it-works/[portfolio]/page.tsx` | Permalink → redirects to `/how-it-works#portfolio-<id>`. |
| `app/how-it-works/opengraph-image.tsx` | OG card showing the actual headline aggregate stat ("+Sharpe in X% of N quarters"), not generic branding. Pattern matches `app/opengraph-image.tsx`. |
| `app/how-it-works/[portfolio]/opengraph-image.tsx` | Per-portfolio OG card. |
| `components/backtest/HeroChart.tsx` | Client island. Recharts NAV line chart with model + 2 benchmarks, rebalance reference lines, hover tooltip in mono font matching `FrontierChart.tsx`. |
| `components/backtest/SamplePortfolioCard.tsx` | Server component. Verdict badge (won / tied / underperformed) derived from wins% AND median Sharpe Δ. Median printed next to mean. One-line "Why:" explanation per portfolio passed in from the page. |
| `components/backtest/CTACards.tsx` | Reuses `PRO_INTERVALS` / `ADVISOR_INTERVALS` from `lib/stripe.ts`, hits existing `/api/stripe/checkout` + Advisor `/api/advisor/accept-disclaimer` endpoints. Don't duplicate logic. |
| `components/backtest/Disclaimer.tsx` | Mobile-collapsible. Imports `ADVISOR_TERMS_VERSION`. LocalStorage key `quantfoli:backtest-disclaimer:dismissed`. |
| `components/backtest/CopyLinkButton.tsx` | Clipboard copy with `window.prompt` fallback. |

### Honesty patch (during session 9, after Dariush reviewed)

First version of `SamplePortfolioCard.tsx` framed a 45%-win, ending-NAV-below-starting-allocation result as net-positive ("Model improved Sharpe in 45% of measured periods · mean Sharpe delta +0.027"). Dariush called it out — that violated `docs/BACKTESTING_LANDING_PAGE.md` §D ("acknowledge limits openly").

Fixed in the same commit:
- Per-card verdict badge with three states.
- Opening sentence flips based on verdict — never leads with "wins in X%" when wins < 50%.
- Median Sharpe Δ printed alongside the mean.
- One-line "Why:" explanation per portfolio. Concentrated SMI's "Why" explicitly upsells the Advisor diagnostic ("the report flags exactly this kind of structural concentration").
- Advisor CTA copy: "Monthly walk-forward report: what the model computes on your portfolio — and, just as importantly, where it doesn't help and why."

### Numbers that landed on the page

66 pooled rebalances (3 portfolios × 22 each), 2019-06 → 2024-12:
- Vs. equal-weight: **+Sharpe in 56% of quarters**, mean Δ +0.022.
- Vs. starting allocation: 47% of quarters, mean Δ +0.029.
- Concentrated SMI: model **loses** (45% wins, ending NAV 1.779 vs starting-allocation 1.812). Surfaced honestly with the "Model underperformed" badge.
- Conservative + growth portfolios: model wins. Page tells both stories.

### Nav + middleware fixes that followed

| Commit | Fix |
|---|---|
| `0f74bfe` | Added "How it works" nav link on the landing; replaced dead "See features" ghost CTA in the hero with "See backtests" → `/how-it-works`. |
| `3c3851c` | Middleware was gating `/how-it-works` and `/backtests` as auth-required, redirecting anonymous visitors to `/login`. Added both to the public-routes list. **Lesson: any new public route MUST be added to `middleware.ts` in the same commit.** |

---

## 5. Session 8 (2026-05-17 morning) — Infrastructure work (condensed)

Single commit `c53bb84` — full detail in git log. Summary:

- **SEO** — enriched `app/layout.tsx` metadata, new `app/sitemap.ts` + `app/robots.ts` routes, dynamic `app/opengraph-image.tsx` (purple gradient). `metadataBase`, OG with `en_CH` locale, Twitter `summary_large_image`.
- **Sentry** — SDK installed (`@sentry/nextjs ^10.53.1`), 3 configs (client, server, edge), `instrumentation.ts` runtime hook, `next.config.js` conditional `withSentryConfig` wrap. **Dormant** until `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_DSN` env vars set in Vercel.
- **Founder-notification email on Advisor signup** — `lib/resend.ts` generic helper, `app/api/webhooks/stripe/route.ts` checks `prevTier` BEFORE upsert to fire the notification exactly once per upgrade transition.
- **Cloudflare DNS migration** — 4 Resend records (DKIM TXT, SPF TXT, SPF MX, DMARC TXT) re-created in Cloudflare, nameservers switched in Namecheap. Resend domain verification went green.
- **Resend** — domain `quantfoli.com` verified, support form tested end-to-end, outbound sending live. `RESEND_API_KEY` set in Vercel Production. `RESEND_FROM` still pending — falls back to `onboarding@resend.dev` (rate-limited).

---

## 6. Current state of files Claude touched today

All committed unless flagged. Working tree should be clean except for `app/finances/` + `components/FinancesSheet.tsx` (deferred 3 sessions, NOT touched today).

### New this session

```
docs/
  BACKTESTING_LANDING_PAGE.md           Full spec, sections A–F. Approved before code.
  LANDING_AUDIT.md                      Diagnosis + 7 fixes ranked by impact.

lib/backtest/
  universe.ts                           Curated SMI + ETF + benchmark list w/ stamp-duty domicile
  data.ts                               7-day disk-cached price loader; pricesBefore() chokepoint
  costs.ts                              Swiss cost model (commission/spread/stamp duty/FX)
  engine.ts                             runWalkForward + lookahead guard + mulberry32 RNG
  engine.test.ts                        13 tests incl. weak + strong lookahead regression
  fidleg-lint.test.ts                   Forbidden-phrase scanner + disclaimer-presence

scripts/
  build-backtests.ts                    Generates 3 portfolio JSONs + aggregate.json
  verify-backtest-jsons.ts              Re-derives aggregate; fails on drift; wired into npm run build

public/backtests/
  conservative.json  growth.json  concentrated.json  aggregate.json   (22 rebalances each, 66 pooled)

app/
  how-it-works/page.tsx                          Main page
  how-it-works/opengraph-image.tsx               OG card w/ aggregate stat
  how-it-works/[portfolio]/page.tsx              Permalink → #anchor
  how-it-works/[portfolio]/opengraph-image.tsx   Per-portfolio OG card
  backtests/page.tsx                             308 → /how-it-works
  register/page.tsx                              308 → /login?tab=signup

components/backtest/
  HeroChart.tsx
  SamplePortfolioCard.tsx                Verdict badge + median Δ + "Why"
  CTACards.tsx                           Reuses /api/stripe/checkout + Advisor accept-disclaimer
  Disclaimer.tsx                         Mobile-collapsible w/ ADVISOR_TERMS_VERSION
  CopyLinkButton.tsx
```

### Modified this session

```
.gitignore                  + data/backtests-cache/
app/sitemap.ts              + /how-it-works @ priority 0.9
app/login/page.tsx          ?tab=signup query-param init (Suspense-wrapped), prose tab switcher, autoFocus
middleware.ts               + /how-it-works, /backtests, /register to public routes
components/Landing.tsx      Universal H1 + Swiss-specific subhead, /login?tab=signup CTAs, "How it works" nav, "See backtests"
components/LandingClient.tsx Free-tier "No credit card · No trial expiry" reassurance, all pricing CTAs → /login?tab=signup&plan=…
package.json                + tsx devDep, + build:backtests / verify:backtests scripts, npm run build now pre-verifies
package-lock.json
HANDOFF.md                  (this file)
```

### DO NOT TOUCH

| File | Why |
|---|---|
| `lib/yahoo.ts` | Portfolio + TWR + Beta/Alpha math. 36 passing tests guard the ±0.2% accuracy invariant. Wrap, don't modify. |
| `app/api/frontier/route.ts` | The engine deliberately keeps its own Markowitz copy in `lib/backtest/engine.ts` rather than reusing this route — keeps request paths uncoupled from the backtest path. |

### Uncommitted (Dariush's decision, deferred 3 sessions now)

| File | Status |
|---|---|
| `app/finances/page.tsx` | Untracked. Personal finances tracker page Dariush built in another session. |
| `components/FinancesSheet.tsx` | Untracked, 307 lines, client component. |

Next session: ask if these should be committed, and if so what auth gating (admin-only? Pro-only? public?).

---

## 7. Approaches tried this session that failed (and how they were fixed)

| Attempt | Why it failed | Resolution |
|---|---|---|
| `randomWeights` with `effectiveCap = Math.max(cap, 1/n)` + safety renormalize at end | When cap × n < 1 the cap is mathematically infeasible. My renormalize broke the cap invariant (e.g. for n=3, cap=0.30 it produced weights with values up to 0.36). | Special-cased the infeasible branch to return uniform `[1/n, ...]` directly. Feasible branch removed the safety renormalize; the iterative cap loop is correct on its own. |
| First lookahead-bias test: shift input series by dropping row 0 | Dropping row 0 doesn't change anything within the lookback window (last 504 trading days before T). Engine output stayed identical → test failed → made it look like a lookahead leak when there wasn't one. | Replaced with two tests. **Weak guard:** shift closes forward by one trading day within the lookback window — output MUST change. **Strong guard:** mutate only prices strictly AFTER `endDate` — output MUST be bit-identical. The strong guard is the canary. Do NOT weaken it. |
| `/how-it-works/opengraph-image` as default `runtime = 'nodejs'` at build time | `next build` failed with "Invalid URL" from `@vercel/og` when prerendering on the Node runtime. The `fs.readFile` of aggregate.json works at request time but not at build time. | Added `export const dynamic = 'force-dynamic'` to both OG image routes. Vercel edge-caches at request time, so no per-pageview compute cost. |
| First H1 rewrite: "Markowitz, Sharpe, and stress tests — on your actual ZKB depot." | Too narrow. ZKB is one of 3 supported importers — arbitrary to name one. 30% of analytics traffic is non-Swiss. Also locks the H1 in for a market expansion you can't yet serve. | Moved specificity to subhead ("ZKB, Yuh or Neon positions") and made H1 universal: **"The portfolio tool your quant friend uses."** (Variant A from `BACKTESTING_LANDING_PAGE.md` §F.) `/how-it-works` keeps the ZKB-specific hero because by then visitor has self-selected. |
| First version of sample-portfolio card copy | Framed a 45%-win, ending-NAV-below-starting-allocation result as net-positive. Violated `docs/BACKTESTING_LANDING_PAGE.md` §D ("acknowledge limits openly"). | Added verdict badge (won / tied / underperformed), median Sharpe Δ alongside mean, opening sentence flips based on verdict, one-line "Why:" explanation per portfolio. Concentrated SMI's "Why" upsells the Advisor diagnostic. |
| `/how-it-works` shipped without adding it to `middleware.ts` public routes | Middleware redirected anonymous visitors to `/login` — exactly the wrong behavior for a marketing page. Caught by Dariush within minutes of going live. | Added `/how-it-works` + `/backtests` to public routes in `3c3851c`. **Process lesson:** every new public route MUST land in `middleware.ts` in the same commit as the route. |
| Discovered `/register` didn't exist as a route, AND every signup CTA on landing routed to `/login` Sign In tab | Found during landing audit. First-time visitors clicking "Start free" landed on a sign-in form they couldn't use. Structural funnel leak invisible in pageview analytics. | Shipped C.1: `?tab=signup` query-param init, new `/register` vanity route (permanent redirect), middleware whitelist, all signup CTAs flipped to `/login?tab=signup` with `&plan=…` future hooks. |

**Approaches from prior sessions that are still relevant (not re-tried today):**

- Putting demo MP4 (~81 MB) into the repo — still deferred.
- Action-shaped Advisor wording — corrected in session 7, do not regress.
- End-to-end Advisor testing with real money — refunded last time, **never repeat in live mode**.

---

## 8. Current production state

### 8.1 Stripe — ✅ live (no change)

Free / Pro M (CHF 15) / Pro Y (CHF 150) / Advisor M (CHF 50) / Advisor Y (CHF 500) all live with verified env vars. Customer Portal cancel works. Refund works. Webhook handler sends founder notification on Advisor transition.

### 8.2 Resend — ✅ live

Domain `quantfoli.com` verified. DKIM + SPF + DMARC green. Sending live. **`RESEND_FROM` still pending** in Vercel — falls back to `onboarding@resend.dev` (rate-limited, unbranded).

### 8.3 Sentry — ⚪ dormant

SDK installed, configs gated on DSN env vars. Activate by adding `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_DSN` in Vercel + redeploy (5 min).

### 8.4 SEO — ✅ live + extended

`/sitemap.xml`, `/robots.txt`, `/opengraph-image` all live. **New since session 8:** `/how-it-works` in sitemap @ priority 0.9, `/how-it-works/opengraph-image` (headline aggregate stat), per-portfolio OG cards. **Pending Dariush action:** submit sitemap to Google Search Console + Bing Webmaster Tools.

### 8.5 Supabase — unchanged

`20260516_advisor_tier_and_disclaimer.sql` applied. `user_tiers` CHECK allows `'free' | 'pro' | 'advisor'`. `advisor_disclaimers` table exists with RLS.

### 8.6 Backtest infrastructure — ✅ live (new this session)

`/how-it-works` server-renders 3 sample portfolios with verdict badges. `npm run build` pre-verifies aggregate.json against per-portfolio JSONs. `npm run build:backtests` regenerates everything when needed.

### 8.7 Signup funnel — ✅ fixed (new this session)

`?tab=signup` deep-link works, `/register` vanity route catches direct/bookmark traffic, all landing CTAs land users on the right tab. Prose switcher recovers wrong-tab landings. Autofocus on Email / Name reduces click count.

---

## 9. Environment variables — full reference

### 9.1 Required for production (set in Vercel)

| Var | What |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key (webhook uses for auth.admin.getUserById + bypassing RLS) |
| `STRIPE_SECRET_KEY` | Stripe server-side |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client-side |
| `STRIPE_PRO_PRICE_ID` / `STRIPE_PRO_YEARLY_PRICE_ID` | CHF 15 / 150 |
| `STRIPE_ADVISOR_PRICE_ID` / `STRIPE_ADVISOR_YEARLY_PRICE_ID` | CHF 50 / 500 |
| `RESEND_API_KEY` | Resend transactional email |

### 9.2 Recommended add — `RESEND_FROM` (still pending from session 8)

```
RESEND_FROM=Quantfoli Support <support@quantfoli.com>
```

Without this, both `app/api/support/route.ts` and `lib/resend.ts` use the `onboarding@resend.dev` fallback.

### 9.3 Optional — Sentry (currently unset)

| Var | When |
|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | Activates client-side error capture |
| `SENTRY_DSN` | Activates server + edge error capture |
| `SENTRY_ORG` + `SENTRY_PROJECT` + `SENTRY_AUTH_TOKEN` | Activates source-map upload |

---

## 10. Outstanding blockers / known issues

| Severity | Issue | Where to fix |
|---|---|---|
| 🟠 | `RESEND_FROM` not set in Vercel | Add env var → redeploy (5 min) |
| 🟠 | No welcome email on signup | `lib/resend.ts` is unblocked, this is shipping-ready (~30 min) |
| 🟡 | No error monitoring active | Activate Sentry (5 min, Dariush action) |
| 🟡 | No conversion-event analytics | `track('signup_submit')` in `app/login/page.tsx` after a successful `supabase.auth.signUp()` would give real funnel numbers. ~15 min. |
| 🟡 | `/how-it-works` + `/register` not submitted to Google Search Console | DNS TXT verification → submit sitemap (5 min) |
| 🟡 | Untracked finances files | Ask Dariush, commit or remove |
| 🟡 | Untested I/O code in `lib/yahoo.ts` | `vi.mock('fetch')` when next refactored |
| 🟡 | Markowitz frontier uses historical means as forward expected returns | Long-term: shrinkage estimator (Ledoit-Wolf / James-Stein) |
| 🟡 | RLS not strictly enforced on `portfolio` / `user_tiers` (frontend-only Pro gating) | Harden before scaling > ~10 paying users |
| 🟢 | McAfee WebAdvisor flags `quantfoli.com` as "not verified" on Dariush's machine | Submit to TrustedSource for re-categorisation (3–7 day review) |
| 🟢 | Stripe customer-support phone is `+41 000 000 0000` placeholder | Replace with real number before scaling |
| 🟢 | DMARC `p=none;` (monitoring only) | Tighten once email volume grows |

---

## 11. Next concrete steps for next session (in priority order)

### 11.1 Read the funnel impact (24–48h after deploy)

Open Vercel Analytics. Specifically check:
- `/register` should now appear in top pages (proves vanity route is catching real traffic).
- `/login` arrival → form-submit rate (if instrumented). If not yet, add `track('signup_submit')` to `app/login/page.tsx` first.
- `/how-it-works` visit count.
- `/` → `/how-it-works` click-through.

If the new H1 underperforms after 48h, swap to Variant B "See your portfolio the way a quant would." (Variant C — ZKB-specific — already ruled out as too narrow for the non-CH audience.)

### 11.2 Marketing scaffolding doc — `docs/MARKETING_PLAN.md` (PRIORITY 2 from further-instructions)

Now that the backtest landing page is live AND the funnel is fixed, the further-instructions doc says this is the next deliverable. Spec details in `C:/AI_System/further instructions.txt`. Key points:

- Scaffolding only — empty tables for Dariush to fill with his own research.
- Section A — UGC strategy (TikTok + Instagram, Higgsfield AI for B-roll, Remotion for programmatic video).
- Section B — 7 personas (Marc, Sarah, Patrick, Thomas, Lukas, Andreas, Michael). Provide structural template; leave content fields empty with `[HYPOTHESIS — TO BE VALIDATED]` markers.
- Section C — Research sources (BfS, SNB, Moneyland, Schwiizerfranke, Mustachian Post, Reddit r/SwissPersonalFinance) + search strings. Research log table per persona, rows blank.
- Section D — Handoff back to Claude: "Once 5+ quotes per persona are collected, paste them here for pattern analysis."

DO NOT hallucinate persona quotes. Wait for Dariush to populate before writing analytical conclusions.

### 11.3 Decide `app/finances/` — commit (with what gating?) or remove

Deferred 3 sessions now. Just ask. If commit, decide auth gating (admin-only? Pro-only? public?).

### 11.4 Dariush actions still pending (5 min each)

- Set `RESEND_FROM` env var in Vercel.
- Activate Sentry — sign up at sentry.io, copy DSN, add `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_DSN` to Vercel.
- Submit sitemap to Google Search Console (DNS TXT verify via Cloudflare).
- Replace Stripe customer-support phone `+41 000 000 0000` with real number.

### 11.5 Future / backlog (defer until justified)

- **C.6 from `LANDING_AUDIT.md`:** wire `?plan=pro|advisor` post-signup auto-checkout (1–2 hr).
- **C.7:** open `UpgradeModal` inline on landing Advisor CTA (1 hr).
- Welcome email on signup (`lib/resend.ts` is ready; ~30 min).
- RLS hardening on `portfolio` + `user_tiers` once paying users > 10.
- `vi.mock('fetch')` tests for `lib/yahoo.ts` I/O functions.
- Markowitz frontier: shrinkage estimator (Ledoit-Wolf or James-Stein) replacing raw historical means.
- Email-based magic link signin (drop password requirement).
- Replace Alpha Vantage with Financial Modeling Prep ($14/mo). Revive Fundamentals tab.
- Annual revenue + LTV dashboard for Dariush's own use.
- Submit `quantfoli.com` to McAfee TrustedSource + Norton Safe Web.
- Swiss legal opinion on FIDLEG (~CHF 2–5k) once Advisor revenue > CHF 5k/mo.
- Automated Advisor report generation (Markdown template + Claude API) when Advisor subscribers > 3.
- Beraterregister registration when Advisor subscribers > 10–20.
- Tighten DMARC from `p=none;` to `p=quarantine` once email volume justifies.
- Refactor `app/api/support/route.ts` to use `lib/resend.ts` helper (currently duplicates fetch boilerplate).

---

## 12. Architecture quick-ref

```
/
├── app/
│   ├── page.tsx                          SERVER: auth check → <Landing /> or <Dashboard />
│   ├── layout.tsx                        Enriched SEO metadata
│   ├── sitemap.ts                        + /how-it-works @ priority 0.9
│   ├── robots.ts
│   ├── opengraph-image.tsx               Site-wide OG card (purple gradient, Quantfoli brand)
│   ├── login/page.tsx                    🔄 Suspense + useSearchParams + ?tab=signup + prose switcher + autoFocus
│   ├── register/page.tsx                 🆕 308 → /login?tab=signup
│   ├── support/page.tsx
│   ├── privacy/page.tsx
│   ├── terms/page.tsx
│   ├── advisor-legal/page.tsx
│   ├── how-it-works/page.tsx             🆕 Backtest landing — Advisor purple, hero, methodology, aggregate, 3 cards, CTA, disclaimer
│   ├── how-it-works/opengraph-image.tsx  🆕 Aggregate-stat OG card
│   ├── how-it-works/[portfolio]/page.tsx 🆕 Permalink → #anchor
│   ├── how-it-works/[portfolio]/opengraph-image.tsx 🆕 Per-portfolio OG card
│   ├── backtests/page.tsx                🆕 308 → /how-it-works
│   ├── finances/page.tsx                 ⚠️ Uncommitted, ignore for now
│   ├── globals.css                       --accent* tier tokens, [data-tier] overrides
│   └── api/
│       ├── support/route.ts
│       ├── advisor/accept-disclaimer/route.ts
│       ├── stripe/{checkout,portal,tier}/route.ts
│       ├── webhooks/stripe/route.ts      + founder notification on Advisor transition
│       └── portfolio/, history/, benchmark/, frontier/, stress/, risk/, fx/, isin/, fundamentals/
├── components/
│   ├── Dashboard.tsx                     data-tier theming
│   ├── Landing.tsx, LandingClient.tsx    🔄 Universal H1 + Swiss subhead, /login?tab=signup CTAs, Free-tier reassurance
│   ├── Footer.tsx
│   ├── UpgradeModal.tsx                  3-card layout + Advisor checkbox
│   ├── ProGate.tsx
│   ├── FrontierChart.tsx
│   ├── LegalLayout.tsx
│   ├── FinancesSheet.tsx                 ⚠️ Uncommitted, ignore for now
│   ├── backtest/                         🆕
│   │   ├── HeroChart.tsx                 Recharts NAV chart w/ rebalance markers
│   │   ├── SamplePortfolioCard.tsx       Verdict badge + median Δ + "Why"
│   │   ├── CTACards.tsx                  Reuses Stripe + Advisor accept endpoints
│   │   ├── Disclaimer.tsx                Mobile-collapsible, imports ADVISOR_TERMS_VERSION
│   │   └── CopyLinkButton.tsx
│   └── parsers UI: ZkbImport, YuhImport, NeonImport
├── lib/
│   ├── stripe.ts                         Tier type, PRICE_IDS, INTERVALS
│   ├── advisor-terms.ts                  ADVISOR_TERMS_VERSION = v1.1-2026-05-16
│   ├── resend.ts                         Generic email helper
│   ├── supabase.ts, supabase-browser.ts
│   ├── yahoo.ts                          ⚠️ DO NOT TOUCH — math
│   ├── yahoo.test.ts                     36 passing tests
│   ├── fx.ts, ticker-meta.ts
│   ├── parsers/{zkb,yuh,neon}.ts
│   └── backtest/                         🆕
│       ├── universe.ts                   SMI + ETF + benchmarks w/ domicile for stamp duty
│       ├── data.ts                       7-day disk cache wrapping lib/yahoo.ts, pricesBefore() chokepoint
│       ├── costs.ts                      Swiss cost model (commission/spread/stamp duty/FX)
│       ├── engine.ts                     runWalkForward + lookahead guard + mulberry32 RNG
│       ├── engine.test.ts                13 tests incl. weak + strong lookahead regression
│       └── fidleg-lint.test.ts           Forbidden-phrase scanner + disclaimer-presence
├── scripts/                              🆕
│   ├── build-backtests.ts                Generates 3 portfolio JSONs + aggregate.json
│   └── verify-backtest-jsons.ts          Re-derives aggregate; wired into npm run build
├── public/backtests/                     🆕 conservative/growth/concentrated/aggregate.json
├── docs/                                 🆕
│   ├── BACKTESTING_LANDING_PAGE.md       Full spec (sections A–F)
│   └── LANDING_AUDIT.md                  Diagnosis + 7 fixes (C.1–C.5 shipped, C.6/C.7 deferred)
├── data/backtests-cache/                 🆕 (gitignored) Price JSON cache, regenerable
├── supabase/migrations/
│   ├── 20260430_neon_transactions.sql
│   ├── 20260507_stripe_tiers.sql
│   └── 20260516_advisor_tier_and_disclaimer.sql
├── sentry.{client,server,edge}.config.ts DSN-conditional, dormant until env vars set
├── instrumentation.ts                    Sentry runtime hook
├── next.config.js                        Conditional withSentryConfig wrap
├── middleware.ts                         🔄 + /how-it-works, /backtests, /register public routes
├── vitest.config.ts
└── package.json                          🔄 + tsx devDep, + build:backtests / verify:backtests; npm run build pre-verifies
```

### Test + build commands

```bash
npm test                  # one-shot test run (51 tests: 36 yahoo + 13 engine + 2 FIDLEG)
npm run test:watch        # TDD mode
npm run build             # tsx scripts/verify-backtest-jsons.ts && next build
npm run build:backtests   # regenerate public/backtests/*.json
npm run verify:backtests  # check aggregate drift only
npm run dev               # localhost:3000
```

---

## 13. Personal + working-style context for the fresh agent

- **Dariush is 18**, Matura in 2026, HSG St. Gallen starting 2027. Tool is proof-of-competence for his LinkedIn network + future IB/quant/consulting internships, and might become a startup / side business.
- **Status:** Einzelunternehmen Schaffhausen. No formal registration required at current scale.
- **First paying user (Pro, CHF 15/mo)** in an earlier session. Yearly tier shipped in session 6. Advisor tier shipped in session 7. **No paying Advisor customer yet** — Dariush is on Advisor himself until 12.06.2026 as his own end-to-end test, then drops to Free.
- **Mom is the "designed first user"** for usability — NOT product-market fit. Real ICP per §1.
- **Autonomy granted.** No confirmations needed for code changes. **Pushes require explicit `push`** (he says it every time he wants a push).
- **Communication style:** brutally honest, terse, no fluff. Prefers reality checks over validation. Caveman feedback (`bad`, `too long`, `wrong`, `deeper`, `build`, `fix`, `push`, etc.) per `~/.claude/CLAUDE.md`.
- **Email canonical address:** `dariush.tahajomi@gmail.com`. Resend account email is `dtahajomi2007@gmail.com`. All transactional + support email lands at the canonical address.
- **Global rule:** load Obsidian brain at session start (`C:/AI_System/obsidian_vault/Obsidian/brain`). Mandatory per Dariush's global CLAUDE.md.
- **Caveman style applies to CHAT ONLY.** Files (this handoff, code, docs) are written in full structured prose. Code is always clean and production-grade.
- **Single bundled PR preferred over many small PRs** (confirmed in session 7, repeated in session 9 when shipping the backtest landing page as one commit).
- **No `// removed` comments, no backwards-compat shims, no dead code paths.** Delete completely.
- **Default to no code comments** — only the WHY when non-obvious. Multi-paragraph docstrings forbidden.

### Decisions made on Dariush's behalf this session (flag if any were wrong)

- Used **mulberry32 with seed=42** as the RNG for the Markowitz Monte Carlo. Determinism > "true randomness" for marketing-page reproducibility. If Dariush ever wants stochastic outputs that differ per pageview, change the seed source.
- Kept the **engine's Markowitz solver as a private copy** rather than extracting `app/api/frontier/route.ts` into a shared `lib/markowitz.ts`. Rationale: avoids regression risk on the live frontier API. Extract later if/when both code paths need to share a feature.
- Chose **static JSON output** (`public/backtests/*.json`) over an API route for sample-portfolio data. Faster page, deterministic, diff-visible in git. Add an API route in v2 only if "try-on-your-own-portfolio" needs server-side compute.
- **Verdict-badge thresholds**: wins ≥ 55% AND median > +0.02 → "won"; wins ≤ 45% OR median < −0.02 → "lost"; else "tied". Round-number heuristics, tune as needed once more portfolios are added.
- **H1 final wording:** "The portfolio tool your quant friend uses." (Variant A from spec §F). Universal hook, Swiss specificity moved to subhead. If a different variant tests better, swap in `components/Landing.tsx`.
- **`/register` redirects to `/login?tab=signup` permanently (308)** rather than serving its own signup page. Avoids duplicating the auth form. If you ever want a dedicated `/register` page, replace the redirect.

---

## 14. Files to read first if you're a fresh agent

In this order:

1. **`HANDOFF.md`** (this file)
2. **`docs/BACKTESTING_LANDING_PAGE.md`** — backtest page spec
3. **`docs/LANDING_AUDIT.md`** — landing-page audit + 7 fixes
4. **`lib/stripe.ts`** + **`lib/advisor-terms.ts`** — pricing data model + `ADVISOR_TERMS_VERSION`
5. **`lib/yahoo.ts`** + **`lib/yahoo.test.ts`** — math + regression suite (DO NOT MODIFY)
6. **`lib/backtest/engine.ts`** + **`engine.test.ts`** — walk-forward engine + lookahead guards
7. **`lib/backtest/{universe,data,costs}.ts`** — engine dependencies
8. **`app/how-it-works/page.tsx`** — landing surface composing everything
9. **`components/backtest/*`** — page components
10. **`scripts/{build-backtests,verify-backtest-jsons}.ts`** — output generation
11. **`app/page.tsx`** + **`components/Landing.tsx`** + **`components/LandingClient.tsx`** — main landing
12. **`app/login/page.tsx`** — signup funnel surface
13. **`middleware.ts`** — auth gate, public-routes list
14. **`app/api/webhooks/stripe/route.ts`** — full subscription lifecycle + founder notification
15. **`components/UpgradeModal.tsx`** + **`app/api/advisor/accept-disclaimer/route.ts`** — Advisor T&C flow
16. **`app/globals.css`** — design system + `--accent*` tier tokens
17. **`supabase/migrations/20260516_advisor_tier_and_disclaimer.sql`** — DB schema for Advisor

---

## 15. Memory references

Persistent memory in `~/.claude/projects/C--Users-Dariush-Tahajomi/memory/`:

- `user_profile.md` — Dariush context
- `project_obsidian.md` — Obsidian vault (referenced by global CLAUDE.md)
- `feedback_autonomy.md` — autonomous file ops granted, push requires explicit ask
- `feedback_tasks_format.md` — daily task file format (Obsidian, not this repo)
- `feedback_obsidian_links.md` — Obsidian backlink conventions
- `feedback_obsidian_permissions.md` — no confirmation prompts for Obsidian files

Global instructions in `~/.claude/CLAUDE.md`. Mandatory: load Obsidian brain at session start.

---

**End of handoff. Immediate pickup point for next session:**

1. **Load Obsidian brain** (mandatory per global CLAUDE.md).
2. **Read this file end-to-end.**
3. **Verify live deploys** — open `https://quantfoli.com` and `https://quantfoli.com/how-it-works` in incognito. Check the new H1 ("The portfolio tool your quant friend uses."), the "How it works" nav link, the green "No credit card · No trial expiry" line on the Free card. Click "Start free" — should land on Create Account tab with cursor in the Name field. Try `https://quantfoli.com/register` — should redirect to `/login?tab=signup`.
4. **Pull fresh analytics** if 24h+ have passed since `b563343` deployed — read funnel impact (§11.1).
5. **Start `docs/MARKETING_PLAN.md` scaffolding** (Priority 2 from further-instructions) — but ONLY scaffolding, no hallucinated persona quotes. Wait for Dariush to fill in research before writing analytical conclusions.
