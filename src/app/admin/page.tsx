'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { PageLoader } from '@/components/LoadingSpinner'
import { formatCurrency, formatDate, getSessionTypeLabel, getSessionTypeColor, cn } from '@/lib/utils'
import { Calendar, Users, DollarSign, Tag, CreditCard, Gift, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { format, startOfMonth, endOfMonth } from 'date-fns'

interface RecentTransaction {
  id: string
  amount_paid: number
  payment_status: string
  created_at: string
  user: { full_name: string }
  session: { title: string; session_type: string }
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalAthletes: 0,
    upcomingSessions: 0,
    monthlyRevenue: 0,
    activeDiscounts: 0,
    pendingCredits: 0,
  })
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAndFetch()
  }, [])

  const checkAdminAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Hardcoded admin check - bypasses RLS issues
    const ADMIN_EMAILS = ['td.grandesportstraining@gmail.com']

    if (!user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      router.push('/dashboard')
      return
    }

    await Promise.all([fetchStats(), fetchRecentTransactions()])
    setLoading(false)
  }

  const fetchStats = async () => {
    // Total athletes
    const { count: athleteCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_admin', false)

    // Upcoming sessions - use API to bypass RLS
    let sessionCount = 0
    try {
      const response = await fetch('/api/sessions')
      const data = await response.json()
      sessionCount = data.sessions?.length || 0
    } catch (error) {
      console.error('Failed to fetch sessions count:', error)
    }

    // Monthly revenue
    const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
    const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd')

    const { data: bookings } = await supabase
      .from('bookings')
      .select('amount_paid')
      .eq('payment_status', 'paid')
      .gte('created_at', monthStart)
      .lte('created_at', monthEnd)

    const monthlyRevenue = bookings?.reduce((sum, b) => sum + b.amount_paid, 0) || 0

    // Active discounts
    const { count: discountCount } = await supabase
      .from('discount_codes')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Pending credits
    let pendingCredits = 0
    try {
      const { data: credits } = await supabase
        .from('session_credits')
        .select('credits')
        .eq('is_active', true)
        .is('used_at', null)

      pendingCredits = credits?.reduce((sum, c) => sum + c.credits, 0) || 0
    } catch {
      // Table may not exist yet
    }

    setStats({
      totalAthletes: athleteCount || 0,
      upcomingSessions: sessionCount || 0,
      monthlyRevenue,
      activeDiscounts: discountCount || 0,
      pendingCredits,
    })
  }

  const fetchRecentTransactions = async () => {
    const { data } = await supabase
      .from('bookings')
      .select(`
        id,
        amount_paid,
        payment_status,
        created_at,
        user:profiles!user_id (full_name),
        session:sessions!session_id (title, session_type)
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    if (data) {
      setRecentTransactions(data as any)
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'refunded':
        return 'bg-red-100 text-red-800'
      case 'credited':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gs-gray-100 text-gs-gray-800'
    }
  }

  if (loading) {
    return <PageLoader />
  }

  return (
    <div className="min-h-screen bg-gs-gray-100">
      <Header />

      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-gs-gray-600">Manage sessions, athletes, payments, and more</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gs-gray-600">Total Athletes</p>
                  <p className="text-2xl font-bold">{stats.totalAthletes}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gs-green bg-opacity-10 rounded-full flex items-center justify-center">
                  <Calendar className="text-gs-green" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gs-gray-600">Upcoming Sessions</p>
                  <p className="text-2xl font-bold">{stats.upcomingSessions}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gs-gray-600">Revenue (Month)</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Tag className="text-purple-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gs-gray-600">Active Discounts</p>
                  <p className="text-2xl font-bold">{stats.activeDiscounts}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Gift className="text-orange-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gs-gray-600">Pending Credits</p>
                  <p className="text-2xl font-bold">{stats.pendingCredits}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/admin/sessions" className="card hover:shadow-md transition-shadow group">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gs-black rounded-lg flex items-center justify-center group-hover:bg-gs-green transition-colors">
                      <Calendar className="text-white" size={28} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Manage Sessions</h3>
                      <p className="text-gs-gray-600 text-sm">Create, edit, and view sessions</p>
                    </div>
                  </div>
                </Link>

                <Link href="/admin/athletes" className="card hover:shadow-md transition-shadow group">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gs-black rounded-lg flex items-center justify-center group-hover:bg-gs-green transition-colors">
                      <Users className="text-white" size={28} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Athletes</h3>
                      <p className="text-gs-gray-600 text-sm">Manage athletes and testing</p>
                    </div>
                  </div>
                </Link>

                <Link href="/admin/payments" className="card hover:shadow-md transition-shadow group">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gs-black rounded-lg flex items-center justify-center group-hover:bg-gs-green transition-colors">
                      <CreditCard className="text-white" size={28} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Payments</h3>
                      <p className="text-gs-gray-600 text-sm">Transactions, refunds, credits</p>
                    </div>
                  </div>
                </Link>

                <Link href="/admin/discounts" className="card hover:shadow-md transition-shadow group">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gs-black rounded-lg flex items-center justify-center group-hover:bg-gs-green transition-colors">
                      <Tag className="text-white" size={28} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Discount Codes</h3>
                      <p className="text-gs-gray-600 text-sm">Create and manage discounts</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Recent Transactions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Recent Transactions</h2>
                <Link href="/admin/payments" className="text-gs-green text-sm hover:underline flex items-center gap-1">
                  View all <ArrowRight size={14} />
                </Link>
              </div>
              <div className="card">
                {recentTransactions.length === 0 ? (
                  <p className="text-gs-gray-500 text-center py-8">No transactions yet</p>
                ) : (
                  <div className="divide-y divide-gs-gray-200">
                    {recentTransactions.map((tx) => (
                      <div key={tx.id} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{tx.user?.full_name || 'Unknown'}</p>
                            <p className="text-sm text-gs-gray-600 truncate">{tx.session?.title || 'Unknown Session'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={cn(
                                "px-2 py-0.5 text-xs font-semibold rounded-full",
                                getPaymentStatusColor(tx.payment_status)
                              )}>
                                {tx.payment_status}
                              </span>
                              <span className="text-xs text-gs-gray-500">
                                {formatDate(tx.created_at)}
                              </span>
                            </div>
                          </div>
                          <p className="font-bold text-lg ml-2">{formatCurrency(tx.amount_paid)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
