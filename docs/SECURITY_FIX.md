# Security Fix — Admin brute-force vulnerability

**Date:** 2026-05-22
**Reporter:** Dominik Buchegger (HSG-Lehrstuhl)
**Status:** Fix implemented, pending deploy and manual Vercel/Cloudflare steps.

---

## Admin endpoint inventory (pre-fix)

| Route | Purpose | Auth | Rate limited |
|---|---|---|---|
| `POST /api/admin/verify` | Plaintext compare against `ADMIN_PASSWORD` env var | `===` on env string | No |

No other `/api/admin/*` routes existed. No `/api/auth/*`. The Stripe webhook uses signature verification (HMAC), not a brute-force surface.

---

## Resolution: endpoint removed, not hardened

The reported endpoint (`/api/admin/verify`) was **orphaned** — no frontend page, no other server code, no UI surface called it. The admin password protected nothing functional. Hardening it would have added attack surface for zero benefit.

**Action taken:** deleted `app/api/admin/` entirely. The brute-force surface no longer exists.

Operational admin needs (viewing users, contact info, subscriptions) are already served by:
- Supabase Auth dashboard — user accounts and emails
- Stripe dashboard — subscriptions, billing
- Supabase SQL editor — ad-hoc queries

---

## Preventive rate limiting on remaining sensitive routes

`lib/rate-limit.ts` — in-memory sliding-window limiter, periodic cleanup, IP extraction via `cf-connecting-ip` → `x-forwarded-for` → `x-real-ip`.

Applied to:

| Route | Limit | Key |
|---|---|---|
| `POST /api/stripe/checkout` | 10 / min | IP |
| `POST /api/support` | 10 / min | IP |
| `POST /api/frontier` | 20 / min | Authenticated user ID |
| `POST /api/stress` | 20 / min | Authenticated user ID |
| `POST /api/benchmark` | 20 / min | Authenticated user ID |
| `POST /api/history` | 20 / min | Authenticated user ID |

Heavy-compute routes use **user ID** (not IP) so users behind corporate NAT don't share a counter.

Public read-only price/FX routes (`/api/prices`, `/api/fx`, `/api/markets`, etc.) are not rate-limited at the app layer — Cloudflare caching handles those. The Stripe webhook is not rate-limited (HMAC-signed, would break legitimate Stripe retries).

Rate-limit response: `429`, with `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers, and JSON body `{ "error": "Too many attempts. Try again later.", "resetAt": <ms> }`. FIDLEG-reviewed: no financial-advice content.

Tests: `lib/rate-limit.test.ts` — 9 tests covering allow/block/reset/isolation and all header-extraction fallbacks. `npx vitest run lib/rate-limit.test.ts` passes.

---

## Cloudflare WAF — additional edge-layer defense (manual)

These steps must be done by Dariush in the Cloudflare dashboard. Edge rate limiting blocks abuse before it reaches Vercel — defense in depth on top of the app-layer limits above.

1. Cloudflare Dashboard → `quantfoli.com` → **Security → WAF → Rate limiting rules**
2. **Create rule "Stripe checkout abuse protection":**
   - Field: `URI Path` | Operator: `contains` | Value: `/api/stripe/checkout`
   - Rate: `20 requests per 1 minute` per IP
   - Action: **Block** (HTTP 429)
   - Block duration: `10 minutes`
3. **Create rule "Support form abuse protection":**
   - Field: `URI Path` | Operator: `equals` | Value: `/api/support`
   - Rate: `20 requests per 1 minute` per IP
   - Action: **Block** (HTTP 429)
   - Block duration: `10 minutes`
4. **(Optional, recommended) Catch-all auth/admin protection** for any future `/api/admin/*` or `/api/auth/*` paths:
   - Field: `URI Path` | Operator: `contains` | Value: `/api/admin` (and a second rule for `/api/auth`)
   - Rate: `10 requests per 1 minute` per IP
   - Action: **Block**

Edge thresholds are intentionally **higher** than app-layer thresholds — the app layer is the primary control, Cloudflare is a backstop for distributed/extreme abuse.

---

## Manual follow-ups for Dariush

- [ ] **Delete `ADMIN_PASSWORD` env var** in Vercel project settings (no longer used).
- [ ] Remove `ADMIN_PASSWORD` from local `.env.local` if present.
- [ ] Apply Cloudflare WAF rules above.
- [ ] Reply to Dominik Buchegger with:
  > The reported `/api/admin/verify` endpoint has been removed entirely — it was orphaned dead code, no frontend used it. Preventive rate limiting (app layer + Cloudflare WAF) has been added to remaining sensitive POST routes (`/api/stripe/checkout`, `/api/support`, plus heavy-compute portfolio routes scoped per authenticated user). Happy for you to re-test.

---

## Local verification command

```bash
# Should succeed 10 times on checkout (auth will 401, but that's fine —
# we're testing rate limit hits before/after the limit).
for i in {1..15}; do
  curl -X POST https://quantfoli.com/api/stripe/checkout \
    -H "Content-Type: application/json" \
    -d '{"plan":"pro"}' \
    -w "Attempt $i — Status: %{http_code}\n" \
    -o /dev/null -s
done
# Expect: first ~10 return 401 (unauthenticated), then 429 with Retry-After header.
```

---

## Notes on what was NOT logged

Failed-auth logs (where they exist) contain: timestamp, IP, route. They do **not** contain submitted passwords, headers other than the IP, request bodies, or any user-supplied secret material.
