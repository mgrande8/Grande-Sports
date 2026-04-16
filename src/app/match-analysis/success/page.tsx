'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LoadingSpinner from '@/components/LoadingSpinner'
import { CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function MatchAnalysisSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!sessionId) {
      setStatus('error')
      setError('Invalid session')
      return
    }

    confirmPayment()
  }, [sessionId])

  const confirmPayment = async () => {
    try {
      const response = await fetch(`/api/match-analysis/single/confirm?session_id=${sessionId}`)
      const data = await response.json()

      if (!response.ok) {
        setStatus('error')
        setError(data.error || 'Failed to confirm payment')
        return
      }

      setStatus('success')
    } catch (err) {
      setStatus('error')
      setError('Failed to confirm payment')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gs-gray-100">
      <Header />

      <main className="flex-1 py-12">
        <div className="max-w-xl mx-auto px-4">
          {status === 'loading' && (
            <div className="card text-center py-16">
              <LoadingSpinner />
              <p className="text-gs-gray-600 mt-4">Confirming your payment...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="card text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={48} className="text-gs-green" />
              </div>

              <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
              <p className="text-gs-gray-600 mb-8">
                Your match analysis request has been submitted successfully.
              </p>

              <div className="bg-gs-gray-100 rounded-lg p-6 mb-8 text-left">
                <h2 className="font-semibold mb-4">What happens next?</h2>
                <ol className="space-y-3 text-sm text-gs-gray-600">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-gs-green text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span>You'll receive a confirmation email shortly</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-gs-gray-300 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span>Our coaches will analyze your match video (3-5 business days)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-gs-gray-300 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <span>You'll receive an email to book your review call</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-gs-gray-300 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                    <span>After the call, we'll send your analysis folder via Google Drive</span>
                  </li>
                </ol>
              </div>

              <div className="space-y-3">
                <Link
                  href="/"
                  className="btn-green w-full flex items-center justify-center gap-2"
                >
                  Back to Home
                  <ArrowRight size={18} />
                </Link>

                <Link
                  href="/match-analysis"
                  className="btn-secondary w-full block text-center"
                >
                  Submit Another Analysis
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="card text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={48} className="text-red-500" />
              </div>

              <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
              <p className="text-gs-gray-600 mb-8">{error}</p>

              <div className="space-y-3">
                <Link
                  href="/match-analysis"
                  className="btn-green w-full flex items-center justify-center gap-2"
                >
                  Try Again
                  <ArrowRight size={18} />
                </Link>

                <p className="text-sm text-gs-gray-500">
                  If you've been charged, please contact us at{' '}
                  <a href="mailto:td.grandesportstraining@gmail.com" className="text-gs-green">
                    td.grandesportstraining@gmail.com
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
