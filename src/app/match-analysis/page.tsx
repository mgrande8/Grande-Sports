'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { MATCH_ANALYSIS_PRICING } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { Video, User, Mail, Phone, Shirt, MapPin, FileText, ArrowRight, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface FormData {
  email_address: string
  contact_email: string
  player_name: string
  jersey_number: string
  jersey_color: string
  position: string
  additional_info: string
  video_url: string
}

const initialFormData: FormData = {
  email_address: '',
  contact_email: '',
  player_name: '',
  jersey_number: '',
  jersey_color: '',
  position: '',
  additional_info: '',
  video_url: '',
}

export default function MatchAnalysisPage() {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/match-analysis/single/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Something went wrong')
        setLoading(false)
        return
      }

      // Redirect to Stripe checkout
      window.location.href = data.url
    } catch (err) {
      setError('Failed to process your request. Please try again.')
      setLoading(false)
    }
  }

  const isFormValid = () => {
    return (
      formData.email_address &&
      formData.contact_email &&
      formData.player_name &&
      formData.jersey_number &&
      formData.position &&
      formData.video_url
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gs-gray-100">
      <Header />

      <main className="flex-1 py-8">
        <div className="max-w-3xl mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Match Analysis</h1>
            <p className="text-gs-gray-600 text-lg max-w-2xl mx-auto">
              Get professional analysis of your match performance. Submit your video and receive detailed feedback from our coaches.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Single Analysis Card */}
            <div className="card border-2 border-gs-green relative">
              <div className="absolute -top-3 left-4 bg-gs-green text-white text-xs font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </div>
              <h3 className="text-xl font-bold mb-2">Single Match Analysis</h3>
              <div className="text-3xl font-bold text-gs-green mb-4">
                {formatCurrency(MATCH_ANALYSIS_PRICING.single)}
              </div>
              <ul className="space-y-2 text-sm text-gs-gray-600 mb-4">
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-gs-green" />
                  Full match breakdown
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-gs-green" />
                  Detailed performance notes
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-gs-green" />
                  1-on-1 video call review
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-gs-green" />
                  Delivered via Google Drive
                </li>
              </ul>
              <p className="text-xs text-gs-gray-500">No account required</p>
            </div>

            {/* Subscription Card */}
            <div className="card border-2 border-gs-gray-200">
              <h3 className="text-xl font-bold mb-2">Monthly Subscription</h3>
              <div className="text-3xl font-bold mb-4">
                {formatCurrency(MATCH_ANALYSIS_PRICING.subscription_monthly)}
                <span className="text-base font-normal text-gs-gray-500">/month</span>
              </div>
              <ul className="space-y-2 text-sm text-gs-gray-600 mb-4">
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-gs-green" />
                  {MATCH_ANALYSIS_PRICING.subscription_credits} analyses per month
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-gs-green" />
                  Everything in single analysis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-gs-green" />
                  Priority turnaround
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-gs-green" />
                  Track progress over time
                </li>
              </ul>
              <Link
                href="/match-analysis/subscribe"
                className="btn-secondary w-full text-center block"
              >
                Subscribe Now
              </Link>
            </div>
          </div>

          {/* Intake Form */}
          <div className="card">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Video size={24} />
              Submit Your Match for Analysis
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gs-gray-700 border-b pb-2">Contact Information</h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                      <Mail size={14} className="inline mr-1" />
                      Your Email *
                    </label>
                    <input
                      type="email"
                      name="email_address"
                      value={formData.email_address}
                      onChange={handleChange}
                      required
                      placeholder="you@example.com"
                      className="input-field w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                      <Mail size={14} className="inline mr-1" />
                      Email for Delivery *
                    </label>
                    <input
                      type="email"
                      name="contact_email"
                      value={formData.contact_email}
                      onChange={handleChange}
                      required
                      placeholder="delivery@example.com"
                      className="input-field w-full"
                    />
                    <p className="text-xs text-gs-gray-500 mt-1">
                      We'll send your analysis materials here
                    </p>
                  </div>
                </div>
              </div>

              {/* Player Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gs-gray-700 border-b pb-2">Player Information</h3>

                <div>
                  <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                    <User size={14} className="inline mr-1" />
                    Player Name *
                  </label>
                  <input
                    type="text"
                    name="player_name"
                    value={formData.player_name}
                    onChange={handleChange}
                    required
                    placeholder="John Smith"
                    className="input-field w-full"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                      <Shirt size={14} className="inline mr-1" />
                      Jersey Number *
                    </label>
                    <input
                      type="text"
                      name="jersey_number"
                      value={formData.jersey_number}
                      onChange={handleChange}
                      required
                      placeholder="10"
                      className="input-field w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                      Jersey Color
                    </label>
                    <input
                      type="text"
                      name="jersey_color"
                      value={formData.jersey_color}
                      onChange={handleChange}
                      placeholder="Blue"
                      className="input-field w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                      <MapPin size={14} className="inline mr-1" />
                      Position *
                    </label>
                    <select
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                      required
                      className="input-field w-full"
                    >
                      <option value="">Select position</option>
                      <option value="Goalkeeper">Goalkeeper</option>
                      <option value="Defender">Defender</option>
                      <option value="Centerback">Centerback</option>
                      <option value="Fullback">Fullback</option>
                      <option value="Midfielder">Midfielder</option>
                      <option value="Defensive Mid">Defensive Mid</option>
                      <option value="Attacking Mid">Attacking Mid</option>
                      <option value="Winger">Winger</option>
                      <option value="Forward">Forward</option>
                      <option value="Striker">Striker</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Match Video */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gs-gray-700 border-b pb-2">Match Video</h3>

                <div>
                  <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                    <Video size={14} className="inline mr-1" />
                    Full Match Video Link *
                  </label>
                  <input
                    type="url"
                    name="video_url"
                    value={formData.video_url}
                    onChange={handleChange}
                    required
                    placeholder="https://youtube.com/watch?v=... or Google Drive link"
                    className="input-field w-full"
                  />
                  <p className="text-xs text-gs-gray-500 mt-1">
                    YouTube, Vimeo, or Google Drive links accepted. Make sure the video is accessible.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gs-gray-700 mb-1">
                    <FileText size={14} className="inline mr-1" />
                    Additional Information
                  </label>
                  <textarea
                    name="additional_info"
                    value={formData.additional_info}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Any specific areas you'd like us to focus on? Context about the match?"
                    className="input-field w-full"
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gs-gray-600">Total</span>
                  <span className="text-2xl font-bold">{formatCurrency(MATCH_ANALYSIS_PRICING.single)}</span>
                </div>

                <button
                  type="submit"
                  disabled={loading || !isFormValid()}
                  className="btn-green w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Continue to Payment
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <p className="text-xs text-gs-gray-500 text-center mt-3">
                  Secure payment powered by Stripe. You'll receive your analysis within 48-72 hours.
                </p>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
