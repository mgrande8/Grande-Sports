const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'
const FROM_EMAIL = 'noreply@grandesportstraining.com'
const FROM_NAME = 'Grande Sports'

async function sendBrevoEmail({ to, subject, htmlContent, textContent }: {
  to: string
  subject: string
  htmlContent: string
  textContent: string
}) {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    console.error('BREVO_API_KEY is not set')
    return { success: false, error: 'BREVO_API_KEY not configured' }
  }

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: FROM_NAME, email: FROM_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent,
      textContent,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Brevo email failed:', response.status, error)
    return { success: false, error }
  }

  const data = await response.json()
  return { success: true, data }
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
    <tr>
      <td style="background-color: #067A3A; padding: 30px 40px; text-align: center;">
        <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo-email.png" alt="Grande Sports" style="height: 60px; width: auto;" />
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 40px 20px 40px; text-align: center;">
        <div style="display: inline-block; background-color: #e8f5e9; border-radius: 50%; width: 80px; height: 80px; line-height: 80px;">
          <span style="font-size: 40px;">✓</span>
        </div>
        <h2 style="color: #067A3A; margin: 20px 0 10px 0; font-size: 24px;">Booking Confirmed!</h2>
        <p style="color: #666666; margin: 0; font-size: 16px;">Hi ${athleteName}, your training session is booked.</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 40px;">
        <div style="background-color: #f8f9fa; border-radius: 12px; padding: 25px; border-left: 4px solid #067A3A;">
          <h3 style="color: #101012; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">Session Details</h3>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr><td style="padding: 8px 0; color: #666666; font-size: 14px; width: 100px;">Session</td><td style="padding: 8px 0; color: #101012; font-size: 14px; font-weight: 500;">${sessionTitle}</td></tr>
            ${coachName ? `<tr><td style="padding: 8px 0; color: #666666; font-size: 14px;">Coach</td><td style="padding: 8px 0; color: #101012; font-size: 14px; font-weight: 500;">${coachName}</td></tr>` : ''}
            <tr><td style="padding: 8px 0; color: #666666; font-size: 14px;">Date</td><td style="padding: 8px 0; color: #101012; font-size: 14px; font-weight: 500;">${sessionDate}</td></tr>
            <tr><td style="padding: 8px 0; color: #666666; font-size: 14px;">Time</td><td style="padding: 8px 0; color: #101012; font-size: 14px; font-weight: 500;">${sessionTime}</td></tr>
            <tr><td style="padding: 8px 0; color: #666666; font-size: 14px;">Location</td><td style="padding: 8px 0; color: #101012; font-size: 14px; font-weight: 500;">${sessionLocation}</td></tr>
            <tr><td style="padding: 8px 0; color: #666666; font-size: 14px;">Parking</td><td style="padding: 8px 0; color: #101012; font-size: 14px; font-weight: 500;">Free parking on-site near the soccer fields</td></tr>
            ${amountPaid > 0 ? `<tr><td style="padding: 8px 0; color: #666666; font-size: 14px;">Amount Paid</td><td style="padding: 8px 0; color: #067A3A; font-size: 14px; font-weight: 600;">$${amountPaid.toFixed(2)}</td></tr>` : `<tr><td style="padding: 8px 0; color: #666666; font-size: 14px;">Amount</td><td style="padding: 8px 0; color: #067A3A; font-size: 14px; font-weight: 600;">Free Session</td></tr>`}
          </table>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 40px;">
        <div style="background-color: #fff3cd; border-radius: 8px; padding: 15px 20px;">
          <p style="color: #856404; margin: 0; font-size: 14px;"><strong>Reminder:</strong> Please arrive 10 minutes early. Cancellations must be made at least 24 hours in advance to receive a credit.</p>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 40px; text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background-color: #067A3A; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">View My Sessions</a>
      </td>
    </tr>
    <tr>
      <td style="background-color: #101012; padding: 30px 40px; text-align: center;">
        <p style="color: #ffffff; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">Grande Sports Training</p>
        <div style="margin: 0 0 20px 0;">
          <a href="https://www.instagram.com/grandesportstraining/" target="_blank" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Instagram" style="width: 28px; height: 28px;" /></a>
          <a href="https://www.tiktok.com/@grandesportstraining" target="_blank" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" alt="TikTok" style="width: 28px; height: 28px;" /></a>
        </div>
        <p style="color: rgba(255,255,255,0.5); margin: 0; font-size: 12px;">Questions? Reply to this email or contact us at<br>td.grandesportstraining@gmail.com</p>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text = `GRANDE SPORTS - Booking Confirmed!\n\nHi ${athleteName},\n\nYour training session has been booked.\n\nSession: ${sessionTitle}${coachName ? `\nCoach: ${coachName}` : ''}\nDate: ${sessionDate}\nTime: ${sessionTime}\nLocation: ${sessionLocation}\nParking: Free on-site\nAmount: ${amountPaid > 0 ? `$${amountPaid.toFixed(2)}` : 'Free Session'}\n\nPlease arrive 10 minutes early. Cancellations must be made at least 24 hours in advance.\n\nView your sessions: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard\n\nQuestions? td.grandesportstraining@gmail.com`

  return sendBrevoEmail({
    to,
    subject: `Booking Confirmed: ${sessionTitle} on ${sessionDate}`,
    htmlContent: html,
    textContent: text,
  })
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
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr><td style="background-color: #067A3A; padding: 30px 40px; text-align: center;"><img src="${process.env.NEXT_PUBLIC_APP_URL}/logo-email.png" alt="Grande Sports" style="height: 60px; width: auto;" /></td></tr>
    <tr>
      <td style="padding: 40px 40px 20px 40px; text-align: center;">
        <h2 style="color: #1976d2; margin: 20px 0 10px 0; font-size: 24px;">Session Assigned</h2>
        <p style="color: #666666; margin: 0; font-size: 16px;">Hi ${athleteName}, you've been assigned to a training session.</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 40px;">
        <div style="background-color: #f8f9fa; border-radius: 12px; padding: 25px; border-left: 4px solid #067A3A;">
          <h3 style="color: #101012; margin: 0 0 20px 0; font-size: 18px;">Session Details</h3>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr><td style="padding: 8px 0; color: #666666; font-size: 14px; width: 100px;">Session</td><td style="padding: 8px 0; color: #101012; font-size: 14px; font-weight: 500;">${sessionTitle}</td></tr>
            ${coachName ? `<tr><td style="padding: 8px 0; color: #666666; font-size: 14px;">Coach</td><td style="padding: 8px 0; color: #101012; font-size: 14px; font-weight: 500;">${coachName}</td></tr>` : ''}
            <tr><td style="padding: 8px 0; color: #666666; font-size: 14px;">Date</td><td style="padding: 8px 0; color: #101012; font-size: 14px; font-weight: 500;">${sessionDate}</td></tr>
            <tr><td style="padding: 8px 0; color: #666666; font-size: 14px;">Time</td><td style="padding: 8px 0; color: #101012; font-size: 14px; font-weight: 500;">${sessionTime}</td></tr>
            <tr><td style="padding: 8px 0; color: #666666; font-size: 14px;">Location</td><td style="padding: 8px 0; color: #101012; font-size: 14px; font-weight: 500;">${sessionLocation}</td></tr>
          </table>
        </div>
      </td>
    </tr>
    <tr><td style="padding: 20px 40px;"><div style="background-color: #e3f2fd; border-radius: 8px; padding: 15px 20px;"><p style="color: #1565c0; margin: 0; font-size: 14px;">This session was assigned by your coach. Please arrive 10 minutes early!</p></div></td></tr>
    <tr><td style="padding: 20px 40px; text-align: center;"><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background-color: #067A3A; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">View My Sessions</a></td></tr>
    <tr>
      <td style="background-color: #101012; padding: 30px 40px; text-align: center;">
        <p style="color: #ffffff; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">Grande Sports Training</p>
        <div style="margin: 0 0 20px 0;"><a href="https://www.instagram.com/grandesportstraining/" target="_blank" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Instagram" style="width: 28px; height: 28px;" /></a><a href="https://www.tiktok.com/@grandesportstraining" target="_blank" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" alt="TikTok" style="width: 28px; height: 28px;" /></a></div>
        <p style="color: rgba(255,255,255,0.5); margin: 0; font-size: 12px;">Questions? Contact us at td.grandesportstraining@gmail.com</p>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text = `Session Assigned\n\nHi ${athleteName},\n\nYou've been assigned to:\n\nSession: ${sessionTitle}${coachName ? `\nCoach: ${coachName}` : ''}\nDate: ${sessionDate}\nTime: ${sessionTime}\nLocation: ${sessionLocation}\n\nPlease arrive 10 minutes early!\n\nView: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard`

  return sendBrevoEmail({
    to,
    subject: `Session Assigned: ${sessionTitle} on ${sessionDate}`,
    htmlContent: html,
    textContent: text,
  })
}

export async function sendSessionReminderEmail(data: {
  to: string
  athleteName: string
  sessionTitle: string
  sessionDate: string
  sessionTime: string
  sessionLocation: string
  coachName?: string
}) {
  const { to, athleteName, sessionTitle, sessionDate, sessionTime, sessionLocation, coachName } = data

  const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr><td style="background-color: #067A3A; padding: 30px 40px; text-align: center;"><img src="${process.env.NEXT_PUBLIC_APP_URL}/logo-email.png" alt="Grande Sports" style="height: 60px; width: auto;" /></td></tr>
    <tr><td style="padding: 40px; text-align: center;">
      <h2 style="color: #067A3A; margin: 0 0 10px;">Training Tomorrow!</h2>
      <p style="color: #666;">Hi ${athleteName}, just a reminder about your session tomorrow.</p>
    </td></tr>
    <tr><td style="padding: 0 40px 20px;">
      <div style="background-color: #f8f9fa; border-radius: 12px; padding: 25px; border-left: 4px solid #067A3A;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr><td style="padding: 8px 0; color: #666; font-size: 14px; width: 100px;">Session</td><td style="padding: 8px 0; color: #101012; font-size: 14px; font-weight: 500;">${sessionTitle}</td></tr>
          ${coachName ? `<tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Coach</td><td style="padding: 8px 0; color: #101012; font-size: 14px; font-weight: 500;">${coachName}</td></tr>` : ''}
          <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Date</td><td style="padding: 8px 0; color: #101012; font-size: 14px; font-weight: 500;">${sessionDate}</td></tr>
          <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Time</td><td style="padding: 8px 0; color: #101012; font-size: 14px; font-weight: 500;">${sessionTime}</td></tr>
          <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Location</td><td style="padding: 8px 0; color: #101012; font-size: 14px; font-weight: 500;">${sessionLocation}</td></tr>
          <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Parking</td><td style="padding: 8px 0; color: #101012; font-size: 14px;">Free on-site near the fields</td></tr>
        </table>
      </div>
    </td></tr>
    <tr><td style="padding: 0 40px 20px;"><p style="color: #666; font-size: 14px; margin: 0;"><strong>What to bring:</strong> Cleats, shin guards, water</p></td></tr>
    <tr>
      <td style="background-color: #101012; padding: 30px 40px; text-align: center;">
        <p style="color: #ffffff; margin: 0 0 10px; font-size: 16px; font-weight: 600;">Grande Sports Training</p>
        <p style="color: rgba(255,255,255,0.5); margin: 0; font-size: 12px;">See you on the field!</p>
      </td>
    </tr>
  </table>
</body></html>`

  const text = `Reminder: Training Tomorrow!\n\nHi ${athleteName},\n\nSession: ${sessionTitle}${coachName ? `\nCoach: ${coachName}` : ''}\nDate: ${sessionDate}\nTime: ${sessionTime}\nLocation: ${sessionLocation}\nParking: Free on-site\n\nBring: Cleats, shin guards, water\n\nSee you on the field!`

  return sendBrevoEmail({
    to,
    subject: `Reminder: ${sessionTitle} Tomorrow at ${sessionTime}`,
    htmlContent: html,
    textContent: text,
  })
}

export async function sendPostSessionFollowUpEmail(data: {
  to: string
  athleteName: string
  sessionTitle: string
  sessionDate: string
}) {
  const { to, athleteName, sessionTitle, sessionDate } = data

  const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr><td style="background-color: #067A3A; padding: 30px 40px; text-align: center;"><img src="${process.env.NEXT_PUBLIC_APP_URL}/logo-email.png" alt="Grande Sports" style="height: 60px; width: auto;" /></td></tr>
    <tr><td style="padding: 40px; text-align: center;">
      <h2 style="color: #101012; margin: 0 0 10px;">How Was Your Session?</h2>
      <p style="color: #666;">Hi ${athleteName}, thanks for training with us today!</p>
    </td></tr>
    <tr><td style="padding: 0 40px 20px;">
      <div style="background-color: #f8f9fa; border-radius: 12px; padding: 20px;">
        <p style="color: #666; font-size: 14px; margin: 0;">Session: <strong>${sessionTitle}</strong><br>Date: ${sessionDate}</p>
      </div>
    </td></tr>
    <tr><td style="padding: 0 40px 20px;"><p style="color: #666; font-size: 14px;">Want to keep the momentum going? Book your next session now:</p></td></tr>
    <tr><td style="padding: 0 40px 30px; text-align: center;"><a href="${process.env.NEXT_PUBLIC_APP_URL}/book" style="display: inline-block; background-color: #067A3A; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">Book Next Session</a></td></tr>
    <tr><td style="padding: 0 40px 20px;"><p style="color: #666; font-size: 14px;">Have feedback? Reply to this email and we'll get back to you.</p></td></tr>
    <tr>
      <td style="background-color: #101012; padding: 30px 40px; text-align: center;">
        <p style="color: #ffffff; margin: 0 0 15px; font-size: 16px; font-weight: 600;">Grande Sports Training</p>
        <div style="margin: 0 0 20px;"><a href="https://www.instagram.com/grandesportstraining/" target="_blank" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Instagram" style="width: 28px; height: 28px;" /></a><a href="https://www.tiktok.com/@grandesportstraining" target="_blank" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" alt="TikTok" style="width: 28px; height: 28px;" /></a></div>
        <p style="color: rgba(255,255,255,0.5); margin: 0; font-size: 12px;">td.grandesportstraining@gmail.com</p>
      </td>
    </tr>
  </table>
</body></html>`

  const text = `How Was Your Session?\n\nHi ${athleteName}, thanks for training with us!\n\nSession: ${sessionTitle}\nDate: ${sessionDate}\n\nBook your next session: ${process.env.NEXT_PUBLIC_APP_URL}/book\n\nHave feedback? Reply to this email.`

  return sendBrevoEmail({
    to,
    subject: `How was your session? - ${sessionTitle}`,
    htmlContent: html,
    textContent: text,
  })
}
