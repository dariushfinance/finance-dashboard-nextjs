# Signup Hardening — Solution B Spec

**Status:** Spec only. Solution A shipped 2026-05-30 (Turnstile + rate-limit + dedup + name sanitization on `/api/welcome`).
**When to implement:** After Matura week. Estimated 2–3h focused work.
**Triggered by:** Aksol email-extortionist incident, 2026-05-23, 6+ welcome emails to `dariush.tahajomi@gmail.com` in 4 minutes with junk usernames.

---

## Why A is not enough

Solution A protects the **welcome-email vector**. It does not protect:

1. **Supabase signup quota.** Anon key + URL are public (any client app needs them). An attacker can call `supabase.auth.signUp()` directly from a script, creating unconfirmed user rows. Supabase's own rate limits apply but are per-IP and generous.
2. **`signup_attempts` audit log.** A serverside choke-point is required to log every attempt (success + fail) with email-hash, IP, timestamp, source.
3. **Defense in depth.** Two layers (Turnstile on welcome + Turnstile on signup) reduces attacker surface even if one is bypassed.

---

## Architecture

Replace client-side `supabase.auth.signUp()` call with server-side `/api/signup`.

### New endpoint — `POST /api/signup`

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "min 6 chars",
  "name": "Marc Müller",
  "turnstileToken": "0.cf-issued-token"
}
```

**Pipeline:**
1. Per-IP rate limit (3/hour, 429 on breach).
2. Per-email rate limit (1/hour, silent 200 OK on breach — don't leak account existence).
3. Email format + length validation (existing pattern).
4. Password length ≥ 6 (matches client validation).
5. `verifyTurnstileToken(body.turnstileToken, ip)`. Fail → 400, log attempt.
6. `sanitizeUserName(body.name)` for display only (Supabase user_metadata).
7. Dedup check: query `signup_attempts` table for unconfirmed signup with same email in last 24h. If found → return cached response (200 OK, do NOT call Supabase, do NOT send welcome).
8. `supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: false, user_metadata: { full_name } })`. Handles its own duplicate-email logic.
9. Insert row into `signup_attempts` (email_hash, ip, success boolean, ts).
10. Send welcome email inline (no second hop). `markSent(email)`.
11. Add to Resend audience (Task 4 — fire-and-forget).
12. Return `{ ok: true, requiresConfirmation: true }`.

**Response codes:**
- 200 — success or silent-dedup
- 400 — bad body / Turnstile failed / email invalid
- 429 — IP rate-limit exceeded
- 500 — Supabase admin call failed (log, do not leak details)

### Client change — `app/portfolio/login/page.tsx`

Replace the `signUp` block:

```ts
const res = await fetch('/api/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, name: name.trim(), turnstileToken }),
})
const data = await res.json()
if (!res.ok) {
  setError(data.error ?? 'Signup failed.')
  resetTurnstile()
} else {
  setMessage('Check your email to confirm, then sign in.')
}
```

No more client-direct Supabase call for the signup path. **Signin** keeps the existing client-side `signInWithPassword`.

### Migration — `supabase/migrations/<date>_signup_attempts.sql`

```sql
create table public.signup_attempts (
  id           bigserial primary key,
  email_hash   text not null,
  ip           text,
  success      boolean not null,
  created_at   timestamptz not null default now()
);
create index signup_attempts_email_hash_idx  on public.signup_attempts (email_hash, created_at desc);
create index signup_attempts_ip_idx          on public.signup_attempts (ip, created_at desc);

-- Only service-role reads. No RLS policy = locked.
alter table public.signup_attempts enable row level security;
```

**Email hash:** SHA-256 of lowercased email. Stored, not raw email, for revDSG minimization. Sufficient for dedup queries — just hash on the query side too.

### Env vars required

Already present after Solution A:
- `TURNSTILE_SECRET_KEY`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (already in Vercel)

No new env vars.

---

## Risks

- **Email enumeration.** Silent 200 OK on rate-limit breach is the standard mitigation. Confirm Supabase admin createUser does not leak via error message ("user already exists" must be normalized to the same 200 OK).
- **Welcome email moved inline.** If Resend is slow, signup feels slow. Mitigation: timeout the email call at 3s; on timeout, return success anyway and log.
- **Service-role key in route handler.** Already used elsewhere (`scripts/verify-history.ts`). Confirm the route runs in Node runtime, not Edge.

---

## Verification plan

1. **Unit tests** — `app/api/signup/route.test.ts`:
   - Rejects without Turnstile token (when key set)
   - Rejects on IP rate limit
   - Silent OK on email rate limit
   - Sanitizes junk names (verify user_metadata stored)
   - Idempotent on duplicate signup within 24h
2. **Manual prod smoke:**
   - Real signup → welcome arrives, account created
   - Same email retry within 1h → no second welcome
   - Bot harness (10 rapid requests from one IP) → 429 after 3rd
3. **Vercel logs check** — confirm `signup_attempts` rows landing.

---

## Out of scope

- Magic-link signin (backlog).
- CAPTCHA on signin form (signin is not the abuse vector; rate-limit on Supabase suffices).
- IP geoblock (Cloudflare WAF, separate decision).
