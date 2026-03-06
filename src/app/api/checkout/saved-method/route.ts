import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'
import { calculateDiscountedPrice, formatDate, formatTime } from '@/lib/utils'
import { sendBookingConfirmationEmail } from '@/lib/email'
import { REFERRAL_DISCOUNT } from '@/lib/types'

// POST - Pay with a saved payment method
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Please sign in to book' }, { status: 401 })
    }

    const { sessionId, discountCodeId, paymentMethodId, position, level, goals, referralSource, referredBy } = await request.json()

    if (!paymentMethodId) {
      return NextResponse.json({ error: 'Payment method required' }, { status: 400 })
    }

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

    if (session.current_capacity >= session.max_capacity) {
      return NextResponse.json({ error: 'Session is full' }, { status: 400 })
    }

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
    let referralDiscountApplied = false

    if (discountCodeId) {
      const { data: discount } = await serviceClient
        .from('discount_codes')
        .select('*')
        .eq('id', discountCodeId)
        .eq('is_active', true)
        .single()

      if (discount) {
        finalPrice = calculateDiscountedPrice(session.price, discount.discount_type, discount.discount_value)
        discountAmount = session.price - finalPrice
      }
    } else if (referredBy) {
      const { count } = await serviceClient
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .neq('status', 'cancelled')

      if (count === 0) {
        finalPrice = Math.max(0, session.price - REFERRAL_DISCOUNT)
        discountAmount = session.price - finalPrice
        referralDiscountApplied = true
      }
    }

    const bookingFields = {
      position: position || null,
      level: level || null,
      goals: goals || null,
      referral_source: referralSource || null,
      referred_by: referredBy || null,
      referral_discount_applied: referralDiscountApplied,
    }

    // If free, create booking directly
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
          ...bookingFields,
        })

      if (bookingError) {
        console.error('Booking error:', bookingError)
        return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
      }

      await serviceClient
        .from('sessions')
        .update({ current_capacity: session.current_capacity + 1 })
        .eq('id', sessionId)

      const { data: profile } = await serviceClient
        .from('profiles')
        .select('email, full_name')
        .eq('id', user.id)
        .single()

      if (profile) {
        await sendBookingConfirmationEmail({
          to: profile.email,
          athleteName: profile.full_name,
          sessionTitle: session.title,
          sessionDate: formatDate(session.date),
          sessionTime: formatTime(session.start_time),
          sessionLocation: session.location || 'Bamford Park, Davie, FL 33314',
          amountPaid: 0,
          coachName: session.coach_name || undefined,
        })
      }

      return NextResponse.json({ success: true })
    }

    // Get customer ID
    const { data: profile } = await serviceClient
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
        position: position || '',
        level: level || '',
        goals: goals || '',
        referral_source: referralSource || '',
        referred_by: referredBy || '',
        referral_discount_applied: referralDiscountApplied ? 'true' : 'false',
      },
    })

    if (paymentIntent.status === 'succeeded') {
      const { error: bookingError } = await serviceClient
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
          ...bookingFields,
        })

      if (bookingError) {
        console.error('Booking creation failed after payment:', bookingError)
        return NextResponse.json({ error: 'Booking failed, please contact support' }, { status: 500 })
      }

      await serviceClient
        .from('sessions')
        .update({ current_capacity: session.current_capacity + 1 })
        .eq('id', sessionId)

      const { data: userProfile } = await serviceClient
        .from('profiles')
        .select('email, full_name')
        .eq('id', user.id)
        .single()

      if (userProfile) {
        await sendBookingConfirmationEmail({
          to: userProfile.email,
          athleteName: userProfile.full_name,
          sessionTitle: session.title,
          sessionDate: formatDate(session.date),
          sessionTime: formatTime(session.start_time),
          sessionLocation: session.location || 'Bamford Park, Davie, FL 33314',
          amountPaid: finalPrice,
          coachName: session.coach_name || undefined,
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

    if (error.type === 'StripeCardError') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: 'Payment failed. Please try again.' }, { status: 500 })
  }
}
