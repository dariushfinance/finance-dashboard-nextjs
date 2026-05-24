# HANDOFF — Quantfoli (Sessions 8 → 14)

**Date last touched:** 2026-05-24
**Branch:** `refactor/unified-landing` (awaiting Dariush review + merge to `main`)
**Last commit:** session 14 work uncommitted at handoff time; spec in `docs/MERGE_ARCHITECTURE.md`
**Deployment:** Vercel auto-deploys from `main`. Live at https://quantfoli.com / https://www.quantfoli.com
**DNS:** Cloudflare (nameservers `adrian.ns.cloudflare.com`, `norm.ns.cloudflare.com`).
**Owner:** Dariush Tahajomi (`dariush.tahajomi@gmail.com`), 18, HSG St. Gallen 2027, Einzelunternehmen in Schaffhausen.
**LinkedIn:** https://www.linkedin.com/in/dariush-tahajomi-09348b370/

> Read this file end-to-end before touching anything. Sessions 1–7 in git history. Sessions 8–13 documented below Session 14.

---

## Session 14 (2026-05-24) — Unified Quantfoli landing · /portfolio prefix migration

### What was done

Quantfoli now hosts two products under one domain. The existing portfolio app moved under `/portfolio`. A new unified host landing at `/` introduces both Portfolio Analytics and Analysts Lens (Hugo's product, built later at `/learn`).

**Spec:** `docs/MERGE_ARCHITECTURE.md` — read this first.
**Auth migration:** `docs/AUTH_MIGRATION.md` — Supabase dashboard steps for Dariush, post-merge.

### Route changes

| Old | New |
|---|---|
| `/` (conditional Landing/Dashboard) | `/portfolio` (same pattern) |
| `/login`, `/register` | `/portfolio/login`, `/portfolio/register` |
| `/how-it-works`, `/how-it-works/[portfolio]` | `/portfolio/how-it-works/...` |
| `/blog`, `/blog/[slug]`, `/blog/sitemap.xml` | `/portfolio/blog/...` |
| `/backtests`, `/finances` | `/portfolio/...` |
| `/opengraph-image.tsx` | `/portfolio/opengraph-image.tsx` (and new root OG for unified landing) |

**Stays at root:** `/`, `/learn`, `/privacy`, `/terms`, `/support`, `/advisor-legal`, `/api/*`, `/sitemap.xml`, `/robots.txt`, `/opengraph-image`.

### Files touched

| Area | Files |
|---|---|
| New | `app/page.tsx` (unified landing), `app/learn/page.tsx` (placeholder), `app/opengraph-image.tsx` (new root OG), `docs/MERGE_ARCHITECTURE.md`, `docs/AUTH_MIGRATION.md` |
| Moved (git mv) | 14 files into `app/portfolio/` |
| URL rewrites | `middleware.ts`, `app/sitemap.ts`, `app/api/stripe/{checkout,portal}/route.ts`, `app/api/welcome/route.ts`, `app/portfolio/login/page.tsx`, `app/portfolio/register/page.tsx`, `app/portfolio/backtests/page.tsx`, `app/portfolio/blog/{page,[slug]/page,sitemap.xml/route}.tsx`, `app/portfolio/how-it-works/{page,opengraph-image,[portfolio]/opengraph-image}.tsx`, `app/portfolio/opengraph-image.tsx`, `components/{Landing,LandingClient,FinancesSheet}.tsx` |
| 301 redirects (legacy → new) | `next.config.js` `redirects()` array — `/how-it-works`, `/blog`, `/login`, `/register`, `/backtests`, `/finances` and slug variants |
| Design tokens | `app/globals.css` — added `--accent-pro`, `--accent-pro-soft`, `--accent-learn`, `--accent-learn-soft` (warm amber for Analysts Lens, placeholder until Hugo confirms) |
| Tests | `lib/backtest/fidleg-lint.test.ts` — `SCAN_ROOTS` updated to `app/portfolio/how-it-works` |

### Copy — FIDLEG review

`@agent-fidleg-reviewer` ran on the new landing copy before writing the page. 3 medium-risk violations flagged and fixed:
1. "institutional finance tools accessible" → "professional-grade finance tools accessible"
2. "analyst-grade" + "valuation mastery" → "professional-grade" + "valuation frameworks"
3. Bare "±0.2%" accuracy claim → "(historical accuracy ±0.2% on ZKB depot sample data)¹" + footnote "Past accuracy does not guarantee future precision."

Hero headline `Finance, built for the next generation.` is placeholder — Dariush + Hugo to refine.

### Verification

- `npm test` — 62/62 ✅ (no test count change; FIDLEG-lint passes against `app/portfolio/how-it-works`)
- `npm run build` — clean. New page count includes `/`, `/learn`, `/portfolio`, and all `/portfolio/*` subroutes.
- Manual smoke tests not yet run — see `docs/AUTH_MIGRATION.md` §5 for the post-deploy checklist Dariush should run.

### Manual steps required (Dariush, post-merge)

See `docs/AUTH_MIGRATION.md`. Summary:
1. Supabase Dashboard → Authentication → URL Configuration: Site URL `https://quantfoli.com/portfolio`; Redirect URLs add `https://quantfoli.com/portfolio/**`.
2. Stripe Dashboard: no change needed.
3. Google Search Console: re-submit sitemap.
4. Run smoke checklist.

### Branch status

`refactor/unified-landing` — all work committed locally, **not pushed**. Dariush to review, then either:
- `git push origin refactor/unified-landing` and open a PR for one final pass, OR
- `git checkout main && git merge --ff-only refactor/unified-landing && git push` to ship.

---

## Session 13 (2026-05-22) — SEO register route · Light mode landing · ETF FX fix · Welcome email

### What was requested / incident brief

Session started with a "production crash" brief claiming `components/Landing.tsx` had been overwritten with a naked login form. **This turned out to be inaccurate.** Audit confirmed Landing.tsx and `app/page.tsx` were both identical to `90ff00b` (the last known good commit). The actual issues were smaller and surgical.

### Actual bugs found and fixed

| # | File | Was | Fixed to |
|---|---|---|---|
| 1 | `app/register/page.tsx` | Bare `permanentRedirect('/login?tab=signup')`, no metadata. Google got a 308 with no title/description/canonical. | Exports `metadata` (German title, description, canonical). Changed to `redirect()`. Metadata is in prerendered HTML — Google reads it. |
| 2 | `components/Landing.tsx` line 153 | Hero "Start free" → `/login?tab=signup` (bypasses shadow SEO route) | → `/register` |
| 3 | `components/Landing.tsx` line 455 | Final CTA "Create your account" → `/login?tab=signup` | → `/register` |

### Light mode for landing page

The dashboard already had full light/dark toggle (`pi_theme` key in localStorage, `data-theme` on `<html>`). Landing page had no toggle — users who set light in dashboard would snap back to dark on the landing.

**Changes:**
- `components/LandingClient.tsx` — new `ThemeToggle` export. Reads `pi_theme` from localStorage on mount, sets `data-theme` on `<html>`, sun/moon icon button. Shares the same key as Dashboard.
- `components/Landing.tsx` — imports `ThemeToggle`, renders it in nav (between About and Sign in). Dot grid changed from hardcoded `oklch(1 0 0 / 0.025)` (white, invisible on light) to `var(--lp-dot)`.
- `app/globals.css` — `--lp-dot: oklch(1 0 0 / 0.025)` in `:root` (dark), `oklch(0 0 0 / 0.045)` in `[data-theme="light"]`.

All other landing page colors already use CSS tokens (`var(--bg)`, `var(--ink)`, `var(--line-soft)`) which the existing `html[data-theme="light"]` block overrides. No further changes needed.

### ETF FX bug fix (🔴 from session 12 audit)

**What was wrong:** `lib/backtest/engine.ts:periodReturns()` and `returnsMatrix()` combined daily returns of CHF, USD, and EUR assets as if they were the same currency. A Swiss-CHF investor's actual return on a USD asset is `(1 + r_usd)(1 + Δ_usdchf) − 1`. The Markowitz optimizer was also solving on native-currency Sharpe instead of CHF Sharpe.

**Affected portfolios:** Conservative 60/40 (VWRL.SW + AGGG.L) and Growth ETF (4 ETFs across CHF/USD/EUR). Concentrated SMI was pure-CHF and unaffected.

**Fix — new files and changes:**

| File | Change |
|---|---|
| `lib/backtest/fx.ts` | **NEW.** Fetches `USDCHF=X` and `EURCHF=X` from Yahoo with same 7-day disk-cache pattern as `data.ts`. Exports `loadFxRates(from, to)`, `buildFxDeltaMaps(fx)` (precomputes date→delta Maps for O(1) lookup), `toChfReturn(r, fxDelta)`. |
| `lib/backtest/engine.ts` | `WalkForwardParams` gains optional `currencyByTicker?: Record<string, string>` and `fx?: FxFrame`. Internal `applyFx()` helper. `returnsMatrix()` and `periodReturns()` both accept `ccyMap` + `fxMaps` — apply `(1+r)(1+Δfx)−1` per non-CHF ticker. Backwards compatible: omit both params = no FX conversion. |
| `scripts/build-backtests.ts` | Imports `loadFxRates` + `metaFor`. Loads FX once in `main()`, builds `currencyByTicker` from universe metadata per portfolio, passes both to `runWalkForward`. |
| `lib/backtest/engine.test.ts` | 2 new FX regression tests: (1) proves FX drag reduces CHF NAV when USD weakens (synthetic monotone series, no Yahoo needed); (2) proves pure-CHF portfolio is unaffected by FX layer. |
| `public/backtests/*.json` | Regenerated with FX-corrected numbers. |

**New headline numbers** (auto-displayed on `/how-it-works` from JSON):
- Was: +Sharpe in 56% of quarters, mean Δ +0.022
- Now: **+Sharpe in 64% of quarters, mean Δ +0.057**

Improvement is correct: Markowitz now optimizes on CHF Sharpe (the right objective), so it picks better weights from a Swiss investor's perspective.

**FIDLEG review post-fix:** `@agent-fidleg-reviewer` ran on the full `/how-it-works` surface. **PASS — zero violations.** Copy is metric-agnostic and relative; higher numbers don't create new risk. Preventive flag: if mean Δ ever exceeds +0.10 or wins >85%, re-run the reviewer.

### Welcome email

**What was built:**

| File | What |
|---|---|
| `app/api/welcome/route.ts` | **NEW.** POST endpoint. Rate-limited (3/IP/10min via `lib/rate-limit.ts`). Validates email format. Sends branded dark-themed HTML welcome email via `lib/resend.ts`. Non-fatal if Resend fails — signup already succeeded. |
| `app/login/page.tsx` | Fire-and-forget `fetch('/api/welcome', ...)` after successful `supabase.auth.signUp()`. Client-side, non-blocking, `.catch()` swallows failures silently. |

Email content: branded Q logo, firstName greeting, "confirm your email → import CSV → see the math" 3-step guide, legal footer. No FIDLEG-sensitive language.

**`RESEND_FROM` env var:** Dariush set in Vercel dashboard as `Quantfoli <support@quantfoli.com>`. This is now live — outbound email will send from the branded address instead of `onboarding@resend.dev`.

### LinkedIn link

Added to `components/Landing.tsx` founder/about section — LinkedIn icon + link below the "HSG St. Gallen '27 · Zurich" line. Points to https://www.linkedin.com/in/dariush-tahajomi-09348b370/

### Test count

62 tests passing (was 51 before this session — jump includes rate-limit tests from `98ad210` + 2 new FX tests).

### Build

40 pages (was 39 — new `/api/welcome` route). `npm run build` clean. `npm test` 62/62.

### Commits this session

Dariush pushed manually. Changes batched across multiple commits (exact hashes in git log). Working tree clean at end of session.

---

## Session 12 (2026-05-20) — Background-task batch (NO CODE CHANGES)

Sunday work block. No git pushes, no production code changes. All deliverables are spec/audit docs in `docs/`.

### Deliverables produced

| File | Type | Highlight |
|---|---|---|
| `docs/ETF_MATH_AUDIT.md` | 🔴 high-severity audit | Confirmed bug: backtest engine mixes CHF/USD/EUR daily returns without FX conversion. **Fixed in session 13.** |
| `docs/PROGATE_REDESIGN.md` §10 (v2 appended) | spec extension | Per-chart paywall pattern. 9 new CTA strings inventoried per chart (Risk R2/R3/R4, Stress S2-S5, Frontier F2/F3). `@agent-fidleg-reviewer` pre-pass done — 7/9 pass, 2 rewrites applied (R2 "Spot" → "Shows"; F3 "Suggested" → "Computed"). Table shippable. |
| `docs/DESIGN_AUDIT.md` | audit | Quantfoli vs. Linear/Vercel/Stripe. Highest-leverage finding: typography (drop Inter Tight, adopt Söhne or GT Walsheim Pro or free Public Sans as `--font-display`). Three-phase implementation plan. |
| `docs/FINYON_BRIEFING.md` | strategic briefing | Internal-only prep for Vollenweider meeting 2026-06-19. **Address discrepancy flagged:** Apollostrasse 2 is Zürich-Hottingen (Kreuzplatz, 8032), NOT Oerlikon (8050) — confirm 24-48h before meeting. |
| `docs/QUANTFOLI_RESEARCH_SOURCES.md` | persona research | Persona 1 (Marc, ZKB IT-Consultant) — 4 quotes filled. Sources blocked (403) limited yield. |
| `docs/content-ideas/2026-05-19-batch-2.md` | content brief | 20 ideas across 4 clusters. Top 3: FX-adjusted return reveal TikTok, Concentrated SMI 45%-win Mustachian thread, "66 real rebalances" LinkedIn post. |

---

## Session 11 (2026-05-19) — Onboarding audit + ProGate redesign + FIDLEG cleanup

### Key commits

| Commit | Scope |
|---|---|
| `f274cdb` | Hero subhead rewrite |
| `7c0eadb` | Blog colour fix + `app/finances/page.tsx` committed |
| `f58dcdd` | HANDOFF rewrite, `FinancesSheet.tsx` committed, 2 new agent definitions |
| `48e7154` | Blog: all article text set to pure white |
| `acbe3a9` | FIDLEG fix — StressTest, SamplePortfolioCard, how-it-works |
| `beb8656` | FIDLEG fix #2 — CTACards whyText + rebalancing copy |
| `ad28b62` | **Main deliverable:** ProGate redesign — blurred-preview pattern + free-tier headline metric. 51/51 tests passing, tsc clean. |

### ProGate redesign (ad28b62)

New ProGate API: `featureName`, `featureSubcopy`, `ctaLabel`, `headlineMetric`, `onUpgrade`, `children`. Layout: crisp headline metric at top, full content blurred behind, gold CTA overlay. Three new headline components: `RiskHeadline.tsx`, `StressHeadline.tsx`, `FrontierHeadline.tsx`. Dashboard wired. Free user with no positions: Upgrade sidebar hidden (E2 fix).

**Per-chart paywall refinement is still pending** — see sprint backlog below.

---

## Session 10 (2026-05-17 evening) — Landing-page audit + signup-funnel fix

Critical finding: `/register` didn't exist, all CTAs routed to `/login` Sign In tab. Fixed C.1–C.5.

| Commit | Fix |
|---|---|
| `b563343` | C.1 — `?tab=signup` param, `/register` redirect, middleware whitelist, all CTAs |
| `cb1be91` | C.2–C.5 — prose tab-switcher, autoFocus, Free card reassurance |
| `7e33e72` | H1 swap: **"The portfolio tool your quant friend uses."** |

---

## Sessions 8 + 9 (2026-05-17)

Session 8: SEO infrastructure, Sentry (dormant), Resend email, Cloudflare DNS migration.
Session 9: `/how-it-works` backtest landing page — full engine (`lib/backtest/`), 3 sample portfolios, scripts, components.

---

## 1. What Quantfoli is

Swiss-focused portfolio analytics SaaS for self-directed investors.

**Stack:** Next.js 14 (App Router) · TypeScript · Supabase (Postgres + Auth) · Stripe · Vercel (Frankfurt) · Resend (transactional email) · Cloudflare (DNS) · Sentry (error monitoring, dormant)

**Tiers:**
- **Free** — CHF 0: tracker, EOD prices, S&P 500 benchmark, Swiss broker CSV import, multi-currency display.
- **Pro** — CHF 15/mo · CHF 150/yr. Markowitz frontier, stress tests, full risk metrics.
- **Advisor** — CHF 50/mo · CHF 500/yr. Pro + monthly walk-forward report.

**Real ICP:** engineer/quant-adjacent Swiss male, 30–55, six-figure portfolio at ZKB/Yuh, technically literate, frustrated by Swiss bank reporting.

---

## 2. Outstanding blockers / known issues

| Severity | Issue | Status |
|---|---|---|
| 🟠 | Per-chart ProGate blur | Spec done (`docs/PROGATE_REDESIGN.md` §10). FIDLEG pre-pass done (9 strings, 2 rewrites applied). Code not yet written. |
| 🟠 | Google Search Console | `/sitemap.xml` live. DNS TXT verify via Cloudflare → submit sitemap. **Dariush action.** |
| 🟡 | Sentry activation | Add `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_DSN` to Vercel → redeploy. 5 min. |
| 🟡 | `track('signup_submit')` | Conversion-event analytics. ~15 min in `app/login/page.tsx`. |
| 🟡 | RLS hardening | `portfolio` + `user_tiers` are frontend-gated only. Harden before >10 paying users. |
| 🟡 | Supabase migration duplicate policy | `ERROR: policy "users_read_own_tier" for table "user_tiers" already exists`. Do NOT re-run `20260516_advisor_tier_and_disclaimer.sql` without prepending `DROP POLICY IF EXISTS "users_read_own_tier" ON user_tiers;` |
| 🟢 | C.6 from LANDING_AUDIT | Wire `?plan=pro|advisor` post-signup auto-checkout. ~1–2h. |
| 🟢 | C.7 from LANDING_AUDIT | Open `UpgradeModal` inline on landing Advisor CTA. ~1h. |
| 🟢 | Welcome email text | No plain-text copy shown if HTML fails — add `text` param improvement if needed. |
| 🟢 | McAfee WebAdvisor | Submit to TrustedSource for re-categorisation. |
| 🟢 | Stripe support phone | `+41 000 000 0000` placeholder. Replace before scaling. |
| 🟢 | DMARC `p=none;` | Tighten to `p=quarantine` once email volume grows. |

---

## 3. Sprint backlog (next session priority order)

### 3.1 Per-chart ProGate refinement (🟠 most valuable next)

Current ProGate blurs the **entire Pro tab** as one blob. Spec in `docs/PROGATE_REDESIGN.md` §10 defines per-chart blur+CTA:

- **Risk tab:** Rolling Volatility chart · Correlation Matrix · Monthly Returns Calendar · 6-stat-box row
- **Stress Test tab:** Four scenario cards individually
- **Frontier tab:** Markowitz scatter · VolatilityInsights section

9 CTA strings inventoried, FIDLEG pre-approved (R2 "Shows", F3 "Computed" rewrites applied). Ready to implement.

**Constraint:** at least ONE crisp real-data number per tab must remain unobscured (the headline metric from RiskHeadline/StressHeadline/FrontierHeadline). Refinement is about granularity of blur, not removing the headline.

Tasks:
1. Extend `docs/PROGATE_REDESIGN.md` with per-chart pattern (already drafted in §10)
2. New `ProChart` component wrapping each gated visualization individually
3. Extend `lib/backtest/fidleg-lint.test.ts` glob to cover new component files

### 3.2 Google Search Console (5 min — Dariush action)

1. Go to search.google.com/search-console
2. Add property → URL prefix → `https://quantfoli.com`
3. Verify via DNS TXT in Cloudflare (no code needed)
4. Submit `https://quantfoli.com/sitemap.xml`

### 3.3 Future / backlog

- Swissquote CSV parser feasibility spec (deferred since session 12)
- Persona research for Personas 2–7 in `docs/QUANTFOLI_RESEARCH_SOURCES.md`
- `docs/MARKETING_PLAN.md` scaffolding (Priority 2 from further-instructions — still not started)
- Magic link signin (drop password requirement)
- Replace Alpha Vantage with Financial Modeling Prep ($14/mo) — revive Fundamentals tab
- Markowitz shrinkage estimator (Ledoit-Wolf / James-Stein replacing raw historical means)
- Automated Advisor report generation (Claude API) when Advisor subscribers > 3
- Swiss legal opinion on FIDLEG (~CHF 2–5k) once Advisor revenue > CHF 5k/mo
- Annual revenue + LTV dashboard for Dariush's own use
- Beraterregister registration when Advisor subscribers > 10–20

---

## 4. Architecture quick-ref

```
/
├── app/
│   ├── page.tsx                          SERVER: auth check → <Landing /> or <Dashboard />
│   ├── layout.tsx                        Enriched SEO metadata
│   ├── sitemap.ts                        /register @ priority 0.7, /how-it-works @ 0.9
│   ├── robots.ts
│   ├── opengraph-image.tsx
│   ├── login/page.tsx                    🔄 Suspense + ?tab=signup + welcome email fire-and-forget
│   ├── register/page.tsx                 🔄 SEO metadata (German) + redirect('/login?tab=signup')
│   ├── how-it-works/page.tsx             Backtest landing — reads from public/backtests/*.json
│   ├── how-it-works/opengraph-image.tsx
│   ├── how-it-works/[portfolio]/page.tsx
│   ├── backtests/page.tsx                308 → /how-it-works
│   ├── finances/page.tsx                 Committed, unguarded auth (decide gating)
│   ├── blog/                             SEO articles
│   └── api/
│       ├── welcome/route.ts              🆕 POST — branded welcome email on signup
│       ├── support/route.ts
│       ├── advisor/accept-disclaimer/route.ts
│       ├── stripe/{checkout,portal,tier}/route.ts
│       ├── webhooks/stripe/route.ts      founder notification on Advisor transition
│       └── portfolio/, history/, benchmark/, frontier/, stress/, risk/, fx/, isin/, fundamentals/
├── components/
│   ├── Dashboard.tsx                     data-tier theming + ProGate redesign + sidebar Upgrade hidden pre-import
│   ├── Landing.tsx                       🔄 /register CTAs · ThemeToggle in nav · LinkedIn in about · var(--lp-dot) dot grid
│   ├── LandingClient.tsx                 🔄 ThemeToggle export added (reads/writes pi_theme localStorage)
│   ├── ProGate.tsx                       Blurred-preview pattern + crisp headline metric
│   ├── RiskHeadline.tsx                  Vol(21d annualised) + Sharpe(1Y)
│   ├── StressHeadline.tsx                Worst historical drawdown + scenario name
│   ├── FrontierHeadline.tsx              Current portfolio coords
│   ├── FrontierChart.tsx                 ⚠️ axis label "expected return" — cosmetic, not FIDLEG violation
│   ├── FinancesSheet.tsx                 Committed, auth-gating decision still open
│   └── backtest/
│       ├── HeroChart.tsx
│       ├── SamplePortfolioCard.tsx       Verdict badge + median Δ + "Why"
│       ├── CTACards.tsx
│       ├── Disclaimer.tsx
│       └── CopyLinkButton.tsx
├── lib/
│   ├── stripe.ts                         Tier type, PRICE_IDS, INTERVALS
│   ├── advisor-terms.ts                  ADVISOR_TERMS_VERSION = v1.1-2026-05-16
│   ├── resend.ts                         Generic email helper — RESEND_FROM now set in Vercel ✅
│   ├── rate-limit.ts                     In-memory rate limiter with IP extraction
│   ├── supabase.ts, supabase-browser.ts
│   ├── yahoo.ts                          ⚠️ DO NOT TOUCH — math
│   ├── yahoo.test.ts                     36 passing tests
│   ├── fx.ts                             Spot FX rates (EUR/USD to CHF, 15-min cache)
│   ├── ticker-meta.ts
│   ├── parsers/{zkb,yuh,neon}.ts
│   └── backtest/
│       ├── universe.ts                   SMI + ETF + benchmarks w/ domicile + currency
│       ├── data.ts                       7-day disk cache wrapping lib/yahoo.ts
│       ├── costs.ts                      Swiss cost model
│       ├── engine.ts                     🔄 FX layer: currencyByTicker + fx params → applyFx() in returnsMatrix + periodReturns
│       ├── engine.test.ts                🔄 62 tests (was 51) — 2 new FX regression tests
│       ├── fx.ts                         🆕 loadFxRates(), buildFxDeltaMaps(), toChfReturn()
│       └── fidleg-lint.test.ts           Forbidden-phrase scanner + disclaimer-presence
├── scripts/
│   ├── build-backtests.ts                🔄 loads FX + currencyByTicker → passes to runWalkForward
│   └── verify-backtest-jsons.ts          Wired into npm run build
├── public/backtests/
│   ├── conservative.json                 🔄 FX-corrected (VWRL.SW CHF + AGGG.L USD)
│   ├── growth.json                       🔄 FX-corrected (4 ETFs, CHF/USD/EUR)
│   ├── concentrated.json                 Unchanged (pure CHF)
│   └── aggregate.json                    🔄 New headline: 64% wins, mean Δ +0.057
├── app/globals.css                       🔄 --lp-dot variable added for theme-aware dot grid
├── docs/
│   ├── ETF_MATH_AUDIT.md                 ✅ Bug fixed in session 13
│   ├── PROGATE_REDESIGN.md               §10 per-chart spec — ready to implement
│   ├── DESIGN_AUDIT.md
│   ├── LANDING_AUDIT.md
│   ├── ONBOARDING_AUDIT.md
│   ├── FINYON_BRIEFING.md
│   ├── FIDLEG_AUDIT.md
│   ├── SECURITY_FIX.md
│   └── content-ideas/
├── middleware.ts                         /how-it-works, /backtests, /register, /blog public routes
├── supabase/migrations/
│   ├── 20260430_neon_transactions.sql
│   ├── 20260507_stripe_tiers.sql
│   └── 20260516_advisor_tier_and_disclaimer.sql  ⚠️ duplicate policy bug — see blockers
└── package.json                          tsx devDep, build:backtests / verify:backtests
```

---

## 5. DO NOT TOUCH

| File | Why |
|---|---|
| `lib/yahoo.ts` | Portfolio + TWR + Beta/Alpha math. 36 passing tests guard ±0.2% accuracy. Wrap, don't modify. |
| `app/api/frontier/route.ts` | Engine keeps its own Markowitz copy in `lib/backtest/engine.ts` — keeps request paths decoupled. |

---

## 6. Test + build commands

```bash
npm test                  # 62 tests: 36 yahoo + 13 engine + 2 FX + 9 rate-limit + 2 FIDLEG
npm run test:watch        # TDD mode
npm run build             # tsx scripts/verify-backtest-jsons.ts && next build
npm run build:backtests   # regenerate public/backtests/*.json (fetches live Yahoo + FX data)
npm run verify:backtests  # check aggregate drift only
npm run dev               # localhost:3000
```

---

## 7. Environment variables — full reference

### Required in Vercel (all set ✅)

| Var | What |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key |
| `STRIPE_SECRET_KEY` | Stripe server-side |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client-side |
| `STRIPE_PRO_PRICE_ID` / `STRIPE_PRO_YEARLY_PRICE_ID` | CHF 15 / 150 |
| `STRIPE_ADVISOR_PRICE_ID` / `STRIPE_ADVISOR_YEARLY_PRICE_ID` | CHF 50 / 500 |
| `RESEND_API_KEY` | Resend transactional email |
| `RESEND_FROM` | **✅ Set in session 13:** `Quantfoli <support@quantfoli.com>` |

### Optional — Sentry (not yet set)

| Var | When |
|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | Activates client-side error capture |
| `SENTRY_DSN` | Activates server + edge error capture |
| `SENTRY_ORG` + `SENTRY_PROJECT` + `SENTRY_AUTH_TOKEN` | Source-map upload |

---

## 8. Personal + working-style context for the fresh agent

- **Dariush is 18**, Matura in 2026, HSG St. Gallen starting 2027. Einzelunternehmen Schaffhausen.
- **First paying user (Pro)** in an earlier session. No paying Advisor customer yet — Dariush is on Advisor himself until 12.06.2026, then drops to Free.
- **Mom is the "designed first user"** for usability — NOT product-market fit.
- **Autonomy granted.** No confirmations needed for code changes. **Pushes require explicit "push".**
- **Communication:** caveman style in chat (short, no fluff). Files/code are full structured prose + clean production code.
- **Preferred pattern:** audit doc first → spec doc → FIDLEG pre-pass on any copy → code. Proven across 5+ sessions.
- **Single bundled commit preferred** over many small PRs.
- **No `// removed` comments, no backwards-compat shims, no dead code paths.**
- **Default to no code comments** — only the WHY when non-obvious.

---

## 9. Approaches tried that failed (historical, relevant to avoid repeating)

| Attempt | Why it failed | Resolution |
|---|---|---|
| `randomWeights` with safety renormalize at end | Broke cap invariant when cap × n < 1 | Special-cased infeasible branch to return uniform `[1/n, ...]` directly |
| First lookahead-bias test: shift input by dropping row 0 | Dropping row 0 doesn't change within-lookback-window values | Replaced with weak guard (shift closes forward) + strong guard (mutate only post-endDate prices) |
| `/how-it-works/opengraph-image` on Node runtime at build | `next build` failed with "Invalid URL" from `@vercel/og` | Added `export const dynamic = 'force-dynamic'` to both OG routes |
| First H1: "Markowitz, Sharpe, and stress tests — on your actual ZKB depot." | Too narrow — ZKB is 1 of 3 importers, 30% traffic non-Swiss | Moved specificity to subhead, H1 is now universal: "The portfolio tool your quant friend uses." |
| `/how-it-works` shipped without adding to `middleware.ts` public routes | Middleware redirected anon visitors to `/login` | Now: every new public route MUST land in `middleware.ts` in the same commit |
| SamplePortfolioCard framing 45%-win result as net-positive | Violated "acknowledge limits openly" principle | Added verdict badge (won/tied/underperformed), flipped opening sentence when wins < 50% |

---

## 10. Current production state

| System | Status |
|---|---|
| Stripe | ✅ All tiers live (Free / Pro M+Y / Advisor M+Y). Customer Portal, refunds, founder notification on Advisor transition all working. |
| Resend | ✅ Domain verified, DKIM+SPF+DMARC green. `RESEND_FROM` now `Quantfoli <support@quantfoli.com>`. Welcome email wired on signup. |
| Sentry | ⚪ Dormant — SDK installed, gated on DSN env vars |
| SEO | ✅ `/sitemap.xml`, `/robots.txt`, OG images live. `/register` in sitemap @ 0.7. Google Search Console not yet verified (Dariush action). |
| Supabase | ✅ `user_tiers` + `advisor_disclaimers` tables live with RLS. |
| Backtest infra | ✅ `/how-it-works` live with FX-corrected numbers. `npm run build` pre-verifies aggregate.json drift. |
| Signup funnel | ✅ `?tab=signup` deep-link, `/register` shadow SEO route, all CTAs, prose switcher, autoFocus, welcome email. |
| Light mode | ✅ Theme toggle on both landing and dashboard, shared `pi_theme` localStorage key. |

---

**End of handoff. Immediate pickup point for next session:**

1. Read this file end-to-end.
2. Load Obsidian brain (`C:/AI_System/obsidian_vault/Obsidian/brain`) — mandatory per global CLAUDE.md.
3. Highest-value next task: **per-chart ProGate blur** — spec is ready in `docs/PROGATE_REDESIGN.md` §10, FIDLEG pre-pass done, 9 CTA strings approved. Start with audit of current ProGate wiring in `components/Dashboard.tsx` to understand exact component boundaries before writing `ProChart`.
4. Check Vercel Analytics if 24h+ since last session — see if `/register` appearing in top pages, `/how-it-works` traffic, signup funnel click-through.
