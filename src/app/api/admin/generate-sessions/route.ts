import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { addDays, format, getDay } from 'date-fns'

const ADMIN_EMAILS = ['td.grandesportstraining@gmail.com']

// Session templates based on availability
const WEEKDAY_SLOTS = [
  // Morning slots (8am-12pm)
  { start: '08:00', end: '09:00', type: 'private' as const },
  { start: '09:00', end: '10:00', type: 'private' as const },
  { start: '10:00', end: '11:00', type: 'private' as const },
  { start: '11:00', end: '12:00', type: 'private' as const },
  // Afternoon slots (3:30pm-5:30pm)
  { start: '15:30', end: '16:30', type: 'private' as const },
  { start: '16:30', end: '17:30', type: 'private' as const },
]

const WEEKEND_SLOTS = [
  // Morning only (9am-11am)
  { start: '09:00', end: '10:00', type: 'private' as const },
  { start: '10:00', end: '11:00', type: 'private' as const },
]

// Special group sessions
const GROUP_SESSIONS = [
  // Monday & Friday 9am - Advanced 14-18
  { days: [1, 5], start: '09:00', end: '10:00', type: 'group' as const, title: 'Advanced Group Training (14-18)', price: 40 },
  // Tuesday & Thursday 4:30pm - U13
  { days: [2, 4], start: '16:30', end: '17:30', type: 'group' as const, title: 'U13 Group Training', price: 40 },
]

const PRICING = {
  private: 95,
  'semi-private': 70,
  group: 40,
}

const CAPACITY = {
  private: 1,
  'semi-private': 2,
  group: 8,
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = createServiceRoleClient()
    const today = new Date()
    const sessions = []

    // Generate sessions for next 30 days
    for (let i = 0; i < 30; i++) {
      const date = addDays(today, i)
      const dateStr = format(date, 'yyyy-MM-dd')
      const dayOfWeek = getDay(date) // 0 = Sunday, 6 = Saturday

      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      const slots = isWeekend ? WEEKEND_SLOTS : WEEKDAY_SLOTS

      // Add regular slots
      for (const slot of slots) {
        // Check if this slot conflicts with a group session
        const hasGroupSession = GROUP_SESSIONS.some(
          g => g.days.includes(dayOfWeek) && g.start === slot.start
        )

        if (!hasGroupSession) {
          sessions.push({
            title: 'Private Training Session',
            session_type: slot.type,
            date: dateStr,
            start_time: slot.start,
            end_time: slot.end,
            price: PRICING[slot.type],
            max_capacity: CAPACITY[slot.type],
            current_capacity: 0,
            location: 'Bamford Park, Davie, FL 33314',
            is_active: true,
          })
        }
      }

      // Add group sessions for this day
      for (const group of GROUP_SESSIONS) {
        if (group.days.includes(dayOfWeek)) {
          sessions.push({
            title: group.title,
            session_type: group.type,
            date: dateStr,
            start_time: group.start,
            end_time: group.end,
            price: group.price,
            max_capacity: CAPACITY[group.type],
            current_capacity: 0,
            location: 'Bamford Park, Davie, FL 33314',
            is_active: true,
          })
        }
      }
    }

    // Check for existing sessions to avoid duplicates
    const { data: existingSessions } = await serviceClient
      .from('sessions')
      .select('date, start_time')
      .gte('date', format(today, 'yyyy-MM-dd'))

    const existingSet = new Set(
      (existingSessions || []).map(s => `${s.date}-${s.start_time}`)
    )

    // Filter out duplicates
    const newSessions = sessions.filter(
      s => !existingSet.has(`${s.date}-${s.start_time}`)
    )

    if (newSessions.length === 0) {
      return NextResponse.json({
        message: 'All sessions already exist',
        created: 0,
        total: sessions.length
      })
    }

    // Insert new sessions
    const { error } = await serviceClient
      .from('sessions')
      .insert(newSessions)

    if (error) {
      console.error('Failed to create sessions:', error)
      return NextResponse.json({ error: 'Failed to create sessions' }, { status: 500 })
    }

    return NextResponse.json({
      message: `Created ${newSessions.length} sessions for the next 30 days`,
      created: newSessions.length,
      skipped: sessions.length - newSessions.length
    })

  } catch (error: any) {
    console.error('Generate sessions error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
