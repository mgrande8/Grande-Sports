'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { PageLoader } from '@/components/LoadingSpinner'
import { formatCurrency } from '@/lib/utils'
import { Calendar, Users, DollarSign, Tag, Activity, Plus, Settings } from 'lucide-react'
import Link from 'next/link'
import { format, startOfMonth, endOfMonth } from 'date-fns'

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalAthletes: 0,
    upcomingSessions: 0,
    monthlyRevenue: 0,
    activeDiscounts: 0,
  })
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      router.push('/dashboard')
      return
    }

    await fetchStats()
    setLoading(false)
  }

  const fetchStats = async () => {
    // Total athletes
    const { count: athleteCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_admin', false)

    // Upcoming sessions
    const { count: sessionCount } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .gte('date', format(new Date(), 'yyyy-MM-dd'))
      .eq('is_active', true)

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

    setStats({
      totalAthletes: athleteCount || 0,
      upcomingSessions: sessionCount || 0,
      monthlyRevenue,
      activeDiscounts: discountCount || 0,
    })
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
              <p className="text-gs-gray-600">Manage sessions, athletes, and more</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                  <p className="text-sm text-gs-gray-600">Revenue (This Month)</p>
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
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/admin/sessions" className="card hover:shadow-md transition-shadow group">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gs-black rounded-lg flex items-center justify-center group-hover:bg-gs-green transition-colors">
                  <Calendar className="text-white" size={28} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Manage Sessions</h3>
                  <p className="text-gs-gray-600 text-sm">Create, edit, and view training sessions</p>
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
                  <p className="text-gs-gray-600 text-sm">View athletes, input technical testing</p>
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
                  <p className="text-gs-gray-600 text-sm">Create and manage discount codes</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
