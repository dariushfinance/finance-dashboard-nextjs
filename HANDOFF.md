# HANDOFF — Quantfoli (Sessions 8 → 16)

**Date last touched:** 2026-05-26
**Branch:** `main`
**Last commit:** `16196c6` — session 16 shipped (phantom-drop fix + CHF conversion in Portfolio Value History)
**Deployment:** Vercel auto-deploys from `main`. Live at https://quantfoli.com / https://www.quantfoli.com
**DNS:** Cloudflare (nameservers `adrian.ns.cloudflare.com`, `norm.ns.cloudflare.com`).
**Owner:** Dariush Tahajomi (`dariush.tahajomi@gmail.com`), 18, HSG St. Gallen 2027, Einzelunternehmen in Schaffhausen.
**LinkedIn:** https://www.linkedin.com/in/dariush-tahajomi-09348b370/

> Read this file end-to-end before touching anything. Sessions 1–7 in git history. Sessions 8–14 documented below Session 15.

---

## Session 16 (2026-05-26) — Portfolio Value History: phantom 70% drops + CHF conversion

### Incident brief

Portfolio Value History chart showed phantom single-day drops (~CHF 300k → ~91k) on isolated days that recovered the next day, with no transactions. Reported on the real CHF ~307k portfolio.

### Root cause (two bugs, one chart)

1. **🔴 Phantom drop.** `app/api/history/route.ts` built the value series on the **union of every ticker's trading days with no forward-fill**. On European-only holidays (Whit Monday 2026-05-25, Easter Monday, Ascension, Labour Day — US open, SIX/Xetra closed), closed-exchange positions had no price bar and were silently valued at **0** → one-day cliff. Hypotheses H4 (cache gaps not backfilled) = cause, H2 (zero-valuation) = mechanism. Good Friday does NOT trigger it (NYSE also closed → no US-only union date), which matched the reported symptom exactly.
2. **🟠 FX.** The series summed native-currency prices (USD/EUR/CHF) as if 1:1 with CHF — wrong CHF axis for mixed portfolios.

### Fix

| Commit | Change |
|---|---|
| `b47b974` (merged via `16196c6`) | Full fix below. |

- **`lib/history-fill.ts` (NEW)** — `forwardFillPriceMap()` carries each ticker's last-known close onto the union grid (only after its first bar, never back-fill). `toChfPriceMap()` converts native → CHF via **per-day historical FX** (`USDCHF=X`, `EURCHF=X`, forward-filled across FX holidays), with **spot fallback — never 1.0**; omits entries with no usable rate so the caller flags them as data gaps.
- **`lib/ticker-currency.ts` (NEW)** — `tickerCurrency()` classifies ticker → CHF/EUR/USD (`.SW`→CHF, euro suffixes→EUR, else `ticker-meta` currency, USD catch-all). Unsupported currencies (GBP/DKK/HKD/JPY) approximated as USD — documented limitation.
- **`app/api/history/route.ts`** — forward-fill + CHF conversion before summing; CHF map fed to `calcTWRReturns` too (TWR now reflects a CHF investor incl. FX moves); `dataGaps[]` surfaced in response; genuine gaps flagged per-point (`gap`).
- **`types/index.ts`** — `HistoricalDataPoint.gap?`, `HistoryResult.dataGaps`.
- **`components/HistoryChart.tsx`** — axis + tooltip labels `$` → `CHF`. FIDLEG-reviewed: compliant (factual currency labels on user's own values).
- **`lib/history-fill.test.ts` (NEW)** — 17 regression tests incl. the specific pattern guard (no single-day drop >50% without a transaction) + proof the OLD logic WOULD drop >50%.
- **`scripts/verify-history.ts` (NEW)** — real-data audit harness. Run `npx tsx scripts/verify-history.ts` (loads `.env.local`, service-role, real Yahoo).

### Verified (real DB + real Yahoo, all 15 users)

| Portfolio | OLD worst 1-day drop | NEW |
|---|---|---|
| CHF 307k (reported, `f47ba9f2`) | **88.5%** (2026-05-25 Whit Monday) | **1.8%** ✅ |
| CHF 50k (`myportfo`, London `.L`) | 81.0% | 7.3% ✅ |
| CHF 349 (`ef1cfcbd`) | 85.9% | 4.0% ✅ |
| all 15 users | — | **<50%** ✅ |

Real drops (April 2025 tariff selloff etc.) preserved. Junk-ticker portfolios (`meinport`) correctly flag data gaps instead of zeroing.

- `npm test` **79/79** · `tsc --noEmit` clean · `next build` clean.
- **No change to `lib/yahoo.ts` core math** (hard rule honored — fill/FX live in new lib files + route).

### Hard-rule note / known limitation

GBP/DKK/HKD/JPY positions are approximated as USD for CHF conversion (additive, close, not exact). A full fix would read `meta.currency` from the Yahoo response — deferred to avoid changing `lib/yahoo.ts`. If a customer holds London-pence or Tokyo listings, their CHF axis will be slightly off (not a phantom drop). Tracked as future work.

### Process note

`gh` CLI is **not installed** on this machine — no PR could be opened from the terminal. Merged `fix/history-phantom-drops` → `main` locally (`--no-ff`) and pushed. Vercel auto-deploys main → production.

---

## Session 15 (2026-05-25) — AEO structured data · sitemap fix · per-article FAQ

### What was done

Follow-up to the session-14 unified-landing launch. Focus: answer-engine optimization (AEO) so LLMs (ChatGPT, Perplexity, Google AI Overviews) can name, price, and describe Quantfoli, plus a production bug fix.

| Commit | Change |
|---|---|
| `6e8c6a0` | **🔴 Bug fix:** middleware matcher excluded image files but not `.xml`/`.txt`, so anon hits to `/sitemap.xml` and `/portfolio/blog/sitemap.xml` 307-redirected to `/portfolio/login` ("Redirecting..." instead of the sitemap). Added `sitemap.xml`, `robots.txt`, `.xml`, `.txt` to the matcher negative-lookahead. **Pre-existing bug, not from the merge.** |
| `a43d6a9` | **AEO schema.** New `lib/schema.ts` — centralized JSON-LD builders: `organizationSchema()`, `softwareApplicationSchema()`, `faqSchema()`, plus canonical `PORTFOLIO_FAQ`. `/` emits Organization + SoftwareApplication; `/portfolio` (anon view) emits SoftwareApplication + FAQPage and renders a visible `components/FaqSection.tsx`. |
| `1a71cc6` | **Per-article FAQ.** Replaced the hand-written ```` ```jsonld-faq ```` markdown fence with a typed frontmatter `faq:` array. `lib/blog.ts` builds FAQPage JSON-LD via `faqSchema()` and exposes items for a visible "Häufige Fragen" accordion on each article. Added a 4-Q FAQ to the Sharpe article. |
| `4b3c6df` | **Cleanup.** The Sharpe article still carried the old jsonld-faq fence in its body; after the `1a71cc6` refactor removed fence-stripping, it rendered as visible code. Removed it. Also repointed two in-body markdown links (`/how-it-works`, `/backtests` → `/portfolio/how-it-works`) — markdown body links were missed in the session-14 migration which only grepped `.tsx`. |

### FIDLEG

All new schema/FAQ copy ran through `@agent-fidleg-reviewer`. English product FAQ: clean as-is. German Sharpe-article FAQ: the "good Sharpe ratio" answer was rewritten from prescriptive thresholds to neutral statistical categories + explicit "Quantfoli bewertet nicht, welche Quote du anstreben solltest".

### Verified

- `npm test` 62/62 · `npm run build` clean (42 pages) · `tsc --noEmit` clean.
- **Google Rich Results Test confirmed the schema is detected** (Dariush verified). Indexing now waits on Google recrawl (days–weeks).
- Sitemap is submitted in Google Search Console.

### How to add a FAQ to any future article

Put this in the markdown frontmatter — schema + visible block render automatically:

```yaml
faq:
  - q: "Frage?"
    a: "Antwort."
```

Do NOT use the old ```` ```jsonld-faq ```` fence — it's gone, it'll render as raw code.

### Still to do (session 16 pickup)

🔴 = blocks correctness/compliance · 🟠 = high ROI · 🟢 = polish

| Sev | Task | Notes |
|---|---|---|
| 🔴 | **Supabase URL config** | Dashboard → Authentication → URL Configuration: Site URL `https://quantfoli.com/portfolio`; add Redirect URL `https://quantfoli.com/portfolio/**`. Confirm whether this was done. `docs/AUTH_MIGRATION.md` §1. **Dariush manual.** |
| 🔴 | **Run prod smoke checklist** | `docs/AUTH_MIGRATION.md` §5 — confirm signup→confirm lands on `/portfolio`, Stripe checkout returns to `/portfolio?upgraded=1`, 301s fire. |
| 🟠 | **Content volume — the biggest growth lever** | Only 1 blog article live. Schema makes pages citable; articles make them rank. Use `seo-article-writer`. Next picks: (1) "ZKB Depot analysieren", (2) "Klumpenrisiko / Diversifikation messen", (3) "Wechselkursrisiko ETF in CHF" (the FX edge nobody else covers). Each ships with frontmatter `faq:` → schema automatic. |
| 🟠 | **Rewrite terms/privacy/support for BOTH products** | Legal pages still portfolio-only. Need Analysts Lens coverage. Blocked on Hugo defining Lens scope. `/advisor-legal` stays portfolio-only. Run copy through `@agent-fidleg-reviewer`. |
| 🟠 | **Impressum check** | Footer firm-name+address line was removed (`66821b6`). Swiss Impressumspflicht expects it visible somewhere — confirm `/terms` or `/support` carries "Dariush Tahajomi, Einzelunternehmen, Schaffhausen". Add back if missing. |
| 🟢 | **Internal linking pass** | Cross-link articles → `/portfolio/how-it-works` and each other. Google weights internal link graphs. |
| 🟢 | **Hero copy** | `Finance, built for the next generation.` is placeholder — Dariush + Hugo to finalize. |
| 🟢 | **`--accent-learn` hue** | Warm amber placeholder; get Hugo's brand color. |
| 🟢 | **`/learn` real content** | Coming-soon placeholder; Hugo builds it. |

### Carried-over backlog (pre-session-15)

- **Per-chart ProGate blur** (🟠) — spec ready `docs/PROGATE_REDESIGN.md` §10, FIDLEG pre-pass done, 9 CTA strings approved. When adding `ProChart`, extend `fidleg-lint` `SCAN_FILES`.
- RLS hardening before >10 paying users.
- Stripe support phone placeholder `+41 000 000 0000`.

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

### Post-merge tweaks (after shipping to main)

| Commit | Change |
|---|---|
| `a0e1993` | Merged `refactor/unified-landing` → `main` (fast-forward). Vercel auto-deployed. |
| `d601b82` | Removed duplicate legal links on `/` — the in-page block under the founder badges duplicated the global `Footer`. Kept the global footer only. |
| `66821b6` | Dropped "Dariush Tahajomi, Einzelunternehmen, Schaffhausen, Schweiz" line from `components/Footer.tsx` per Dariush. ⚠️ See Impressum note in "Still to do". |

Also added in post-merge polish (part of the merge commit `a0e1993`):
- **"One pipeline" section** on `/` (Learn → Import → Measure, 3 step cards) — product-marketing tone, explains how the two products connect.
- **Founder badges** (DT indigo, HT amber initials; DT links to LinkedIn).
- **Footnote moved** out of the Portfolio card to a single page-bottom disclaimer so both product-card CTAs align at equal height.
- **Backlinks to `/`**: Landing logo, Dashboard sidebar brand (now a `<Link>`, was a static div), login back-arrow, and how-it-works "← Back to Quantfoli" all route to the unified host `/`.

### Verification

- `npm test` — 62/62 ✅ (FIDLEG-lint passes against `app/portfolio/how-it-works`)
- `npm run build` — clean. `tsc --noEmit` clean after each post-merge edit.
- Production smoke tests — **not yet confirmed by Dariush.** Checklist in `docs/AUTH_MIGRATION.md` §5.

### Still to do (session 15 pickup) — unified-landing follow-ups

🔴 = blocks correctness/compliance · 🟠 = should do soon · 🟢 = polish

| Sev | Task | Notes |
|---|---|---|
| 🔴 | **Supabase URL config** | Dashboard → Authentication → URL Configuration: Site URL `https://quantfoli.com/portfolio`; add Redirect URL `https://quantfoli.com/portfolio/**`. Until done, email-confirm links may land wrong. **Dariush manual.** |
| 🔴 | **Run prod smoke checklist** | `docs/AUTH_MIGRATION.md` §5 — verify 301s fire (`/how-it-works` → `/portfolio/how-it-works`), signup→confirm lands on `/portfolio`, Stripe checkout returns to `/portfolio?upgraded=1`. |
| 🟠 | **Rewrite terms/privacy/support for BOTH products** | Legal pages still portfolio-only. Need Analysts Lens coverage. Blocked on Hugo defining Lens scope (accounts? data collection?). `/advisor-legal` stays portfolio-only. Coordinate with `@agent-fidleg-reviewer`. |
| 🟠 | **Impressum check** | Removed firm name + address from footer. Swiss Impressumspflicht expects it visible somewhere — confirm `/terms` or `/support` still carries "Dariush Tahajomi, Einzelunternehmen, Schaffhausen". Add back if missing. |
| 🟢 | **Hero copy** | `Finance, built for the next generation.` is placeholder — Dariush + Hugo to finalize. |
| 🟢 | **`--accent-learn` hue** | Warm amber `oklch(0.78 0.150 75)` is a placeholder. Get Hugo's brand color. |
| 🟢 | **`/learn` real content** | Currently a "Coming soon" placeholder. Hugo builds the real platform. |
| 🟢 | **Google Search Console** | Re-submit `https://quantfoli.com/sitemap.xml` after deploy confirmed. |

### Carried-over backlog (pre-session-14, still open)

- **Per-chart ProGate blur** (🟠) — spec ready in `docs/PROGATE_REDESIGN.md` §10, FIDLEG pre-pass done, 9 CTA strings approved. Note: `fidleg-lint` `SCAN_FILES` already lists the components; when adding `ProChart`, extend that list.
- RLS hardening before >10 paying users.
- Stripe support phone placeholder `+41 000 000 0000`.

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
npm test                  # 79 tests: 36 yahoo + 13 engine + 2 FX + 9 rate-limit + 2 FIDLEG + 17 history-fill
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
