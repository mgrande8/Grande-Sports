import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'
import { calculateDiscountedPrice } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Please sign in to book' }, { status: 401 })
    }

    const { sessionId, discountCodeId } = await request.json()

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('is_active', true)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Check capacity
    if (session.current_capacity >= session.max_capacity) {
      return NextResponse.json({ error: 'Session is full' }, { status: 400 })
    }

    // Check if already booked
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('id')
      .eq('user_id', user.id)
      .eq('session_id', sessionId)
      .neq('status', 'cancelled')
      .single()

    if (existingBooking) {
      return NextResponse.json({ error: 'You have already booked this session' }, { status: 400 })
    }

    // Calculate price with discount
    let finalPrice = session.price
    let discountAmount = 0

    if (discountCodeId) {
      const { data: discount } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('id', discountCodeId)
        .eq('is_active', true)
        .single()

      if (discount) {
        finalPrice = calculateDiscountedPrice(session.price, discount.type, discount.value)
        discountAmount = session.price - finalPrice
      }
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
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

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', user.id)
    }

    // Create Stripe Checkout session with saved payment methods
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: session.title,
              description: `${session.date} at ${session.start_time}`,
            },
            unit_amount: Math.round(finalPrice * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Save card for future purchases - returning customers will see their saved cards
      payment_method_options: {
        card: {
          setup_future_usage: 'on_session',
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?booking=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/book?cancelled=true`,
      metadata: {
        user_id: user.id,
        session_id: sessionId,
        discount_code_id: discountCodeId || '',
        discount_amount: discountAmount.toString(),
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
