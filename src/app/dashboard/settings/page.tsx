'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { PageLoader } from '@/components/LoadingSpinner'
import { ArrowLeft, Eye, EyeOff, User, Shield, CheckCircle, CreditCard, Trash2, Plus } from 'lucide-react'
import Link from 'next/link'

interface PaymentMethod {
  id: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
}

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [error, setError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [success, setSuccess] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Payment Methods
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true)
  const [deletingMethodId, setDeletingMethodId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    position: '',
    emergency_contact: '',
    emergency_phone: '',
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

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
    await Promise.all([fetchProfile(user.id), fetchPaymentMethods()])
    setLoading(false)
  }

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (data) {
      setFormData({
        full_name: data.full_name || '',
        phone: data.phone || '',
        position: data.position || '',
        emergency_contact: data.emergency_contact || '',
        emergency_phone: data.emergency_phone || '',
      })
    }
  }

  const fetchPaymentMethods = async () => {
    setLoadingPaymentMethods(true)
    try {
      const response = await fetch('/api/payment-methods')
      const data = await response.json()
      if (data.paymentMethods) {
        setPaymentMethods(data.paymentMethods)
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error)
    }
    setLoadingPaymentMethods(false)
  }

  const deletePaymentMethod = async (paymentMethodId: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) {
      return
    }

    setDeletingMethodId(paymentMethodId)
    try {
      const response = await fetch('/api/payment-methods', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId }),
      })

      if (response.ok) {
        setPaymentMethods(paymentMethods.filter(pm => pm.id !== paymentMethodId))
      } else {
        alert('Failed to remove payment method')
      }
    } catch (error) {
      alert('Failed to remove payment method')
    }
    setDeletingMethodId(null)
  }

  const getCardIcon = (brand: string) => {
    const brandLower = brand?.toLowerCase()
    switch (brandLower) {
      case 'visa':
        return '💳 Visa'
      case 'mastercard':
        return '💳 Mastercard'
      case 'amex':
        return '💳 Amex'
      case 'discover':
        return '💳 Discover'
      default:
        return '💳 Card'
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value })
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          position: formData.position,
          emergency_contact: formData.emergency_contact,
          emergency_phone: formData.emergency_phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()

      if (updateError) {
        console.error('Profile update error:', updateError)
        setError(`Failed to update profile: ${updateError.message}`)
      } else if (!data || data.length === 0) {
        setError('No profile found to update. Please refresh and try again.')
      } else {
        setSuccess('Profile updated successfully!')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err: any) {
      console.error('Profile update exception:', err)
      setError('An unexpected error occurred. Please try again.')
    }

    setSaving(false)
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPassword(true)
    setPasswordError('')
    setPasswordSuccess('')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match')
      setSavingPassword(false)
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters')
      setSavingPassword(false)
      return
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: passwordForm.currentPassword,
    })

    if (signInError) {
      setPasswordError('Current password is incorrect')
      setSavingPassword(false)
      return
    }

    // Update to new password
    const { error } = await supabase.auth.updateUser({
      password: passwordForm.newPassword,
    })

    if (error) {
      setPasswordError('Failed to update password. Please try again.')
    } else {
      setPasswordSuccess('Password updated successfully!')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setTimeout(() => setPasswordSuccess(''), 3000)
    }

    setSavingPassword(false)
  }

  if (loading) {
    return <PageLoader />
  }

  return (
    <div className="min-h-screen flex flex-col bg-gs-gray-100">
      <Header />

      <main className="flex-1 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-gs-gray-600 hover:text-gs-black mb-6"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to Dashboard
          </Link>

          <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
          <p className="text-gs-gray-600 mb-8">Manage your profile, payment methods, and password</p>

          {/* Profile Information */}
          <div className="card mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gs-green bg-opacity-10 rounded-full flex items-center justify-center">
                <User className="text-gs-green" size={20} />
              </div>
              <h2 className="text-xl font-bold">Profile Information</h2>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-6 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 mb-6 text-sm flex items-center gap-2">
                <CheckCircle size={16} />
                {success}
              </div>
            )}

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gs-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  className="input-field bg-gs-gray-100 cursor-not-allowed"
                  disabled
                />
                <p className="text-xs text-gs-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gs-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gs-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gs-gray-700 mb-1">
                  Position
                </label>
                <select
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Select your position</option>
                  <option value="Goalkeeper">Goalkeeper</option>
                  <option value="Defender">Defender</option>
                  <option value="Midfielder">Midfielder</option>
                  <option value="Forward">Forward</option>
                  <option value="Multiple">Multiple Positions</option>
                </select>
              </div>

              <div className="border-t border-gs-gray-200 pt-4 mt-4">
                <h3 className="font-semibold mb-4">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="emergency_contact" className="block text-sm font-medium text-gs-gray-700 mb-1">
                      Contact Name
                    </label>
                    <input
                      id="emergency_contact"
                      name="emergency_contact"
                      type="text"
                      value={formData.emergency_contact}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div>
                    <label htmlFor="emergency_phone" className="block text-sm font-medium text-gs-gray-700 mb-1">
                      Contact Phone
                    </label>
                    <input
                      id="emergency_phone"
                      name="emergency_phone"
                      type="tel"
                      value={formData.emergency_phone}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Payment Methods */}
          <div className="card mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <CreditCard className="text-blue-600" size={20} />
              </div>
              <h2 className="text-xl font-bold">Payment Methods</h2>
            </div>

            {loadingPaymentMethods ? (
              <div className="text-center py-4">
                <p className="text-gs-gray-600">Loading payment methods...</p>
              </div>
            ) : paymentMethods.length === 0 ? (
              <div className="text-center py-6 bg-gs-gray-50 rounded-lg">
                <CreditCard className="mx-auto text-gs-gray-400 mb-3" size={32} />
                <p className="text-gs-gray-600 mb-2">No payment methods saved</p>
                <p className="text-sm text-gs-gray-500">
                  Your payment method will be saved automatically when you book a session.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between p-4 bg-gs-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{getCardIcon(method.brand).split(' ')[0]}</div>
                      <div>
                        <p className="font-medium">
                          {method.brand?.charAt(0).toUpperCase() + method.brand?.slice(1)} ending in {method.last4}
                        </p>
                        <p className="text-sm text-gs-gray-600">
                          Expires {method.expMonth}/{method.expYear}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deletePaymentMethod(method.id)}
                      disabled={deletingMethodId === method.id}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                      title="Remove card"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Apple Pay & Google Pay:</strong> Available automatically at checkout on supported devices.
              </p>
            </div>
          </div>

          {/* Password Change */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Shield className="text-purple-600" size={20} />
              </div>
              <h2 className="text-xl font-bold">Change Password</h2>
            </div>

            {passwordError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-6 text-sm">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 mb-6 text-sm flex items-center gap-2">
                <CheckCircle size={16} />
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gs-gray-700 mb-1">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    className="input-field pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gs-gray-500"
                  >
                    {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gs-gray-700 mb-1">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    className="input-field pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gs-gray-500"
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="text-xs text-gs-gray-500 mt-1">Must be at least 6 characters</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gs-gray-700 mb-1">
                  Confirm New Password *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  className="input-field"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
