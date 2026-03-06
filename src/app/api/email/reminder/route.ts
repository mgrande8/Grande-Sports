import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { sendSessionReminderEmail } from '@/lib/email'
import { formatDate, formatTime } from '@/lib/utils'
import { addDays, format } from 'date-fns'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id,
      user_id,
      session_id,
      reminder_sent,
      profiles:user_id (email, full_name),
      sessions:session_id (title, date, start_time, end_time, location, coach_name)
    `)
    .eq('status', 'confirmed')
    .eq('reminder_sent', false)

  if (error) {
    console.error('Failed to fetch bookings for reminders:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }

  const tomorrowBookings = (bookings || []).filter((b: any) => b.sessions?.date === tomorrow)

  let sent = 0
  for (const booking of tomorrowBookings) {
    const profile = booking.profiles as any
    const session = booking.sessions as any
    if (!profile || !session) continue

    try {
      await sendSessionReminderEmail({
        to: profile.email,
        athleteName: profile.full_name,
        sessionTitle: session.title,
        sessionDate: formatDate(session.date),
        sessionTime: formatTime(session.start_time),
        sessionLocation: session.location || 'Bamford Park, Davie, FL 33314',
        coachName: session.coach_name || undefined,
      })

      await supabase
        .from('bookings')
        .update({ reminder_sent: true })
        .eq('id', booking.id)

      sent++
    } catch (err) {
      console.error(`Failed to send reminder for booking ${booking.id}:`, err)
    }
  }

  return NextResponse.json({ sent, total: tomorrowBookings.length })
}
