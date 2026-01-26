import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'

const ADMIN_EMAILS = ['td.grandesportstraining@gmail.com']

// GET - Fetch tests for an athlete
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const athleteId = searchParams.get('athleteId')

    if (!athleteId) {
      return NextResponse.json({ error: 'Athlete ID required' }, { status: 400 })
    }

    const serviceClient = createServiceRoleClient()

    const { data, error } = await serviceClient
      .from('technical_tests')
      .select('*')
      .eq('user_id', athleteId)
      .order('test_date', { ascending: true })

    if (error) {
      console.error('Fetch tests error:', error)
      return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 })
    }

    return NextResponse.json({ tests: data || [] })
  } catch (error: any) {
    console.error('Tests API error:', error)
    return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 })
  }
}

// POST - Create a new test result
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const testData = await request.json()

    if (!testData.user_id || !testData.test_date) {
      return NextResponse.json({ error: 'Athlete ID and test date are required' }, { status: 400 })
    }

    const serviceClient = createServiceRoleClient()

    const { data, error } = await serviceClient
      .from('technical_tests')
      .insert(testData)
      .select()
      .single()

    if (error) {
      console.error('Create test error:', error)
      return NextResponse.json({ error: 'Failed to create test' }, { status: 500 })
    }

    return NextResponse.json({ success: true, test: data })
  } catch (error: any) {
    console.error('Tests API error:', error)
    return NextResponse.json({ error: 'Failed to create test' }, { status: 500 })
  }
}

// PUT - Update a test result
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, ...updateData } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Test ID required' }, { status: 400 })
    }

    const serviceClient = createServiceRoleClient()

    const { error } = await serviceClient
      .from('technical_tests')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Update test error:', error)
      return NextResponse.json({ error: 'Failed to update test' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Tests API error:', error)
    return NextResponse.json({ error: 'Failed to update test' }, { status: 500 })
  }
}

// DELETE - Delete a test result
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Test ID required' }, { status: 400 })
    }

    const serviceClient = createServiceRoleClient()

    const { error } = await serviceClient
      .from('technical_tests')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete test error:', error)
      return NextResponse.json({ error: 'Failed to delete test' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Tests API error:', error)
    return NextResponse.json({ error: 'Failed to delete test' }, { status: 500 })
  }
}
