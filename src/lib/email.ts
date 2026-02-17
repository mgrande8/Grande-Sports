import { Resend } from 'resend'

const FROM_EMAIL = 'Grande Sports <noreply@grandesportstraining.com>'

function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY)
}

interface BookingEmailData {
  to: string
  athleteName: string
  sessionTitle: string
  sessionDate: string
  sessionTime: string
  sessionLocation: string
  amountPaid: number
  coachName?: string
}

export async function sendBookingConfirmationEmail(data: BookingEmailData) {
  const { to, athleteName, sessionTitle, sessionDate, sessionTime, sessionLocation, amountPaid, coachName } = data

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background-color: #067A3A; padding: 30px 40px; text-align: center;">
        <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo-email.png" alt="Grande Sports" style="height: 60px; width: auto;" />
      </td>
    </tr>

    <!-- Success Badge -->
    <tr>
      <td style="padding: 40px 40px 20px 40px; text-align: center;">
        <div style="display: inline-block; background-color: #e8f5e9; border-radius: 50%; width: 80px; height: 80px; line-height: 80px;">
          <span style="font-size: 40px;">✓</span>
        </div>
        <h2 style="color: #067A3A; margin: 20px 0 10px 0; font-size: 24px;">
          Booking Confirmed!
        </h2>
        <p style="color: #666666; margin: 0; font-size: 16px;">
          Hi ${athleteName}, your training session is booked.
        </p>
      </td>
    </tr>

    <!-- Session Details -->
    <tr>
      <td style="padding: 20px 40px;">
        <div style="background-color: #f8f9fa; border-radius: 12px; padding: 25px; border-left: 4px solid #067A3A;">
          <h3 style="color: #101012; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
            Session Details
          </h3>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 8px 0; color: #666666; font-size: 14px; width: 100px;">Session</td>
              <td style="padding: 8px 0; color: #101012; font-size: 14px; font-weight: 500;">${sessionTitle}</td>
            </tr>
            ${coachName ? `
            <tr>
              <td style="padding: 8px 0; color: #666666; font-size: 14px;">Coach</td>
              <td style="padding: 8px 0; color: #101012; font-size: 14px; font-weight: 500;">${coachName}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; color: #666666; font-size: 14px;">Date</td>
              <td style="padding: 8px 0; color: #101012; font-size: 14px; font-weight: 500;">${sessionDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666666; font-size: 14px;">Time</td>
              <td style="padding: 8px 0; color: #101012; font-size: 14px; font-weight: 500;">${sessionTime}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666666; font-size: 14px;">Location</td>
              <td style="padding: 8px 0; color: #101012; font-size: 14px; font-weight: 500;">${sessionLocation}</td>
            </tr>
            ${amountPaid > 0 ? `
            <tr>
              <td style="padding: 8px 0; color: #666666; font-size: 14px;">Amount Paid</td>
              <td style="padding: 8px 0; color: #067A3A; font-size: 14px; font-weight: 600;">$${amountPaid.toFixed(2)}</td>
            </tr>
            ` : `
            <tr>
              <td style="padding: 8px 0; color: #666666; font-size: 14px;">Amount</td>
              <td style="padding: 8px 0; color: #067A3A; font-size: 14px; font-weight: 600;">Free Session</td>
            </tr>
            `}
          </table>
        </div>
      </td>
    </tr>

    <!-- Important Info -->
    <tr>
      <td style="padding: 20px 40px;">
        <div style="background-color: #fff3cd; border-radius: 8px; padding: 15px 20px;">
          <p style="color: #856404; margin: 0; font-size: 14px;">
            <strong>Reminder:</strong> Please arrive 10 minutes early. Cancellations must be made at least 24 hours in advance to receive a credit.
          </p>
        </div>
      </td>
    </tr>

    <!-- CTA Button -->
    <tr>
      <td style="padding: 20px 40px; text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
           style="display: inline-block; background-color: #067A3A; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
          View My Sessions
        </a>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #101012; padding: 30px 40px; text-align: center;">
        <p style="color: #ffffff; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">
          Grande Sports Training
        </p>
        <!-- Social Icons -->
        <div style="margin: 0 0 20px 0;">
          <a href="https://www.instagram.com/grandesportstraining/" target="_blank" style="display: inline-block; margin: 0 8px;">
            <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Instagram" style="width: 28px; height: 28px;" />
          </a>
          <a href="https://www.tiktok.com/@grandesportstraining" target="_blank" style="display: inline-block; margin: 0 8px;">
            <img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" alt="TikTok" style="width: 28px; height: 28px;" />
          </a>
        </div>
        <p style="color: rgba(255,255,255,0.5); margin: 0; font-size: 12px;">
          Questions? Reply to this email or contact us at<br>
          td.grandesportstraining@gmail.com
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  const text = `
GRANDE SPORTS - Booking Confirmed!

Hi ${athleteName},

Your training session has been booked successfully.

SESSION DETAILS:
- Session: ${sessionTitle}${coachName ? `\n- Coach: ${coachName}` : ''}
- Date: ${sessionDate}
- Time: ${sessionTime}
- Location: ${sessionLocation}
- Amount: ${amountPaid > 0 ? `$${amountPaid.toFixed(2)}` : 'Free Session'}

IMPORTANT: Please arrive 10 minutes early. Cancellations must be made at least 24 hours in advance to receive a credit.

View your sessions at: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

Questions? Contact us at td.grandesportstraining@gmail.com

Grande Sports Training
Instagram: @grandesportstraining | TikTok: @grandesportstraining
  `

  try {
    const { data, error } = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `Booking Confirmed: ${sessionTitle} on ${sessionDate}`,
      html,
      text,
    })

    if (error) {
      console.error('Email send error:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Email exception:', error)
    return { success: false, error }
  }
}

interface SessionAssignedEmailData {
  to: string
  athleteName: string
  sessionTitle: string
  sessionDate: string
  sessionTime: string
  sessionLocation: string
  coachName?: string
}

export async function sendSessionAssignedEmail(data: SessionAssignedEmailData) {
  const { to, athleteName, sessionTitle, sessionDate, sessionTime, sessionLocation, coachName } = data

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Session Assigned</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background-color: #067A3A; padding: 30px 40px; text-align: center;">
        <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo-email.png" alt="Grande Sports" style="height: 60px; width: auto;" />
      </td>
    </tr>

    <!-- Content -->
    <tr>
      <td style="padding: 40px 40px 20px 40px; text-align: center;">
        <div style="display: inline-block; background-color: #e3f2fd; border-radius: 50%; width: 80px; height: 80px; line-height: 80px;">
          <span style="font-size: 40px;">📅</span>
        </div>
        <h2 style="color: #1976d2; margin: 20px 0 10px 0; font-size: 24px;">
          Session Assigned
        </h2>
        <p style="color: #666666; margin: 0; font-size: 16px;">
          Hi ${athleteName}, you've been assigned to a training session.
        </p>
      </td>
    </tr>

    <!-- Session Details -->
    <tr>
      <td style="padding: 20px 40px;">
        <div style="background-color: #f8f9fa; border-radius: 12px; padding: 25px; border-left: 4px solid #067A3A;">
          <h3 style="color: #101012; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
            Session Details
          </h3>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 8px 0; color: #666666; font-size: 14px; width: 100px;">Session</td>
              <td style="padding: 8px 0; color: #101012; font-size: 14px; font-weight: 500;">${sessionTitle}</td>
            </tr>
            ${coachName ? `
            <tr>
              <td style="padding: 8px 0; color: #666666; font-size: 14px;">Coach</td>
              <td style="padding: 8px 0; color: #101012; font-size: 14px; font-weight: 500;">${coachName}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; color: #666666; font-size: 14px;">Date</td>
              <td style="padding: 8px 0; color: #101012; font-size: 14px; font-weight: 500;">${sessionDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666666; font-size: 14px;">Time</td>
              <td style="padding: 8px 0; color: #101012; font-size: 14px; font-weight: 500;">${sessionTime}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666666; font-size: 14px;">Location</td>
              <td style="padding: 8px 0; color: #101012; font-size: 14px; font-weight: 500;">${sessionLocation}</td>
            </tr>
          </table>
        </div>
      </td>
    </tr>

    <!-- Info -->
    <tr>
      <td style="padding: 20px 40px;">
        <div style="background-color: #e3f2fd; border-radius: 8px; padding: 15px 20px;">
          <p style="color: #1565c0; margin: 0; font-size: 14px;">
            This session was assigned by your coach. Please arrive 10 minutes early and come prepared to train!
          </p>
        </div>
      </td>
    </tr>

    <!-- CTA Button -->
    <tr>
      <td style="padding: 20px 40px; text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
           style="display: inline-block; background-color: #067A3A; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
          View My Sessions
        </a>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #101012; padding: 30px 40px; text-align: center;">
        <p style="color: #ffffff; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">
          Grande Sports Training
        </p>
        <!-- Social Icons -->
        <div style="margin: 0 0 20px 0;">
          <a href="https://www.instagram.com/grandesportstraining/" target="_blank" style="display: inline-block; margin: 0 8px;">
            <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Instagram" style="width: 28px; height: 28px;" />
          </a>
          <a href="https://www.tiktok.com/@grandesportstraining" target="_blank" style="display: inline-block; margin: 0 8px;">
            <img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" alt="TikTok" style="width: 28px; height: 28px;" />
          </a>
        </div>
        <p style="color: rgba(255,255,255,0.5); margin: 0; font-size: 12px;">
          Questions? Contact us at<br>
          td.grandesportstraining@gmail.com
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  const text = `
GRANDE SPORTS - Session Assigned

Hi ${athleteName},

You've been assigned to a training session.

SESSION DETAILS:
- Session: ${sessionTitle}${coachName ? `\n- Coach: ${coachName}` : ''}
- Date: ${sessionDate}
- Time: ${sessionTime}
- Location: ${sessionLocation}

This session was assigned by your coach. Please arrive 10 minutes early and come prepared to train!

View your sessions at: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

Questions? Contact us at td.grandesportstraining@gmail.com

Grande Sports Training
Instagram: @grandesportstraining | TikTok: @grandesportstraining
  `

  try {
    const { data, error } = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `Session Assigned: ${sessionTitle} on ${sessionDate}`,
      html,
      text,
    })

    if (error) {
      console.error('Email send error:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Email exception:', error)
    return { success: false, error }
  }
}
