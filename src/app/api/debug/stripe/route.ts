import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const priceId = 'price_1TOrMDFooJJWubcH4fyNJoEf'

    // Get account info to verify which Stripe account we're connected to
    const account = await stripe.accounts.retrieve()

    // Try to retrieve the price
    let priceInfo = null
    let priceError = null
    try {
      priceInfo = await stripe.prices.retrieve(priceId)
    } catch (err: any) {
      priceError = {
        message: err.message,
        type: err.type,
        code: err.code,
      }
    }

    // List all prices to see what exists
    let allPrices = null
    try {
      const prices = await stripe.prices.list({ limit: 10, active: true })
      allPrices = prices.data.map(p => ({
        id: p.id,
        unit_amount: p.unit_amount,
        currency: p.currency,
        recurring: p.recurring,
        product: p.product,
      }))
    } catch (err: any) {
      allPrices = { error: err.message }
    }

    return NextResponse.json({
      stripe_account: {
        id: account.id,
        email: account.email,
        business_profile: account.business_profile,
      },
      target_price_id: priceId,
      price_lookup_result: priceInfo ? {
        found: true,
        id: priceInfo.id,
        unit_amount: priceInfo.unit_amount,
        currency: priceInfo.currency,
        active: priceInfo.active,
      } : {
        found: false,
        error: priceError,
      },
      all_active_prices: allPrices,
      env_check: {
        has_secret_key: !!process.env.STRIPE_SECRET_KEY,
        secret_key_prefix: process.env.STRIPE_SECRET_KEY?.substring(0, 12) + '...',
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      type: error.type,
      code: error.code,
    }, { status: 500 })
  }
}
