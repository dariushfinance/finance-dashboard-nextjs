# AUTH_MIGRATION.md — Supabase + Stripe URL Updates

**Created:** 2026-05-24
**Related:** `docs/MERGE_ARCHITECTURE.md` (Quantfoli unified landing + `/portfolio` move)
**Audience:** Dariush — manual dashboard steps required after merging `refactor/unified-landing` to `main`.

---

## What changed in the codebase

All product routes moved from root to `/portfolio` prefix. Auth flow now lives at `/portfolio/login`, post-confirm redirects to `/portfolio`, Stripe checkout returns to `/portfolio?upgraded=1`.

The codebase is fully updated. The two external systems that hold URLs outside the repo — **Supabase** and **Stripe** — need manual review.

---

## 1. Supabase — required

Go to **Supabase Dashboard → your project → Authentication → URL Configuration**.

### Site URL

Change from:
```
https://quantfoli.com
```
to:
```
https://quantfoli.com/portfolio
```

This is the URL Supabase appends to email-confirmation links when the code does not pass an explicit `emailRedirectTo`. The code now always passes `${window.location.origin}/portfolio`, so the Site URL is a fallback — but keep it consistent.

### Redirect URLs (allow-list)

Add (or confirm present):
```
https://quantfoli.com/portfolio
https://quantfoli.com/portfolio/**
http://localhost:3000/portfolio
http://localhost:3000/portfolio/**
```

You can remove the old root entries (`https://quantfoli.com`, `https://quantfoli.com/`) after the deploy, but keeping them does no harm — the 301 redirects in `next.config.js` will catch any leftover root-targeted links.

### Email templates (optional)

If you have customised the Supabase magic-link / confirm-email templates (Authentication → Email Templates), search them for `{{ .SiteURL }}` references. The default templates use `{{ .SiteURL }}{{ .RedirectTo }}` and will work automatically. Custom templates with hard-coded `https://quantfoli.com/` paths need updating.

---

## 2. Stripe — no dashboard change needed

The Stripe **webhook endpoint** is `/api/webhooks/stripe`, which stays at root. The endpoint URL in the Stripe Dashboard (Developers → Webhooks) does not change.

**Success / cancel URLs** are passed at session-creation time from the server (`app/api/stripe/checkout/route.ts`). They are not configured in the Stripe Dashboard. The code now sends:
- success: `${origin}/portfolio?upgraded=1`
- cancel: `${origin}/portfolio`
- portal return: `${origin}/portfolio`

No action required in the Stripe Dashboard. Verify by running one test checkout post-deploy.

---

## 3. Vercel env vars — no change

No env vars need updating. If at any point you add a `NEXT_PUBLIC_SITE_URL` env var, point it at `https://quantfoli.com` (the unified host), not `/portfolio`.

---

## 4. Google Search Console — submit updated sitemap

After deploy:
1. Go to Search Console → your `https://quantfoli.com` property.
2. Sitemaps → re-submit `https://quantfoli.com/sitemap.xml`.
3. The 301 redirects in `next.config.js` preserve link equity for all old URLs (e.g. `/how-it-works` → `/portfolio/how-it-works`).
4. Optionally, request a re-crawl of high-traffic pages from URL Inspection.

---

## 5. Smoke test after deploy

Run through these in production:

| Step | Expected |
|---|---|
| Visit `https://quantfoli.com/` | New unified landing (Quantfoli + Analysts Lens cards) |
| Visit `https://quantfoli.com/portfolio` | Old portfolio landing (anon) or dashboard (auth) |
| Visit `https://quantfoli.com/how-it-works` | 301 → `/portfolio/how-it-works` |
| Visit `https://quantfoli.com/login` | 301 → `/portfolio/login` |
| Visit `https://quantfoli.com/blog` | 301 → `/portfolio/blog` |
| Visit `https://quantfoli.com/learn` | Placeholder page (200) |
| Sign up with a fresh email, confirm via the email link | Lands on `/portfolio` (dashboard view) |
| Click upgrade to Pro, complete Stripe test card `4242 4242 4242 4242` | Returns to `/portfolio?upgraded=1`, tier reflects Pro |
| Open Stripe Customer Portal, click "Back" | Returns to `/portfolio` |

If any of these fail, fastest rollback is **Vercel Dashboard → Deployments → previous deployment → Promote**.

---

## 6. Rollback

If something breaks badly:

```bash
git checkout main
git revert <merge-commit>
git push
```

Then revert the Supabase Site URL back to `https://quantfoli.com`.
