import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { sendPostSessionFollowUpEmail } from '@/lib/email'
import { formatDate } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const now = new Date()

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id,
      user_id,
      session_id,
      follow_up_sent,
      profiles:user_id (email, full_name),
      sessions:session_id (title, date, end_time)
    `)
    .eq('status', 'confirmed')
    .eq('follow_up_sent', false)

  if (error) {
    console.error('Failed to fetch bookings for follow-up:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }

  const eligibleBookings = (bookings || []).filter((b: any) => {
    const session = b.sessions
    if (!session) return false
    const sessionEnd = new Date(`${session.date}T${session.end_time}`)
    const twoHoursAfterEnd = new Date(sessionEnd.getTime() + 2 * 60 * 60 * 1000)
    return now >= twoHoursAfterEnd
  })

  let sent = 0
  for (const booking of eligibleBookings) {
    const profile = booking.profiles as any
    const session = booking.sessions as any
    if (!profile || !session) continue

    try {
      await sendPostSessionFollowUpEmail({
        to: profile.email,
        athleteName: profile.full_name,
        sessionTitle: session.title,
        sessionDate: formatDate(session.date),
      })

      await supabase
        .from('bookings')
        .update({ follow_up_sent: true })
        .eq('id', booking.id)

      sent++
    } catch (err) {
      console.error(`Failed to send follow-up for booking ${booking.id}:`, err)
    }
  }

  return NextResponse.json({ sent, total: eligibleBookings.length })
}
