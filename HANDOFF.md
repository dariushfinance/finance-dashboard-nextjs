# HANDOFF — Quantfoli (Sessions 8 + 9)

**Date:** 2026-05-17
**Branch:** `main`
**Deployment:** Vercel auto-deploys from `main`. Live at https://quantfoli.com / https://www.quantfoli.com
**DNS:** Cloudflare (nameservers `adrian.ns.cloudflare.com`, `norm.ns.cloudflare.com`). Migrated in session 8.
**Owner:** Dariush Tahajomi (dariush.tahajomi@gmail.com), 18, HSG St. Gallen 2027, Einzelunternehmen in Schaffhausen

> Prior handoffs are in git history. Read this file end-to-end before touching anything.

---

## 0. Session 9 — Backtesting landing page (2026-05-17, same day as session 8)

Built the `/how-it-works` landing page from `docs/BACKTESTING_LANDING_PAGE.md`. Spec was written first, approved (`go ahead, build my guy`), then implemented end-to-end. One PR, bundled commit.

### What shipped

- **Walk-forward backtest engine** (`lib/backtest/engine.ts`) with lookahead-bias guard. Two guards: a runtime assertion that no price row with `date >= asOf` reaches the optimizer, and two regression tests — one shifting in-window prices by 1 trading day (output MUST change), one mutating only post-`endDate` prices (output MUST be identical). The strong guard is the canary; do not weaken it.
- **Mulberry32 deterministic RNG** for the Monte Carlo Markowitz solver (`seed: 42`). Same input → identical weights → reproducible aggregate JSONs.
- **Cost model** (`lib/backtest/costs.ts`): 0.50% commission + 0.10% spread + 0.15% (CH) / 0.30% (foreign) stamp duty per trade side, with sources cited in the file header. If the numbers change, update `docs/BACKTESTING_LANDING_PAGE.md` §B.3 in the same commit — they must stay in sync.
- **Data pipeline** (`lib/backtest/data.ts`): 7-day disk cache under `data/backtests-cache/` (gitignored). Single chokepoint for all price reads — `pricesBefore(frame, ticker, asOf)` is the only function the engine uses to read history.
- **Universe** (`lib/backtest/universe.ts`): curated SMI large-caps + Swiss-broker-accessible UCITS ETFs, annotated with first-trade-date and domicile for stamp duty.
- **Build script** (`scripts/build-backtests.ts`): generates 3 portfolio JSONs + `aggregate.json` into `public/backtests/`. Run with `npm run build:backtests`.
- **Verify script** (`scripts/verify-backtest-jsons.ts`): re-derives aggregate from the per-portfolio JSONs, fails on drift. **Wired into `npm run build`** as a precheck — `next build` will not run if aggregate is stale.
- **`/how-it-works`** route (server component, `data-tier="advisor"` for purple cascade). Hero chart, methodology section, screenshot-quotable aggregate-stats block, three sample portfolio cards, dual Pro/Advisor CTA, disclaimer importing `ADVISOR_TERMS_VERSION` from `lib/advisor-terms.ts`.
- **`/backtests`** → 308 redirect to `/how-it-works`.
- **`/how-it-works/[portfolio]`** → permalink that redirects to `#portfolio-<id>` anchor.
- **OG cards** at `/how-it-works/opengraph-image` and `/how-it-works/[portfolio]/opengraph-image` — show actual aggregate stats, not generic branding. Both are `runtime = 'nodejs'` + `dynamic = 'force-dynamic'` (need fs to read JSON; Vercel edge-caches at request time).
- **`tsx`** added as devDependency (was needed by the build/verify scripts).
- **`sitemap.ts`** + `/how-it-works` (priority 0.9, weekly).
- **FIDLEG copy lint** (`lib/backtest/fidleg-lint.test.ts`): walks every `.tsx` under `app/how-it-works/` and `components/backtest/`, fails on forbidden prescriptive phrasing. Allow-list via `// eslint-allow-fidleg: <reason>` comment.

### Honesty patch (post-Dariush review)

Dariush spotted that the original card sentence framed a 45%-win, ending-NAV-below-starting-allocation result as net-positive. That violates `docs/BACKTESTING_LANDING_PAGE.md` §D ("acknowledge limits openly"). Fixed in the same commit:

- Per-card **verdict badge** (`Model outperformed` / `Roughly tied` / `Model underperformed`) derived from wins% AND median Sharpe Δ (median is the more honest center than the mean).
- Opening sentence flips based on verdict — never leads with "wins in X%" when wins < 50%.
- Median Sharpe Δ printed next to the mean on every card.
- One-line **"Why"** explanation per portfolio, passed in from the page. Concentrated portfolio's "why" explicitly upsells the Advisor diagnostic.
- Advisor CTA copy now says "what the model computes on your portfolio — and, just as importantly, where it doesn't help and why."

### Test counts

`npx vitest run` — **51/51 passing** (36 original + 13 engine/costs/lookahead + 2 FIDLEG/disclaimer).

### Headline numbers (66 pooled rebalances, 2019-06 → 2024-12)

- Vs. equal-weight: **+Sharpe in 56% of quarters**, mean Δ **+0.022**.
- Vs. starting allocation: 47% of quarters, mean Δ **+0.029**.
- Concentrated SMI portfolio: model loses (45% wins, ending NAV 1.779 vs starting-allocation 1.812). Surfaced honestly with verdict badge "Model underperformed" + structural explanation.
- Conservative + growth portfolios: model wins. The page tells both stories.

### Files added/modified this session

```
NEW
  docs/BACKTESTING_LANDING_PAGE.md
  lib/backtest/{universe,data,costs,engine,engine.test,fidleg-lint.test}.ts
  scripts/{build-backtests,verify-backtest-jsons}.ts
  public/backtests/{conservative,growth,concentrated,aggregate}.json
  app/how-it-works/page.tsx
  app/how-it-works/opengraph-image.tsx
  app/how-it-works/[portfolio]/page.tsx
  app/how-it-works/[portfolio]/opengraph-image.tsx
  app/backtests/page.tsx                      (308 → /how-it-works)
  components/backtest/{HeroChart,SamplePortfolioCard,CTACards,Disclaimer,CopyLinkButton}.tsx

MODIFIED
  .gitignore                                  + data/backtests-cache/
  app/sitemap.ts                              + /how-it-works @ priority 0.9
  package.json                                + tsx devDep, + build/verify scripts
  package-lock.json
  HANDOFF.md                                  (this section)
```

### What was NOT done

- **`app/finances/page.tsx` + `components/FinancesSheet.tsx`** are still untracked (deferred in session 8, deferred again here — Dariush's call).
- **HANDOFF.md bottom sections** (5–14) below still describe session 8 state. Re-read them but treat this Session 9 block as the latest authoritative summary on backtest infrastructure.
- **No browser walkthrough by Claude** — Dariush ran `npm run dev` and reviewed live, then asked for the honesty patch which is now shipped.

### Next session pickup

1. Verify the live deploy of `/how-it-works` once Vercel finishes the auto-deploy. Open in incognito; check Advisor purple cascade, hero chart renders, verdict badges show the right verdict per card, OG cards render at `/how-it-works/opengraph-image` and `/how-it-works/conservative/opengraph-image`.
2. Submit the new route to Google Search Console (sitemap already includes it).
3. Decision still pending: commit `app/finances/` or remove.
4. Marketing scaffolding doc (`docs/MARKETING_PLAN.md`) is the next deliverable per the further-instructions file — but Dariush will do most of the research himself, with Claude in advisory role. Wait for him to start.

---

## 1. What Quantfoli is

A Swiss-focused portfolio analytics SaaS for self-directed investors.

**Stack:** Next.js 14 (App Router) · TypeScript · Supabase (Postgres + Auth) · Stripe · Vercel (Frankfurt) · Resend (transactional email) · Cloudflare (DNS) · Sentry (error monitoring, dormant)

**Pricing (3-tier):**
- **Free** — CHF 0: tracker, EOD prices (Yahoo Finance), S&P 500 benchmark, Swiss broker CSV import, multi-currency display
- **Pro Monthly** — CHF 15/mo
- **Pro Yearly** — CHF 150/yr (≈17% off)
- **Advisor Monthly** — CHF 50/mo
- **Advisor Yearly** — CHF 500/yr (2 months free)

**Defensible differentiator:** Markowitz frontier + historical stress test + Sharpe/Sortino/Beta/Alpha on top of FX-aware ZKB/Yuh/Neon CSV imports, accurate to ±0.2% vs. the broker statement. No Swiss retail competitor ships this combo.

**Owner status (legal):** Einzelunternehmen (sole proprietorship), Schaffhausen. Not registered in Handelsregister (only required > CHF 100k turnover/year). Not MWST-registered (only required > CHF 100k worldwide turnover/year). Currently invisible to FINMA — at current scale (1–2 paying users) no regulatory action is realistic.

---

## 2. Session 8 — what was built (chronological)

Single commit this session (everything bundled):

| Commit | What it did |
|---|---|
| `c53bb84` | SEO meta tags + sitemap + robots + dynamic OG image. Sentry SDK install + dormant config. Founder-notification email on Advisor signup with disclaimer audit row. |

Non-code work done this session (no commits):
- **Cloudflare DNS migration completed end-to-end.** Per §6.3.1 of session 7's handoff. All Namecheap DNS records re-created in Cloudflare, nameservers switched, propagation confirmed (~30 min). Site briefly unreachable on Dariush's machine due to stale local cache; fixed with `ipconfig /flushdns`.
- **Resend domain verification completed.** All 4 records (DKIM TXT, SPF TXT, SPF MX, DMARC TXT) now green in Resend dashboard. Outbound sending live.
- **Support form tested end-to-end.** Email submitted from incognito landed in `dariush.tahajomi@gmail.com` within seconds.

---

## 3. Cloudflare DNS migration — final state

### 3.1 Records now live in Cloudflare DNS

| Type | Name | Value | Priority | Proxy |
|---|---|---|---|---|
| A | `@` | `76.76.21.21` (Vercel) | — | proxied (orange) |
| CNAME | `www` | `cname.vercel-dns.com` | — | proxied (orange) |
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDGPvwNA3Qy7U/DI5+d/+sjizpYibrhfj3RBUMwuVU3jiMn7o2W0Q+u58IbiFXqXP/N1/Ai7lTnX5/PcC4YmN5q+oFnX8duXzbI3TOeUaavGNWRU8U4bpbvVMDEUCOoWqHMUhD5TdogPvyqJfQMAE8ZXVhFwfmKJT0rWXXT13TJAwIDAQAB` | — | DNS only (grey) |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | — | DNS only |
| MX | `send` | `feedback-smtp.eu-west-1.amazonses.com` | 10 | DNS only |
| TXT | `_dmarc` | `v=DMARC1; p=none;` | — | DNS only |

### 3.2 Nameservers

```
adrian.ns.cloudflare.com
norm.ns.cloudflare.com
```

Switched in Namecheap → Domain → Nameservers → Custom DNS. Namecheap still owns the domain registration (just delegates DNS to Cloudflare).

### 3.3 Issue hit during migration

Right after nameserver propagation, Dariush couldn't reach `quantfoli.com` (`DNS_PROBE_POSSIBLE`). Public DNS resolved fine from 8.8.8.8 / 1.1.1.1 — the local Windows resolver had cached the old Namecheap-served records.

**Fix:** `ipconfig /flushdns` + hard refresh. Site immediately returned.

**For future debugging:** if anyone else reports the site is unreachable after the migration, first action is always DNS cache flush. Second action would be to toggle the orange-cloud proxy off on A `@` + CNAME `www` if there's an SSL handshake failure between Cloudflare ↔ Vercel. The fix for THAT would be to set Cloudflare SSL/TLS mode to **Full (strict)** since Vercel issues valid certs. Currently the apex is proxied and working, so don't touch unless something breaks.

### 3.4 Diagnostic commands (PowerShell)

```powershell
# Check nameservers
Resolve-DnsName -Type NS quantfoli.com -Server 8.8.8.8

# Check Resend records
Resolve-DnsName -Type TXT resend._domainkey.quantfoli.com -Server 1.1.1.1
Resolve-DnsName -Type TXT send.quantfoli.com -Server 1.1.1.1
Resolve-DnsName -Type MX  send.quantfoli.com -Server 1.1.1.1
```

`MxToolbox` web UI does **NOT** work via WebFetch (JS-rendered) — use direct `Resolve-DnsName` calls instead.

---

## 4. Session 8 code changes — full architecture

### 4.1 SEO package

| File | Purpose |
|---|---|
| `app/layout.tsx` (modified) | Enriched `Metadata` export: title template, full description, keywords array, authors/creator/publisher, canonical, robots hints, OG block with locale `en_CH`, Twitter `summary_large_image` card, `metadataBase`. Single `SITE_URL` + `SITE_NAME` + `SITE_DESCRIPTION` constants at file top — change one place to rebrand. |
| `app/sitemap.ts` (new) | Exports default `sitemap()` returning `MetadataRoute.Sitemap`. Generates `quantfoli.com/sitemap.xml` listing 6 public pages with per-route `priority` and `changeFrequency`. Add new public pages to the `routes` array. |
| `app/robots.ts` (new) | Exports default `robots()` returning `MetadataRoute.Robots`. Generates `quantfoli.com/robots.txt` allowing `/`, disallowing `/api/` + `/login`. Includes `sitemap` and `host` pointers. |
| `app/opengraph-image.tsx` (new) | Edge runtime. Uses `ImageResponse` from `next/og` to render a 1200×630 PNG with purple gradient, Q brand mark, headline + features subline + URL. This is what WhatsApp/LinkedIn/iMessage show as the preview card. Refresh `https://quantfoli.com/opengraph-image` directly to see the live render. |

**To verify OG card after deploy:** paste `https://quantfoli.com` into https://www.opengraph.xyz/ — should show the purple gradient card.

**To submit to Google:** Google Search Console → add property `quantfoli.com` (DNS TXT verification, add in Cloudflare) → submit sitemap `https://quantfoli.com/sitemap.xml`. Same for Bing Webmaster Tools if interested.

### 4.2 Sentry package (dormant)

Built defensively: every config checks for the DSN env var and skips `init()` if missing. Pushing the SDK to production with no env vars means zero overhead, zero crashes, zero traffic. Activation = adding env vars + redeploy.

| File | Purpose |
|---|---|
| `sentry.client.config.ts` (new) | Browser errors. Reads `NEXT_PUBLIC_SENTRY_DSN`. `tracesSampleRate: 0.1`, replays disabled. |
| `sentry.server.config.ts` (new) | API route / Node errors. Reads `SENTRY_DSN` or falls back to `NEXT_PUBLIC_SENTRY_DSN`. |
| `sentry.edge.config.ts` (new) | Middleware / edge runtime errors. Same DSN sourcing as server. |
| `instrumentation.ts` (new) | Next 14 hook. `register()` conditionally imports `sentry.server.config` (nodejs runtime) or `sentry.edge.config` (edge). Re-exports `captureRequestError as onRequestError` for Next's App Router error reporting. |
| `next.config.js` (modified) | Now wraps `nextConfig` with `withSentryConfig` ONLY when `SENTRY_AUTH_TOKEN` + `SENTRY_ORG` + `SENTRY_PROJECT` are all set. Without those, exports raw `nextConfig` — no Sentry build hooks fire. Tunnel route `/monitoring` (bypasses ad-blockers on the client SDK). |
| `package.json` / `package-lock.json` | + `@sentry/nextjs ^10.53.1` (177 packages added). |

**Activation steps for next session (or when Dariush wants):**
1. Sign up at https://sentry.io (free tier: 5k errors/mo)
2. Create project type "Next.js"
3. Copy DSN (looks like `https://abc123@o123.ingest.sentry.io/456`)
4. Vercel → `quantfoli` → Settings → Environment Variables → add to Production:
   - `NEXT_PUBLIC_SENTRY_DSN` = DSN
   - `SENTRY_DSN` = same DSN
5. For source-map upload (clean stack traces) — also add:
   - `SENTRY_ORG` = your org slug
   - `SENTRY_PROJECT` = your project slug
   - `SENTRY_AUTH_TOKEN` = auth token from Sentry settings
6. Redeploy.

**Gotcha discovered this session:** `@sentry/nextjs` v10 does NOT export `onRequestError` — it's named `captureRequestError`. The instrumentation.ts uses `export { captureRequestError as onRequestError }` to match the Next.js convention. Don't revert to the named import without checking the version.

### 4.3 Founder-notification email on Advisor signup (HANDOFF §7 from session 7)

This was specified at the end of session 7 and was the headline implementation task this session.

| File | Purpose |
|---|---|
| `lib/resend.ts` (new) | Generic `sendEmail({ to, subject, text, html, replyTo })` helper. Returns `{ ok, error? }`. Reads `RESEND_API_KEY` and `RESEND_FROM` env vars. No-ops with warning log if API key missing — never throws. Used by both `app/api/webhooks/stripe/route.ts` and (could be used by) `app/api/support/route.ts`. Future: support route should be refactored to use this helper for consistency, but it works as-is. |
| `app/api/webhooks/stripe/route.ts` (modified) | Three additions: (1) `PLAN_NAME` map for human-readable plan strings. (2) `upsertSubscription` now reads `user_tiers.tier` BEFORE the upsert and returns `{ userId, prevTier, newTier, priceId, customerId }`. (3) New `notifyFounderAdvisorSignup` function called from `checkout.session.completed` and `customer.subscription.updated` event handlers when `newTier === 'advisor' && prevTier !== 'advisor'`. |

**Email content** (plain text, audit-trail-grade):
```
New Quantfoli Advisor subscriber.

Customer:        <user email>
User ID:         <uuid>
Plan:            <advisor | advisor_yearly>
Subscribed at:   <iso timestamp>
Stripe customer: https://dashboard.stripe.com/customers/<cus_xxx>

Disclaimer acceptance:
  Accepted at:   <iso>
  Terms version: <v1.1-2026-05-16>
  IP address:    <x.x.x.x>
  User agent:    <ua string>

Next action: prepare their first monthly Advisor report.
```

**Why the prev-tier check matters:** Stripe fires `customer.subscription.updated` events frequently (every renewal, every minor change). Without the `prevTier !== 'advisor'` guard, you'd spam yourself every time an existing Advisor's renewal processes. The guard fires the email exactly once per upgrade transition.

**Failure mode:** if Resend call fails (e.g. API key missing, rate limit, network), the error is logged but the webhook still returns 200 to Stripe. Subscription record in `user_tiers` is still upserted correctly. The user gets Advisor access regardless — only the founder notification is best-effort.

### 4.4 Files modified summary

```
app/api/webhooks/stripe/route.ts   # + founder notification on Advisor transition
app/layout.tsx                      # enriched SEO metadata
app/opengraph-image.tsx             # 🆕 dynamic OG card
app/robots.ts                       # 🆕 robots.txt route
app/sitemap.ts                      # 🆕 sitemap.xml route
instrumentation.ts                  # 🆕 Sentry runtime hook
lib/resend.ts                       # 🆕 generic email helper
next.config.js                      # wrapped with conditional withSentryConfig
package.json                        # + @sentry/nextjs
package-lock.json                   # +177 deps
sentry.client.config.ts             # 🆕
sentry.edge.config.ts               # 🆕
sentry.server.config.ts             # 🆕
```

### 4.5 DO NOT TOUCH

| File | Why |
|---|---|
| `lib/yahoo.ts` | Portfolio + TWR + Beta/Alpha calculations. 36 passing tests guard the math behaviour. Refactoring without re-running `npm test` red→green could silently break ±0.2% accuracy. |

### 4.6 Uncommitted local files (Dariush's call)

| File | Status |
|---|---|
| `app/finances/page.tsx` | Untracked. Imports `FinancesSheet`. Personal finances tracker page Dariush built in another session. |
| `components/FinancesSheet.tsx` | Untracked. 307 lines, client component. Same context. |

**Still uncommitted at session 8 end.** Dariush deferred the decision again. Next session: ask if these should be committed, and if so what auth gating they need (admin-only? Pro-only? public?). Until then, do not include in commits.

---

## 5. Current production state

### 5.1 Stripe — ✅ live (no change from session 7)

- Free / Pro Monthly (CHF 15) / Pro Yearly (CHF 150) / Advisor Monthly (CHF 50) / Advisor Yearly (CHF 500) all live in Production with verified env vars.
- Customer Portal cancel works.
- Refund works.
- Disclaimer gate on Advisor checkout works (UI + server enforcement).
- Webhook handler now also sends founder notification on Advisor transition.

### 5.2 Resend — ✅ live (new this session)

- Domain `quantfoli.com` verified in Resend dashboard. All 4 records green.
- DKIM active, SPF TXT + MX active, DMARC TXT active.
- Sending is live. Support form tested successfully end-to-end (incognito → form submit → email landed at `dariush.tahajomi@gmail.com` within seconds).
- API key (`RESEND_API_KEY`) configured in Vercel Production.

### 5.3 Sentry — ⚪ dormant

- SDK installed, configs in place.
- No env vars set → init() returns early → zero overhead.
- Will activate the moment `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_DSN` are added in Vercel.

### 5.4 SEO — ✅ live

- Meta tags shipped.
- `/sitemap.xml` + `/robots.txt` live routes.
- `/opengraph-image` route renders dynamic 1200×630 share card.
- **Pending Dariush action:** submit sitemap to Google Search Console + Bing Webmaster Tools (5 min, one-time).

### 5.5 Supabase — unchanged

- Migration `20260516_advisor_tier_and_disclaimer.sql` applied (session 7).
- `user_tiers` CHECK allows `'free' | 'pro' | 'advisor'`.
- `advisor_disclaimers` table exists with RLS.

---

## 6. Environment variables — full reference

### 6.1 Required for production (already set in Vercel)

| Var | What |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key (webhook uses for `auth.admin.getUserById` + bypassing RLS) |
| `STRIPE_SECRET_KEY` | Stripe server-side |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client-side |
| `STRIPE_PRO_PRICE_ID` | CHF 15 monthly |
| `STRIPE_PRO_YEARLY_PRICE_ID` | CHF 150 yearly |
| `STRIPE_ADVISOR_PRICE_ID` | CHF 50 monthly |
| `STRIPE_ADVISOR_YEARLY_PRICE_ID` | CHF 500 yearly |
| `RESEND_API_KEY` | Resend transactional email |

### 6.2 Recommended add — `RESEND_FROM` (still pending)

```
RESEND_FROM=Quantfoli Support <support@quantfoli.com>
```

Without this, both `app/api/support/route.ts` and `lib/resend.ts` fall back to `onboarding@resend.dev` which has rate limits and doesn't carry the Quantfoli brand. Add in Vercel Production scope and redeploy.

### 6.3 Optional — Sentry (currently unset)

| Var | When |
|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | Activates client-side error capture |
| `SENTRY_DSN` | Activates server + edge error capture |
| `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` | Activates source-map upload for clean stack traces |

---

## 7. Approaches that didn't work this session

| Attempt | Why it failed | Resolution |
|---|---|---|
| Diagnosing DNS via MxToolbox web UI through WebFetch | MxToolbox results page is JS-rendered. WebFetch only sees the static HTML shell, which describes the tool but returns no actual query results. | Used `Resolve-DnsName` in PowerShell directly. Faster, scriptable, no rate limits. Recipe in §3.4 above. |
| Adding MX record in Namecheap | Namecheap free plan blocks "Custom MX" — UI only exposes "MXE Record" (proprietary IP-redirect type, useless for Resend). Paid "Private Email" plan (~CHF 11/yr) unlocks real MX. | Migrated DNS to Cloudflare (free, no upsells). |
| Cloudflare DNS auto-import from Namecheap | Imported most records but missed/garbled long DKIM TXT values when tested. Risk too high to trust silently. | Manually re-added all 4 Resend records in Cloudflare before flipping nameservers. Took 5 minutes, eliminated risk. |
| Setting `RESEND_FROM` before DNS verification | Pointless — Resend would reject `<support@quantfoli.com>` as unverified sender domain. | Wait for all 4 records green in Resend first (now done), then set the env var. |
| Initial Sentry import `export { onRequestError } from '@sentry/nextjs'` | Sentry v10 doesn't export that name. Build error: `Module '"@sentry/nextjs"' has no exported member 'onRequestError'`. | Renamed to `captureRequestError as onRequestError`. Detected by inspecting `Object.keys(require('@sentry/nextjs'))`. |
| Sentry config without DSN-conditional gates | First draft initialized Sentry unconditionally. Would cause noisy warnings in dev + potentially fail builds without env vars. | All 3 configs now check for DSN first and skip `init()` if missing. Result: shipping the SDK to prod with no env vars is a true no-op. |
| Pre-emptive testing of the site after Cloudflare nameserver flip without flushing local DNS | Got `DNS_PROBE_POSSIBLE` on Dariush's machine. Public DNS was fine (8.8.8.8 / 1.1.1.1 resolved correctly), local resolver had cached the dead Namecheap state. | `ipconfig /flushdns` + hard refresh. Always recommend this as the first debugging step post-migration. |

**Approaches from prior sessions still relevant (not re-tried this session):**

- Putting demo MP4 (~81 MB) into the repo — still deferred. Recommendation: YouTube unlisted embed or ffmpeg-compressed self-host.
- Action-shaped Advisor feature wording — already corrected to descriptive-only in session 7, do not regress.
- End-to-end Advisor testing with real money — refunded last time, **never repeat in live mode**. Use Stripe Test Mode + card `4242 4242 4242 4242`.

---

## 8. Outstanding blockers / known issues

| Severity | Issue | Where to fix |
|---|---|---|
| 🟠 **`RESEND_FROM` not set in Vercel** | Support form + founder-notification email currently use `onboarding@resend.dev` fallback. Rate-limited and unbranded. | Vercel → quantfoli → Settings → Env Vars → add `RESEND_FROM=Quantfoli Support <support@quantfoli.com>` (Production scope) → redeploy. |
| 🟠 **No welcome email on signup** | New users get no onboarding touch. Resend is now unblocked, this is shipping-ready. | See §10.1. |
| 🟡 **No error monitoring active** | Sentry SDK is installed but dormant. Webhook 500s and API failures are invisible until a customer complains. | Activate per §4.2 (5 min: sign up + env vars + redeploy). |
| 🟡 **No analytics on landing-page conversion** | Vercel Analytics tracks pageviews but not signup funnel events. | Add `track()` calls on key actions: signup-start, signup-complete, checkout-start, checkout-complete. Or wire PostHog free tier. |
| 🟡 **Sitemap not submitted to Google** | `/sitemap.xml` is live but no search engine knows. | Google Search Console → verify domain (TXT in Cloudflare) → submit sitemap URL. 5 min. |
| 🟡 **Untracked finances files** | `app/finances/page.tsx` + `components/FinancesSheet.tsx` sitting uncommitted across multiple sessions now. | Next session, just ask Dariush: commit + what gating, or remove. |
| 🟡 **Untested I/O code** | `lib/yahoo.ts` math is tested (36 tests), but I/O wrappers (`getCurrentPrice`, `getHistoricalPrices`, `getFundamentals`) untested. | Add `vi.mock('fetch')` tests when one of those functions is next refactored. Lower ROI than math; defer. |
| 🟡 | Markowitz frontier uses historical means as forward expected returns (textbook over-fit). | Acceptable for MVP. Long-term: shrinkage estimator (Ledoit-Wolf or James-Stein). |
| 🟡 | RLS not strictly enforced on `portfolio` / `user_tiers` (frontend-only Pro gating; API checks auth but not tier). | Harden before scaling past ~10 paying users. |
| 🟢 | McAfee WebAdvisor flags `quantfoli.com` as "not verified" on Dariush's machine. | Submit to `https://www.trustedsource.org/` for re-categorisation (Finance / Banking). 3–7 day review. |
| 🟢 | Stripe customer-support phone is currently `+41 000 000 0000` placeholder. Visible on customer card statements. | Replace with real number before scaling — non-working phone increases chargeback risk. |
| 🟢 | DMARC policy is `p=none;` (monitoring only). | Once email volume grows, tighten to `p=quarantine` or `p=reject` for anti-spoofing. |

---

## 9. Honesty status — public claims vs reality (unchanged from session 7)

| Claim | Backed by code? |
|---|---|
| "Markowitz Efficient Frontier" | ✅ `app/api/frontier/route.ts` — 5,000-MC Monte Carlo with weight caps |
| "Historical Stress Testing — dot-com, 2008, COVID, 2022" | ✅ `app/api/stress/route.ts` (4 scenarios) |
| "Sharpe · Sortino · Beta · Alpha" | ✅ `lib/yahoo.ts` — backed by 36 unit tests |
| "Multi-currency, FX-aware to ±0.2%" | ✅ Validated manually against ZKB statement |
| "ZKB · Yuh · Neon CSV import" | ✅ `lib/parsers/` |
| Advisor: "Model-optimal weights (Markowitz, historical covariance)" | ✅ Computed manually with Claude assistance, delivered via email |
| Advisor: "Factor exposure breakdown (Fama-French)" | ⚠️ Fulfillable manually but not yet templated |
| Advisor: "Priority support · 24h response" | ⚠️ Aspirational. At 1 subscriber easy |

Residual legal risk: FINMA / FIDLEG ambiguity around frontier + Advisor. Disclaimer + descriptive-only wording + audit row + Schaffhausen jurisdiction = defensible at <10 Advisor users. Past that, **budget CHF 2–5k for a Swiss legal opinion** before scaling Advisor marketing.

---

## 10. Next concrete steps (priority order)

### 10.1 High-leverage code (~15–30 min each)

1. **Set `RESEND_FROM` env var in Vercel** (5 min, Dariush action). See §6.2.

2. **Welcome email on signup.** Now that Resend is verified, this is straightforward:
   - **Option A (simplest):** add to `app/page.tsx` or a client-side first-dashboard-load effect — check `user.user_metadata.welcomed`, send via `lib/resend.ts`, then set `welcomed: true` via Supabase update. Idempotent.
   - **Option B (cleaner):** Supabase auth hook → fires server-side on user creation → calls a `/api/internal/welcome` route. More robust but needs the Supabase auth-hook config.
   - **Content:** friendly intro, link to dashboard, link to /support, mention 7-day free Pro trial if you ever add one. Keep it short. Plain text or minimal HTML.

3. **Activate Sentry** (5 min, Dariush action). See §4.2. The SDK is shipped — adding 2 env vars is all that's left.

4. **Submit sitemap to Google** (5 min, Dariush action):
   - Google Search Console → Add Property → `quantfoli.com`
   - Verification → DNS → copy the TXT record → add in Cloudflare DNS panel (DNS only, grey cloud)
   - Click verify in Google
   - Sitemaps → submit `https://quantfoli.com/sitemap.xml`

### 10.2 Decisions waiting

5. **Decide on `app/finances/`** — commit (with what gating?) or remove. Has been deferred 2 sessions in a row.

6. **Replace Stripe support phone** `+41 000 000 0000` with a real number before scaling.

### 10.3 Marketing (Dariush's move, not code)

7. **LinkedIn launch post** — 18, HSG-bound, shipped a SaaS with paying users + 3 tiers + civil/regulatory-grade legal layer. Strong signal for his network + future internships.

8. **r/SwissPersonalFinance long-form German post** — walk through Sharpe + Frontier on a sample portfolio. Educational tone, Quantfoli as the tool.

### 10.4 Future / backlog (defer)

9. RLS hardening on `portfolio` + `user_tiers` once paying users > 10.
10. Add `vi.mock('fetch')` tests for `getCurrentPrice` / `getHistoricalPrices` / `getFundamentals`.
11. Markowitz frontier: replace raw historical means with shrinkage estimator (Ledoit-Wolf / James-Stein).
12. Email-based magic link signin (drop password requirement).
13. Replace Alpha Vantage with Financial Modeling Prep ($14/mo). Revive Fundamentals tab.
14. Annual revenue + LTV dashboard for Dariush's own use.
15. Submit `quantfoli.com` to McAfee TrustedSource + Norton Safe Web for reputation clearing.
16. Swiss legal opinion on FIDLEG (~CHF 2–5k) once Advisor revenue justifies (>CHF 5k/mo).
17. Build automated Advisor report generation (Markdown template + Claude API call pulling from `portfolio` table) when Advisor subscribers > 3.
18. Beraterregister registration once Advisor subscribers > 10–20 (~CHF 2–4k upfront + ~CHF 500–1k/yr Ombudsstelle).
19. Tighten DMARC from `p=none;` to `p=quarantine` or `p=reject` once email volume justifies.
20. Refactor `app/api/support/route.ts` to use `lib/resend.ts` helper for consistency (currently duplicates the fetch boilerplate).

---

## 11. Architecture quick-ref

```
/
├── app/
│   ├── page.tsx                          # SERVER: auth check → Landing or Dashboard
│   ├── layout.tsx                        # 🔄 Enriched SEO metadata
│   ├── sitemap.ts                        # 🆕 /sitemap.xml route
│   ├── robots.ts                         # 🆕 /robots.txt route
│   ├── opengraph-image.tsx               # 🆕 Dynamic 1200×630 share card
│   ├── login/page.tsx
│   ├── support/page.tsx
│   ├── privacy/page.tsx
│   ├── terms/page.tsx
│   ├── advisor-legal/page.tsx
│   ├── finances/page.tsx                 # ⚠️ Uncommitted, ignore for now
│   ├── globals.css                       # --accent* tokens, [data-tier] overrides
│   └── api/
│       ├── support/route.ts              # SUPPORT_TO = dariush.tahajomi@gmail.com
│       ├── advisor/accept-disclaimer/route.ts
│       ├── stripe/{checkout,portal,tier}/route.ts
│       ├── webhooks/stripe/route.ts      # 🔄 + founder notification on Advisor transition
│       └── portfolio/, history/, benchmark/, frontier/, stress/, risk/, fx/, isin/, fundamentals/
├── components/
│   ├── Dashboard.tsx                     # data-tier theming
│   ├── Landing.tsx, LandingClient.tsx
│   ├── Footer.tsx
│   ├── UpgradeModal.tsx                  # 3-card layout + Advisor checkbox
│   ├── ProGate.tsx
│   ├── FrontierChart.tsx
│   ├── LegalLayout.tsx
│   ├── FinancesSheet.tsx                 # ⚠️ Uncommitted, ignore for now
│   └── parsers UI: ZkbImport, YuhImport, NeonImport
├── lib/
│   ├── stripe.ts                         # Tier type, PRICE_IDS, ADVISOR_*
│   ├── advisor-terms.ts                  # ADVISOR_TERMS_VERSION = v1.1-2026-05-16
│   ├── resend.ts                         # 🆕 Generic email helper
│   ├── supabase.ts, supabase-browser.ts
│   ├── yahoo.ts                          # ⚠️ DO NOT TOUCH — math
│   ├── yahoo.test.ts                     # 36 passing tests
│   ├── fx.ts, ticker-meta.ts
│   └── parsers/{zkb,yuh,neon}.ts
├── supabase/migrations/
│   ├── 20260430_neon_transactions.sql
│   ├── 20260507_stripe_tiers.sql
│   └── 20260516_advisor_tier_and_disclaimer.sql
├── sentry.client.config.ts               # 🆕 DSN-conditional
├── sentry.server.config.ts               # 🆕
├── sentry.edge.config.ts                 # 🆕
├── instrumentation.ts                    # 🆕 Sentry runtime hook
├── next.config.js                        # 🔄 Conditional withSentryConfig wrap
├── middleware.ts                         # + /advisor-legal in public pages
├── vitest.config.ts
└── package.json                          # + @sentry/nextjs ^10.53.1
```

### Test + build commands

```bash
npm test            # one-shot test run (36 tests)
npm run test:watch  # TDD mode
npm run build       # production build (also catches type errors)
npm run dev         # localhost:3000
```

---

## 12. Personal context for the fresh agent

- **Dariush is 18, Matura in 2026, HSG St. Gallen starting 2027.** Tool functions as proof-of-competence for his LinkedIn network and future internships (IB/quant/consulting) and might become a startup / side business.
- **Status:** Einzelunternehmen in Schaffhausen. No formal registration required at current scale. Will register with Ausgleichskasse as selbstständig once profit > ~CHF 2.3k/yr regelmässig.
- **First paying user converted (Pro, CHF 15/mo) in an earlier session.** Yearly tier (CHF 150/yr) shipped in session 6. Advisor tier (CHF 50/mo, CHF 500/yr) shipped in session 7. No paying Advisor customer yet — Dariush is on Advisor himself (his own end-to-end test) until 12.06.2026, then drops to Free.
- **Mom is the "designed first user"** for usability — NOT product-market fit. Real ICP is engineer/quant-adjacent Swiss male, 30–55, six-figure portfolio at ZKB/Yuh, technically literate, frustrated by Swiss bank reporting.
- **He grants full autonomous file operations** — no confirmations needed for code changes. **Pushes to GitHub require explicit `push` command** (see `~/.claude/memory/feedback_autonomy.md`).
- **Communication style:** brutally honest, terse, no fluff. Prefers reality checks over validation. Caveman feedback (`bad`, `too long`, `wrong`, `deeper`, `build`, `fix`, `push`, etc.) — see `~/.claude/CLAUDE.md` for the full protocol.
- **Email canonical address:** `dariush.tahajomi@gmail.com`. Resend account email is `dtahajomi2007@gmail.com`. All transactional + support email lands at the canonical address.
- **Global rule:** load Obsidian brain at session start (`C:\AI_System\obsidian_vault\Obsidian\brain`). Mandatory per Dariush's global CLAUDE.md.
- **Caveman style applies to CHAT ONLY.** Files (this handoff, code, docs) are written in full structured prose. Code is always clean and production-grade.
- **Decisions made on his behalf this session** (push back if any were wrong):
  - Chose **single bundled commit** over splitting into 3 (SEO / Sentry / founder-email). Dariush asked for it; logged here for transparency. Future preference unclear — ask next time.
  - Built Sentry **dormant by default** rather than failing-loud when DSN missing. Trade-off: silent until activated. Rationale: shipping the SDK shouldn't break production while waiting for Dariush to create a Sentry account.
  - Built `lib/resend.ts` as a **generic helper** rather than inlining the fetch call into the webhook. Adds 30 lines for the abstraction. Worth it because welcome email + future Advisor-report-delivery email will all use the same helper.
  - **Did NOT refactor `app/api/support/route.ts`** to use the new helper. The duplication is minor and the refactor would be churn this session. Logged as §10.4 item 20.
  - Used `prevTier !== 'advisor'` guard on founder notification, computed BEFORE the upsert. Alternative would have been to write the notification dispatch into a separate cron / queue. The synchronous in-webhook approach is fine at current scale (<1 Advisor signup per day).
  - Kept Cloudflare apex + www records **proxied (orange cloud)**. Vercel handles its own SSL handshake correctly with Cloudflare Full mode (the SSL config didn't need a touch since the working state is the default Cloudflare-to-Vercel pairing). If proxy ever causes 502s, instructions to disable are in §3.3.

---

## 13. Files to read first if you're a fresh agent

In this order:

1. **`HANDOFF.md`** (this file) — context
2. **`lib/stripe.ts`** + **`lib/advisor-terms.ts`** — pricing data model
3. **`lib/resend.ts`** — email helper used by webhook + future welcome email
4. **`lib/yahoo.ts`** + **`lib/yahoo.test.ts`** — math + regression suite
5. **`app/api/stripe/checkout/route.ts`** + **`app/api/webhooks/stripe/route.ts`** — full subscription lifecycle + founder notification
6. **`app/api/advisor/accept-disclaimer/route.ts`** — civil-defense audit endpoint
7. **`components/UpgradeModal.tsx`** — Advisor checkbox + 3-card layout
8. **`components/Dashboard.tsx`** — main app shell with `data-tier` theming
9. **`components/LegalLayout.tsx`** — shared legal-pages shell
10. **`app/layout.tsx`** + **`app/sitemap.ts`** + **`app/robots.ts`** + **`app/opengraph-image.tsx`** — SEO package
11. **`app/globals.css`** — design system + `--accent*` tier tokens
12. **`instrumentation.ts`** + **`sentry.*.config.ts`** — error monitoring (dormant)
13. **`next.config.js`** — Sentry build wrap (conditional)
14. **`middleware.ts`** — auth gate
15. **`supabase/migrations/20260516_advisor_tier_and_disclaimer.sql`** — DB schema for Advisor

---

## 14. Memory references

Persistent memory in `~/.claude/projects/C--AI-System-finance-dashboard-nextjs/memory/` (and also `~/.claude/projects/C--Users-Dariush-Tahajomi/memory/` from older session paths):

- `user_profile.md` — Dariush context
- `project_obsidian.md` — separate Obsidian vault (referenced by global CLAUDE.md)
- `feedback_autonomy.md` — autonomous operation granted, push requires explicit ask
- `feedback_tasks_format.md` — daily task file format (Obsidian, not this repo)
- `feedback_obsidian_links.md` — Obsidian backlink conventions
- `feedback_obsidian_permissions.md` — no confirmation prompts for Obsidian files

Global instructions in `~/.claude/CLAUDE.md`. Mandatory: load Obsidian brain at session start.

---

**End of handoff. The next session can read this file and resume cleanly.**

**Immediate pickup point:**

1. **Verify deployment is live.** Open https://quantfoli.com — should load. Check `https://quantfoli.com/sitemap.xml` returns XML. Check `https://quantfoli.com/robots.txt` returns the rules. Check `https://quantfoli.com/opengraph-image` returns the purple PNG.
2. **Confirm `RESEND_FROM` is set** in Vercel Production. If not, ask Dariush to add it (§6.2). 5 min, unblocks branded email sending.
3. **Welcome email on signup** (§10.1 step 2) is the next high-leverage build. Resend is unblocked, this is shipping-ready.
4. **Sentry activation** (§10.1 step 3) is a 5-min Dariush action — guide him through the signup + env vars when he's ready.
5. **Submit sitemap to Google Search Console** (§10.1 step 4) so the new SEO work actually drives traffic.
6. **Then:** decide on `app/finances/`, replace Stripe support phone, marketing posts.
