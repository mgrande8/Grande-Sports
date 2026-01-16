'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SessionCard from '@/components/SessionCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Session } from '@/lib/types'
import { formatCurrency, calculateDiscountedPrice } from '@/lib/utils'
import { format, addDays, startOfDay, endOfDay, addMonths } from 'date-fns'
import { Calendar, Tag, CreditCard, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function BookPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [discountCode, setDiscountCode] = useState('')
  const [discountApplied, setDiscountApplied] = useState<{
    type: 'percentage' | 'fixed'
    value: number
    id: string
  } | null>(null)
  const [discountError, setDiscountError] = useState('')
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
    fetchSessions()
  }, [selectedDate])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchSessions = async () => {
    setLoading(true)
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('date', dateStr)
      .eq('is_active', true)
      .order('start_time', { ascending: true })

    if (!error && data) {
      setSessions(data)
    }
    setLoading(false)
  }

  const applyDiscount = async () => {
    if (!discountCode.trim()) return
    
    setDiscountError('')
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', discountCode.toUpperCase())
      .eq('is_active', true)
      .single()

    if (error || !data) {
      setDiscountError('Invalid discount code')
      setDiscountApplied(null)
      return
    }

    // Check if max uses reached
    if (data.max_uses && data.current_uses >= data.max_uses) {
      setDiscountError('This discount code has expired')
      setDiscountApplied(null)
      return
    }

    // Check validity dates
    const now = new Date()
    if (data.valid_from && new Date(data.valid_from) > now) {
      setDiscountError('This discount code is not yet valid')
      setDiscountApplied(null)
      return
    }
    if (data.valid_until && new Date(data.valid_until) < now) {
      setDiscountError('This discount code has expired')
      setDiscountApplied(null)
      return
    }

    // Check if athlete-specific
    if (data.athlete_id && user && data.athlete_id !== user.id) {
      setDiscountError('This discount code is not available for your account')
      setDiscountApplied(null)
      return
    }

    setDiscountApplied({
      type: data.type,
      value: data.value,
      id: data.id,
    })
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
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSession.id,
          discountCodeId: discountApplied?.id,
        }),
      })

      const { url, error } = await response.json()

      if (error) {
        alert(error)
        setCheckoutLoading(false)
        return
      }

      // Redirect to Stripe Checkout
      window.location.href = url
    } catch (err) {
      alert('Something went wrong. Please try again.')
      setCheckoutLoading(false)
    }
  }

  const navigateDate = (days: number) => {
    const newDate = addDays(selectedDate, days)
    const maxDate = addMonths(new Date(), 1)
    if (newDate >= startOfDay(new Date()) && newDate <= maxDate) {
      setSelectedDate(newDate)
      setSelectedSession(null)
    }
  }

  // Generate date options for the next month
  const dateOptions = Array.from({ length: 7 }, (_, i) => addDays(selectedDate, i - 3))
    .filter(date => date >= startOfDay(new Date()) && date <= addMonths(new Date(), 1))

  return (
    <div className="min-h-screen flex flex-col bg-gs-gray-100">
      <Header />

      <main className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Book a Session</h1>
          <p className="text-gs-gray-600 mb-8">Select a date and choose your training session</p>

          {/* Date Selector */}
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Calendar size={20} />
                Select Date
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateDate(-7)}
                  className="p-2 hover:bg-gs-gray-100 rounded"
                  disabled={selectedDate <= new Date()}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => navigateDate(7)}
                  className="p-2 hover:bg-gs-gray-100 rounded"
                  disabled={addDays(selectedDate, 7) > addMonths(new Date(), 1)}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {dateOptions.map((date) => (
                <button
                  key={date.toISOString()}
                  onClick={() => {
                    setSelectedDate(date)
                    setSelectedSession(null)
                  }}
                  className={`flex-shrink-0 px-4 py-3 text-center rounded-lg border-2 transition-colors ${
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
                    ✓ Discount applied: {discountApplied.type === 'percentage' 
                      ? `${discountApplied.value}% off` 
                      : `${formatCurrency(discountApplied.value)} off`}
                  </p>
                )}
              </div>

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
                  <>
                    Pay {formatCurrency(getFinalPrice())}
                    <ArrowRight size={18} />
                  </>
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
