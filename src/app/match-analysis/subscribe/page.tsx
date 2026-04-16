'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LoadingSpinner from '@/components/LoadingSpinner'
import { MATCH_ANALYSIS_PRICING } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { CheckCircle, Video, Calendar, Zap, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Subscription {
  id: string
  credits_total: number
  credits_used: number
  credits_remaining: number
  status: string
  current_period_end: string
}

export default function MatchAnalysisSubscribePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [subscription, setSubscription] = useState<Subscription | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const cancelled = searchParams.get('cancelled')

  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (success) {
      // Refetch subscription after successful payment
      fetchSubscription()
    }
  }, [success])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    if (user) {
      await fetchSubscription()
    }

    setLoading(false)
  }

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/match-analysis/subscription/status')
      const data = await response.json()

      if (data.hasSubscription) {
        setSubscription(data.subscription)
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error)
    }
  }

  const handleSubscribe = async () => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    setCheckoutLoading(true)

    try {
      const response = await fetch('/api/match-analysis/subscription/checkout', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.error) {
        alert(data.error)
        setCheckoutLoading(false)
        return
      }

      window.location.href = data.url
    } catch (error) {
      alert('Failed to start checkout')
      setCheckoutLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gs-gray-100">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </main>
        <Footer />
      </div>
    )
  }

  // Show success message
  if (success && subscription) {
    return (
      <div className="min-h-screen flex flex-col bg-gs-gray-100">
        <Header />
        <main className="flex-1 py-12">
          <div className="max-w-xl mx-auto px-4">
            <div className="card text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={48} className="text-gs-green" />
              </div>

              <h1 className="text-2xl font-bold mb-2">Subscription Active!</h1>
              <p className="text-gs-gray-600 mb-8">
                You now have {subscription.credits_remaining} match analyses available this month.
              </p>

              <Link
                href="/match-analysis/submit"
                className="btn-green inline-flex items-center gap-2"
              >
                Submit Your First Analysis
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Show active subscription status
  if (subscription) {
    return (
      <div className="min-h-screen flex flex-col bg-gs-gray-100">
        <Header />
        <main className="flex-1 py-12">
          <div className="max-w-xl mx-auto px-4">
            <div className="card">
              <h1 className="text-2xl font-bold mb-6">Your Subscription</h1>

              <div className="bg-gs-green/10 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gs-gray-600">Monthly Plan</span>
                  <span className="px-3 py-1 bg-gs-green text-white text-sm font-medium rounded-full">
                    Active
                  </span>
                </div>

                <div className="text-center">
                  <p className="text-4xl font-bold text-gs-green mb-1">
                    {subscription.credits_remaining}
                  </p>
                  <p className="text-gs-gray-600">analyses remaining this month</p>
                </div>

                <div className="mt-4 pt-4 border-t border-gs-green/20">
                  <p className="text-sm text-gs-gray-600 text-center">
                    Renews {new Date(subscription.current_period_end).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {subscription.credits_remaining > 0 ? (
                <Link
                  href="/match-analysis/submit"
                  className="btn-green w-full flex items-center justify-center gap-2"
                >
                  Submit Analysis
                  <ArrowRight size={18} />
                </Link>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gs-gray-600">
                    You've used all your analyses this month. Credits reset on renewal.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Show subscription offer
  return (
    <div className="min-h-screen flex flex-col bg-gs-gray-100">
      <Header />

      <main className="flex-1 py-12">
        <div className="max-w-3xl mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Match Analysis Subscription
            </h1>
            <p className="text-gs-gray-600 text-lg">
              Get regular match analysis to accelerate your development
            </p>
          </div>

          {/* Cancelled message */}
          {cancelled && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6">
              Checkout was cancelled. You can try again when you're ready.
            </div>
          )}

          {/* Subscription Card */}
          <div className="card border-2 border-gs-green max-w-md mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-2">Monthly Plan</h2>
              <div className="text-4xl font-bold text-gs-green">
                {formatCurrency(MATCH_ANALYSIS_PRICING.subscription_monthly)}
                <span className="text-base font-normal text-gs-gray-500">/month</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gs-green/10 rounded-full flex items-center justify-center">
                  <Video size={14} className="text-gs-green" />
                </div>
                <span>{MATCH_ANALYSIS_PRICING.subscription_credits} match analyses per month</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gs-green/10 rounded-full flex items-center justify-center">
                  <CheckCircle size={14} className="text-gs-green" />
                </div>
                <span>Full match breakdown</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gs-green/10 rounded-full flex items-center justify-center">
                  <Calendar size={14} className="text-gs-green" />
                </div>
                <span>1-on-1 video review for each</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gs-green/10 rounded-full flex items-center justify-center">
                  <Zap size={14} className="text-gs-green" />
                </div>
                <span>Priority turnaround</span>
              </li>
            </ul>

            <button
              onClick={handleSubscribe}
              disabled={checkoutLoading}
              className="btn-green w-full flex items-center justify-center gap-2"
            >
              {checkoutLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </>
              ) : user ? (
                <>
                  Subscribe Now
                  <ArrowRight size={18} />
                </>
              ) : (
                <>
                  Sign In to Subscribe
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <p className="text-xs text-gs-gray-500 text-center mt-4">
              Cancel anytime. Credits reset each billing cycle.
            </p>
          </div>

          {/* Compare */}
          <div className="text-center mt-8">
            <p className="text-gs-gray-600 mb-2">
              Only need a single analysis?
            </p>
            <Link href="/match-analysis" className="text-gs-green font-medium hover:underline">
              Pay {formatCurrency(MATCH_ANALYSIS_PRICING.single)} per analysis instead
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
