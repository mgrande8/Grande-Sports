'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { PageLoader } from '@/components/LoadingSpinner'
import { formatDate, formatCurrency, getSessionTypeLabel, getSessionTypeColor, cn } from '@/lib/utils'
import { ArrowLeft, Search, CreditCard, RefreshCw, Gift, X, DollarSign, Calendar, User, Filter } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface TransactionWithDetails {
  id: string
  user_id: string
  session_id: string
  status: string
  payment_status: string
  payment_intent_id: string
  amount_paid: number
  discount_amount: number
  created_at: string
  user: { id: string; full_name: string; email: string }
  session: { title: string; date: string; session_type: string; price: number }
}

interface AthleteOption {
  id: string
  full_name: string
  email: string
}

export default function AdminPaymentsPage() {
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionWithDetails[]>([])
  const [athletes, setAthletes] = useState<AthleteOption[]>([])
  const [loading, setLoading] = useState(true)
  const [processingRefund, setProcessingRefund] = useState<string | null>(null)

  // Filters
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    athleteId: '',
    status: '',
  })

  // Credit Modal
  const [showCreditModal, setShowCreditModal] = useState(false)
  const [creditForm, setCreditForm] = useState({
    athlete_id: '',
    credits: '1',
    reason: '',
  })
  const [savingCredit, setSavingCredit] = useState(false)

  // Stats
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    totalRefunds: 0,
    pendingCredits: 0,
  })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAndFetch()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters, transactions])

  const checkAdminAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Hardcoded admin check
    const ADMIN_EMAILS = ['td.grandesportstraining@gmail.com']

    if (!user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      router.push('/dashboard')
      return
    }

    await Promise.all([
      fetchTransactions(),
      fetchAthletes(),
      fetchStats(),
    ])
    setLoading(false)
  }

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from('bookings')
      .select(`
        id,
        user_id,
        session_id,
        status,
        payment_status,
        payment_intent_id,
        amount_paid,
        discount_amount,
        created_at,
        user:profiles!user_id (id, full_name, email),
        session:sessions!session_id (title, date, session_type, price)
      `)
      .order('created_at', { ascending: false })

    if (data) {
      setTransactions(data as any)
    }
  }

  const fetchAthletes = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('is_admin', false)
      .order('full_name', { ascending: true })

    if (data) {
      setAthletes(data)
    }
  }

  const fetchStats = async () => {
    // Total revenue
    const { data: paidBookings } = await supabase
      .from('bookings')
      .select('amount_paid')
      .eq('payment_status', 'paid')

    const totalRevenue = paidBookings?.reduce((sum, b) => sum + b.amount_paid, 0) || 0

    // Total refunds
    const { data: refundedBookings } = await supabase
      .from('bookings')
      .select('amount_paid')
      .eq('payment_status', 'refunded')

    const totalRefunds = refundedBookings?.reduce((sum, b) => sum + b.amount_paid, 0) || 0

    // Pending credits (from session_credits table if it exists)
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
      totalRevenue,
      totalTransactions: paidBookings?.length || 0,
      totalRefunds,
      pendingCredits,
    })
  }

  const applyFilters = () => {
    let filtered = [...transactions]

    if (filters.dateFrom) {
      filtered = filtered.filter(t => t.created_at >= filters.dateFrom)
    }
    if (filters.dateTo) {
      filtered = filtered.filter(t => t.created_at <= filters.dateTo + 'T23:59:59')
    }
    if (filters.athleteId) {
      filtered = filtered.filter(t => t.user_id === filters.athleteId)
    }
    if (filters.status) {
      filtered = filtered.filter(t => t.payment_status === filters.status)
    }

    setFilteredTransactions(filtered)
  }

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      athleteId: '',
      status: '',
    })
  }

  const handleRefund = async (transaction: TransactionWithDetails) => {
    if (!transaction.payment_intent_id) {
      alert('No payment found for this booking')
      return
    }

    if (!confirm(`Process refund of ${formatCurrency(transaction.amount_paid)} to ${transaction.user.full_name}?`)) {
      return
    }

    setProcessingRefund(transaction.id)

    try {
      const response = await fetch('/api/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: transaction.id }),
      })

      if (response.ok) {
        alert('Refund processed successfully!')
        await fetchTransactions()
        await fetchStats()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to process refund')
      }
    } catch {
      alert('Failed to process refund')
    }

    setProcessingRefund(null)
  }

  const handleAddCredit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingCredit(true)

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('session_credits')
      .insert({
        user_id: creditForm.athlete_id,
        credits: parseInt(creditForm.credits),
        reason: creditForm.reason || null,
        issued_by: user?.id,
      })

    if (error) {
      alert('Failed to add credit. The session_credits table may not exist yet.')
    } else {
      alert('Credit added successfully!')
      setShowCreditModal(false)
      setCreditForm({ athlete_id: '', credits: '1', reason: '' })
      await fetchStats()
    }

    setSavingCredit(false)
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'refunded':
        return 'bg-red-100 text-red-800'
      case 'credited':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
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
        <div className="max-w-6xl mx-auto px-4">
          <Link href="/admin" className="inline-flex items-center text-gs-gray-600 hover:text-gs-black mb-6">
            <ArrowLeft size={16} className="mr-1" />
            Back to Admin
          </Link>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Payments</h1>
              <p className="text-gs-gray-600">View transactions, process refunds, and manage credits</p>
            </div>
            <button
              onClick={() => setShowCreditModal(true)}
              className="btn-green flex items-center gap-2"
            >
              <Gift size={18} />
              Add Credit
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gs-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <CreditCard className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gs-gray-600">Transactions</p>
                  <p className="text-2xl font-bold">{stats.totalTransactions}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <RefreshCw className="text-red-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gs-gray-600">Total Refunded</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalRefunds)}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Gift className="text-purple-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gs-gray-600">Pending Credits</p>
                  <p className="text-2xl font-bold">{stats.pendingCredits}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="card mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={18} className="text-gs-gray-500" />
              <h2 className="font-semibold">Filters</h2>
              {(filters.dateFrom || filters.dateTo || filters.athleteId || filters.status) && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-gs-green hover:underline ml-auto"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gs-gray-600 mb-1">From Date</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm text-gs-gray-600 mb-1">To Date</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm text-gs-gray-600 mb-1">Athlete</label>
                <select
                  value={filters.athleteId}
                  onChange={(e) => setFilters({ ...filters, athleteId: e.target.value })}
                  className="input-field"
                >
                  <option value="">All athletes</option>
                  {athletes.map((a) => (
                    <option key={a.id} value={a.id}>{a.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gs-gray-600 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="input-field"
                >
                  <option value="">All statuses</option>
                  <option value="paid">Paid</option>
                  <option value="refunded">Refunded</option>
                  <option value="credited">Credited</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="card">
            <h2 className="font-bold text-lg mb-4">
              Transactions ({filteredTransactions.length})
            </h2>

            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="mx-auto text-gs-gray-400 mb-4" size={48} />
                <p className="text-gs-gray-600">No transactions found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((tx) => (
                  <div key={tx.id} className="border border-gs-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "px-2 py-0.5 text-xs font-semibold rounded-full",
                            getPaymentStatusColor(tx.payment_status)
                          )}>
                            {tx.payment_status.toUpperCase()}
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 text-xs font-semibold rounded-full",
                            getSessionTypeColor(tx.session?.session_type || 'group')
                          )}>
                            {getSessionTypeLabel(tx.session?.session_type || 'group')}
                          </span>
                        </div>
                        <h3 className="font-bold">{tx.session?.title || 'Unknown Session'}</h3>
                        <div className="flex flex-wrap gap-4 mt-1 text-sm text-gs-gray-600">
                          <div className="flex items-center gap-1">
                            <User size={14} />
                            {tx.user?.full_name || 'Unknown'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDate(tx.created_at)}
                          </div>
                        </div>
                        {tx.discount_amount > 0 && (
                          <p className="text-sm text-gs-green mt-1">
                            Discount applied: -{formatCurrency(tx.discount_amount)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">{formatCurrency(tx.amount_paid)}</p>
                        {tx.payment_status === 'paid' && tx.payment_intent_id && (
                          <button
                            onClick={() => handleRefund(tx)}
                            disabled={processingRefund === tx.id}
                            className="text-sm text-red-600 hover:text-red-800 mt-2 disabled:opacity-50"
                          >
                            {processingRefund === tx.id ? 'Processing...' : 'Refund'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Credit Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Add Session Credit</h2>
                <button onClick={() => setShowCreditModal(false)} className="text-gs-gray-500 hover:text-gs-black">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddCredit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                    Athlete *
                  </label>
                  <select
                    value={creditForm.athlete_id}
                    onChange={(e) => setCreditForm({ ...creditForm, athlete_id: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Select athlete</option>
                    {athletes.map((a) => (
                      <option key={a.id} value={a.id}>{a.full_name} ({a.email})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                    Number of Credits *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={creditForm.credits}
                    onChange={(e) => setCreditForm({ ...creditForm, credits: e.target.value })}
                    className="input-field"
                    required
                  />
                  <p className="text-xs text-gs-gray-500 mt-1">Each credit = 1 free session</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                    Reason
                  </label>
                  <textarea
                    value={creditForm.reason}
                    onChange={(e) => setCreditForm({ ...creditForm, reason: e.target.value })}
                    className="input-field"
                    rows={2}
                    placeholder="e.g., Compensation for cancelled session"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreditModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingCredit}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    {savingCredit ? 'Adding...' : 'Add Credit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
