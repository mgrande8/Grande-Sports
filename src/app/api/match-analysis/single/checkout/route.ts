import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { MATCH_ANALYSIS_PRICING } from '@/lib/types'

interface CheckoutBody {
  email_address: string
  contact_email: string
  player_name: string
  jersey_number: string
  jersey_color?: string
  position: string
  additional_info?: string
  video_url: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutBody = await request.json()

    // Validate required fields
    const requiredFields = ['email_address', 'contact_email', 'player_name', 'jersey_number', 'position', 'video_url']
    for (const field of requiredFields) {
      if (!body[field as keyof CheckoutBody]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email_address) || !emailRegex.test(body.contact_email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // Validate video URL
    try {
      new URL(body.video_url)
    } catch {
      return NextResponse.json({ error: 'Invalid video URL' }, { status: 400 })
    }

    const amount = MATCH_ANALYSIS_PRICING.single

    // Create Stripe Checkout session
    // Store form data in metadata (max 500 chars per value, 50 keys)
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Match Analysis',
              description: `Analysis for ${body.player_name} - ${body.position}`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: body.email_address,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/match-analysis/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/match-analysis?cancelled=true`,
      metadata: {
        type: 'match_analysis_single',
        email_address: body.email_address,
        contact_email: body.contact_email,
        player_name: body.player_name,
        jersey_number: body.jersey_number,
        jersey_color: body.jersey_color || '',
        position: body.position,
        additional_info: (body.additional_info || '').substring(0, 500), // Stripe metadata limit
        video_url: body.video_url,
        amount: amount.toString(),
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    console.error('Match analysis checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
