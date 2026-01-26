import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'

// GET - Fetch current user's test results
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = createServiceRoleClient()

    const { data, error } = await serviceClient
      .from('technical_tests')
      .select('*')
      .eq('user_id', user.id)
      .order('test_date', { ascending: true })

    if (error) {
      console.error('Fetch tests error:', error)
      return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 })
    }

    return NextResponse.json({ tests: data || [] })
  } catch (error: any) {
    console.error('My tests API error:', error)
    return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 })
  }
}
