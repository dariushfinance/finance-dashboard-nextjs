# Portfolio Intelligence Tool — Next.js

> Professional finance dashboard for portfolio tracking, benchmarking, and fundamental analysis.  
> Migrated from Streamlit → **Next.js 14** · **Supabase** · **Vercel**

---

## Features

| Module | Description |
|---|---|
| **Live P&L** | Real-time prices via Alpha Vantage + Yahoo Finance fallback |
| **Portfolio History** | Area chart of daily portfolio value since first purchase |
| **Sharpe & Volatility** | Risk-adjusted return metrics, annualised |
| **S&P 500 Benchmark** | Side-by-side comparison, normalised to 100 at first buy date |
| **Beta & Alpha** | Market sensitivity and excess return vs. index |
| **Company Fundamentals** | P/E, EV/EBITDA, P/S, Gross Margin, ROE, FCF Yield, D/E |
| **Admin View** | Password-protected master database view |

## Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts
- **Backend:** Next.js API Routes (TypeScript)
- **Database:** PostgreSQL via Supabase
- **Data:** Alpha Vantage API + Yahoo Finance (fallback)
- **Hosting:** Vercel

## Local Setup

```bash
git clone https://github.com/dariushfinance/finance-dashboard-nextjs
cd finance-dashboard-nextjs
npm install

cp .env.example .env.local
# → fill in your Supabase + Alpha Vantage credentials

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
| `ALPHA_VANTAGE_KEY` | Alpha Vantage API key |
| `ADMIN_PASSWORD` | Admin panel password |

---

Built by [Dariush Tahajomi](https://linkedin.com/in/dariushtahajomi) · HSG St. Gallen 2026
