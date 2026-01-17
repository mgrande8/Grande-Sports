'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { PageLoader } from '@/components/LoadingSpinner'
import { Session, PRICING, SESSION_CAPACITY } from '@/lib/types'
import { formatDate, formatTime, formatCurrency, getSessionTypeLabel, getSessionTypeColor, cn } from '@/lib/utils'
import { ArrowLeft, Plus, Calendar, Users, Trash2, Edit, X } from 'lucide-react'
import Link from 'next/link'
import { format, addDays } from 'date-fns'

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    session_type: 'group' as 'private' | 'semi-private' | 'group',
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '10:00',
    end_time: '11:00',
    location: 'Miami Shores Park',
    notes: '',
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

    await fetchSessions()
    setLoading(false)
  }

  const fetchSessions = async () => {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .gte('date', format(new Date(), 'yyyy-MM-dd'))
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (data) {
      setSessions(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const sessionData = {
      title: formData.title || `${getSessionTypeLabel(formData.session_type)}`,
      session_type: formData.session_type,
      date: formData.date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      price: PRICING[formData.session_type],
      max_capacity: SESSION_CAPACITY[formData.session_type],
      location: formData.location,
      notes: formData.notes || null,
    }

    if (editingSession) {
      const { error } = await supabase
        .from('sessions')
        .update(sessionData)
        .eq('id', editingSession.id)

      if (error) {
        alert('Failed to update session')
        return
      }
    } else {
      const { error } = await supabase
        .from('sessions')
        .insert(sessionData)

      if (error) {
        alert('Failed to create session')
        return
      }
    }

    setShowModal(false)
    setEditingSession(null)
    resetForm()
    await fetchSessions()
  }

  const handleEdit = (session: Session) => {
    setEditingSession(session)
    setFormData({
      title: session.title,
      session_type: session.session_type as any,
      date: session.date,
      start_time: session.start_time,
      end_time: session.end_time,
      location: session.location,
      notes: session.notes || '',
    })
    setShowModal(true)
  }

  const handleDelete = async (session: Session) => {
    if (!confirm(`Are you sure you want to delete "${session.title}" on ${formatDate(session.date)}?`)) {
      return
    }

    const { error } = await supabase
      .from('sessions')
      .update({ is_active: false })
      .eq('id', session.id)

    if (error) {
      alert('Failed to delete session')
    } else {
      await fetchSessions()
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      session_type: 'group',
      date: format(new Date(), 'yyyy-MM-dd'),
      start_time: '10:00',
      end_time: '11:00',
      location: 'Miami Shores Park',
      notes: '',
    })
  }

  const openCreateModal = () => {
    setEditingSession(null)
    resetForm()
    setShowModal(true)
  }

  if (loading) {
    return <PageLoader />
  }

  // Group sessions by date
  const sessionsByDate = sessions.reduce((acc, session) => {
    if (!acc[session.date]) {
      acc[session.date] = []
    }
    acc[session.date].push(session)
    return acc
  }, {} as Record<string, Session[]>)

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
              <h1 className="text-3xl font-bold">Manage Sessions</h1>
              <p className="text-gs-gray-600">Create and manage training sessions</p>
            </div>
            <button onClick={openCreateModal} className="btn-green flex items-center gap-2">
              <Plus size={20} />
              Create Session
            </button>
          </div>

          {/* Sessions List */}
          {Object.keys(sessionsByDate).length === 0 ? (
            <div className="card text-center py-12">
              <Calendar className="mx-auto text-gs-gray-400 mb-4" size={48} />
              <h2 className="text-xl font-bold mb-2">No Upcoming Sessions</h2>
              <p className="text-gs-gray-600 mb-4">Create your first session to get started.</p>
              <button onClick={openCreateModal} className="btn-green">
                Create Session
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(sessionsByDate).map(([date, dateSessions]) => (
                <div key={date}>
                  <h2 className="font-bold text-lg mb-3">{formatDate(date)}</h2>
                  <div className="space-y-3">
                    {dateSessions.map((session) => (
                      <div key={session.id} className="card">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={cn(
                                "px-2 py-1 text-xs font-semibold rounded-full",
                                getSessionTypeColor(session.session_type)
                              )}>
                                {getSessionTypeLabel(session.session_type)}
                              </span>
                              <span className="text-sm text-gs-gray-600">
                                {formatCurrency(session.price)}
                              </span>
                            </div>
                            <h3 className="font-bold">{session.title}</h3>
                            <p className="text-sm text-gs-gray-600">
                              {formatTime(session.start_time)} - {formatTime(session.end_time)} • {session.location}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-sm">
                                <Users size={16} className="text-gs-gray-500" />
                                <span className={session.current_capacity >= session.max_capacity ? 'text-red-600 font-medium' : ''}>
                                  {session.current_capacity}/{session.max_capacity}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(session)}
                                className="p-2 text-gs-gray-600 hover:text-gs-black hover:bg-gs-gray-100 rounded"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(session)}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">
                  {editingSession ? 'Edit Session' : 'Create Session'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gs-gray-500 hover:text-gs-black">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                    Session Type *
                  </label>
                  <select
                    value={formData.session_type}
                    onChange={(e) => setFormData({ ...formData, session_type: e.target.value as any })}
                    className="input-field"
                    required
                  >
                    <option value="private">Private ($95)</option>
                    <option value="semi-private">Semi-Private ($70)</option>
                    <option value="group">Group ($40)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                    Title (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-field"
                    placeholder={`${getSessionTypeLabel(formData.session_type)}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="input-field"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                      End Time *
                    </label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="input-field"
                    placeholder="Miami Shores Park"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input-field"
                    rows={3}
                    placeholder="Any additional details..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    {editingSession ? 'Save Changes' : 'Create Session'}
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
