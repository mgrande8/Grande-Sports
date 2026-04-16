import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { sendMatchAnalysisConfirmationEmail, sendMatchAnalysisAdminNotification } from '@/lib/email'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // Retrieve the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)

    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    // Check if we already processed this session (idempotency)
    const supabase = createServiceRoleClient()
    const { data: existingAnalysis } = await supabase
      .from('match_analyses')
      .select('id')
      .eq('stripe_checkout_session_id', sessionId)
      .single()

    if (existingAnalysis) {
      // Already processed, return success
      return NextResponse.json({
        success: true,
        message: 'Already processed',
        analysisId: existingAnalysis.id
      })
    }

    // Extract form data from metadata
    const metadata = checkoutSession.metadata!
    const amount = parseFloat(metadata.amount)

    // Create the match analysis record
    const { data: analysis, error: insertError } = await supabase
      .from('match_analyses')
      .insert({
        email_address: metadata.email_address,
        contact_email: metadata.contact_email,
        player_name: metadata.player_name,
        jersey_number: metadata.jersey_number,
        jersey_color: metadata.jersey_color || null,
        position: metadata.position,
        additional_info: metadata.additional_info || null,
        video_url: metadata.video_url,
        payment_type: 'single',
        amount: amount,
        stripe_checkout_session_id: sessionId,
        stripe_payment_intent_id: checkoutSession.payment_intent as string,
        payment_status: 'paid',
        status: 'not-started',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create match analysis:', insertError)
      return NextResponse.json(
        { error: 'Failed to create analysis record' },
        { status: 500 }
      )
    }

    // Send confirmation email to client
    await sendMatchAnalysisConfirmationEmail({
      to: metadata.contact_email,
      playerName: metadata.player_name,
      position: metadata.position,
      videoUrl: metadata.video_url,
      amount: amount,
    })

    // Send notification to admin
    await sendMatchAnalysisAdminNotification({
      playerName: metadata.player_name,
      position: metadata.position,
      jerseyNumber: metadata.jersey_number,
      jerseyColor: metadata.jersey_color || undefined,
      videoUrl: metadata.video_url,
      contactEmail: metadata.contact_email,
      additionalInfo: metadata.additional_info || undefined,
      amount: amount,
    })

    return NextResponse.json({
      success: true,
      analysisId: analysis.id
    })
  } catch (error: any) {
    console.error('Match analysis confirm error:', error)
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}
