import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { Resend } from 'resend'

function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY)
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, phone, position } = await request.json()

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const serviceClient = createServiceRoleClient()

    // Check if user already exists
    const { data: existingUsers } = await serviceClient.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 })
    }

    // Create user with email_confirm = false (they need to confirm)
    const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: false, // User must confirm email
      user_metadata: {
        full_name: fullName,
        phone: phone || null,
        position: position || null,
      },
    })

    if (createError) {
      console.error('Create user error:', createError)
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    // Generate email confirmation link
    const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
      type: 'signup',
      email: email.toLowerCase(),
      password: password,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })

    if (linkError) {
      console.error('Generate link error:', linkError)
      // User created but link failed - still return success, they can request new link
    }

    // Create profile
    const { error: profileError } = await serviceClient
      .from('profiles')
      .insert({
        id: newUser.user.id,
        email: email.toLowerCase(),
        full_name: fullName,
        phone: phone || null,
        position: position || null,
        is_admin: false,
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Profile might be auto-created by trigger, continue
    }

    // Send confirmation email via Resend
    if (linkData?.properties?.action_link) {
      const confirmationLink = linkData.properties.action_link

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="background-color: #067A3A; padding: 30px 40px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 1px;">
          GRANDE SPORTS
        </h1>
        <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">
          Training & Development
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 40px 20px 40px; text-align: center;">
        <h2 style="color: #101012; margin: 0 0 10px 0; font-size: 24px;">
          Welcome to Grande Sports!
        </h2>
        <p style="color: #666666; margin: 0; font-size: 16px;">
          Hi ${fullName}, please confirm your email to get started.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 40px; text-align: center;">
        <a href="${confirmationLink}"
           style="display: inline-block; background-color: #067A3A; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
          Confirm Email Address
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 40px;">
        <p style="color: #666666; font-size: 14px; text-align: center;">
          Or copy and paste this link into your browser:<br>
          <a href="${confirmationLink}" style="color: #067A3A; word-break: break-all;">${confirmationLink}</a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 40px;">
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 15px 20px;">
          <p style="color: #666666; margin: 0; font-size: 14px;">
            This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      </td>
    </tr>
    <tr>
      <td style="background-color: #101012; padding: 30px 40px; text-align: center;">
        <p style="color: #ffffff; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
          Grande Sports Training
        </p>
        <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 14px;">
          Elite Soccer Development in Miami
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
      `

      const text = `
Welcome to Grande Sports!

Hi ${fullName},

Please confirm your email address by clicking the link below:

${confirmationLink}

This link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.

Grande Sports Training
Elite Soccer Development in Miami
      `

      try {
        await getResendClient().emails.send({
          from: 'Grande Sports <noreply@grandesportstraining.com>',
          to: [email],
          subject: 'Confirm your Grande Sports account',
          html,
          text,
        })
      } catch (emailError) {
        console.error('Email send error:', emailError)
        // User created but email failed - they can request a new confirmation
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Account created! Please check your email to confirm your account.',
    })
  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}
