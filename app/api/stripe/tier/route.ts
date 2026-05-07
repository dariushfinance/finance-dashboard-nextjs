import { NextResponse } from 'next/server'
import { getAuthUser, createServerClient } from '@/lib/supabase'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ tier: 'free' })

  const db = createServerClient()
  const { data } = await db
    .from('user_tiers')
    .select('tier, subscription_status, current_period_end, stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({
    tier:               data?.tier ?? 'free',
    subscriptionStatus: data?.subscription_status ?? null,
    currentPeriodEnd:   data?.current_period_end ?? null,
    hasCustomer:        !!data?.stripe_customer_id,
  })
}
