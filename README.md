# Portfolio Intelligence Tool — Next.js

> Professional finance dashboard for portfolio tracking, benchmarking, and quantitative risk analysis.  
> Migrated from Streamlit → **Next.js 14** · **Supabase** · **Vercel**

---

## Features

| Module | Description |
|---|---|
| **Daily P&L** | End-of-day prices via Yahoo Finance |
| **Portfolio History** | Area chart of daily portfolio value since first purchase |
| **Sharpe & Volatility** | Risk-adjusted return metrics, annualised |
| **S&P 500 Benchmark** | Side-by-side comparison, normalised to 100 at first buy date |
| **Beta & Alpha** | Market sensitivity and excess return vs. index |
| **Admin View** | Password-protected master database view |

## Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts
- **Backend:** Next.js API Routes (TypeScript)
- **Database:** PostgreSQL via Supabase
- **Data:** Yahoo Finance (EOD prices, FX rates, ISIN lookup)
- **Hosting:** Vercel

## Local Setup

```bash
git clone https://github.com/dariushfinance/finance-dashboard-nextjs
cd finance-dashboard-nextjs
npm install

cp .env.example .env.local
# → fill in your Supabase + Stripe credentials

npm run dev
# → http://localhost:3000
```

## Database

Create the `portfolio` table in your Supabase SQL editor:

```sql
CREATE TABLE IF NOT EXISTS portfolio (
  id        BIGSERIAL PRIMARY KEY,
  user_id   TEXT NOT NULL DEFAULT 'default',
  ticker    TEXT NOT NULL,
  shares    REAL NOT NULL,
  buy_price REAL NOT NULL,
  buy_date  TEXT NOT NULL
);
```

## Deploy to Vercel

1. Push to GitHub
2. Import repo at [vercel.com/new](https://vercel.com/new)
3. Add environment variables from `.env.example`
4. Deploy

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRO_PRICE_ID` | Stripe price ID for Pro tier |
| `RESEND_API_KEY` | Resend API key for support emails |

---

Built by [Dariush Tahajomi](https://linkedin.com/in/dariushtahajomi) · HSG St. Gallen 2027
