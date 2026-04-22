import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'
import { MATCH_ANALYSIS_PRICING } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // User must be logged in
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Please sign in to subscribe' }, { status: 401 })
    }

    const serviceClient = createServiceRoleClient()

    // Check if user already has an active subscription
    const { data: existingSub } = await serviceClient
      .from('match_analysis_subscriptions')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (existingSub) {
      return NextResponse.json({ error: 'You already have an active subscription' }, { status: 400 })
    }

    // Get or create Stripe customer
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('stripe_customer_id, email, full_name')
      .eq('id', user.id)
      .single()

    let stripeCustomerId = profile?.stripe_customer_id

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email,
        name: profile?.full_name,
        metadata: { supabase_user_id: user.id },
      })
      stripeCustomerId = customer.id

      await serviceClient
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', user.id)
    }

    // Create Stripe Checkout session for subscription
    const priceId = process.env.STRIPE_MATCH_ANALYSIS_PRICE_ID

    if (!priceId) {
      console.error('STRIPE_MATCH_ANALYSIS_PRICE_ID not configured')
      return NextResponse.json({ error: 'Subscription not configured' }, { status: 500 })
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/match-analysis/subscribe?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/match-analysis/subscribe?cancelled=true`,
      metadata: {
        type: 'match_analysis_subscription',
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
        },
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    console.error('Subscription checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
