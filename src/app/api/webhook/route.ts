import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { sendBookingConfirmationEmail } from '@/lib/email'
import { formatDate, formatTime } from '@/lib/utils'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  if (event.type === 'checkout.session.completed') {
    const checkoutSession = event.data.object as Stripe.Checkout.Session
    const { user_id, session_id, discount_code_id, discount_amount } = checkoutSession.metadata!

    // Create booking
    const { error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id,
        session_id,
        status: 'confirmed',
        payment_status: 'paid',
        payment_intent_id: checkoutSession.payment_intent as string,
        amount_paid: (checkoutSession.amount_total || 0) / 100,
        discount_code_id: discount_code_id || null,
        discount_amount: parseFloat(discount_amount || '0'),
      })

    if (bookingError) {
      console.error('Failed to create booking:', bookingError)
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    // Increment discount code usage if applicable
    if (discount_code_id) {
      await supabase.rpc('increment_discount_uses', { code_id: discount_code_id })
    }

    // Get user and session details for email and capacity update
    const [userResult, sessionResult] = await Promise.all([
      supabase.from('profiles').select('email, full_name').eq('id', user_id).single(),
      supabase.from('sessions').select('*').eq('id', session_id).single(),
    ])

    // Update session capacity
    if (sessionResult.data) {
      await supabase
        .from('sessions')
        .update({ current_capacity: sessionResult.data.current_capacity + 1 })
        .eq('id', session_id)
    }

    if (userResult.data && sessionResult.data) {
      const session = sessionResult.data
      const user = userResult.data

      // Send confirmation email
      try {
        await sendBookingConfirmationEmail({
          to: user.email,
          athleteName: user.full_name,
          sessionTitle: session.title,
          sessionDate: formatDate(session.date),
          sessionTime: formatTime(session.start_time),
          sessionLocation: session.location || 'Bamford Park (Davie)',
          amountPaid: (checkoutSession.amount_total || 0) / 100,
        })
        console.log('Confirmation email sent to:', user.email)
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError)
      }
    }

    console.log('Booking created successfully for user:', user_id)
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    console.error('Payment failed:', paymentIntent.id)
  }

  return NextResponse.json({ received: true })
}
