'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { PageLoader } from '@/components/LoadingSpinner'
import { formatDate, formatCurrency, getSessionTypeLabel } from '@/lib/utils'
import { ArrowLeft, CreditCard, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface BookingWithSession {
  id: string
  status: string
  payment_status: string
  amount_paid: number
  discount_amount: number
  created_at: string
  session: {
    title: string
    session_type: string
    date: string
    price: number
    coach_name: string | null
  }
}

export default function HistoryPage() {
  const [bookings, setBookings] = useState<BookingWithSession[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuthAndFetch()
  }, [])

  const checkAuthAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        payment_status,
        amount_paid,
        discount_amount,
        created_at,
        session:sessions (
          title,
          session_type,
          date,
          price,
          coach_name
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) {
      setBookings(data as any)
    }
    setLoading(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="text-gs-green" size={18} />
      case 'refunded':
      case 'credited':
        return <RefreshCw className="text-blue-500" size={18} />
      default:
        return <XCircle className="text-gs-gray-400" size={18} />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Paid'
      case 'refunded':
        return 'Refunded'
      case 'credited':
        return 'Credit Issued'
      default:
        return 'Pending'
    }
  }

  const totalSpent = bookings
    .filter(b => b.payment_status === 'paid')
    .reduce((sum, b) => sum + b.amount_paid, 0)

  if (loading) {
    return <PageLoader />
  }

  return (
    <div className="min-h-screen flex flex-col bg-gs-gray-100">
      <Header />

      <main className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/dashboard" className="inline-flex items-center text-gs-gray-600 hover:text-gs-black mb-6">
            <ArrowLeft size={16} className="mr-1" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gs-black rounded-full flex items-center justify-center">
              <CreditCard className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Payment History</h1>
              <p className="text-gs-gray-600">View all your transactions</p>
            </div>
          </div>

          {/* Summary Card */}
          <div className="card mb-6 bg-gs-black text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gs-gray-400 text-sm">Total Spent</p>
                <p className="text-3xl font-bold">{formatCurrency(totalSpent)}</p>
              </div>
              <div className="text-right">
                <p className="text-gs-gray-400 text-sm">Sessions Booked</p>
                <p className="text-3xl font-bold">{bookings.length}</p>
              </div>
            </div>
          </div>

          {/* Transaction List */}
          {bookings.length === 0 ? (
            <div className="card text-center py-12">
              <CreditCard className="mx-auto text-gs-gray-400 mb-4" size={48} />
              <h2 className="text-xl font-bold mb-2">No Transactions</h2>
              <p className="text-gs-gray-600 mb-4">
                Your payment history will appear here after your first booking.
              </p>
              <Link href="/book" className="btn-green">
                Book a Session
              </Link>
            </div>
          ) : (
            <div className="card">
              <h2 className="font-bold mb-4">All Transactions</h2>
              <div className="divide-y divide-gs-gray-200">
                {bookings.map((booking) => (
                  <div key={booking.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(booking.payment_status)}
                          <span className="font-semibold">{booking.session.title}</span>
                        </div>
                        <p className="text-sm text-gs-gray-600">
                          {getSessionTypeLabel(booking.session.session_type)} • {formatDate(booking.session.date)}
                          {booking.session.coach_name && ` • ${booking.session.coach_name}`}
                        </p>
                        <p className="text-xs text-gs-gray-500 mt-1">
                          Booked on {format(new Date(booking.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          {booking.payment_status === 'refunded' ? '-' : ''}{formatCurrency(booking.amount_paid)}
                        </p>
                        {booking.discount_amount > 0 && (
                          <p className="text-xs text-gs-green">
                            Saved {formatCurrency(booking.discount_amount)}
                          </p>
                        )}
                        <p className={`text-xs mt-1 ${
                          booking.payment_status === 'paid' ? 'text-gs-green' :
                          booking.payment_status === 'credited' ? 'text-blue-500' :
                          'text-gs-gray-500'
                        }`}>
                          {getStatusLabel(booking.payment_status)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
