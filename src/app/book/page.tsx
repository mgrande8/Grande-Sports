'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SessionCard from '@/components/SessionCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Session, POSITION_OPTIONS, LEVEL_OPTIONS, GOALS_OPTIONS, REFERRAL_SOURCE_OPTIONS, REFERRAL_DISCOUNT, PACKAGE_OPTIONS } from '@/lib/types'
import { formatCurrency, calculateDiscountedPrice } from '@/lib/utils'
import { format, addDays, startOfDay, addMonths } from 'date-fns'
import { Calendar, Tag, CreditCard, ArrowRight, ArrowLeft, Wallet, MapPin, User, Package, Mail, CloudRain } from 'lucide-react'
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

  // About You form fields
  const [position, setPosition] = useState('')
  const [level, setLevel] = useState('')
  const [goals, setGoals] = useState('')
  const [referralSource, setReferralSource] = useState('')

  // Referral discount
  const [referredBy, setReferredBy] = useState('')
  const [isFirstBooking, setIsFirstBooking] = useState(true)

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
      // Check if first booking for referral discount
      const { count } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .neq('status', 'cancelled')
      setIsFirstBooking(count === 0)
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

  // Filter sessions to only show within available time windows
  const filterByAvailability = (sessions: Session[], date: Date) => {
    const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    return sessions.filter(session => {
      const startTime = session.start_time // Format: "HH:MM:SS" or "HH:MM"
      const [hours, minutes] = startTime.split(':').map(Number)
      const timeInMinutes = hours * 60 + minutes

      if (isWeekend) {
        // Saturday/Sunday: Only 9am-11am (540-660 minutes)
        return timeInMinutes >= 540 && timeInMinutes < 660
      } else {
        // Monday-Friday: 8am-11am (480-660) OR 3:30pm-5:30pm (930-1050)
        const isMorning = timeInMinutes >= 480 && timeInMinutes < 660
        const isAfternoon = timeInMinutes >= 930 && timeInMinutes < 1050
        return isMorning || isAfternoon
      }
    })
  }

  const fetchSessions = async () => {
    setLoading(true)
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    try {
      const response = await fetch(`/api/sessions?date=${dateStr}`)
      const data = await response.json()
      if (data.sessions) {
        // Filter sessions by availability windows
        const filteredSessions = filterByAvailability(data.sessions, selectedDate)
        setSessions(filteredSessions)
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
      // Clear referral if applying discount code (they don't stack)
      setReferredBy('')
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
    // Referral discount: $15 off, only for first booking, doesn't stack with discount codes
    if (referredBy.trim() && isFirstBooking && !discountApplied) {
      return Math.max(0, selectedSession.price - REFERRAL_DISCOUNT)
    }
    if (!discountApplied) return selectedSession.price
    return calculateDiscountedPrice(
      selectedSession.price,
      discountApplied.type,
      discountApplied.value
    )
  }

  const hasReferralDiscount = !!(referredBy.trim() && isFirstBooking && !discountApplied)

  const getDiscountDisplay = () => {
    if (!discountApplied) return ''
    if (discountApplied.type === 'free_session') return 'Free Session!'
    if (discountApplied.type === 'percentage') return `${discountApplied.value}% off`
    return `${formatCurrency(discountApplied.value)} off`
  }

  const handleCheckout = async () => {
    if (!selectedSession) return

    if (!user) {
      localStorage.setItem('pendingBooking', JSON.stringify({
        sessionId: selectedSession.id,
        discountCodeId: discountApplied?.id,
        position,
        level,
        goals,
        referralSource,
        referredBy: referredBy.trim(),
      }))
      router.push('/auth/login')
      return
    }

    setCheckoutLoading(true)

    try {
      const extraFields = {
        position,
        level,
        goals,
        referralSource,
        referredBy: referredBy.trim() || undefined,
      }

      // If using a saved payment method
      if (selectedPaymentMethod !== 'new' && paymentMethods.length > 0) {
        const response = await fetch('/api/checkout/saved-method', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: selectedSession.id,
            discountCodeId: discountApplied?.id,
            paymentMethodId: selectedPaymentMethod,
            ...extraFields,
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
          ...extraFields,
        }),
      })

      const { url, error } = await response.json()

      if (error) {
        alert(error)
        setCheckoutLoading(false)
        return
      }

      window.location.href = url
    } catch (err) {
      alert('Something went wrong. Please try again.')
      setCheckoutLoading(false)
    }
  }

  const getCardBrandIcon = (brand: string) => '💳'

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

          {/* Training Packages */}
          <div className="card mb-6">
            <h2 className="font-semibold flex items-center gap-2 mb-4">
              <Package size={20} />
              Training Packages
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {PACKAGE_OPTIONS.map((pkg) => (
                <div
                  key={pkg.name}
                  className={`border-2 rounded-lg p-4 text-center relative ${
                    pkg.popular ? 'border-gs-green bg-gs-green/5' : 'border-gs-gray-200'
                  }`}
                >
                  {pkg.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gs-green text-white text-xs font-bold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  )}
                  <h3 className="font-bold text-sm mt-1">{pkg.name}</h3>
                  <p className="text-2xl font-bold text-gs-black mt-2">
                    {formatCurrency(pkg.totalPrice)}
                  </p>
                  {pkg.pricePerSession && (
                    <p className="text-xs text-gs-gray-500">
                      {formatCurrency(pkg.pricePerSession)}/session
                    </p>
                  )}
                  {pkg.savings && (
                    <span className="inline-block bg-gs-green/10 text-gs-green text-xs font-semibold px-2 py-0.5 rounded mt-2">
                      {pkg.savings}
                    </span>
                  )}
                  <p className="text-xs text-gs-gray-600 mt-2">{pkg.description}</p>
                  {pkg.sessions !== '1' ? (
                    <a
                      href={`mailto:info@grandesportstraining.com?subject=Package Inquiry - ${pkg.name}`}
                      className="btn-secondary text-xs mt-3 inline-flex items-center gap-1"
                    >
                      <Mail size={12} />
                      Contact Us
                    </a>
                  ) : (
                    <span className="text-xs text-gs-gray-500 mt-3 inline-block">Book below</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Location Info */}
          <div className="card mb-6 bg-gs-green/5 border-gs-green/20">
            <div className="flex items-start gap-3">
              <MapPin className="text-gs-green mt-0.5 flex-shrink-0" size={20} />
              <div>
                <h3 className="font-semibold text-gs-black">Bamford Park, Davie, FL 33314</h3>
                <p className="text-sm text-gs-gray-600 mt-1">
                  Free parking available on-site near the soccer fields.
                </p>
                <a
                  href="https://www.google.com/maps/search/Bamford+Park+Davie+FL+33314"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gs-green hover:underline mt-1 inline-block"
                >
                  Get Directions →
                </a>
              </div>
            </div>
          </div>

          {/* Rain Policy */}
          <div className="card mb-6 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <CloudRain className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <h3 className="font-semibold text-gs-black">Rain Policy</h3>
                <p className="text-sm text-gs-gray-600 mt-1">
                  Training continues in light rain — we train through it! In case of heavy rain, lightning, or unsafe conditions,
                  you'll receive an email notification and your session will be rescheduled at no extra cost.
                </p>
              </div>
            </div>
          </div>

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

          {/* About You Form */}
          {selectedSession && (
            <div className="card mb-6 animate-fade-in">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <User size={20} />
                About You
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gs-gray-700 mb-1">Position</label>
                  <select value={position} onChange={(e) => setPosition(e.target.value)} className="input-field w-full">
                    <option value="">Select position...</option>
                    {POSITION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gs-gray-700 mb-1">Level</label>
                  <select value={level} onChange={(e) => setLevel(e.target.value)} className="input-field w-full">
                    <option value="">Select level...</option>
                    {LEVEL_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gs-gray-700 mb-1">Training Goals</label>
                  <select value={goals} onChange={(e) => setGoals(e.target.value)} className="input-field w-full">
                    <option value="">Select primary goal...</option>
                    {GOALS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gs-gray-700 mb-1">How did you hear about us?</label>
                  <select value={referralSource} onChange={(e) => setReferralSource(e.target.value)} className="input-field w-full">
                    <option value="">Select...</option>
                    {REFERRAL_SOURCE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Checkout Panel */}
          {selectedSession && (
            <div className="card sticky bottom-4 bg-white shadow-lg border-2 border-gs-green animate-fade-in">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <CreditCard size={20} />
                Complete Your Booking
              </h2>

              {/* Referral Discount (only for first-time bookers, hidden when discount code is applied) */}
              {isFirstBooking && !discountApplied && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                    Referred by someone? Get $15 off!
                  </label>
                  <input
                    type="text"
                    value={referredBy}
                    onChange={(e) => setReferredBy(e.target.value)}
                    placeholder="Enter their name"
                    className="input-field w-full"
                  />
                  {hasReferralDiscount && (
                    <p className="text-gs-green text-sm mt-1">
                      Referral discount: ${REFERRAL_DISCOUNT} off your first session!
                    </p>
                  )}
                </div>
              )}

              {/* Discount Code (hidden when referral is active) */}
              {!hasReferralDiscount && (
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
              )}

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
                {selectedSession.coach_name && (
                  <div className="flex justify-between mb-2">
                    <span className="text-gs-gray-600">Coach</span>
                    <span>{selectedSession.coach_name}</span>
                  </div>
                )}
                <div className="flex justify-between mb-2">
                  <span className="text-gs-gray-600">Original Price</span>
                  <span className={(discountApplied || hasReferralDiscount) ? 'line-through text-gs-gray-400' : ''}>
                    {formatCurrency(selectedSession.price)}
                  </span>
                </div>
                {discountApplied && (
                  <div className="flex justify-between mb-2 text-gs-green">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedSession.price - getFinalPrice())}</span>
                  </div>
                )}
                {hasReferralDiscount && (
                  <div className="flex justify-between mb-2 text-gs-green">
                    <span>Referral Discount</span>
                    <span>-{formatCurrency(REFERRAL_DISCOUNT)}</span>
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
