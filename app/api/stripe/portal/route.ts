import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getAuthUser, createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServerClient()
  const { data: tierRow } = await db
    .from('user_tiers')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  if (!tierRow?.stripe_customer_id) {
    return NextResponse.json({ error: 'No active subscription' }, { status: 400 })
  }

  const stripe = getStripe()
  const origin = req.headers.get('origin') ?? 'http://localhost:3000'

  const session = await stripe.billingPortal.sessions.create({
    customer:   tierRow.stripe_customer_id,
    return_url: origin,
  })

  return NextResponse.json({ url: session.url })
}
