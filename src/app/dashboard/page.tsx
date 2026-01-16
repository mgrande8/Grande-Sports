'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LoadingSpinner, { PageLoader } from '@/components/LoadingSpinner'
import { formatDate, formatTime, formatCurrency, getSessionTypeLabel, getSessionTypeColor, canCancelBooking, cn } from '@/lib/utils'
import { Calendar, Clock, MapPin, CreditCard, TrendingUp, User, AlertCircle, CheckCircle, XCircle, Settings } from 'lucide-react'
import Link from 'next/link'

interface BookingWithSession {
  id: string
  status: string
  payment_status: string
  amount_paid: number
  created_at: string
  session: {
    id: string
    title: string
    session_type: string
    date: string
    start_time: string
    end_time: string
    location: string
    price: number
  }
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [bookings, setBookings] = useState<BookingWithSession[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }
    setUser(user)
    await fetchProfile(user.id)
    await fetchBookings(user.id)
    setLoading(false)
  }

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
  }

  const fetchBookings = async (userId: string) => {
    const { data } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        payment_status,
        amount_paid,
        created_at,
        session:sessions (
          id,
          title,
          session_type,
          date,
          start_time,
          end_time,
          location,
          price
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (data) {
      setBookings(data as any)
    }
  }

  const handleCancel = async (bookingId: string, sessionDate: string, sessionTime: string) => {
    if (!canCancelBooking(sessionDate, sessionTime)) {
      alert('Cannot cancel within 24 hours of session. Please contact us directly.')
      return
    }

    if (!confirm('Are you sure you want to cancel this booking? You will receive a credit for a future session.')) {
      return
    }

    setCancellingId(bookingId)

    const { error } = await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled', 
        payment_status: 'credited',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', bookingId)

    if (error) {
      alert('Failed to cancel booking. Please try again.')
    } else {
      await fetchBookings(user.id)
    }

    setCancellingId(null)
  }

  if (loading) {
    return <PageLoader />
  }

  const upcomingBookings = bookings.filter(
    b => b.status === 'confirmed' && new Date(b.session.date) >= new Date()
  )
  const pastBookings = bookings.filter(
    b => b.status === 'completed' || (b.status === 'confirmed' && new Date(b.session.date) < new Date())
  )
  const totalSessions = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length

  return (
    <div className="min-h-screen flex flex-col bg-gs-gray-100">
      <Header />

      <main className="flex-1 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name?.split(' ')[0] || 'Athlete'}</h1>
            <p className="text-gs-gray-600">Manage your training sessions and track your progress</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gs-green bg-opacity-10 rounded-full flex items-center justify-center">
                  <Calendar className="text-gs-green" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gs-gray-600">Upcoming Sessions</p>
                  <p className="text-2xl font-bold">{upcomingBookings.length}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gs-gray-600">Total Sessions</p>
                  <p className="text-2xl font-bold">{totalSessions}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <Link href="/dashboard/progress" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="text-purple-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gs-gray-600">View Progress</p>
                  <p className="text-lg font-semibold text-gs-green">Technical Testing →</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-4 mb-8">
            <Link href="/book" className="btn-primary">
              Book New Session
            </Link>
            <Link href="/dashboard/history" className="btn-secondary">
              Payment History
            </Link>
            <Link href="/dashboard/settings" className="btn-secondary flex items-center gap-2">
              <Settings size={18} />
              Settings
            </Link>
          </div>

          {/* Upcoming Sessions */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Upcoming Sessions</h2>
            {upcomingBookings.length === 0 ? (
              <div className="card text-center py-8">
                <Calendar className="mx-auto text-gs-gray-400 mb-4" size={48} />
                <p className="text-gs-gray-600 mb-4">No upcoming sessions</p>
                <Link href="/book" className="btn-green">
                  Book a Session
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div key={booking.id} className="card">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn(
                            "px-2 py-1 text-xs font-semibold rounded-full",
                            getSessionTypeColor(booking.session.session_type)
                          )}>
                            {getSessionTypeLabel(booking.session.session_type)}
                          </span>
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Confirmed
                          </span>
                        </div>
                        <h3 className="font-bold text-lg">{booking.session.title}</h3>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gs-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar size={16} />
                            {formatDate(booking.session.date)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={16} />
                            {formatTime(booking.session.start_time)} - {formatTime(booking.session.end_time)}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin size={16} />
                            {booking.session.location}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gs-gray-600">Paid</p>
                          <p className="font-bold">{formatCurrency(booking.amount_paid)}</p>
                        </div>
                        {canCancelBooking(booking.session.date, booking.session.start_time) && (
                          <button
                            onClick={() => handleCancel(booking.id, booking.session.date, booking.session.start_time)}
                            disabled={cancellingId === booking.id}
                            className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                          >
                            {cancellingId === booking.id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Sessions */}
          {pastBookings.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Recent Sessions</h2>
              <div className="space-y-4">
                {pastBookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="card opacity-75">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">{booking.session.title}</h3>
                        <p className="text-sm text-gs-gray-600">
                          {formatDate(booking.session.date)} at {formatTime(booking.session.start_time)}
                        </p>
                      </div>
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gs-gray-200 text-gs-gray-600">
                        Completed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {pastBookings.length > 5 && (
                <Link href="/dashboard/history" className="block text-center mt-4 text-gs-green font-medium hover:underline">
                  View all past sessions →
                </Link>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
