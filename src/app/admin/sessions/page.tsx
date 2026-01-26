'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { PageLoader } from '@/components/LoadingSpinner'
import { Session, User, PRICING, SESSION_CAPACITY } from '@/lib/types'
import { formatDate, formatTime, formatCurrency, getSessionTypeLabel, getSessionTypeColor, cn } from '@/lib/utils'
import { ArrowLeft, Plus, Calendar, Users, Trash2, Edit, X, UserPlus, Repeat, List, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import Link from 'next/link'
import { format, addDays, addWeeks, getDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [athletes, setAthletes] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assigningSession, setAssigningSession] = useState<Session | null>(null)
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('')
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    session_type: 'group' as 'private' | 'semi-private' | 'group',
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '10:00',
    end_time: '11:00',
    location: 'Bamford Park (Davie)',
    notes: '',
    is_recurring: false,
    recurrence_day: getDay(new Date()),
    recurrence_end_date: format(addWeeks(new Date(), 8), 'yyyy-MM-dd'),
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

    const ADMIN_EMAILS = ['td.grandesportstraining@gmail.com']

    if (!user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      router.push('/dashboard')
      return
    }

    await Promise.all([fetchSessions(), fetchAthletes()])
    setLoading(false)
  }

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/sessions')
      const data = await response.json()

      if (data.sessions) {
        setSessions(data.sessions)
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    }
  }

  const fetchAthletes = async () => {
    try {
      const response = await fetch('/api/admin/athletes')
      const data = await response.json()

      if (data.athletes) {
        setAthletes(data.athletes)
      }
    } catch (error) {
      console.error('Failed to fetch athletes:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const baseSessionData = {
      title: formData.title || `${getSessionTypeLabel(formData.session_type)}`,
      session_type: formData.session_type,
      start_time: formData.start_time,
      end_time: formData.end_time,
      price: PRICING[formData.session_type],
      max_capacity: SESSION_CAPACITY[formData.session_type],
      location: formData.location,
      notes: formData.notes || null,
    }

    try {
      if (editingSession) {
        // Update existing session via API
        const response = await fetch('/api/admin/sessions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingSession.id,
            ...baseSessionData,
            date: formData.date,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          alert(data.error || 'Failed to update session')
          return
        }
      } else if (formData.is_recurring) {
        // Create recurring sessions
        const sessionsToCreate = []
        let currentDate = new Date(formData.date)
        const endDate = new Date(formData.recurrence_end_date)

        // Adjust to the correct day of week
        while (getDay(currentDate) !== formData.recurrence_day) {
          currentDate = addDays(currentDate, 1)
        }

        // Generate sessions for each week until end date
        while (currentDate <= endDate) {
          sessionsToCreate.push({
            ...baseSessionData,
            date: format(currentDate, 'yyyy-MM-dd'),
            is_recurring: true,
            recurrence_day: formData.recurrence_day,
          })
          currentDate = addWeeks(currentDate, 1)
        }

        if (sessionsToCreate.length === 0) {
          alert('No sessions to create. Check your date range.')
          return
        }

        const response = await fetch('/api/admin/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessions: sessionsToCreate }),
        })

        if (!response.ok) {
          const data = await response.json()
          alert(data.error || 'Failed to create recurring sessions')
          return
        }

        alert(`Created ${sessionsToCreate.length} recurring sessions!`)
      } else {
        // Create single session via API
        const response = await fetch('/api/admin/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessions: [{ ...baseSessionData, date: formData.date }] }),
        })

        if (!response.ok) {
          const data = await response.json()
          alert(data.error || 'Failed to create session')
          return
        }
      }

      setShowModal(false)
      setEditingSession(null)
      resetForm()
      await fetchSessions()
    } catch (error) {
      alert('Failed to save session')
    }
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
      is_recurring: false,
      recurrence_day: getDay(new Date(session.date)),
      recurrence_end_date: format(addWeeks(new Date(), 8), 'yyyy-MM-dd'),
    })
    setShowModal(true)
  }

  const handleDelete = async (session: Session) => {
    if (!confirm(`Are you sure you want to delete "${session.title}" on ${formatDate(session.date)}?`)) {
      return
    }

    try {
      const response = await fetch('/api/admin/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: session.id }),
      })

      if (!response.ok) {
        alert('Failed to delete session')
      } else {
        await fetchSessions()
      }
    } catch (error) {
      alert('Failed to delete session')
    }
  }

  const openAssignModal = (session: Session) => {
    setAssigningSession(session)
    setSelectedAthleteId('')
    setShowAssignModal(true)
  }

  const handleAssignSession = async () => {
    if (!assigningSession || !selectedAthleteId) {
      alert('Please select an athlete')
      return
    }

    try {
      const response = await fetch('/api/admin/assign-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: assigningSession.id,
          athleteId: selectedAthleteId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Failed to assign session')
        return
      }

      alert('Session assigned successfully! The athlete will receive an email notification.')
      setShowAssignModal(false)
      setAssigningSession(null)
      setSelectedAthleteId('')
      await fetchSessions()
    } catch (error) {
      alert('Failed to assign session')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      session_type: 'group',
      date: format(new Date(), 'yyyy-MM-dd'),
      start_time: '10:00',
      end_time: '11:00',
      location: 'Bamford Park (Davie)',
      notes: '',
      is_recurring: false,
      recurrence_day: getDay(new Date()),
      recurrence_end_date: format(addWeeks(new Date(), 8), 'yyyy-MM-dd'),
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

  // Calendar helpers
  const getCalendarDays = () => {
    const start = startOfWeek(startOfMonth(currentMonth))
    const end = endOfWeek(endOfMonth(currentMonth))
    const days = []
    let day = start
    while (day <= end) {
      days.push(day)
      day = addDays(day, 1)
    }
    return days
  }

  const getSessionsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return sessionsByDate[dateStr] || []
  }

  const getSessionCountColor = (count: number) => {
    if (count === 0) return ''
    if (count === 1) return 'bg-green-100 text-green-800'
    if (count === 2) return 'bg-blue-100 text-blue-800'
    return 'bg-purple-100 text-purple-800'
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
              <h1 className="text-3xl font-bold">Manage Sessions</h1>
              <p className="text-gs-gray-600">Create and manage training sessions</p>
            </div>
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex bg-white rounded-lg border border-gs-gray-200 p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "px-3 py-1.5 rounded-md flex items-center gap-1.5 text-sm font-medium transition-colors",
                    viewMode === 'list' ? 'bg-gs-green text-white' : 'text-gs-gray-600 hover:bg-gs-gray-100'
                  )}
                >
                  <List size={16} />
                  List
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={cn(
                    "px-3 py-1.5 rounded-md flex items-center gap-1.5 text-sm font-medium transition-colors",
                    viewMode === 'calendar' ? 'bg-gs-green text-white' : 'text-gs-gray-600 hover:bg-gs-gray-100'
                  )}
                >
                  <CalendarDays size={16} />
                  Calendar
                </button>
              </div>
              <button onClick={openCreateModal} className="btn-green flex items-center gap-2">
                <Plus size={20} />
                Create Session
              </button>
            </div>
          </div>

          {/* Calendar View */}
          {viewMode === 'calendar' && (
            <div className="card mb-6">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-2 hover:bg-gs-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <h2 className="text-xl font-bold">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-2 hover:bg-gs-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Day Headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-sm font-semibold text-gs-gray-600 py-2">
                    {day}
                  </div>
                ))}

                {/* Calendar Days */}
                {getCalendarDays().map((day, index) => {
                  const daySessions = getSessionsForDate(day)
                  const isCurrentMonth = isSameMonth(day, currentMonth)
                  const isToday = isSameDay(day, new Date())
                  const isSelected = selectedDate && isSameDay(day, selectedDate)

                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "min-h-[80px] p-2 border rounded-lg text-left transition-colors",
                        isCurrentMonth ? 'bg-white' : 'bg-gs-gray-50',
                        isToday && 'ring-2 ring-gs-green',
                        isSelected && 'border-gs-green border-2',
                        !isSelected && 'border-gs-gray-200 hover:border-gs-gray-300'
                      )}
                    >
                      <div className={cn(
                        "text-sm font-medium mb-1",
                        !isCurrentMonth && 'text-gs-gray-400',
                        isToday && 'text-gs-green'
                      )}>
                        {format(day, 'd')}
                      </div>
                      {daySessions.length > 0 && (
                        <div className={cn(
                          "text-xs font-semibold px-1.5 py-0.5 rounded",
                          getSessionCountColor(daySessions.length)
                        )}>
                          {daySessions.length} session{daySessions.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Selected Date Sessions */}
              {selectedDate && (
                <div className="mt-6 pt-6 border-t border-gs-gray-200">
                  <h3 className="font-bold text-lg mb-4">
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </h3>
                  {getSessionsForDate(selectedDate).length === 0 ? (
                    <p className="text-gs-gray-500 text-center py-4">No sessions on this date</p>
                  ) : (
                    <div className="space-y-3">
                      {getSessionsForDate(selectedDate).map((session) => (
                        <div key={session.id} className="bg-gs-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={cn(
                                  "px-2 py-0.5 text-xs font-semibold rounded-full",
                                  getSessionTypeColor(session.session_type)
                                )}>
                                  {getSessionTypeLabel(session.session_type)}
                                </span>
                                <span className="text-sm text-gs-gray-600">
                                  {formatCurrency(session.price)}
                                </span>
                              </div>
                              <h4 className="font-semibold">{session.title}</h4>
                              <p className="text-sm text-gs-gray-600">
                                {formatTime(session.start_time)} - {formatTime(session.end_time)} • {session.location}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gs-gray-600">
                                {session.current_capacity}/{session.max_capacity}
                              </span>
                              <button
                                onClick={() => openAssignModal(session)}
                                className="p-2 text-gs-green hover:bg-green-50 rounded"
                                title="Assign"
                              >
                                <UserPlus size={16} />
                              </button>
                              <button
                                onClick={() => handleEdit(session)}
                                className="p-2 text-gs-gray-600 hover:bg-gs-gray-100 rounded"
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(session)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            Object.keys(sessionsByDate).length === 0 ? (
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
                              {session.is_recurring && (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
                                  <Repeat size={12} />
                                  Recurring
                                </span>
                              )}
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
                                onClick={() => openAssignModal(session)}
                                className="p-2 text-gs-green hover:text-green-800 hover:bg-green-50 rounded"
                                title="Assign to athlete"
                              >
                                <UserPlus size={18} />
                              </button>
                              <button
                                onClick={() => handleEdit(session)}
                                className="p-2 text-gs-gray-600 hover:text-gs-black hover:bg-gs-gray-100 rounded"
                                title="Edit session"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(session)}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                title="Delete session"
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
          )
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

                {/* Recurring Option */}
                {!editingSession && (
                  <div className="border rounded-lg p-4 bg-gs-gray-50">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_recurring}
                        onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                        className="w-4 h-4 text-gs-green rounded"
                      />
                      <span className="font-medium flex items-center gap-2">
                        <Repeat size={16} />
                        Repeat Weekly
                      </span>
                    </label>

                    {formData.is_recurring && (
                      <div className="mt-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                            Repeat Every
                          </label>
                          <select
                            value={formData.recurrence_day}
                            onChange={(e) => setFormData({ ...formData, recurrence_day: parseInt(e.target.value) })}
                            className="input-field"
                          >
                            {DAYS_OF_WEEK.map((day) => (
                              <option key={day.value} value={day.value}>
                                {day.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                            Starting From
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

                        <div>
                          <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                            Until
                          </label>
                          <input
                            type="date"
                            value={formData.recurrence_end_date}
                            onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value })}
                            min={formData.date}
                            className="input-field"
                            required
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Single Date (when not recurring) */}
                {(!formData.is_recurring || editingSession) && (
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
                )}

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
                    placeholder="Bamford Park (Davie)"
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
                    {editingSession ? 'Save Changes' : formData.is_recurring ? 'Create Recurring Sessions' : 'Create Session'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign to Athlete Modal */}
      {showAssignModal && assigningSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Assign Session to Athlete</h2>
                <button onClick={() => setShowAssignModal(false)} className="text-gs-gray-500 hover:text-gs-black">
                  <X size={24} />
                </button>
              </div>

              <div className="mb-4 p-4 bg-gs-gray-50 rounded-lg">
                <p className="font-medium">{assigningSession.title}</p>
                <p className="text-sm text-gs-gray-600">
                  {formatDate(assigningSession.date)} at {formatTime(assigningSession.start_time)}
                </p>
                <p className="text-sm text-gs-gray-600">{formatCurrency(assigningSession.price)}</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                  Select Athlete *
                </label>
                <select
                  value={selectedAthleteId}
                  onChange={(e) => setSelectedAthleteId(e.target.value)}
                  className="input-field"
                >
                  <option value="">Choose an athlete...</option>
                  {athletes.map((athlete) => (
                    <option key={athlete.id} value={athlete.id}>
                      {athlete.full_name} ({athlete.email})
                    </option>
                  ))}
                </select>
                {athletes.length === 0 && (
                  <p className="text-sm text-gs-gray-500 mt-2">
                    No athletes found. Add athletes from the Athletes page first.
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignSession}
                  disabled={!selectedAthleteId}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assign Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
