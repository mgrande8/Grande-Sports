'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { PageLoader } from '@/components/LoadingSpinner'
import { DiscountCode } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, Plus, Tag, Trash2, Edit, X, Copy, Check, Gift, Percent, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<DiscountCode[]>([])
  const [athletes, setAthletes] = useState<{ id: string; full_name: string; email: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed' | 'free_session',
    value: '',
    valid_until: '',
    athlete_id: '',
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

    await fetchDiscounts()
    await fetchAthletes()
    setLoading(false)
  }

  const fetchDiscounts = async () => {
    try {
      const response = await fetch('/api/admin/discounts')
      const data = await response.json()

      if (data.discounts) {
        setDiscounts(data.discounts)
      }
    } catch (error) {
      console.error('Failed to fetch discounts:', error)
    }
  }

  const fetchAthletes = async () => {
    try {
      const response = await fetch('/api/admin/athletes')
      const data = await response.json()

      if (data.athletes) {
        setAthletes(data.athletes.map((a: any) => ({
          id: a.id,
          full_name: a.full_name,
          email: a.email,
        })))
      }
    } catch (error) {
      console.error('Failed to fetch athletes:', error)
    }
  }

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = 'GS'
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, code })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const discountData = {
      code: formData.code.toUpperCase(),
      type: formData.type,
      value: formData.type === 'free_session' ? 0 : parseFloat(formData.value),
      valid_until: formData.valid_until || null,
      athlete_id: formData.athlete_id || null,
    }

    try {
      if (editingDiscount) {
        const response = await fetch('/api/admin/discounts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingDiscount.id, ...discountData }),
        })

        if (!response.ok) {
          const data = await response.json()
          alert(data.error || 'Failed to update discount code')
          return
        }
      } else {
        const response = await fetch('/api/admin/discounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(discountData),
        })

        if (!response.ok) {
          const data = await response.json()
          alert(data.error || 'Failed to create discount code')
          return
        }
      }

      setShowModal(false)
      setEditingDiscount(null)
      resetForm()
      await fetchDiscounts()
    } catch (error) {
      alert('Failed to save discount code')
    }
  }

  const handleEdit = (discount: DiscountCode) => {
    setEditingDiscount(discount)
    setFormData({
      code: discount.code,
      type: discount.type,
      value: discount.value.toString(),
      valid_until: discount.valid_until ? format(new Date(discount.valid_until), 'yyyy-MM-dd') : '',
      athlete_id: discount.athlete_id || '',
    })
    setShowModal(true)
  }

  const handleDelete = async (discount: DiscountCode) => {
    if (!confirm(`Delete code "${discount.code}"?`)) return

    try {
      const response = await fetch('/api/admin/discounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: discount.id }),
      })

      if (!response.ok) {
        alert('Failed to delete discount code')
      }
    } catch (error) {
      alert('Failed to delete discount code')
    }

    await fetchDiscounts()
  }

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const resetForm = () => {
    setFormData({
      code: '',
      type: 'percentage',
      value: '',
      valid_until: '',
      athlete_id: '',
    })
  }

  const openCreateModal = () => {
    setEditingDiscount(null)
    resetForm()
    setShowModal(true)
  }

  const getDiscountDisplay = (discount: DiscountCode) => {
    switch (discount.type) {
      case 'percentage':
        return `${discount.value}% off`
      case 'fixed':
        return `${formatCurrency(discount.value)} off`
      case 'free_session':
        return 'Free Session'
      default:
        return `${discount.value} off`
    }
  }

  const getDiscountIcon = (type: string) => {
    switch (type) {
      case 'percentage':
        return <Percent size={16} />
      case 'fixed':
        return <DollarSign size={16} />
      case 'free_session':
        return <Gift size={16} />
      default:
        return <Tag size={16} />
    }
  }

  const getDiscountColor = (type: string) => {
    switch (type) {
      case 'percentage':
        return 'bg-blue-100 text-blue-800'
      case 'fixed':
        return 'bg-green-100 text-green-800'
      case 'free_session':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) return <PageLoader />

  const activeDiscounts = discounts.filter(d => d.is_active)

  return (
    <div className="min-h-screen bg-gs-gray-100">
      <Header />

      <main className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/admin" className="inline-flex items-center text-gs-gray-600 hover:text-gs-black mb-6">
            <ArrowLeft size={16} className="mr-1" />
            Back to Admin
          </Link>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Discount Codes</h1>
              <p className="text-gs-gray-600">Create and manage discount codes (unlimited uses)</p>
            </div>
            <button
              onClick={openCreateModal}
              className="btn-green flex items-center gap-2"
            >
              <Plus size={20} />
              Create Code
            </button>
          </div>

          {activeDiscounts.length === 0 ? (
            <div className="card text-center py-12">
              <Tag className="mx-auto text-gs-gray-400 mb-4" size={48} />
              <h2 className="text-xl font-bold mb-2">No Discount Codes</h2>
              <p className="text-gs-gray-600 mb-4">Create your first discount code.</p>
              <button onClick={openCreateModal} className="btn-green">
                Create Code
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeDiscounts.map((discount) => (
                <div key={discount.id} className="card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-gs-green bg-opacity-10 px-4 py-2 rounded-lg">
                        <code className="text-lg font-bold text-gs-green">{discount.code}</code>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getDiscountColor(discount.type)}`}>
                            {getDiscountIcon(discount.type)}
                            {getDiscountDisplay(discount)}
                          </span>
                        </div>
                        <div className="flex gap-3 text-sm text-gs-gray-600">
                          <span>Used: {discount.current_uses} times</span>
                          {discount.athlete_id && (
                            <span className="text-blue-600">Athlete-specific</span>
                          )}
                          {discount.valid_until && (
                            <span>Expires: {format(new Date(discount.valid_until), 'MMM d, yyyy')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(discount.code, discount.id)}
                        className="p-2 text-gs-gray-600 hover:text-gs-black hover:bg-gs-gray-100 rounded"
                        title="Copy code"
                      >
                        {copiedId === discount.id ? <Check size={18} className="text-gs-green" /> : <Copy size={18} />}
                      </button>
                      <button
                        onClick={() => handleEdit(discount)}
                        className="p-2 text-gs-gray-600 hover:text-gs-black hover:bg-gs-gray-100 rounded"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(discount)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
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
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">
                  {editingDiscount ? 'Edit Discount Code' : 'Create Discount Code'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gs-gray-500 hover:text-gs-black">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gs-gray-700 mb-1">Code *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="input-field flex-1"
                      placeholder="SAVE10"
                      required
                      disabled={!!editingDiscount}
                    />
                    {!editingDiscount && (
                      <button type="button" onClick={generateCode} className="btn-secondary text-sm">
                        Generate
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gs-gray-700 mb-1">Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="input-field"
                  >
                    <option value="percentage">Percentage Off (%)</option>
                    <option value="fixed">Fixed Amount Off ($)</option>
                    <option value="free_session">Free Session (100% off)</option>
                  </select>
                </div>

                {formData.type !== 'free_session' && (
                  <div>
                    <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                      Value * {formData.type === 'percentage' ? '(%)' : '($)'}
                    </label>
                    <input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className="input-field"
                      placeholder={formData.type === 'percentage' ? '20' : '10'}
                      required
                      min="0"
                      max={formData.type === 'percentage' ? '100' : undefined}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gs-gray-700 mb-1">Expires On (optional)</label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    className="input-field"
                  />
                  <p className="text-xs text-gs-gray-500 mt-1">Leave empty for no expiration</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gs-gray-700 mb-1">Restrict to Athlete (optional)</label>
                  <select
                    value={formData.athlete_id}
                    onChange={(e) => setFormData({ ...formData, athlete_id: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Anyone can use</option>
                    {athletes.map((athlete) => (
                      <option key={athlete.id} value={athlete.id}>
                        {athlete.full_name} ({athlete.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-gs-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gs-gray-600">
                    <strong>Note:</strong> All discount codes have unlimited uses.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    {editingDiscount ? 'Save Changes' : 'Create Code'}
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
