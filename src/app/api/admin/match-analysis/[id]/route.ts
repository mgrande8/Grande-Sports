import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { sendAnalysisCompleteEmail, sendDeliveryEmail } from '@/lib/email'

const ADMIN_EMAILS = ['td.grandesportstraining@gmail.com']

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = createServiceRoleClient()

    const { data: analysis, error } = await serviceClient
      .from('match_analyses')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }

    return NextResponse.json({ analysis })
  } catch (error: any) {
    console.error('Get analysis error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const serviceClient = createServiceRoleClient()

    // Get the current analysis for comparison
    const { data: currentAnalysis } = await serviceClient
      .from('match_analyses')
      .select('*')
      .eq('id', params.id)
      .single()

    if (!currentAnalysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Handle status changes
    if (body.status && body.status !== currentAnalysis.status) {
      updateData.status = body.status

      // If marking as analysis-complete, set fulfillment date
      if (body.status === 'analysis-complete') {
        updateData.fulfillment_date = new Date().toISOString().split('T')[0]

        // Send email with Calendly link
        const calendlyUrl = process.env.CALENDLY_EVENT_URL
        if (calendlyUrl) {
          await sendAnalysisCompleteEmail({
            to: currentAnalysis.contact_email,
            playerName: currentAnalysis.player_name,
            calendlyUrl,
          })
        }
      }

      // If marking as delivered, send delivery email
      if (body.status === 'delivered' && (body.delivery_folder_url || currentAnalysis.delivery_folder_url)) {
        const folderUrl = body.delivery_folder_url || currentAnalysis.delivery_folder_url
        await sendDeliveryEmail({
          to: currentAnalysis.contact_email,
          playerName: currentAnalysis.player_name,
          deliveryFolderUrl: folderUrl,
        })
      }
    }

    // Handle other field updates
    if (body.admin_notes !== undefined) {
      updateData.admin_notes = body.admin_notes
    }

    if (body.delivery_folder_url !== undefined) {
      updateData.delivery_folder_url = body.delivery_folder_url
    }

    if (body.meeting_booked_at !== undefined) {
      updateData.meeting_booked_at = body.meeting_booked_at
    }

    if (body.calendly_event_url !== undefined) {
      updateData.calendly_event_url = body.calendly_event_url
    }

    if (body.fulfillment_date !== undefined) {
      updateData.fulfillment_date = body.fulfillment_date
    }

    // Update the analysis
    const { data: analysis, error } = await serviceClient
      .from('match_analyses')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Update analysis error:', error)
      return NextResponse.json({ error: 'Failed to update analysis' }, { status: 500 })
    }

    return NextResponse.json({ analysis })
  } catch (error: any) {
    console.error('Update analysis error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
