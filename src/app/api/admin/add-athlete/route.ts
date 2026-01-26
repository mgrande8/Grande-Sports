import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if admin
    const ADMIN_EMAILS = ['td.grandesportstraining@gmail.com']
    if (!user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { email, full_name, phone } = await request.json()

    if (!email || !full_name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 })
    }

    // Check if email already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingProfile) {
      return NextResponse.json({ error: 'An athlete with this email already exists' }, { status: 400 })
    }

    // Use Supabase Admin API to invite user
    // This sends an email invitation to the user
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: full_name,
        phone: phone || null,
      },
    })

    if (inviteError) {
      console.error('Invite error:', inviteError)

      // If admin API not available, create profile directly (user will need to sign up)
      // This is a fallback for when service role key doesn't have admin access
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: crypto.randomUUID(),
          email: email.toLowerCase(),
          full_name: full_name,
          phone: phone || null,
          is_admin: false,
        })

      if (profileError) {
        // If that also fails, it might be a foreign key constraint
        // In that case, we need the user to sign up first
        return NextResponse.json({
          error: 'Could not add athlete. They will need to sign up themselves first.',
          details: profileError.message
        }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        message: 'Athlete profile created. They can sign up with their email to access their account.',
        invited: false
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation sent! The athlete will receive an email to set up their account.',
      invited: true
    })
  } catch (error: any) {
    console.error('Add athlete error:', error)
    return NextResponse.json({ error: 'Failed to add athlete' }, { status: 500 })
  }
}
