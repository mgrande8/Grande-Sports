import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'

const ADMIN_EMAILS = ['td.grandesportstraining@gmail.com']

// GET - Fetch all athletes (non-admin users)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = createServiceRoleClient()

    // Fetch all non-admin profiles
    const { data: profiles, error } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('is_admin', false)
      .order('full_name', { ascending: true })

    if (error) {
      console.error('Fetch athletes error:', error)
      return NextResponse.json({ error: 'Failed to fetch athletes' }, { status: 500 })
    }

    // Fetch booking counts for each athlete
    const athletesWithStats = await Promise.all(
      (profiles || []).map(async (profile) => {
        const { count } = await serviceClient
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .in('status', ['confirmed', 'completed'])

        return {
          ...profile,
          total_sessions: count || 0,
        }
      })
    )

    return NextResponse.json({ athletes: athletesWithStats })
  } catch (error: any) {
    console.error('Athletes API error:', error)
    return NextResponse.json({ error: 'Failed to fetch athletes' }, { status: 500 })
  }
}
