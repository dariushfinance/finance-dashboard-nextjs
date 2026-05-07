import { NextRequest, NextResponse } from 'next/server'
import { stripe, PRICE_IDS, type PlanKey } from '@/lib/stripe'
import { getAuthUser, createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan } = await req.json() as { plan: PlanKey }
  if (!PRICE_IDS[plan]) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const db = createServerClient()

  // Fetch or create Stripe customer
  const { data: tierRow } = await db
    .from('user_tiers')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  let customerId = tierRow?.stripe_customer_id

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

  const session = await stripe.checkout.sessions.create({
    customer:            customerId,
    mode:                'subscription',
    line_items:          [{ price: PRICE_IDS[plan], quantity: 1 }],
    success_url:         `${origin}/?upgraded=1`,
    cancel_url:          `${origin}/`,
    payment_method_types: ['card'],
    metadata:            { user_id: user.id, plan },
    subscription_data:   { metadata: { user_id: user.id, plan } },
  })

  return NextResponse.json({ url: session.url })
}
