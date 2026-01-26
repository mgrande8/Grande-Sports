import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'Discount code is required' }, { status: 400 })
    }

    // Use service role client to bypass RLS
    const serviceClient = createServiceRoleClient()

    const { data: discount, error } = await serviceClient
      .from('discount_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single()

    if (error || !discount) {
      return NextResponse.json({ error: 'Invalid discount code' }, { status: 404 })
    }

    // Check validity dates
    const now = new Date()
    if (discount.valid_from && new Date(discount.valid_from) > now) {
      return NextResponse.json({ error: 'This discount code is not yet valid' }, { status: 400 })
    }
    if (discount.valid_until && new Date(discount.valid_until) < now) {
      return NextResponse.json({ error: 'This discount code has expired' }, { status: 400 })
    }

    // Check if athlete-specific
    if (discount.athlete_id && user && discount.athlete_id !== user.id) {
      return NextResponse.json({ error: 'This discount code is not available for your account' }, { status: 400 })
    }

    // Return the discount info (but not sensitive data)
    return NextResponse.json({
      success: true,
      discount: {
        id: discount.id,
        code: discount.code,
        type: discount.type,
        value: discount.value,
      }
    })
  } catch (error: any) {
    console.error('Discount validation error:', error)
    return NextResponse.json({ error: 'Failed to validate discount code' }, { status: 500 })
  }
}
