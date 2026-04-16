'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { PageLoader } from '@/components/LoadingSpinner'
import { formatCurrency } from '@/lib/utils'
import { MatchAnalysis, ANALYSIS_STATUS_LABELS, AnalysisStatus } from '@/lib/types'
import {
  Video, DollarSign, Clock, CheckCircle, Calendar, Users,
  ExternalLink, ChevronDown, Filter, ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

const STATUS_COLORS: Record<AnalysisStatus, string> = {
  'not-started': 'bg-gray-100 text-gray-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  'analysis-complete': 'bg-purple-100 text-purple-700',
  'meeting-scheduled': 'bg-yellow-100 text-yellow-700',
  'delivered': 'bg-green-100 text-green-700',
}

interface Stats {
  total: number
  totalRevenue: number
  notStarted: number
  inProgress: number
  analysisComplete: number
  meetingScheduled: number
  delivered: number
  thisMonth: number
}

export default function AdminMatchAnalysisPage() {
  const [loading, setLoading] = useState(true)
  const [analyses, setAnalyses] = useState<MatchAnalysis[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAndFetch()
  }, [])

  useEffect(() => {
    if (!loading) {
      fetchAnalyses()
    }
  }, [statusFilter])

  const checkAdminAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    const ADMIN_EMAILS = ['td.grandesportstraining@gmail.com']
    if (!user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      router.push('/dashboard')
      return
    }

    await fetchAnalyses(true)
    setLoading(false)
  }

  const fetchAnalyses = async (includeStats = false) => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.set('status', statusFilter)
      }
      if (includeStats) {
        params.set('stats', 'true')
      }

      const response = await fetch(`/api/admin/match-analysis?${params}`)
      const data = await response.json()

      if (data.analyses) {
        setAnalyses(data.analyses)
      }
      if (data.stats) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch analyses:', error)
    }
  }

  const updateStatus = async (id: string, newStatus: AnalysisStatus) => {
    setUpdatingId(id)
    try {
      const response = await fetch(`/api/admin/match-analysis/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        await fetchAnalyses(true)
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
    setUpdatingId(null)
  }

  if (loading) {
    return <PageLoader />
  }

  return (
    <div className="min-h-screen bg-gs-gray-100">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center text-gs-gray-600 hover:text-gs-black mb-2"
            >
              <ArrowLeft size={16} className="mr-1" />
              Back to Admin
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Video size={28} />
              Match Analysis
            </h1>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gs-green/10 rounded-lg flex items-center justify-center">
                  <DollarSign size={20} className="text-gs-green" />
                </div>
                <div>
                  <p className="text-sm text-gs-gray-600">Total Revenue</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gs-gray-600">Total Submissions</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock size={20} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gs-gray-600">Pending</p>
                  <p className="text-xl font-bold">{stats.notStarted + stats.inProgress}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gs-gray-600">This Month</p>
                  <p className="text-xl font-bold">{stats.thisMonth}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Pills */}
        {stats && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-gs-black text-white'
                  : 'bg-white text-gs-gray-600 hover:bg-gs-gray-100'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setStatusFilter('not-started')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                statusFilter === 'not-started'
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Not Started ({stats.notStarted})
            </button>
            <button
              onClick={() => setStatusFilter('in-progress')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                statusFilter === 'in-progress'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              In Progress ({stats.inProgress})
            </button>
            <button
              onClick={() => setStatusFilter('analysis-complete')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                statusFilter === 'analysis-complete'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
            >
              Analysis Complete ({stats.analysisComplete})
            </button>
            <button
              onClick={() => setStatusFilter('meeting-scheduled')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                statusFilter === 'meeting-scheduled'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              }`}
            >
              Meeting Scheduled ({stats.meetingScheduled})
            </button>
            <button
              onClick={() => setStatusFilter('delivered')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                statusFilter === 'delivered'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              Delivered ({stats.delivered})
            </button>
          </div>
        )}

        {/* Analysis Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gs-gray-100 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gs-gray-600">Player</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gs-gray-600">Position</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gs-gray-600">Jersey</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gs-gray-600">Video</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gs-gray-600">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gs-gray-600">Submitted</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gs-gray-600">Amount</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gs-gray-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {analyses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gs-gray-500">
                      No match analyses found
                    </td>
                  </tr>
                ) : (
                  analyses.map((analysis) => (
                    <tr key={analysis.id} className="hover:bg-gs-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{analysis.player_name}</p>
                          <p className="text-xs text-gs-gray-500">{analysis.contact_email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{analysis.position}</td>
                      <td className="px-4 py-3 text-sm">
                        #{analysis.jersey_number}
                        {analysis.jersey_color && (
                          <span className="text-gs-gray-500"> ({analysis.jersey_color})</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={analysis.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-gs-green hover:underline"
                        >
                          <Video size={14} />
                          Watch
                          <ExternalLink size={12} />
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={analysis.status}
                          onChange={(e) => updateStatus(analysis.id, e.target.value as AnalysisStatus)}
                          disabled={updatingId === analysis.id}
                          className={`text-xs font-medium px-3 py-1 rounded-full border-0 cursor-pointer ${
                            STATUS_COLORS[analysis.status as AnalysisStatus]
                          } ${updatingId === analysis.id ? 'opacity-50' : ''}`}
                        >
                          <option value="not-started">Not Started</option>
                          <option value="in-progress">In Progress</option>
                          <option value="analysis-complete">Analysis Complete</option>
                          <option value="meeting-scheduled">Meeting Scheduled</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm text-gs-gray-600">
                        {format(new Date(analysis.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gs-green">
                        {formatCurrency(analysis.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/match-analysis/${analysis.id}`}
                          className="text-sm text-gs-green hover:underline"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
