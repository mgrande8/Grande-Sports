import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { bookingId } = await request.json()

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 })
    }

    // Get booking with payment info
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, payment_intent_id, amount_paid, payment_status, session_id')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.payment_status === 'refunded') {
      return NextResponse.json({ error: 'Already refunded' }, { status: 400 })
    }

    if (!booking.payment_intent_id) {
      return NextResponse.json({ error: 'No payment found for this booking' }, { status: 400 })
    }

    // Process Stripe refund
    const refund = await stripe.refunds.create({
      payment_intent: booking.payment_intent_id,
    })

    if (refund.status !== 'succeeded' && refund.status !== 'pending') {
      return NextResponse.json({ error: 'Refund failed' }, { status: 500 })
    }

    // Update booking status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        payment_status: 'refunded',
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', bookingId)

    if (updateError) {
      console.error('Failed to update booking status:', updateError)
      // Refund already processed, log but don't fail
    }

    return NextResponse.json({
      success: true,
      refundId: refund.id,
      status: refund.status,
    })
  } catch (error: any) {
    console.error('Refund error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process refund' },
      { status: 500 }
    )
  }
}
