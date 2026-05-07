import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not set')
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-04-22.dahlia' })
  }
  return _stripe
}

export const PRICE_IDS = {
  pro:     process.env.STRIPE_PRO_PRICE_ID!,
  pro_max: process.env.STRIPE_PRO_MAX_PRICE_ID!,
} as const

export type PlanKey = keyof typeof PRICE_IDS

export const PLANS = {
  free: {
    name: 'Free',
    price: 'CHF 0',
    period: '',
    features: [
      'Portfolio tracker & P&L',
      'EOD prices (Alpha Vantage)',
      'S&P 500 Benchmark',
      'CSV + Swiss Broker Import',
      'Multi-Currency display',
    ],
  },
  pro: {
    name: 'Pro',
    price: 'CHF 12',
    period: '/mo',
    features: [
      'Everything in Free',
      'Sharpe · Beta · Alpha · Sortino',
      'Efficient Frontier (MPT)',
      'Stress Testing',
      'Full Fundamentals (P/E, EV/EBITDA, FCF)',
      'Risk Diversification Score',
      'Rolling Vol Regime · Correlation Matrix',
    ],
  },
  pro_max: {
    name: 'Pro Max',
    price: 'CHF 19',
    period: '/mo',
    features: [
      'Everything in Pro',
      'AI Portfolio Advisor (Claude)',
      'What-if Simulator',
      'Tax Lot Tracking',
      'Fama-French Factor Attribution',
      'Broker CSV Parser Advanced',
    ],
  },
} as const
