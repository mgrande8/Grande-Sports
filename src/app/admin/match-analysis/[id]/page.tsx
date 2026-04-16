'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Header from '@/components/Header'
import { PageLoader } from '@/components/LoadingSpinner'
import { formatCurrency } from '@/lib/utils'
import { MatchAnalysis, ANALYSIS_STATUS_LABELS, AnalysisStatus } from '@/lib/types'
import {
  Video, User, Mail, Phone, Shirt, MapPin, FileText, Calendar,
  ExternalLink, ArrowLeft, Save, CheckCircle, Loader2, FolderOpen
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

const STATUS_OPTIONS: { value: AnalysisStatus; label: string; color: string }[] = [
  { value: 'not-started', label: 'Not Started', color: 'bg-gray-100 text-gray-700' },
  { value: 'in-progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  { value: 'analysis-complete', label: 'Analysis Complete', color: 'bg-purple-100 text-purple-700' },
  { value: 'meeting-scheduled', label: 'Meeting Scheduled', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-700' },
]

export default function AdminMatchAnalysisDetailPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null)

  // Form state
  const [status, setStatus] = useState<AnalysisStatus>('not-started')
  const [adminNotes, setAdminNotes] = useState('')
  const [deliveryFolderUrl, setDeliveryFolderUrl] = useState('')
  const [fulfillmentDate, setFulfillmentDate] = useState('')

  const router = useRouter()
  const params = useParams()
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

    const ADMIN_EMAILS = ['td.grandesportstraining@gmail.com']
    if (!user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      router.push('/dashboard')
      return
    }

    await fetchAnalysis()
    setLoading(false)
  }

  const fetchAnalysis = async () => {
    try {
      const response = await fetch(`/api/admin/match-analysis/${params.id}`)
      const data = await response.json()

      if (data.analysis) {
        setAnalysis(data.analysis)
        setStatus(data.analysis.status)
        setAdminNotes(data.analysis.admin_notes || '')
        setDeliveryFolderUrl(data.analysis.delivery_folder_url || '')
        setFulfillmentDate(data.analysis.fulfillment_date || '')
      } else {
        router.push('/admin/match-analysis')
      }
    } catch (error) {
      console.error('Failed to fetch analysis:', error)
      router.push('/admin/match-analysis')
    }
  }

  const handleSave = async () => {
    if (!analysis) return

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/match-analysis/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          admin_notes: adminNotes,
          delivery_folder_url: deliveryFolderUrl,
          fulfillment_date: fulfillmentDate || null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setAnalysis(data.analysis)
      }
    } catch (error) {
      console.error('Failed to save:', error)
    }
    setSaving(false)
  }

  const markComplete = async () => {
    setStatus('analysis-complete')
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/match-analysis/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'analysis-complete',
          admin_notes: adminNotes,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setAnalysis(data.analysis)
        setFulfillmentDate(data.analysis.fulfillment_date || '')
      }
    } catch (error) {
      console.error('Failed to mark complete:', error)
    }
    setSaving(false)
  }

  const markDelivered = async () => {
    if (!deliveryFolderUrl) {
      alert('Please add a Google Drive folder URL first')
      return
    }

    setStatus('delivered')
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/match-analysis/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'delivered',
          delivery_folder_url: deliveryFolderUrl,
          admin_notes: adminNotes,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setAnalysis(data.analysis)
      }
    } catch (error) {
      console.error('Failed to mark delivered:', error)
    }
    setSaving(false)
  }

  if (loading) {
    return <PageLoader />
  }

  if (!analysis) {
    return null
  }

  return (
    <div className="min-h-screen bg-gs-gray-100">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/match-analysis"
            className="inline-flex items-center text-gs-gray-600 hover:text-gs-black mb-2"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to Match Analysis
          </Link>
          <h1 className="text-2xl font-bold">{analysis.player_name}</h1>
          <p className="text-gs-gray-600">
            Submitted {format(new Date(analysis.created_at), 'MMMM d, yyyy')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Player Info */}
            <div className="card">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <User size={18} />
                Player Information
              </h2>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gs-gray-500">Name</p>
                  <p className="font-medium">{analysis.player_name}</p>
                </div>
                <div>
                  <p className="text-gs-gray-500">Position</p>
                  <p className="font-medium">{analysis.position}</p>
                </div>
                <div>
                  <p className="text-gs-gray-500">Jersey Number</p>
                  <p className="font-medium">#{analysis.jersey_number}</p>
                </div>
                <div>
                  <p className="text-gs-gray-500">Jersey Color</p>
                  <p className="font-medium">{analysis.jersey_color || '-'}</p>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="card">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Mail size={18} />
                Contact Information
              </h2>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gs-gray-500">Email (Respondent)</p>
                  <a href={`mailto:${analysis.email_address}`} className="font-medium text-gs-green">
                    {analysis.email_address}
                  </a>
                </div>
                <div>
                  <p className="text-gs-gray-500">Email (Delivery)</p>
                  <a href={`mailto:${analysis.contact_email}`} className="font-medium text-gs-green">
                    {analysis.contact_email}
                  </a>
                </div>
              </div>
            </div>

            {/* Video */}
            <div className="card">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Video size={18} />
                Match Video
              </h2>

              <a
                href={analysis.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-green inline-flex items-center gap-2"
              >
                <Video size={16} />
                Watch Video
                <ExternalLink size={14} />
              </a>

              <p className="text-xs text-gs-gray-500 mt-2 break-all">
                {analysis.video_url}
              </p>
            </div>

            {/* Additional Info */}
            {analysis.additional_info && (
              <div className="card">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <FileText size={18} />
                  Additional Information
                </h2>
                <p className="text-sm text-gs-gray-600 whitespace-pre-wrap">
                  {analysis.additional_info}
                </p>
              </div>
            )}

            {/* Admin Notes */}
            <div className="card">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <FileText size={18} />
                Admin Notes
              </h2>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                placeholder="Add your notes here..."
                className="input-field w-full"
              />
            </div>

            {/* Delivery Folder */}
            <div className="card">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <FolderOpen size={18} />
                Google Drive Folder
              </h2>
              <input
                type="url"
                value={deliveryFolderUrl}
                onChange={(e) => setDeliveryFolderUrl(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="input-field w-full"
              />
              <p className="text-xs text-gs-gray-500 mt-1">
                Paste the Google Drive folder link where you've saved the analysis materials
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="card">
              <h2 className="font-semibold mb-4">Status</h2>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AnalysisStatus)}
                className="input-field w-full mb-4"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Quick Actions */}
              <div className="space-y-2">
                {status === 'in-progress' && (
                  <button
                    onClick={markComplete}
                    disabled={saving}
                    className="btn-green w-full flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle size={16} />
                    )}
                    Mark Analysis Complete
                  </button>
                )}

                {(status === 'analysis-complete' || status === 'meeting-scheduled') && (
                  <button
                    onClick={markDelivered}
                    disabled={saving || !deliveryFolderUrl}
                    className="btn-green w-full flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle size={16} />
                    )}
                    Mark Delivered
                  </button>
                )}

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Save Changes
                </button>
              </div>
            </div>

            {/* Payment Info */}
            <div className="card">
              <h2 className="font-semibold mb-4">Payment</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gs-gray-500">Amount</span>
                  <span className="font-bold text-gs-green">{formatCurrency(analysis.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gs-gray-500">Type</span>
                  <span className="capitalize">{analysis.payment_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gs-gray-500">Status</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    analysis.payment_status === 'paid'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {analysis.payment_status}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="card">
              <h2 className="font-semibold mb-4">Timeline</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gs-gray-500">Submitted</span>
                  <span>{format(new Date(analysis.created_at), 'MMM d, yyyy')}</span>
                </div>
                {analysis.fulfillment_date && (
                  <div className="flex justify-between">
                    <span className="text-gs-gray-500">Completed</span>
                    <span>{format(new Date(analysis.fulfillment_date), 'MMM d, yyyy')}</span>
                  </div>
                )}
                {analysis.meeting_booked_at && (
                  <div className="flex justify-between">
                    <span className="text-gs-gray-500">Meeting</span>
                    <span>{format(new Date(analysis.meeting_booked_at), 'MMM d, yyyy')}</span>
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
