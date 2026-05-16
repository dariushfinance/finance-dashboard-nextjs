import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createServerClient } from '@/lib/supabase'
import { sendEmail } from '@/lib/resend'
import type Stripe from 'stripe'

const FOUNDER_EMAIL = 'dariush.tahajomi@gmail.com'

const TIER_MAP: Record<string, string> = {
  [process.env.STRIPE_PRO_PRICE_ID!]:            'pro',
  [process.env.STRIPE_PRO_YEARLY_PRICE_ID!]:     'pro',
  [process.env.STRIPE_ADVISOR_PRICE_ID!]:        'advisor',
  [process.env.STRIPE_ADVISOR_YEARLY_PRICE_ID!]: 'advisor',
}

const PLAN_NAME: Record<string, string> = {
  [process.env.STRIPE_ADVISOR_PRICE_ID!]:        'advisor',
  [process.env.STRIPE_ADVISOR_YEARLY_PRICE_ID!]: 'advisor_yearly',
}

type UpsertResult = {
  userId: string | null
  prevTier: string | null
  newTier: string
  priceId: string
  customerId: string
}

async function upsertSubscription(
  sub: Stripe.Subscription,
  db: ReturnType<typeof createServerClient>
): Promise<UpsertResult | null> {
  const userId = sub.metadata?.user_id
  if (!userId) {
    console.error('[webhook] No user_id in subscription metadata', sub.id)
    return null
  }

  const priceId  = sub.items.data[0]?.price.id ?? ''
  const tier     = TIER_MAP[priceId] ?? 'pro'
  const isActive = sub.status === 'active' || sub.status === 'trialing'
  const newTier  = isActive ? tier : 'free'

  const raw = (sub as unknown as Record<string, unknown>)
  const periodEnd = typeof raw.current_period_end === 'number'
    ? new Date(raw.current_period_end * 1000).toISOString()
    : null

  const customerId = typeof sub.customer === 'string' ? sub.customer : (sub.customer as Stripe.Customer).id

  const { data: prev } = await db
    .from('user_tiers')
    .select('tier')
    .eq('user_id', userId)
    .maybeSingle()

  const { error } = await db.from('user_tiers').upsert({
    user_id:                 userId,
    tier:                    newTier,
    stripe_customer_id:      customerId,
    stripe_subscription_id:  sub.id,
    subscription_status:     sub.status,
    current_period_end:      periodEnd,
    updated_at:              new Date().toISOString(),
  }, { onConflict: 'user_id' })

  if (error) {
    console.error('[webhook] Supabase upsert error:', error)
    return null
  }
  console.log('[webhook] tier upserted:', userId, newTier)
  return { userId, prevTier: prev?.tier ?? null, newTier, priceId, customerId }
}

async function notifyFounderAdvisorSignup(
  result: UpsertResult,
  db: ReturnType<typeof createServerClient>
) {
  const { userId, priceId, customerId } = result
  if (!userId) return

  const { data: userRow } = await db.auth.admin.getUserById(userId)
  const customerEmail = userRow?.user?.email ?? '(unknown email)'

  const { data: disclaimer } = await db
    .from('advisor_disclaimers')
    .select('accepted_at, terms_version, ip_address, user_agent')
    .eq('user_id', userId)
    .order('accepted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const plan = PLAN_NAME[priceId] ?? 'advisor'
  const stripeUrl = `https://dashboard.stripe.com/customers/${customerId}`

  const text = [
    `New Quantfoli Advisor subscriber.`,
    ``,
    `Customer:        ${customerEmail}`,
    `User ID:         ${userId}`,
    `Plan:            ${plan}`,
    `Subscribed at:   ${new Date().toISOString()}`,
    `Stripe customer: ${stripeUrl}`,
    ``,
    `Disclaimer acceptance:`,
    `  Accepted at:   ${disclaimer?.accepted_at ?? '(no row found — investigate)'}`,
    `  Terms version: ${disclaimer?.terms_version ?? '(missing)'}`,
    `  IP address:    ${disclaimer?.ip_address ?? '(missing)'}`,
    `  User agent:    ${disclaimer?.user_agent ?? '(missing)'}`,
    ``,
    `Next action: prepare their first monthly Advisor report.`,
  ].join('\n')

  const r = await sendEmail({
    to: FOUNDER_EMAIL,
    subject: `New Advisor subscriber — ${customerEmail}`,
    text,
  })
  if (!r.ok) {
    console.error('[webhook] Founder notification email failed:', r.error)
  } else {
    console.log('[webhook] Founder notified of new Advisor subscriber:', customerEmail)
  }
}

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe()
    const body   = await req.text()
    const sig    = req.headers.get('stripe-signature')!

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[webhook] Signature verification failed:', msg)
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
    }

    const db = createServerClient()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const sub = await stripe.subscriptions.retrieve(session.subscription as string)

        if (!sub.metadata?.user_id && session.metadata?.user_id) {
          await stripe.subscriptions.update(sub.id, {
            metadata: { user_id: session.metadata.user_id, plan: session.metadata.plan ?? 'pro' },
          })
          sub.metadata = { ...sub.metadata, user_id: session.metadata.user_id }
        }
        const result = await upsertSubscription(sub, db)
        if (result && result.newTier === 'advisor' && result.prevTier !== 'advisor') {
          await notifyFounderAdvisorSignup(result, db)
        }
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const result = await upsertSubscription(sub, db)
        if (result && result.newTier === 'advisor' && result.prevTier !== 'advisor') {
          await notifyFounderAdvisorSignup(result, db)
        }
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
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[webhook] Unhandled error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
