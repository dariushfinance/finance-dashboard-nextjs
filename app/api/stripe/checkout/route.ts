import { NextRequest, NextResponse } from 'next/server'
import { getStripe, PRICE_IDS, type PlanKey } from '@/lib/stripe'
import { getAuthUser, createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan } = await req.json() as { plan: PlanKey }
  if (!PRICE_IDS[plan]) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const stripe = getStripe()
  const db = createServerClient()

  const { data: tierRow } = await db
    .from('user_tiers')
    .select('stripe_customer_id, tier')
    .eq('user_id', user.id)
    .single()

  let customerId = tierRow?.stripe_customer_id
  const currentTier = tierRow?.tier ?? 'free'

  if (currentTier === plan) {
    return NextResponse.json({ error: `Already on ${plan} plan` }, { status: 400 })
  }

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id },
    })
    customerId = customer.id

    await db
      .from('user_tiers')
      .upsert({ user_id: user.id, stripe_customer_id: customerId, tier: 'free' })
  }

  const origin = req.headers.get('origin') ?? 'http://localhost:3000'

  // If user has an active subscription, upgrade it instead of creating a new one
  if (currentTier !== 'free') {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    })
    const existing = subscriptions.data[0]

    if (existing) {
      await stripe.subscriptions.update(existing.id, {
        items: [{ id: existing.items.data[0].id, price: PRICE_IDS[plan] }],
        proration_behavior: 'always_invoice',
        metadata: { user_id: user.id, plan },
      })

      await db
        .from('user_tiers')
        .update({ tier: plan })
        .eq('user_id', user.id)

      return NextResponse.json({ url: `${origin}/?upgraded=1` })
    }
  }

  const session = await stripe.checkout.sessions.create({
    customer:             customerId,
    mode:                 'subscription',
    line_items:           [{ price: PRICE_IDS[plan], quantity: 1 }],
    success_url:          `${origin}/?upgraded=1`,
    cancel_url:           `${origin}/`,

    metadata:             { user_id: user.id, plan },
    subscription_data:    { metadata: { user_id: user.id, plan } },
  })

  return NextResponse.json({ url: session.url })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[stripe/checkout]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
