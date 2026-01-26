import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

// GET - Fetch sessions (for booking page)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    const serviceClient = createServiceRoleClient()

    let query = serviceClient
      .from('sessions')
      .select('*')
      .eq('is_active', true)
      .order('start_time', { ascending: true })

    if (date) {
      query = query.eq('date', date)
    } else {
      // If no date specified, get upcoming sessions
      const today = new Date().toISOString().split('T')[0]
      query = query.gte('date', today).order('date', { ascending: true })
    }

    const { data, error } = await query

    if (error) {
      console.error('Fetch sessions error:', error)
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
    }

    return NextResponse.json({ sessions: data || [] })
  } catch (error: any) {
    console.error('Sessions API error:', error)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}
