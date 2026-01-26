import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'
import { calculateDiscountedPrice, formatDate, formatTime } from '@/lib/utils'
import { sendBookingConfirmationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Please sign in to book' }, { status: 401 })
    }

    const { sessionId, discountCodeId } = await request.json()

    // Use service role client to bypass RLS for session lookup
    const serviceClient = createServiceRoleClient()

    // Get session details
    const { data: session, error: sessionError } = await serviceClient
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('is_active', true)
      .single()

    if (sessionError || !session) {
      console.error('Session lookup error:', sessionError)
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Check capacity
    if (session.current_capacity >= session.max_capacity) {
      return NextResponse.json({ error: 'Session is full' }, { status: 400 })
    }

    // Check if already booked (use service client to bypass RLS)
    const { data: existingBooking } = await serviceClient
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
      const { data: discount } = await serviceClient
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

    // If the session is free (after discount), create booking directly without Stripe
    if (finalPrice === 0) {
      const { error: bookingError } = await serviceClient
        .from('bookings')
        .insert({
          user_id: user.id,
          session_id: sessionId,
          status: 'confirmed',
          payment_status: 'paid',
          amount_paid: 0,
          discount_code_id: discountCodeId || null,
          discount_amount: discountAmount,
        })

      if (bookingError) {
        console.error('Booking error:', bookingError)
        return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
      }

      // Get user profile for email
      const { data: profile } = await serviceClient
        .from('profiles')
        .select('email, full_name')
        .eq('id', user.id)
        .single()

      // Send confirmation email for free booking
      if (profile) {
        await sendBookingConfirmationEmail({
          to: profile.email,
          athleteName: profile.full_name,
          sessionTitle: session.title,
          sessionDate: formatDate(session.date),
          sessionTime: formatTime(session.start_time),
          sessionLocation: session.location || 'Miami Shores Park',
          amountPaid: 0,
        })
      }

      // Return success URL directly for free bookings
      return NextResponse.json({
        url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?booking=success`,
        free: true
      })
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

    // Create Stripe Checkout session with card and Apple Pay
    // payment_method_types: ['card'] automatically enables Apple Pay and Google Pay on supported devices
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
      // Enable saving payment method for future use
      payment_intent_data: {
        setup_future_usage: 'off_session',
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
