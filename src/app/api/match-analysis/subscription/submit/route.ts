import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { sendMatchAnalysisConfirmationEmail, sendMatchAnalysisAdminNotification } from '@/lib/email'

export const dynamic = 'force-dynamic'

interface SubmitBody {
  player_name: string
  jersey_number: string
  jersey_color?: string
  position: string
  additional_info?: string
  video_url: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Please sign in' }, { status: 401 })
    }

    const body: SubmitBody = await request.json()

    // Validate required fields
    const requiredFields = ['player_name', 'jersey_number', 'position', 'video_url']
    for (const field of requiredFields) {
      if (!body[field as keyof SubmitBody]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }

    const serviceClient = createServiceRoleClient()

    // Get user's subscription
    const { data: subscription, error: subError } = await serviceClient
      .from('match_analysis_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (subError || !subscription) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })
    }

    // Check credits
    const creditsRemaining = subscription.credits_total - subscription.credits_used
    if (creditsRemaining <= 0) {
      return NextResponse.json({ error: 'No credits remaining this month' }, { status: 400 })
    }

    // Get user profile for email
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single()

    const contactEmail = profile?.email || user.email || ''

    // Create the match analysis record
    const { data: analysis, error: insertError } = await serviceClient
      .from('match_analyses')
      .insert({
        email_address: contactEmail,
        contact_email: contactEmail,
        player_name: body.player_name,
        jersey_number: body.jersey_number,
        jersey_color: body.jersey_color || null,
        position: body.position,
        additional_info: body.additional_info || null,
        video_url: body.video_url,
        user_id: user.id,
        payment_type: 'subscription',
        amount: 0, // Covered by subscription
        payment_status: 'paid',
        status: 'not-started',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create analysis:', insertError)
      return NextResponse.json({ error: 'Failed to create analysis' }, { status: 500 })
    }

    // Decrement credits
    const { error: updateError } = await serviceClient
      .from('match_analysis_subscriptions')
      .update({
        credits_used: subscription.credits_used + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id)

    if (updateError) {
      console.error('Failed to update credits:', updateError)
    }

    // Send confirmation email to client
    await sendMatchAnalysisConfirmationEmail({
      to: contactEmail,
      playerName: body.player_name,
      position: body.position,
      videoUrl: body.video_url,
      amount: 0, // Subscription
    })

    // Send notification to admin
    await sendMatchAnalysisAdminNotification({
      playerName: body.player_name,
      position: body.position,
      jerseyNumber: body.jersey_number,
      jerseyColor: body.jersey_color,
      videoUrl: body.video_url,
      contactEmail: contactEmail,
      additionalInfo: body.additional_info,
      amount: 0,
    })

    return NextResponse.json({
      success: true,
      analysisId: analysis.id,
      creditsRemaining: creditsRemaining - 1,
    })
  } catch (error: any) {
    console.error('Subscription submit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
