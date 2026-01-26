import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'

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

    const { email, full_name, phone, password } = await request.json()

    if (!email || !full_name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 })
    }

    // Use service role client for admin operations
    const serviceClient = createServiceRoleClient()

    // Check if user already exists in auth
    const { data: existingUsers } = await serviceClient.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (existingUser) {
      return NextResponse.json({ error: 'An athlete with this email already exists' }, { status: 400 })
    }

    // Create user directly with password (no confirmation email sent)
    // Use provided password or default to 'GrandeSports123!'
    const userPassword = password || 'GrandeSports123!'

    const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
      email: email.toLowerCase(),
      password: userPassword,
      email_confirm: true, // Auto-confirm email so they can log in immediately
      user_metadata: {
        full_name: full_name,
        phone: phone || null,
      },
    })

    if (createError) {
      console.error('Create user error:', createError)
      return NextResponse.json({
        error: 'Failed to create athlete account',
        details: createError.message
      }, { status: 400 })
    }

    // Create profile for the new user
    const { error: profileError } = await serviceClient
      .from('profiles')
      .insert({
        id: newUser.user.id,
        email: email.toLowerCase(),
        full_name: full_name,
        phone: phone || null,
        is_admin: false,
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // User was created but profile failed - still return success
      // The profile might be auto-created by a trigger
    }

    return NextResponse.json({
      success: true,
      message: `Athlete added successfully! They can log in with email: ${email} and password: ${userPassword}`,
      defaultPassword: userPassword,
    })
  } catch (error: any) {
    console.error('Add athlete error:', error)
    return NextResponse.json({ error: 'Failed to add athlete' }, { status: 500 })
  }
}
