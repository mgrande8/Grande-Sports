import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = createServiceRoleClient()

    // Get user's subscription
    const { data: subscription } = await serviceClient
      .from('match_analysis_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!subscription) {
      return NextResponse.json({
        hasSubscription: false,
        subscription: null,
      })
    }

    // Calculate credits remaining
    const creditsRemaining = subscription.credits_total - subscription.credits_used

    return NextResponse.json({
      hasSubscription: true,
      subscription: {
        ...subscription,
        credits_remaining: creditsRemaining,
      },
    })
  } catch (error: any) {
    console.error('Subscription status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
