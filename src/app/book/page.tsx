'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SessionCard from '@/components/SessionCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Session } from '@/lib/types'
import { formatCurrency, calculateDiscountedPrice } from '@/lib/utils'
import { format, addDays, startOfDay, addMonths } from 'date-fns'
import { Calendar, Tag, CreditCard, ArrowRight, ArrowLeft, Wallet } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface PaymentMethod {
  id: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
}

export default function BookPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [discountCode, setDiscountCode] = useState('')
  const [discountApplied, setDiscountApplied] = useState<{
    type: 'percentage' | 'fixed' | 'free_session'
    value: number
    id: string
  } | null>(null)
  const [discountError, setDiscountError] = useState('')
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Payment methods
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('new')
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
    fetchSessions()
  }, [selectedDate])

  // Reset checkout loading state when page becomes visible (user clicked back from Stripe)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setCheckoutLoading(false)
      }
    }

    // Reset on mount (in case user navigated back)
    setCheckoutLoading(false)

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      fetchPaymentMethods()
    }
  }

  const fetchPaymentMethods = async () => {
    setLoadingPaymentMethods(true)
    try {
      const response = await fetch('/api/payment-methods')
      const data = await response.json()
      if (data.paymentMethods) {
        setPaymentMethods(data.paymentMethods)
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error)
    }
    setLoadingPaymentMethods(false)
  }

  const fetchSessions = async () => {
    setLoading(true)
    const dateStr = format(selectedDate, 'yyyy-MM-dd')

    try {
      const response = await fetch(`/api/sessions?date=${dateStr}`)
      const data = await response.json()

      if (data.sessions) {
        setSessions(data.sessions)
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    }
    setLoading(false)
  }

  const applyDiscount = async () => {
    if (!discountCode.trim()) return

    setDiscountError('')

    try {
      const response = await fetch('/api/discount/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        setDiscountError(data.error || 'Invalid discount code')
        setDiscountApplied(null)
        return
      }

      setDiscountApplied({
        type: data.discount.type,
        value: data.discount.value,
        id: data.discount.id,
      })
    } catch (error) {
      setDiscountError('Failed to validate discount code')
      setDiscountApplied(null)
    }
  }

  const getFinalPrice = () => {
    if (!selectedSession) return 0
    if (!discountApplied) return selectedSession.price
    return calculateDiscountedPrice(
      selectedSession.price,
      discountApplied.type,
      discountApplied.value
    )
  }

  const getDiscountDisplay = () => {
    if (!discountApplied) return ''
    if (discountApplied.type === 'free_session') {
      return 'Free Session!'
    }
    if (discountApplied.type === 'percentage') {
      return `${discountApplied.value}% off`
    }
    return `${formatCurrency(discountApplied.value)} off`
  }

  const handleCheckout = async () => {
    if (!selectedSession) return

    if (!user) {
      // Store selected session and redirect to login
      localStorage.setItem('pendingBooking', JSON.stringify({
        sessionId: selectedSession.id,
        discountCodeId: discountApplied?.id,
      }))
      router.push('/auth/login')
      return
    }

    setCheckoutLoading(true)

    try {
      // If using a saved payment method
      if (selectedPaymentMethod !== 'new' && paymentMethods.length > 0) {
        const response = await fetch('/api/checkout/saved-method', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: selectedSession.id,
            discountCodeId: discountApplied?.id,
            paymentMethodId: selectedPaymentMethod,
          }),
        })

        const data = await response.json()

        if (data.error) {
          alert(data.error)
          setCheckoutLoading(false)
          return
        }

        if (data.success) {
          router.push('/dashboard?booking=success')
          return
        }
      }

      // Use Stripe Checkout for new payment method
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSession.id,
          discountCodeId: discountApplied?.id,
        }),
      })

      const { url, error, free } = await response.json()

      if (error) {
        alert(error)
        setCheckoutLoading(false)
        return
      }

      // For free bookings, url is the success page
      window.location.href = url
    } catch (err) {
      alert('Something went wrong. Please try again.')
      setCheckoutLoading(false)
    }
  }

  const getCardBrandIcon = (brand: string) => {
    return '💳'
  }

  // Generate date options for the next 30 days
  const dateOptions = Array.from({ length: 30 }, (_, i) => addDays(new Date(), i))
    .filter(date => date >= startOfDay(new Date()) && date <= addMonths(new Date(), 1))

  return (
    <div className="min-h-screen flex flex-col bg-gs-gray-100">
      <Header />

      <main className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-gs-gray-600 hover:text-gs-black mb-6"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to Dashboard
          </Link>

          <h1 className="text-3xl font-bold mb-2">Book a Session</h1>
          <p className="text-gs-gray-600 mb-8">Select a date and choose your training session</p>

          {/* Date Selector */}
          <div className="card mb-6">
            <h2 className="font-semibold flex items-center gap-2 mb-4">
              <Calendar size={20} />
              Select Date (Next 30 Days)
            </h2>

            <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-2">
              {dateOptions.map((date) => (
                <button
                  key={date.toISOString()}
                  onClick={() => {
                    setSelectedDate(date)
                    setSelectedSession(null)
                  }}
                  className={`px-2 py-3 text-center rounded-lg border-2 transition-colors ${
                    format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                      ? 'border-gs-green bg-gs-green text-white'
                      : 'border-gs-gray-200 hover:border-gs-gray-300'
                  }`}
                >
                  <div className="text-xs uppercase">{format(date, 'EEE')}</div>
                  <div className="text-lg font-bold">{format(date, 'd')}</div>
                  <div className="text-xs">{format(date, 'MMM')}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Available Sessions */}
          <div className="mb-6">
            <h2 className="font-semibold mb-4">
              Available Sessions - {format(selectedDate, 'EEEE, MMMM d')}
            </h2>

            {loading ? (
              <div className="py-12">
                <LoadingSpinner />
              </div>
            ) : sessions.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-gs-gray-600">No sessions available on this date.</p>
                <p className="text-sm text-gs-gray-500 mt-2">Try selecting a different date.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    selected={selectedSession?.id === session.id}
                    onSelect={setSelectedSession}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Checkout Panel */}
          {selectedSession && (
            <div className="card sticky bottom-4 bg-white shadow-lg border-2 border-gs-green animate-fade-in">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <CreditCard size={20} />
                Complete Your Booking
              </h2>

              {/* Discount Code */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                  <Tag size={14} className="inline mr-1" />
                  Discount Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="input-field flex-1"
                    disabled={!!discountApplied}
                  />
                  {discountApplied ? (
                    <button
                      onClick={() => {
                        setDiscountApplied(null)
                        setDiscountCode('')
                      }}
                      className="btn-secondary"
                    >
                      Remove
                    </button>
                  ) : (
                    <button onClick={applyDiscount} className="btn-secondary">
                      Apply
                    </button>
                  )}
                </div>
                {discountError && (
                  <p className="text-red-600 text-sm mt-1">{discountError}</p>
                )}
                {discountApplied && (
                  <p className="text-gs-green text-sm mt-1">
                    {getDiscountDisplay()}
                  </p>
                )}
              </div>

              {/* Payment Method Selection */}
              {user && paymentMethods.length > 0 && getFinalPrice() > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gs-gray-700 mb-2">
                    <Wallet size={14} className="inline mr-1" />
                    Payment Method
                  </label>
                  <div className="space-y-2">
                    {paymentMethods.map((method) => (
                      <label
                        key={method.id}
                        className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                          selectedPaymentMethod === method.id
                            ? 'border-gs-green bg-green-50'
                            : 'border-gs-gray-200 hover:border-gs-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={selectedPaymentMethod === method.id}
                          onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                          className="sr-only"
                        />
                        <span className="text-xl mr-3">{getCardBrandIcon(method.brand)}</span>
                        <span className="font-medium">
                          {method.brand?.charAt(0).toUpperCase() + method.brand?.slice(1)} ending in {method.last4}
                        </span>
                      </label>
                    ))}
                    <label
                      className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedPaymentMethod === 'new'
                          ? 'border-gs-green bg-green-50'
                          : 'border-gs-gray-200 hover:border-gs-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="new"
                        checked={selectedPaymentMethod === 'new'}
                        onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                        className="sr-only"
                      />
                      <span className="text-xl mr-3">+</span>
                      <span className="font-medium">Use new card or Apple Pay</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="border-t border-gs-gray-200 pt-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gs-gray-600">Session</span>
                  <span>{selectedSession.title}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gs-gray-600">Original Price</span>
                  <span className={discountApplied ? 'line-through text-gs-gray-400' : ''}>
                    {formatCurrency(selectedSession.price)}
                  </span>
                </div>
                {discountApplied && (
                  <div className="flex justify-between mb-2 text-gs-green">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedSession.price - getFinalPrice())}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(getFinalPrice())}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="btn-green w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {checkoutLoading ? (
                  'Processing...'
                ) : user ? (
                  getFinalPrice() === 0 ? (
                    <>
                      Book Free Session
                      <ArrowRight size={18} />
                    </>
                  ) : selectedPaymentMethod !== 'new' ? (
                    <>
                      Pay {formatCurrency(getFinalPrice())}
                      <ArrowRight size={18} />
                    </>
                  ) : (
                    <>
                      Continue to Payment
                      <ArrowRight size={18} />
                    </>
                  )
                ) : (
                  <>
                    Sign in to Book
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <p className="text-xs text-gs-gray-500 text-center mt-3">
                By booking, you agree to our 24-hour cancellation policy.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
