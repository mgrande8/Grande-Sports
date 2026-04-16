'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LoadingSpinner from '@/components/LoadingSpinner'
import { CheckCircle, Video, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Subscription {
  id: string
  credits_total: number
  credits_used: number
  credits_remaining: number
  status: string
  current_period_end: string
}

export default function MatchAnalysisSubmitPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [success, setSuccess] = useState(false)
  const [creditsAfterSubmit, setCreditsAfterSubmit] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    player_name: '',
    jersey_number: '',
    jersey_color: '',
    position: '',
    additional_info: '',
    video_url: '',
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
    await fetchSubscription()
    setLoading(false)
  }

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/match-analysis/subscription/status')
      const data = await response.json()

      if (data.hasSubscription) {
        setSubscription(data.subscription)
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/match-analysis/subscription/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.error) {
        alert(data.error)
        setSubmitting(false)
        return
      }

      setCreditsAfterSubmit(data.creditsRemaining)
      setSuccess(true)
    } catch (error) {
      alert('Failed to submit analysis')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gs-gray-100">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </main>
        <Footer />
      </div>
    )
  }

  // No subscription - redirect to subscribe page
  if (!subscription) {
    return (
      <div className="min-h-screen flex flex-col bg-gs-gray-100">
        <Header />
        <main className="flex-1 py-12">
          <div className="max-w-xl mx-auto px-4">
            <div className="card text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32} className="text-yellow-600" />
              </div>

              <h1 className="text-2xl font-bold mb-2">No Active Subscription</h1>
              <p className="text-gs-gray-600 mb-6">
                You need an active subscription to submit match analyses using credits.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/match-analysis/subscribe" className="btn-green">
                  Subscribe Monthly
                </Link>
                <Link href="/match-analysis" className="btn-secondary">
                  Pay Per Analysis
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // No credits remaining
  if (subscription.credits_remaining <= 0) {
    return (
      <div className="min-h-screen flex flex-col bg-gs-gray-100">
        <Header />
        <main className="flex-1 py-12">
          <div className="max-w-xl mx-auto px-4">
            <div className="card text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32} className="text-yellow-600" />
              </div>

              <h1 className="text-2xl font-bold mb-2">No Credits Remaining</h1>
              <p className="text-gs-gray-600 mb-4">
                You've used all {subscription.credits_total} analyses for this billing period.
              </p>
              <p className="text-gs-gray-500 text-sm mb-6">
                Your credits will reset on {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>

              <Link href="/match-analysis" className="btn-secondary">
                Purchase Single Analysis
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-gs-gray-100">
        <Header />
        <main className="flex-1 py-12">
          <div className="max-w-xl mx-auto px-4">
            <div className="card text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={48} className="text-gs-green" />
              </div>

              <h1 className="text-2xl font-bold mb-2">Analysis Submitted!</h1>
              <p className="text-gs-gray-600 mb-2">
                We've received your match footage and will begin the analysis shortly.
              </p>
              <p className="text-gs-gray-500 text-sm mb-6">
                You have {creditsAfterSubmit} {creditsAfterSubmit === 1 ? 'analysis' : 'analyses'} remaining this month.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {creditsAfterSubmit !== null && creditsAfterSubmit > 0 && (
                  <button
                    onClick={() => {
                      setSuccess(false)
                      setFormData({
                        player_name: '',
                        jersey_number: '',
                        jersey_color: '',
                        position: '',
                        additional_info: '',
                        video_url: '',
                      })
                      fetchSubscription()
                    }}
                    className="btn-green"
                  >
                    Submit Another
                  </button>
                )}
                <Link href="/dashboard" className="btn-secondary">
                  Go to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Show form
  return (
    <div className="min-h-screen flex flex-col bg-gs-gray-100">
      <Header />

      <main className="flex-1 py-12">
        <div className="max-w-2xl mx-auto px-4">
          {/* Credits banner */}
          <div className="bg-gs-green/10 border border-gs-green/20 rounded-lg p-4 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Video size={20} className="text-gs-green" />
              <span className="font-medium">
                {subscription.credits_remaining} of {subscription.credits_total} analyses remaining
              </span>
            </div>
            <span className="text-sm text-gs-gray-600">
              Resets {new Date(subscription.current_period_end).toLocaleDateString()}
            </span>
          </div>

          <div className="card">
            <h1 className="text-2xl font-bold mb-2">Submit Match Analysis</h1>
            <p className="text-gs-gray-600 mb-8">
              Enter your match details and we'll provide a comprehensive analysis.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Player Name */}
              <div>
                <label htmlFor="player_name" className="block text-sm font-medium text-gs-gray-700 mb-1">
                  Player Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="player_name"
                  name="player_name"
                  value={formData.player_name}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="Enter player's full name"
                />
              </div>

              {/* Jersey Number & Color */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="jersey_number" className="block text-sm font-medium text-gs-gray-700 mb-1">
                    Jersey Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="jersey_number"
                    name="jersey_number"
                    value={formData.jersey_number}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="#"
                  />
                </div>
                <div>
                  <label htmlFor="jersey_color" className="block text-sm font-medium text-gs-gray-700 mb-1">
                    Jersey Color
                  </label>
                  <input
                    type="text"
                    id="jersey_color"
                    name="jersey_color"
                    value={formData.jersey_color}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., Blue, Red/White"
                  />
                </div>
              </div>

              {/* Position */}
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gs-gray-700 mb-1">
                  Player Position During Match <span className="text-red-500">*</span>
                </label>
                <select
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="">Select position...</option>
                  <option value="Goalkeeper">Goalkeeper</option>
                  <option value="Center Back">Center Back</option>
                  <option value="Full Back">Full Back</option>
                  <option value="Wing Back">Wing Back</option>
                  <option value="Defensive Midfielder">Defensive Midfielder</option>
                  <option value="Central Midfielder">Central Midfielder</option>
                  <option value="Attacking Midfielder">Attacking Midfielder</option>
                  <option value="Winger">Winger</option>
                  <option value="Striker">Striker</option>
                  <option value="Multiple Positions">Multiple Positions</option>
                </select>
              </div>

              {/* Video URL */}
              <div>
                <label htmlFor="video_url" className="block text-sm font-medium text-gs-gray-700 mb-1">
                  Match Video URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  id="video_url"
                  name="video_url"
                  value={formData.video_url}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="https://drive.google.com/... or YouTube/Vimeo link"
                />
                <p className="mt-1 text-sm text-gs-gray-500">
                  Google Drive, YouTube, Vimeo, or Dropbox links accepted
                </p>
              </div>

              {/* Additional Info */}
              <div>
                <label htmlFor="additional_info" className="block text-sm font-medium text-gs-gray-700 mb-1">
                  Additional Information
                </label>
                <textarea
                  id="additional_info"
                  name="additional_info"
                  value={formData.additional_info}
                  onChange={handleChange}
                  rows={4}
                  className="input-field"
                  placeholder="Any specific areas you'd like us to focus on? Context about the match? (Optional)"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="btn-green w-full flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Analysis
                    <Video size={18} />
                  </>
                )}
              </button>

              <p className="text-xs text-gs-gray-500 text-center">
                This will use 1 of your {subscription.credits_remaining} remaining credits.
              </p>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
