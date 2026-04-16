import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'

const ADMIN_EMAILS = ['td.grandesportstraining@gmail.com']

export async function GET(request: NextRequest) {
  try {
    // Check auth
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const includeStats = searchParams.get('stats') === 'true'

    const serviceClient = createServiceRoleClient()

    // Build query
    let query = serviceClient
      .from('match_analyses')
      .select('*')
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: analyses, error } = await query

    if (error) {
      console.error('Failed to fetch analyses:', error)
      return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 })
    }

    // Calculate stats if requested
    let stats = null
    if (includeStats) {
      const { data: allAnalyses } = await serviceClient
        .from('match_analyses')
        .select('status, amount, payment_status, created_at')
        .eq('payment_status', 'paid')

      if (allAnalyses) {
        const now = new Date()
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        stats = {
          total: allAnalyses.length,
          totalRevenue: allAnalyses.reduce((sum, a) => sum + parseFloat(a.amount), 0),
          notStarted: allAnalyses.filter(a => a.status === 'not-started').length,
          inProgress: allAnalyses.filter(a => a.status === 'in-progress').length,
          analysisComplete: allAnalyses.filter(a => a.status === 'analysis-complete').length,
          meetingScheduled: allAnalyses.filter(a => a.status === 'meeting-scheduled').length,
          delivered: allAnalyses.filter(a => a.status === 'delivered').length,
          thisMonth: allAnalyses.filter(a => new Date(a.created_at) >= thisMonth).length,
        }
      }
    }

    return NextResponse.json({ analyses, stats })
  } catch (error: any) {
    console.error('Admin match analysis error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
