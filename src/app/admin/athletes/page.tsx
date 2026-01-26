'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { PageLoader } from '@/components/LoadingSpinner'
import { User, Session } from '@/lib/types'
import { formatDate, formatTime, formatCurrency } from '@/lib/utils'
import { ArrowLeft, Search, User as UserIcon, Activity, X, Eye, Edit, Trash2, Phone, Mail, Calendar, AlertTriangle, Plus, CalendarPlus, FileText } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface AthleteWithStats extends User {
  total_sessions: number
}

export default function AdminAthletesPage() {
  const [athletes, setAthletes] = useState<AthleteWithStats[]>([])
  const [filteredAthletes, setFilteredAthletes] = useState<AthleteWithStats[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // Add Athlete Modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({
    full_name: '',
    email: '',
    phone: '',
  })
  const [adding, setAdding] = useState(false)

  // Test Modal
  const [showTestModal, setShowTestModal] = useState(false)
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteWithStats | null>(null)
  const [testForm, setTestForm] = useState({
    test_date: format(new Date(), 'yyyy-MM-dd'),
    drill_180: '',
    drill_open_90: '',
    drill_v: '',
    dribble_20_yard: '',
    dribble_v: '',
    dribble_t: '',
    juggling_both: '',
    juggling_left: '',
    juggling_right: '',
    straight_line_both: '',
    straight_line_left: '',
    straight_line_right: '',
    notes: '',
  })

  // View Modal
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingAthlete, setViewingAthlete] = useState<AthleteWithStats | null>(null)

  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingAthlete, setEditingAthlete] = useState<AthleteWithStats | null>(null)
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    position: '',
    emergency_contact: '',
    emergency_phone: '',
    admin_notes: '',
  })
  const [saving, setSaving] = useState(false)

  // Book Session Modal
  const [showBookModal, setShowBookModal] = useState(false)
  const [bookingAthlete, setBookingAthlete] = useState<AthleteWithStats | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [booking, setBooking] = useState(false)

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAndFetch()
  }, [])

  useEffect(() => {
    if (search) {
      const filtered = athletes.filter(a =>
        a.full_name.toLowerCase().includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase()) ||
        a.position?.toLowerCase().includes(search.toLowerCase())
      )
      setFilteredAthletes(filtered)
    } else {
      setFilteredAthletes(athletes)
    }
  }, [search, athletes])

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

    await Promise.all([fetchAthletes(), fetchSessions()])
    setLoading(false)
  }

  const fetchAthletes = async () => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_admin', false)
      .order('full_name', { ascending: true })

    if (profiles) {
      const athletesWithStats = await Promise.all(
        profiles.map(async (profile) => {
          const { count } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id)
            .in('status', ['confirmed', 'completed'])

          return {
            ...profile,
            total_sessions: count || 0,
          }
        })
      )
      setAthletes(athletesWithStats)
    }
  }

  const fetchSessions = async () => {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('is_active', true)
      .gte('date', format(new Date(), 'yyyy-MM-dd'))
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (data) {
      setSessions(data)
    }
  }

  // Add Athlete
  const handleAddAthlete = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true)

    try {
      const response = await fetch('/api/admin/add-athlete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Failed to add athlete')
      } else {
        alert(data.message)
        setShowAddModal(false)
        setAddForm({ full_name: '', email: '', phone: '' })
        await fetchAthletes()
      }
    } catch (error) {
      alert('Failed to add athlete')
    }

    setAdding(false)
  }

  // View Modal
  const openViewModal = (athlete: AthleteWithStats) => {
    setViewingAthlete(athlete)
    setShowViewModal(true)
  }

  // Edit Modal
  const openEditModal = (athlete: AthleteWithStats) => {
    setEditingAthlete(athlete)
    setEditForm({
      full_name: athlete.full_name || '',
      phone: athlete.phone || '',
      position: athlete.position || '',
      emergency_contact: athlete.emergency_contact || '',
      emergency_phone: athlete.emergency_phone || '',
      admin_notes: athlete.admin_notes || '',
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAthlete) return

    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: editForm.full_name,
        phone: editForm.phone,
        position: editForm.position,
        emergency_contact: editForm.emergency_contact,
        emergency_phone: editForm.emergency_phone,
        admin_notes: editForm.admin_notes,
      })
      .eq('id', editingAthlete.id)

    if (error) {
      alert('Failed to update athlete')
    } else {
      alert('Athlete updated successfully!')
      setShowEditModal(false)
      await fetchAthletes()
    }

    setSaving(false)
  }

  // Book Session on Behalf
  const openBookModal = (athlete: AthleteWithStats) => {
    setBookingAthlete(athlete)
    setSelectedSessionId('')
    setShowBookModal(true)
  }

  const handleBookSession = async () => {
    if (!bookingAthlete || !selectedSessionId) {
      alert('Please select a session')
      return
    }

    setBooking(true)

    try {
      const response = await fetch('/api/admin/assign-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          athleteId: bookingAthlete.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Failed to book session')
      } else {
        alert(`Session booked for ${bookingAthlete.full_name}! They will receive an email notification.`)
        setShowBookModal(false)
        setBookingAthlete(null)
        setSelectedSessionId('')
        await fetchSessions()
      }
    } catch (error) {
      alert('Failed to book session')
    }

    setBooking(false)
  }

  // Delete
  const handleDelete = async (athlete: AthleteWithStats) => {
    if (!confirm(`Are you sure you want to delete ${athlete.full_name}? This action cannot be undone.`)) {
      return
    }

    setDeletingId(athlete.id)

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', athlete.id)

    if (error) {
      alert('Failed to delete athlete. They may have bookings or other data.')
    } else {
      await fetchAthletes()
    }

    setDeletingId(null)
  }

  // Test Modal
  const openTestModal = (athlete: AthleteWithStats) => {
    setSelectedAthlete(athlete)
    setTestForm({
      test_date: format(new Date(), 'yyyy-MM-dd'),
      drill_180: '',
      drill_open_90: '',
      drill_v: '',
      dribble_20_yard: '',
      dribble_v: '',
      dribble_t: '',
      juggling_both: '',
      juggling_left: '',
      juggling_right: '',
      straight_line_both: '',
      straight_line_left: '',
      straight_line_right: '',
      notes: '',
    })
    setShowTestModal(true)
  }

  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAthlete) return

    const testData = {
      user_id: selectedAthlete.id,
      test_date: testForm.test_date,
      drill_180: testForm.drill_180 ? parseInt(testForm.drill_180) : null,
      drill_open_90: testForm.drill_open_90 ? parseInt(testForm.drill_open_90) : null,
      drill_v: testForm.drill_v ? parseInt(testForm.drill_v) : null,
      dribble_20_yard: testForm.dribble_20_yard ? parseFloat(testForm.dribble_20_yard) : null,
      dribble_v: testForm.dribble_v ? parseFloat(testForm.dribble_v) : null,
      dribble_t: testForm.dribble_t ? parseFloat(testForm.dribble_t) : null,
      juggling_both: testForm.juggling_both ? parseInt(testForm.juggling_both) : null,
      juggling_left: testForm.juggling_left ? parseInt(testForm.juggling_left) : null,
      juggling_right: testForm.juggling_right ? parseInt(testForm.juggling_right) : null,
      straight_line_both: testForm.straight_line_both ? parseFloat(testForm.straight_line_both) : null,
      straight_line_left: testForm.straight_line_left ? parseFloat(testForm.straight_line_left) : null,
      straight_line_right: testForm.straight_line_right ? parseFloat(testForm.straight_line_right) : null,
      notes: testForm.notes || null,
    }

    const { error } = await supabase
      .from('technical_tests')
      .insert(testData)

    if (error) {
      alert('Failed to save test results')
    } else {
      alert('Test results saved successfully!')
      setShowTestModal(false)
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
              <h1 className="text-3xl font-bold">Athletes</h1>
              <p className="text-gs-gray-600">Manage athletes and input technical testing</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-green flex items-center gap-2"
            >
              <Plus size={20} />
              Add Athlete
            </button>
          </div>

          {/* Search */}
          <div className="card mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gs-gray-400" size={20} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or position..."
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Athletes List */}
          {filteredAthletes.length === 0 ? (
            <div className="card text-center py-12">
              <UserIcon className="mx-auto text-gs-gray-400 mb-4" size={48} />
              <h2 className="text-xl font-bold mb-2">No Athletes Found</h2>
              <p className="text-gs-gray-600 mb-4">
                {search ? 'Try a different search term.' : 'Add your first athlete to get started.'}
              </p>
              {!search && (
                <button onClick={() => setShowAddModal(true)} className="btn-green">
                  Add Athlete
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAthletes.map((athlete) => (
                <div key={athlete.id} className="card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gs-gray-200 rounded-full flex items-center justify-center">
                        <UserIcon className="text-gs-gray-600" size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold">{athlete.full_name}</h3>
                          {athlete.admin_notes && (
                            <span title="Has admin notes">
                              <FileText size={14} className="text-orange-500" />
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gs-gray-600">{athlete.email}</p>
                        <div className="flex gap-4 mt-1 text-xs text-gs-gray-500">
                          {athlete.position && <span>{athlete.position}</span>}
                          <span>{athlete.total_sessions} sessions</span>
                          <span>Joined {formatDate(athlete.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openBookModal(athlete)}
                        className="p-2 text-gs-green hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                        title="Book session for athlete"
                      >
                        <CalendarPlus size={18} />
                      </button>
                      <button
                        onClick={() => openViewModal(athlete)}
                        className="p-2 text-gs-gray-600 hover:text-gs-black hover:bg-gs-gray-100 rounded transition-colors"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => openEditModal(athlete)}
                        className="p-2 text-gs-gray-600 hover:text-gs-black hover:bg-gs-gray-100 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(athlete)}
                        disabled={deletingId === athlete.id}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button
                        onClick={() => openTestModal(athlete)}
                        className="btn-secondary flex items-center gap-2 text-sm ml-2"
                      >
                        <Activity size={16} />
                        Add Test
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Athlete Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Add New Athlete</h2>
                <button onClick={() => setShowAddModal(false)} className="text-gs-gray-500 hover:text-gs-black">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddAthlete} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={addForm.full_name}
                    onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                    className="input-field"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="input-field"
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    className="input-field"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    The athlete will receive an email invitation to set up their account and manage their payment information.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adding}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    {adding ? 'Adding...' : 'Add Athlete'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Book Session Modal */}
      {showBookModal && bookingAthlete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Book Session</h2>
                <button onClick={() => setShowBookModal(false)} className="text-gs-gray-500 hover:text-gs-black">
                  <X size={24} />
                </button>
              </div>

              <div className="mb-4 p-4 bg-gs-gray-50 rounded-lg">
                <p className="font-medium">{bookingAthlete.full_name}</p>
                <p className="text-sm text-gs-gray-600">{bookingAthlete.email}</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                  Select Session *
                </label>
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="input-field"
                >
                  <option value="">Choose a session...</option>
                  {sessions.filter(s => s.current_capacity < s.max_capacity).map((session) => (
                    <option key={session.id} value={session.id}>
                      {formatDate(session.date)} - {formatTime(session.start_time)} - {session.title} ({formatCurrency(session.price)})
                    </option>
                  ))}
                </select>
                {sessions.length === 0 && (
                  <p className="text-sm text-gs-gray-500 mt-2">
                    No available sessions. Create sessions from the Sessions page first.
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBookSession}
                  disabled={!selectedSessionId || booking}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {booking ? 'Booking...' : 'Book Session'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Athlete Modal */}
      {showViewModal && viewingAthlete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Athlete Details</h2>
                <button onClick={() => setShowViewModal(false)} className="text-gs-gray-500 hover:text-gs-black">
                  <X size={24} />
                </button>
              </div>

              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gs-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <UserIcon className="text-gs-gray-600" size={40} />
                </div>
                <h3 className="text-xl font-bold">{viewingAthlete.full_name}</h3>
                {viewingAthlete.position && (
                  <span className="inline-block px-3 py-1 bg-gs-green bg-opacity-10 text-gs-green text-sm font-medium rounded-full mt-2">
                    {viewingAthlete.position}
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gs-gray-50 rounded">
                  <Mail className="text-gs-gray-500" size={18} />
                  <div>
                    <p className="text-xs text-gs-gray-500">Email</p>
                    <p className="font-medium">{viewingAthlete.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gs-gray-50 rounded">
                  <Phone className="text-gs-gray-500" size={18} />
                  <div>
                    <p className="text-xs text-gs-gray-500">Phone</p>
                    <p className="font-medium">{viewingAthlete.phone || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gs-gray-50 rounded">
                  <Calendar className="text-gs-gray-500" size={18} />
                  <div>
                    <p className="text-xs text-gs-gray-500">Member Since</p>
                    <p className="font-medium">{formatDate(viewingAthlete.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gs-gray-50 rounded">
                  <Activity className="text-gs-gray-500" size={18} />
                  <div>
                    <p className="text-xs text-gs-gray-500">Total Sessions</p>
                    <p className="font-medium">{viewingAthlete.total_sessions} sessions booked</p>
                  </div>
                </div>

                {(viewingAthlete.emergency_contact || viewingAthlete.emergency_phone) && (
                  <div className="border-t border-gs-gray-200 pt-4 mt-4">
                    <h4 className="font-semibold text-sm text-gs-gray-700 mb-3 flex items-center gap-2">
                      <AlertTriangle size={16} className="text-orange-500" />
                      Emergency Contact
                    </h4>
                    <div className="p-3 bg-orange-50 rounded">
                      <p className="font-medium">{viewingAthlete.emergency_contact || 'Not provided'}</p>
                      <p className="text-sm text-gs-gray-600">{viewingAthlete.emergency_phone || 'No phone'}</p>
                    </div>
                  </div>
                )}

                {viewingAthlete.admin_notes && (
                  <div className="border-t border-gs-gray-200 pt-4 mt-4">
                    <h4 className="font-semibold text-sm text-gs-gray-700 mb-3 flex items-center gap-2">
                      <FileText size={16} className="text-blue-500" />
                      Admin Notes
                    </h4>
                    <div className="p-3 bg-blue-50 rounded">
                      <p className="text-sm whitespace-pre-wrap">{viewingAthlete.admin_notes}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    openEditModal(viewingAthlete)
                  }}
                  className="btn-secondary flex-1"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="btn-primary flex-1"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Athlete Modal */}
      {showEditModal && editingAthlete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">Edit Athlete</h2>
                  <p className="text-gs-gray-600 text-sm">{editingAthlete.email}</p>
                </div>
                <button onClick={() => setShowEditModal(false)} className="text-gs-gray-500 hover:text-gs-black">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="input-field"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                    Position
                  </label>
                  <select
                    value={editForm.position}
                    onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select position</option>
                    <option value="Goalkeeper">Goalkeeper</option>
                    <option value="Defender">Defender</option>
                    <option value="Midfielder">Midfielder</option>
                    <option value="Forward">Forward</option>
                    <option value="Multiple">Multiple Positions</option>
                  </select>
                </div>

                <div className="border-t border-gs-gray-200 pt-4">
                  <h3 className="font-semibold mb-3">Emergency Contact</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                        Contact Name
                      </label>
                      <input
                        type="text"
                        value={editForm.emergency_contact}
                        onChange={(e) => setEditForm({ ...editForm, emergency_contact: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={editForm.emergency_phone}
                        onChange={(e) => setEditForm({ ...editForm, emergency_phone: e.target.value })}
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gs-gray-200 pt-4">
                  <label className="block text-sm font-medium text-gs-gray-700 mb-1 flex items-center gap-2">
                    <FileText size={16} className="text-blue-500" />
                    Admin Notes (only visible to admins)
                  </label>
                  <textarea
                    value={editForm.admin_notes}
                    onChange={(e) => setEditForm({ ...editForm, admin_notes: e.target.value })}
                    className="input-field"
                    rows={4}
                    placeholder="Add private notes about this athlete..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Technical Test Modal */}
      {showTestModal && selectedAthlete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">Technical Testing</h2>
                  <p className="text-gs-gray-600">{selectedAthlete.full_name}</p>
                </div>
                <button onClick={() => setShowTestModal(false)} className="text-gs-gray-500 hover:text-gs-black">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleTestSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                    Test Date *
                  </label>
                  <input
                    type="date"
                    value={testForm.test_date}
                    onChange={(e) => setTestForm({ ...testForm, test_date: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                {/* Technical Passing */}
                <div>
                  <h3 className="font-semibold text-gs-gray-700 mb-3 uppercase text-sm tracking-wide">
                    Technical Passing (Score)
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gs-gray-600 mb-1">180 Drill</label>
                      <input
                        type="number"
                        value={testForm.drill_180}
                        onChange={(e) => setTestForm({ ...testForm, drill_180: e.target.value })}
                        className="input-field"
                        placeholder="Score"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gs-gray-600 mb-1">Open 90 Drill</label>
                      <input
                        type="number"
                        value={testForm.drill_open_90}
                        onChange={(e) => setTestForm({ ...testForm, drill_open_90: e.target.value })}
                        className="input-field"
                        placeholder="Score"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gs-gray-600 mb-1">V Drill</label>
                      <input
                        type="number"
                        value={testForm.drill_v}
                        onChange={(e) => setTestForm({ ...testForm, drill_v: e.target.value })}
                        className="input-field"
                        placeholder="Score"
                      />
                    </div>
                  </div>
                </div>

                {/* Dribbling */}
                <div>
                  <h3 className="font-semibold text-gs-gray-700 mb-3 uppercase text-sm tracking-wide">
                    Dribbling (Time in seconds)
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gs-gray-600 mb-1">20 Yard</label>
                      <input
                        type="number"
                        step="0.01"
                        value={testForm.dribble_20_yard}
                        onChange={(e) => setTestForm({ ...testForm, dribble_20_yard: e.target.value })}
                        className="input-field"
                        placeholder="Seconds"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gs-gray-600 mb-1">V Dribble</label>
                      <input
                        type="number"
                        step="0.01"
                        value={testForm.dribble_v}
                        onChange={(e) => setTestForm({ ...testForm, dribble_v: e.target.value })}
                        className="input-field"
                        placeholder="Seconds"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gs-gray-600 mb-1">T Dribble</label>
                      <input
                        type="number"
                        step="0.01"
                        value={testForm.dribble_t}
                        onChange={(e) => setTestForm({ ...testForm, dribble_t: e.target.value })}
                        className="input-field"
                        placeholder="Seconds"
                      />
                    </div>
                  </div>
                </div>

                {/* Ball Control */}
                <div>
                  <h3 className="font-semibold text-gs-gray-700 mb-3 uppercase text-sm tracking-wide">
                    Ball Control
                  </h3>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm text-gs-gray-600 mb-1">Juggling (Both)</label>
                      <input
                        type="number"
                        value={testForm.juggling_both}
                        onChange={(e) => setTestForm({ ...testForm, juggling_both: e.target.value })}
                        className="input-field"
                        placeholder="Count"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gs-gray-600 mb-1">Juggling (Left)</label>
                      <input
                        type="number"
                        value={testForm.juggling_left}
                        onChange={(e) => setTestForm({ ...testForm, juggling_left: e.target.value })}
                        className="input-field"
                        placeholder="Count"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gs-gray-600 mb-1">Juggling (Right)</label>
                      <input
                        type="number"
                        value={testForm.juggling_right}
                        onChange={(e) => setTestForm({ ...testForm, juggling_right: e.target.value })}
                        className="input-field"
                        placeholder="Count"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gs-gray-600 mb-1">Straight Line (Both)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={testForm.straight_line_both}
                        onChange={(e) => setTestForm({ ...testForm, straight_line_both: e.target.value })}
                        className="input-field"
                        placeholder="Seconds"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gs-gray-600 mb-1">Straight Line (Left)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={testForm.straight_line_left}
                        onChange={(e) => setTestForm({ ...testForm, straight_line_left: e.target.value })}
                        className="input-field"
                        placeholder="Seconds"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gs-gray-600 mb-1">Straight Line (Right)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={testForm.straight_line_right}
                        onChange={(e) => setTestForm({ ...testForm, straight_line_right: e.target.value })}
                        className="input-field"
                        placeholder="Seconds"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={testForm.notes}
                    onChange={(e) => setTestForm({ ...testForm, notes: e.target.value })}
                    className="input-field"
                    rows={3}
                    placeholder="Any observations or feedback..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowTestModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    Save Results
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
