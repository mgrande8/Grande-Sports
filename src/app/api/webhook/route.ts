import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceRoleClient } from '@/lib/supabase-server'
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
    const session = event.data.object as Stripe.Checkout.Session
    const { user_id, session_id, discount_code_id, discount_amount } = session.metadata!

    // Create booking
    const { error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id,
        session_id,
        status: 'confirmed',
        payment_status: 'paid',
        payment_intent_id: session.payment_intent as string,
        amount_paid: (session.amount_total || 0) / 100,
        discount_code_id: discount_code_id || null,
        discount_amount: parseFloat(discount_amount || '0'),
      })

    if (bookingError) {
      console.error('Failed to create booking:', bookingError)
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    // Send confirmation email (you can integrate Resend here)
    // await sendBookingConfirmation(user_id, session_id)

    console.log('Booking created successfully for user:', user_id)
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    console.error('Payment failed:', paymentIntent.id)
  }

  return NextResponse.json({ received: true })
}
