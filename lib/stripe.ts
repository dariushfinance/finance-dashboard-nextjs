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
  pro:        process.env.STRIPE_PRO_PRICE_ID!,
  pro_yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
} as const

export type PlanKey = keyof typeof PRICE_IDS

// Maps any plan key back to the tier value stored in user_tiers.tier
export const PLAN_TIER: Record<PlanKey, 'pro'> = {
  pro:        'pro',
  pro_yearly: 'pro',
}

export type IntervalKey = 'monthly' | 'yearly'

export const PRO_INTERVALS: Record<IntervalKey, {
  planKey:  PlanKey
  label:    string
  price:    string
  period:   string
  savings:  string | null
}> = {
  monthly: {
    planKey: 'pro',
    label:   'Monthly',
    price:   'CHF 15',
    period:  '/mo',
    savings: null,
  },
  yearly: {
    planKey: 'pro_yearly',
    label:   'Yearly',
    price:   'CHF 150',
    period:  '/yr',
    savings: '2 months free',
  },
}

const PRO_FEATURES = [
  'Everything in Free',
  'Sharpe · Beta · Alpha · Sortino',
  'Efficient Frontier (MPT)',
  'Stress Testing',
  'Risk Diversification Score',
  'Rolling Vol Regime · Correlation Matrix',
]

export const PLANS = {
  free: {
    name: 'Free',
    price: 'CHF 0',
    period: '',
    features: [
      'Portfolio tracker & P&L',
      'EOD prices (Yahoo Finance)',
      'S&P 500 Benchmark',
      'CSV + Swiss Broker Import',
      'Multi-Currency display',
    ],
  },
  pro: {
    name: 'Pro',
    price: 'CHF 15',
    period: '/mo',
    features: PRO_FEATURES,
  },
} as const

export const PRO_FEATURE_LIST = PRO_FEATURES
