import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { sendSessionAssignedEmail } from '@/lib/email'
import { formatDate, formatTime } from '@/lib/utils'

const ADMIN_EMAILS = ['td.grandesportstraining@gmail.com']

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId, athleteId } = await request.json()

    if (!sessionId || !athleteId) {
      return NextResponse.json({ error: 'Session ID and Athlete ID are required' }, { status: 400 })
    }

    // Use service role client to bypass RLS
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

    // Check if already booked
    const { data: existingBooking } = await serviceClient
      .from('bookings')
      .select('id')
      .eq('user_id', athleteId)
      .eq('session_id', sessionId)
      .neq('status', 'cancelled')
      .single()

    if (existingBooking) {
      return NextResponse.json({ error: 'Athlete is already booked for this session' }, { status: 400 })
    }

    // Check capacity
    if (session.current_capacity >= session.max_capacity) {
      return NextResponse.json({ error: 'Session is full' }, { status: 400 })
    }

    // Get athlete profile for email
    const { data: athlete, error: athleteError } = await serviceClient
      .from('profiles')
      .select('email, full_name')
      .eq('id', athleteId)
      .single()

    if (athleteError || !athlete) {
      console.error('Athlete lookup error:', athleteError)
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 })
    }

    // Create booking on behalf of athlete
    const { error: bookingError } = await serviceClient
      .from('bookings')
      .insert({
        user_id: athleteId,
        session_id: sessionId,
        status: 'confirmed',
        payment_status: 'paid',
        amount_paid: session.price,
      })

    if (bookingError) {
      console.error('Booking error:', bookingError)
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    // Send notification email to athlete
    await sendSessionAssignedEmail({
      to: athlete.email,
      athleteName: athlete.full_name,
      sessionTitle: session.title,
      sessionDate: formatDate(session.date),
      sessionTime: formatTime(session.start_time),
      sessionLocation: session.location || 'Miami Shores Park',
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Assign session error:', error)
    return NextResponse.json({ error: 'Failed to assign session' }, { status: 500 })
  }
}
