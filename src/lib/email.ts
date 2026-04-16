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

// ============================================
// MATCH ANALYSIS EMAILS
// ============================================

interface MatchAnalysisConfirmationData {
  to: string
  playerName: string
  position: string
  videoUrl: string
  amount: number
}

export async function sendMatchAnalysisConfirmationEmail(data: MatchAnalysisConfirmationData) {
  const { to, playerName, position, videoUrl, amount } = data

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Match Analysis Submitted</title>
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
          <span style="font-size: 40px;">🎬</span>
        </div>
        <h2 style="color: #067A3A; margin: 20px 0 10px 0; font-size: 24px;">Match Analysis Submitted!</h2>
        <p style="color: #666666; margin: 0; font-size: 16px;">Thanks for submitting your match for analysis.</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 40px;">
        <div style="background-color: #f8f9fa; border-radius: 12px; padding: 25px; border-left: 4px solid #067A3A;">
          <h3 style="color: #101012; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">Submission Details</h3>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr><td style="padding: 8px 0; color: #666666; font-size: 14px; width: 100px;">Player</td><td style="padding: 8px 0; color: #101012; font-size: 14px; font-weight: 500;">${playerName}</td></tr>
            <tr><td style="padding: 8px 0; color: #666666; font-size: 14px;">Position</td><td style="padding: 8px 0; color: #101012; font-size: 14px; font-weight: 500;">${position}</td></tr>
            <tr><td style="padding: 8px 0; color: #666666; font-size: 14px;">Amount Paid</td><td style="padding: 8px 0; color: #067A3A; font-size: 14px; font-weight: 600;">$${amount.toFixed(2)}</td></tr>
          </table>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 40px;">
        <h3 style="color: #101012; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">What happens next?</h3>
        <ol style="color: #666666; font-size: 14px; padding-left: 20px; margin: 0;">
          <li style="margin-bottom: 10px;">Our coaches will review your match video</li>
          <li style="margin-bottom: 10px;">You'll receive an email with a link to book your review call</li>
          <li style="margin-bottom: 10px;">After the call, we'll send your analysis folder via Google Drive</li>
        </ol>
        <p style="color: #666666; font-size: 14px; margin-top: 15px;"><strong>Turnaround time:</strong> 3-5 business days</p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #101012; padding: 30px 40px; text-align: center;">
        <p style="color: #ffffff; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">Grande Sports Training</p>
        <p style="color: rgba(255,255,255,0.5); margin: 0; font-size: 12px;">Questions? Contact us at td.grandesportstraining@gmail.com</p>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text = `GRANDE SPORTS - Match Analysis Submitted!\n\nThanks for submitting your match for analysis.\n\nSUBMISSION DETAILS:\n- Player: ${playerName}\n- Position: ${position}\n- Amount Paid: $${amount.toFixed(2)}\n\nWHAT HAPPENS NEXT:\n1. Our coaches will review your match video\n2. You'll receive an email with a link to book your review call\n3. After the call, we'll send your analysis folder via Google Drive\n\nTurnaround time: 3-5 business days\n\nQuestions? Contact us at td.grandesportstraining@gmail.com`

  return sendBrevoEmail({
    to,
    subject: `Match Analysis Submitted - ${playerName}`,
    htmlContent: html,
    textContent: text,
  })
}

interface MatchAnalysisAdminNotificationData {
  playerName: string
  position: string
  jerseyNumber: string
  jerseyColor?: string
  videoUrl: string
  contactEmail: string
  additionalInfo?: string
  amount: number
}

export async function sendMatchAnalysisAdminNotification(data: MatchAnalysisAdminNotificationData) {
  const adminEmail = process.env.ADMIN_EMAIL || 'td.grandesportstraining@gmail.com'
  const { playerName, position, jerseyNumber, jerseyColor, videoUrl, contactEmail, additionalInfo, amount } = data

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Match Analysis Submission</title>
</head>
<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <div style="background-color: #067A3A; padding: 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 20px;">🎬 New Match Analysis</h1>
    </div>
    <div style="padding: 30px;">
      <p style="color: #666; margin: 0 0 20px 0;">A new match analysis has been submitted and paid.</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;">Player</td><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">${playerName}</td></tr>
        <tr><td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;">Position</td><td style="padding: 10px; border-bottom: 1px solid #eee;">${position}</td></tr>
        <tr><td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;">Jersey</td><td style="padding: 10px; border-bottom: 1px solid #eee;">#${jerseyNumber}${jerseyColor ? ` (${jerseyColor})` : ''}</td></tr>
        <tr><td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;">Contact Email</td><td style="padding: 10px; border-bottom: 1px solid #eee;"><a href="mailto:${contactEmail}">${contactEmail}</a></td></tr>
        <tr><td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;">Amount</td><td style="padding: 10px; border-bottom: 1px solid #eee; color: #067A3A; font-weight: bold;">$${amount.toFixed(2)}</td></tr>
      </table>
      ${additionalInfo ? `<div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px;"><strong style="color: #333;">Additional Notes:</strong><p style="color: #666; margin: 10px 0 0 0;">${additionalInfo}</p></div>` : ''}
      <div style="margin-top: 25px; text-align: center;">
        <a href="${videoUrl}" target="_blank" style="display: inline-block; background-color: #067A3A; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold;">Watch Match Video</a>
      </div>
      <div style="margin-top: 25px; text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/match-analysis" style="display: inline-block; background-color: #101012; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px;">View in Dashboard</a>
      </div>
    </div>
  </div>
</body>
</html>`

  const text = `NEW MATCH ANALYSIS SUBMISSION\n\nPlayer: ${playerName}\nPosition: ${position}\nJersey: #${jerseyNumber}${jerseyColor ? ` (${jerseyColor})` : ''}\nContact: ${contactEmail}\nAmount: $${amount.toFixed(2)}\n\nVideo: ${videoUrl}\n\n${additionalInfo ? `Notes: ${additionalInfo}` : ''}\n\nView in dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/admin/match-analysis`

  return sendBrevoEmail({
    to: adminEmail,
    subject: `🎬 New Match Analysis: ${playerName} - ${position}`,
    htmlContent: html,
    textContent: text,
  })
}

interface AnalysisCompleteEmailData {
  to: string
  playerName: string
  calendlyUrl: string
}

export async function sendAnalysisCompleteEmail(data: AnalysisCompleteEmailData) {
  const { to, playerName, calendlyUrl } = data

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Match Analysis is Ready!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="background-color: #067A3A; padding: 30px 40px; text-align: center;">
        <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo-email.png" alt="Grande Sports" style="height: 60px; width: auto;" />
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 40px 20px 40px; text-align: center;">
        <div style="display: inline-block; background-color: #e8f5e9; border-radius: 50%; width: 80px; height: 80px; line-height: 80px;">
          <span style="font-size: 40px;">✅</span>
        </div>
        <h2 style="color: #067A3A; margin: 20px 0 10px 0; font-size: 24px;">Your Analysis is Ready!</h2>
        <p style="color: #666666; margin: 0; font-size: 16px;">Hi! We've completed the analysis for ${playerName}.</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 40px;">
        <p style="color: #666; font-size: 14px; line-height: 1.6;">The next step is to schedule a video call where we'll walk through the analysis together and discuss key areas for improvement.</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 40px; text-align: center;">
        <a href="${calendlyUrl}" target="_blank" style="display: inline-block; background-color: #067A3A; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: bold;">Book Your Review Call</a>
        <p style="color: #999; font-size: 12px; margin-top: 15px;">Click to choose a time that works for you</p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #101012; padding: 30px 40px; text-align: center;">
        <p style="color: #ffffff; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">Grande Sports Training</p>
        <p style="color: rgba(255,255,255,0.5); margin: 0; font-size: 12px;">Questions? Reply to this email.</p>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text = `YOUR MATCH ANALYSIS IS READY!\n\nHi! We've completed the analysis for ${playerName}.\n\nThe next step is to schedule a video call where we'll walk through the analysis together.\n\nBook your review call: ${calendlyUrl}\n\nQuestions? Reply to this email.`

  return sendBrevoEmail({
    to,
    subject: `Your Match Analysis is Ready - Book Your Review Call`,
    htmlContent: html,
    textContent: text,
  })
}

interface DeliveryEmailData {
  to: string
  playerName: string
  deliveryFolderUrl: string
}

export async function sendDeliveryEmail(data: DeliveryEmailData) {
  const { to, playerName, deliveryFolderUrl } = data

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Match Analysis Materials</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="background-color: #067A3A; padding: 30px 40px; text-align: center;">
        <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo-email.png" alt="Grande Sports" style="height: 60px; width: auto;" />
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 40px 20px 40px; text-align: center;">
        <div style="display: inline-block; background-color: #e8f5e9; border-radius: 50%; width: 80px; height: 80px; line-height: 80px;">
          <span style="font-size: 40px;">📁</span>
        </div>
        <h2 style="color: #067A3A; margin: 20px 0 10px 0; font-size: 24px;">Your Analysis Materials</h2>
        <p style="color: #666666; margin: 0; font-size: 16px;">Here's everything from your match analysis for ${playerName}.</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 40px; text-align: center;">
        <a href="${deliveryFolderUrl}" target="_blank" style="display: inline-block; background-color: #067A3A; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: bold;">Open Google Drive Folder</a>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 40px;">
        <p style="color: #666; font-size: 14px; line-height: 1.6;">Your folder contains all the analysis materials we discussed during your review call. Feel free to revisit these anytime and share with your coach if needed.</p>
        <p style="color: #666; font-size: 14px;">Thank you for choosing Grande Sports Training!</p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #101012; padding: 30px 40px; text-align: center;">
        <p style="color: #ffffff; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">Grande Sports Training</p>
        <p style="color: rgba(255,255,255,0.5); margin: 0; font-size: 12px;">Questions? Reply to this email.</p>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text = `YOUR MATCH ANALYSIS MATERIALS\n\nHere's everything from your match analysis for ${playerName}.\n\nOpen your Google Drive folder: ${deliveryFolderUrl}\n\nYour folder contains all the analysis materials we discussed during your review call.\n\nThank you for choosing Grande Sports Training!\n\nQuestions? Reply to this email.`

  return sendBrevoEmail({
    to,
    subject: `Your Match Analysis Materials - ${playerName}`,
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
