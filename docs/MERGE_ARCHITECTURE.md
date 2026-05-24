# MERGE_ARCHITECTURE.md — Unified Landing + /portfolio Move

**Date:** 2026-05-24
**Branch:** `refactor/unified-landing`
**Status:** Spec approved (caveman approval received); implementation in progress.

---

## 0. Scope decisions (confirmed with Dariush)

1. **Legal pages stay at root.** `/privacy`, `/terms`, `/support`, `/advisor-legal` are org-wide and shared between Quantfoli's two products. They do NOT move under `/portfolio`. Both products link to them from their footers. This avoids forcing Hugo (Analysts Lens / `/learn`) to maintain duplicate legal pages.
2. **Branch strategy:** all work on `refactor/unified-landing`. Merge to `main` only after manual review by Dariush.

---

## 1. Route map — before and after

### Stays at root

| Path | Notes |
|---|---|
| `/` | **NEW** unified landing (hero + two product cards). |
| `/learn` | **NEW** placeholder page — explains Analysts Lens is coming, link back to `/`. Hugo builds the real thing later. |
| `/privacy` | Org-wide legal. |
| `/terms` | Org-wide legal. |
| `/support` | Org-wide contact. |
| `/advisor-legal` | FIDLEG-relevant; referenced from Stripe checkout and backtest disclaimers. Keep at root so canonical URL doesn't change. |
| `/api/*` | All API routes unchanged. Stripe webhooks fire at `/api/webhooks/stripe` — no change needed. |
| `/sitemap.xml`, `/robots.txt`, `/opengraph-image` | Root-level metadata. Root OG image is rebuilt for unified landing. |

### Moves under `/portfolio`

| Old path | New path |
|---|---|
| `/` (Landing/Dashboard conditional) | `/portfolio` |
| `/login` | `/portfolio/login` |
| `/register` | `/portfolio/register` |
| `/how-it-works` | `/portfolio/how-it-works` |
| `/how-it-works/[portfolio]` | `/portfolio/how-it-works/[portfolio]` |
| `/blog` | `/portfolio/blog` |
| `/blog/[slug]` | `/portfolio/blog/[slug]` |
| `/blog/sitemap.xml` | `/portfolio/blog/sitemap.xml` |
| `/backtests` | `/portfolio/backtests` (legacy 308 → `/portfolio/how-it-works`) |
| `/finances` | `/portfolio/finances` |
| `/opengraph-image` (root) | `/portfolio/opengraph-image` (existing image now represents the portfolio product) |

### Dashboard architecture

Current pattern (kept): `app/page.tsx` server-checks auth → renders `<Dashboard />` or `<Landing />`. After refactor, **`app/portfolio/page.tsx` keeps this exact pattern**. There is no separate `/portfolio/dashboard` route. Stripe success URL and login post-auth redirect both target `/portfolio`, which then renders the dashboard for authenticated users.

This deviates from the spec wording ("`/portfolio/dashboard`") but preserves the proven session-13 pattern without adding new routes. Flag for Dariush: if you'd prefer an explicit `/portfolio/dashboard` path, say so and I'll split.

---

## 2. New unified landing — copy (FIDLEG-fixed)

The `fidleg-reviewer` flagged 3 medium-risk violations in the original draft copy. All fixes are baked in below.

### Hero

- **Headline:** `Finance, built for the next generation.` *(placeholder — Dariush + Hugo will refine)*
- **Subline:** `Two products. One mission: make professional-grade finance tools accessible.` *(was "institutional" → "professional-grade")*

### Left card — Portfolio Analytics

- **Title:** `Portfolio Analytics`
- **Tagline:** `The tool your quant friend uses.`
- **Bullets:**
  1. `Markowitz frontier, Sharpe, stress tests`
  2. `FX-adjusted (historical accuracy ±0.2% on ZKB depot sample data)¹` *(was bare "±0.2%" → quantified historical claim with footnote)*
  3. `Free tier. Pro from CHF 15/mo.`
- **CTA:** `Open Portfolio Tool →` → `/portfolio`
- **Footnote ¹:** `Past accuracy does not guarantee future precision.`

### Right card — Analysts Lens

- **Title:** `Analysts Lens`
- **Tagline:** `Learn finance like an analyst. For free.` *(unchanged — "tagline" is descriptive, "valuation mastery" is what got removed below)*
- **Bullets:**
  1. `Structured courses in finance fundamentals and valuation frameworks` *(was "from analyst basics to valuation mastery")*
  2. `Built by students, for students`
  3. `Free forever`
- **CTA:** `Start Learning →` → `/learn`

### Footer attribution

`Built in Switzerland by Dariush Tahajomi (Quantfoli) and Hugo Tautorat (Analysts Lens).`
LinkedIn icons for both. Below: `Privacy · Terms · Support`.

### Metadata

- **Title:** `Quantfoli — Portfolio Analytics & Finance Education`
- **Description:** `Professional-grade portfolio analytics for the next generation. FX-corrected analytics on your ZKB depot, plus free structured finance courses.` *(removed "institutional" and "analyst-grade")*
- **Canonical:** `https://quantfoli.com`

---

## 3. Design tokens — new

Add to `:root` in `app/globals.css`:

```css
/* Cross-product accent tokens — Quantfoli host shell */
--accent-pro:    oklch(0.68 0.180 258);                /* indigo, matches existing --brand-a */
--accent-learn:  oklch(0.78 0.150 75);                 /* warm amber — placeholder until Hugo confirms */
--accent-learn-soft: oklch(0.78 0.150 75 / 0.14);
```

Light-mode overrides (in `html[data-theme="light"]`):

```css
--accent-learn:      oklch(0.65 0.150 75);
--accent-learn-soft: oklch(0.65 0.150 75 / 0.16);
```

---

## 4. Files touched (full inventory)

### Route moves (git mv)

```
app/page.tsx                    → app/portfolio/page.tsx
app/login/page.tsx              → app/portfolio/login/page.tsx
app/register/page.tsx           → app/portfolio/register/page.tsx
app/how-it-works/**             → app/portfolio/how-it-works/**
app/blog/**                     → app/portfolio/blog/**
app/backtests/page.tsx          → app/portfolio/backtests/page.tsx
app/finances/page.tsx           → app/portfolio/finances/page.tsx
app/opengraph-image.tsx         → app/portfolio/opengraph-image.tsx
```

### New files

```
app/page.tsx                    NEW unified landing
app/opengraph-image.tsx         NEW OG for unified landing
app/learn/page.tsx              NEW placeholder for Hugo's product
docs/MERGE_ARCHITECTURE.md      this file
docs/AUTH_MIGRATION.md          Supabase dashboard manual steps for Dariush
```

### URL/link rewrites — files touched

| File | What changes |
|---|---|
| `middleware.ts` | `path === '/'` removed from public list (still public via missing match); public-route list rewritten with `/portfolio/*` whitelist; login redirect → `/portfolio/login`; post-login → `/portfolio` |
| `app/sitemap.ts` | All paths re-prefixed with `/portfolio` except `/`, legal pages; `/` added; `/learn` added |
| `next.config.js` → `next.config.ts` | **Renamed.** Adds `redirects()` array: 301 from every old path to new `/portfolio/...` equivalent |
| `app/api/stripe/checkout/route.ts` | `success_url`/`cancel_url`: `${origin}/?upgraded=1` → `${origin}/portfolio?upgraded=1`; cancel → `${origin}/portfolio` |
| `app/api/stripe/portal/route.ts` | `return_url`: `${origin}` → `${origin}/portfolio` |
| `app/portfolio/login/page.tsx` | `emailRedirectTo: ${origin}/` → `${origin}/portfolio`; post-signin `router.push('/')` → `router.push('/portfolio')`; back-to-landing link `/` → `/portfolio` |
| `app/portfolio/register/page.tsx` | Canonical URL `/register` → `/portfolio/register`; redirect target `/login?tab=signup` → `/portfolio/login?tab=signup` |
| `app/api/welcome/route.ts` | Email body links `quantfoli.com` → `quantfoli.com/portfolio` for "import your first portfolio" CTA; legal footer links unchanged (`/privacy`, `/terms` stay at root) |
| `components/Landing.tsx` | All internal links re-prefixed; logo `/` → `/portfolio`; nav links `/how-it-works` → `/portfolio/how-it-works`, `/blog` → `/portfolio/blog`, `/login` → `/portfolio/login`, `/register` → `/portfolio/register` |
| `components/LandingClient.tsx` | All `/login?tab=signup...` → `/portfolio/login?tab=signup...` |
| `components/Footer.tsx` | Legal links unchanged (stay at root). |
| `components/FinancesSheet.tsx` | `<a href="/">← Dashboard</a>` → `<a href="/portfolio">` |
| `components/UpgradeModal.tsx` | `/advisor-legal` unchanged. |
| `components/backtest/CTACards.tsx` | `/advisor-legal` unchanged. |
| `components/backtest/Disclaimer.tsx` | `/advisor-legal` unchanged. |
| `components/LegalLayout.tsx` | Back link `/` → check: should go to `/portfolio` if reached from portfolio context, or `/` if reached from unified landing. Decision: link to `/` (unified host). |
| `app/portfolio/blog/[slug]/page.tsx` | `<Link href="/blog">` → `/portfolio/blog` |
| `app/portfolio/how-it-works/page.tsx` | `<Link href="/">` (logo home) → `/portfolio` |
| `app/portfolio/how-it-works/opengraph-image.tsx` | Footer text `quantfoli.com/how-it-works` → `quantfoli.com/portfolio/how-it-works` |
| `app/portfolio/how-it-works/[portfolio]/opengraph-image.tsx` | Same |
| `app/portfolio/blog/sitemap.xml/route.ts` | `SITE_URL` paths updated to include `/portfolio/blog` |
| `lib/backtest/fidleg-lint.test.ts` | `SCAN_ROOTS`: `app/how-it-works` → `app/portfolio/how-it-works`; disclaimer file path test: `app/how-it-works/page.tsx` → `app/portfolio/how-it-works/page.tsx` |

### Files explicitly NOT touched

- `lib/yahoo.ts`, `lib/backtest/engine.ts`, `lib/backtest/fx.ts`, `public/backtests/*.json` — math layer.
- FIDLEG-relevant copy on `/portfolio/how-it-works` itself — only the URL of the linked OG image footer changes.

---

## 5. Manual steps required (Dariush, post-merge)

See `docs/AUTH_MIGRATION.md` for full detail. Summary:

1. **Supabase Dashboard → Authentication → URL Configuration**
   - Site URL: `https://quantfoli.com/portfolio`
   - Redirect URLs: add `https://quantfoli.com/portfolio/**` (or the specific paths `/portfolio`, `/portfolio/login`)
2. **Stripe Dashboard** — no change needed. Webhooks fire at `/api/webhooks/stripe` (root, unchanged). Success/cancel URLs are passed at session-creation time from server code, not configured in dashboard.
3. **Vercel env vars** — no changes required. (If you later set a `NEXT_PUBLIC_SITE_URL`, point it at `https://quantfoli.com`.)
4. **Google Search Console** — submit updated `https://quantfoli.com/sitemap.xml` (auto-updates from `app/sitemap.ts`). The 301 redirects on old paths preserve link equity.
5. **DMARC / Resend** — no changes; transactional email infrastructure unchanged.

---

## 6. Environment variables — review

No new env vars needed. Confirm existing in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — unchanged.
- `STRIPE_*` — unchanged.
- `RESEND_API_KEY`, `RESEND_FROM` — unchanged.
- `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN` — still dormant.

---

## 7. Test plan

1. `npm test` — expect 62/62 still green (FIDLEG-lint globs updated to new paths).
2. `npm run build` — clean build, page count grows by 2 (`/learn`, `/`) and shrinks by net 0 (old routes moved, not removed).
3. Manual smoke (post-deploy or on local `npm run dev`):
   - `/` renders unified landing in both dark and light themes.
   - `/portfolio` renders Landing (anon) or Dashboard (auth).
   - `/portfolio/how-it-works`, `/portfolio/blog`, `/portfolio/login` reachable.
   - `/how-it-works` → 301 → `/portfolio/how-it-works`.
   - `/login` → 301 → `/portfolio/login`.
   - `/blog` → 301 → `/portfolio/blog`.
   - `/learn` returns the placeholder page (200, not 404).
   - Anon visit to `/portfolio/finances` redirects to `/portfolio/login`.
   - Stripe test checkout returns to `/portfolio?upgraded=1`.
   - Signup confirmation email link lands on `/portfolio` (auth user → Dashboard).

---

## 8. Rollback plan

If anything breaks in production after merge:

```bash
git checkout main
git revert <merge-commit>
git push
```

301 redirects from old → new paths can be removed in `next.config.ts` by deleting the `redirects()` function. Old paths will then 404 (better behavior than the broken state).

Vercel keeps the previous deployment alive — instant rollback via the Vercel dashboard is the fastest option.

---

## 9. Outstanding decisions deferred to Dariush + Hugo

- **Hero copy** — current is placeholder.
- **`--accent-learn` exact hue** — chose warm amber as placeholder. Hugo to confirm.
- **`/learn` page content** — currently a placeholder. Hugo builds the real thing.
- **Whether to split `/portfolio` into separate `/portfolio` (always landing) and `/portfolio/dashboard` (always dashboard)** — currently kept as conditional render per session-13 pattern.
