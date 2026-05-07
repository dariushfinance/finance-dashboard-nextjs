import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerClient } from '@/lib/supabase'
import type Stripe from 'stripe'

const TIER_MAP: Record<string, string> = {
  [process.env.STRIPE_PRO_PRICE_ID!]:     'pro',
  [process.env.STRIPE_PRO_MAX_PRICE_ID!]: 'pro_max',
}

async function upsertSubscription(sub: Stripe.Subscription, db: ReturnType<typeof createServerClient>) {
  const userId  = sub.metadata?.user_id
  if (!userId) return

  const priceId = sub.items.data[0]?.price.id ?? ''
  const tier    = TIER_MAP[priceId] ?? 'pro'
  const isActive = sub.status === 'active' || sub.status === 'trialing'

  await db.from('user_tiers').upsert({
    user_id:                 userId,
    tier:                    isActive ? tier : 'free',
    stripe_customer_id:      typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
    stripe_subscription_id:  sub.id,
    subscription_status:     sub.status,
    current_period_end:      new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000).toISOString(),
    updated_at:              new Date().toISOString(),
  }, { onConflict: 'user_id' })
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  const db = createServerClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription') break

      // Fetch the full subscription to get metadata + price
      const sub = await stripe.subscriptions.retrieve(session.subscription as string)
      // Attach user_id metadata if not already on the subscription
      if (!sub.metadata?.user_id && session.metadata?.user_id) {
        await stripe.subscriptions.update(sub.id, {
          metadata: { user_id: session.metadata.user_id, plan: session.metadata.plan ?? 'pro' },
        })
        sub.metadata = { ...sub.metadata, user_id: session.metadata.user_id }
      }
      await upsertSubscription(sub, db)
      break
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await upsertSubscription(sub, db)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as unknown as { subscription?: string | { id: string } }
      const subId   = typeof invoice.subscription === 'string'
        ? invoice.subscription
        : invoice.subscription?.id
      if (subId) {
        const sub = await stripe.subscriptions.retrieve(subId)
        await upsertSubscription(sub, db)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
