import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'
import { calculateDiscountedPrice, formatDate, formatTime } from '@/lib/utils'
import { sendBookingConfirmationEmail } from '@/lib/email'

// POST - Pay with a saved payment method
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Please sign in to book' }, { status: 401 })
    }

    const { sessionId, discountCodeId, paymentMethodId } = await request.json()

    if (!paymentMethodId) {
      return NextResponse.json({ error: 'Payment method required' }, { status: 400 })
    }

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
      // Use service role client to bypass RLS for discount codes
      const serviceClient = createServiceRoleClient()
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

    // If free, create booking directly
    if (finalPrice === 0) {
      const { error: bookingError } = await supabase
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
        return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
      }

      // Get user profile for email
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', user.id)
        .single()

      // Send confirmation email
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

      return NextResponse.json({ success: true })
    }

    // Get customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'No payment methods on file' }, { status: 400 })
    }

    // Create PaymentIntent and confirm with saved payment method
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalPrice * 100),
      currency: 'usd',
      customer: profile.stripe_customer_id,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      description: `${session.title} - ${session.date}`,
      metadata: {
        user_id: user.id,
        session_id: sessionId,
        discount_code_id: discountCodeId || '',
        discount_amount: discountAmount.toString(),
      },
    })

    if (paymentIntent.status === 'succeeded') {
      // Create the booking
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          session_id: sessionId,
          status: 'confirmed',
          payment_status: 'paid',
          amount_paid: finalPrice,
          payment_intent_id: paymentIntent.id,
          discount_code_id: discountCodeId || null,
          discount_amount: discountAmount,
        })

      if (bookingError) {
        // Payment succeeded but booking failed - should refund
        console.error('Booking creation failed after payment:', bookingError)
        return NextResponse.json({ error: 'Booking failed, please contact support' }, { status: 500 })
      }

      // Get user profile for email
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', user.id)
        .single()

      // Send confirmation email
      if (userProfile) {
        await sendBookingConfirmationEmail({
          to: userProfile.email,
          athleteName: userProfile.full_name,
          sessionTitle: session.title,
          sessionDate: formatDate(session.date),
          sessionTime: formatTime(session.start_time),
          sessionLocation: session.location || 'Miami Shores Park',
          amountPaid: finalPrice,
        })
      }

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({
        error: 'Payment requires additional authentication. Please use a different card.',
        requiresAction: true,
        clientSecret: paymentIntent.client_secret
      }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Saved method checkout error:', error)

    // Handle specific Stripe errors
    if (error.type === 'StripeCardError') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: 'Payment failed. Please try again.' }, { status: 500 })
  }
}
