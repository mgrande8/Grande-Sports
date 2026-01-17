import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

// Admin-only email endpoint
const ADMIN_EMAIL = 'td.grandesportstraining@gmail.com'

export async function POST(request: Request) {
  try {
    const { to, subject, message, userId } = await request.json()

    // Verify admin user
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin with the correct email
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, email')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin || profile.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Validate input
    if (!to || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Grande Sports <noreply@grandesportstraining.com>',
      to: to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #000000; padding: 20px; text-align: center;">
            <h1 style="color: #00ff00; margin: 0;">Grande Sports</h1>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9;">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <div style="padding: 20px; background-color: #000000; text-align: center;">
            <p style="color: #888888; margin: 0; font-size: 12px;">
              Grande Sports Training | Miami, FL
            </p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, messageId: data?.id })
  } catch (error: any) {
    console.error('Send email error:', error)
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 })
  }
}
