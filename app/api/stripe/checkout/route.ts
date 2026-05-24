import { NextRequest, NextResponse } from 'next/server'
import { getStripe, PRICE_IDS, PLAN_TIER, type PlanKey } from '@/lib/stripe'
import { getAuthUser, createServerClient } from '@/lib/supabase'
import { rateLimit, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIdentifier(req)
    const limit = rateLimit(`stripe-checkout:${ip}`, 10, 60_000)
    if (!limit.allowed) return rateLimitResponse(limit)

    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { plan } = await req.json() as { plan: PlanKey }
    if (!PRICE_IDS[plan]) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

    const stripe = getStripe()
    const db = createServerClient()

    // Advisor plans require a recorded disclaimer acceptance. Civil-liability defense.
    if (plan === 'advisor' || plan === 'advisor_yearly') {
      const { data: disclaimer, error: discErr } = await db
        .from('advisor_disclaimers')
        .select('id')
        .eq('user_id', user.id)
        .order('accepted_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (discErr) {
        console.error('[stripe/checkout] disclaimer lookup failed:', discErr)
        return NextResponse.json({ error: 'Could not verify disclaimer' }, { status: 500 })
      }
      if (!disclaimer) {
        return NextResponse.json(
          { error: 'Advisor terms must be accepted before subscribing.' },
          { status: 403 },
        )
      }
    }

    const { data: tierRow } = await db
      .from('user_tiers')
      .select('stripe_customer_id, tier')
      .eq('user_id', user.id)
      .single()

    let customerId = tierRow?.stripe_customer_id
    const currentTier = tierRow?.tier ?? 'free'

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
    const targetPriceId = PRICE_IDS[plan]

    // If user has an active subscription, swap to the new price instead of creating a new one
    if (currentTier !== 'free') {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1,
      })
      const existing = subscriptions.data[0]

      if (existing) {
        const existingItem = existing.items.data[0]
        if (existingItem.price.id === targetPriceId) {
          return NextResponse.json({ error: 'Already on this plan' }, { status: 400 })
        }

        await stripe.subscriptions.update(existing.id, {
          items: [{ id: existingItem.id, price: targetPriceId }],
          proration_behavior: 'always_invoice',
          metadata: { user_id: user.id, plan },
        })

        await db
          .from('user_tiers')
          .update({ tier: PLAN_TIER[plan] })
          .eq('user_id', user.id)

        return NextResponse.json({ url: `${origin}/portfolio?upgraded=1` })
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer:             customerId,
      mode:                 'subscription',
      line_items:           [{ price: targetPriceId, quantity: 1 }],
      success_url:          `${origin}/portfolio?upgraded=1`,
      cancel_url:           `${origin}/portfolio`,

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
