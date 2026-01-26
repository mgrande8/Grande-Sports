import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'

const ADMIN_EMAILS = ['td.grandesportstraining@gmail.com']

// POST - Create discount code
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const discountData = await request.json()

    const serviceClient = createServiceRoleClient()

    const { data, error } = await serviceClient
      .from('discount_codes')
      .insert(discountData)
      .select()
      .single()

    if (error) {
      console.error('Discount creation error:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A discount code with this name already exists' }, { status: 400 })
      }
      return NextResponse.json({ error: 'Failed to create discount code' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Admin discounts error:', error)
    return NextResponse.json({ error: 'Failed to create discount code' }, { status: 500 })
  }
}

// PUT - Update discount code
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, ...updateData } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Discount ID required' }, { status: 400 })
    }

    const serviceClient = createServiceRoleClient()

    const { error } = await serviceClient
      .from('discount_codes')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Discount update error:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A discount code with this name already exists' }, { status: 400 })
      }
      return NextResponse.json({ error: 'Failed to update discount code' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Admin discounts error:', error)
    return NextResponse.json({ error: 'Failed to update discount code' }, { status: 500 })
  }
}

// DELETE - Soft delete discount code
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Discount ID required' }, { status: 400 })
    }

    const serviceClient = createServiceRoleClient()

    const { error } = await serviceClient
      .from('discount_codes')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('Discount delete error:', error)
      return NextResponse.json({ error: 'Failed to delete discount code' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Admin discounts error:', error)
    return NextResponse.json({ error: 'Failed to delete discount code' }, { status: 500 })
  }
}
