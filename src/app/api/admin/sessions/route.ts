import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'

const ADMIN_EMAILS = ['td.grandesportstraining@gmail.com']

// POST - Create session(s)
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessions } = await request.json()

    if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
      return NextResponse.json({ error: 'Sessions data required' }, { status: 400 })
    }

    // Use service role client to bypass RLS
    const serviceClient = createServiceRoleClient()

    // Ensure all sessions have is_active set to true and current_capacity to 0
    const sessionsWithDefaults = sessions.map((session: any) => ({
      ...session,
      is_active: true,
      current_capacity: 0,
    }))

    const { data, error } = await serviceClient
      .from('sessions')
      .insert(sessionsWithDefaults)
      .select()

    if (error) {
      console.error('Session creation error:', error)
      return NextResponse.json({ error: 'Failed to create session(s)' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Admin sessions error:', error)
    return NextResponse.json({ error: 'Failed to create session(s)' }, { status: 500 })
  }
}

// PUT - Update session
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, ...updateData } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    const serviceClient = createServiceRoleClient()

    const { error } = await serviceClient
      .from('sessions')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Session update error:', error)
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Admin sessions error:', error)
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
  }
}

// DELETE - Soft delete session
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    const serviceClient = createServiceRoleClient()

    const { error } = await serviceClient
      .from('sessions')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('Session delete error:', error)
      return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Admin sessions error:', error)
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 })
  }
}
