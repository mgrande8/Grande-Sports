'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { PageLoader } from '@/components/LoadingSpinner'
import { formatDate } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, ArrowLeft, Activity } from 'lucide-react'
import Link from 'next/link'

interface TechnicalTest {
  id: string
  test_date: string
  drill_180: number | null
  drill_open_90: number | null
  drill_v: number | null
  dribble_20_yard: number | null
  dribble_v: number | null
  dribble_t: number | null
  juggling_both: number | null
  juggling_left: number | null
  juggling_right: number | null
  straight_line_both: number | null
  straight_line_left: number | null
  straight_line_right: number | null
  notes: string | null
}

export default function ProgressPage() {
  const [tests, setTests] = useState<TechnicalTest[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuthAndFetch()
  }, [])

  const checkAuthAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data } = await supabase
      .from('technical_tests')
      .select('*')
      .eq('user_id', user.id)
      .order('test_date', { ascending: false })

    if (data) {
      setTests(data)
    }
    setLoading(false)
  }

  const getTrend = (current: number | null, previous: number | null, lowerIsBetter: boolean = false) => {
    if (current === null || previous === null) return null
    if (current === previous) return 'same'
    if (lowerIsBetter) {
      return current < previous ? 'up' : 'down'
    }
    return current > previous ? 'up' : 'down'
  }

  const TrendIcon = ({ trend }: { trend: string | null }) => {
    if (trend === 'up') return <TrendingUp className="text-gs-green" size={16} />
    if (trend === 'down') return <TrendingDown className="text-red-500" size={16} />
    if (trend === 'same') return <Minus className="text-gs-gray-400" size={16} />
    return null
  }

  const latestTest = tests[0]
  const previousTest = tests[1]

  if (loading) {
    return <PageLoader />
  }

  return (
    <div className="min-h-screen flex flex-col bg-gs-gray-100">
      <Header />

      <main className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/dashboard" className="inline-flex items-center text-gs-gray-600 hover:text-gs-black mb-6">
            <ArrowLeft size={16} className="mr-1" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gs-green rounded-full flex items-center justify-center">
              <Activity className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Technical Testing</h1>
              <p className="text-gs-gray-600">Track your progress over time</p>
            </div>
          </div>

          {tests.length === 0 ? (
            <div className="card text-center py-12">
              <Activity className="mx-auto text-gs-gray-400 mb-4" size={48} />
              <h2 className="text-xl font-bold mb-2">No Tests Yet</h2>
              <p className="text-gs-gray-600">
                Your technical testing results will appear here after your first assessment.
              </p>
            </div>
          ) : (
            <>
              {/* Latest Results */}
              <div className="card mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Latest Results</h2>
                  <span className="text-sm text-gs-gray-600">{formatDate(latestTest.test_date)}</span>
                </div>

                {/* Technical Passing */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gs-gray-700 mb-3 uppercase text-sm tracking-wide">
                    Technical Passing
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gs-gray-100 p-4 rounded-lg">
                      <p className="text-sm text-gs-gray-600 mb-1">180 Drill</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">{latestTest.drill_180 ?? '-'}</p>
                        <TrendIcon trend={getTrend(latestTest.drill_180, previousTest?.drill_180)} />
                      </div>
                    </div>
                    <div className="bg-gs-gray-100 p-4 rounded-lg">
                      <p className="text-sm text-gs-gray-600 mb-1">Open 90 Drill</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">{latestTest.drill_open_90 ?? '-'}</p>
                        <TrendIcon trend={getTrend(latestTest.drill_open_90, previousTest?.drill_open_90)} />
                      </div>
                    </div>
                    <div className="bg-gs-gray-100 p-4 rounded-lg">
                      <p className="text-sm text-gs-gray-600 mb-1">V Drill</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">{latestTest.drill_v ?? '-'}</p>
                        <TrendIcon trend={getTrend(latestTest.drill_v, previousTest?.drill_v)} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dribbling */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gs-gray-700 mb-3 uppercase text-sm tracking-wide">
                    Dribbling (Timed - seconds)
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gs-gray-100 p-4 rounded-lg">
                      <p className="text-sm text-gs-gray-600 mb-1">20 Yard</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">{latestTest.dribble_20_yard ?? '-'}<span className="text-sm">s</span></p>
                        <TrendIcon trend={getTrend(latestTest.dribble_20_yard, previousTest?.dribble_20_yard, true)} />
                      </div>
                    </div>
                    <div className="bg-gs-gray-100 p-4 rounded-lg">
                      <p className="text-sm text-gs-gray-600 mb-1">V Dribble</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">{latestTest.dribble_v ?? '-'}<span className="text-sm">s</span></p>
                        <TrendIcon trend={getTrend(latestTest.dribble_v, previousTest?.dribble_v, true)} />
                      </div>
                    </div>
                    <div className="bg-gs-gray-100 p-4 rounded-lg">
                      <p className="text-sm text-gs-gray-600 mb-1">T Dribble</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">{latestTest.dribble_t ?? '-'}<span className="text-sm">s</span></p>
                        <TrendIcon trend={getTrend(latestTest.dribble_t, previousTest?.dribble_t, true)} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ball Control */}
                <div>
                  <h3 className="font-semibold text-gs-gray-700 mb-3 uppercase text-sm tracking-wide">
                    Ball Control
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-gs-gray-100 p-4 rounded-lg">
                      <p className="text-sm text-gs-gray-600 mb-1">Juggling (Both)</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">{latestTest.juggling_both ?? '-'}</p>
                        <TrendIcon trend={getTrend(latestTest.juggling_both, previousTest?.juggling_both)} />
                      </div>
                    </div>
                    <div className="bg-gs-gray-100 p-4 rounded-lg">
                      <p className="text-sm text-gs-gray-600 mb-1">Juggling (Left)</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">{latestTest.juggling_left ?? '-'}</p>
                        <TrendIcon trend={getTrend(latestTest.juggling_left, previousTest?.juggling_left)} />
                      </div>
                    </div>
                    <div className="bg-gs-gray-100 p-4 rounded-lg">
                      <p className="text-sm text-gs-gray-600 mb-1">Juggling (Right)</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">{latestTest.juggling_right ?? '-'}</p>
                        <TrendIcon trend={getTrend(latestTest.juggling_right, previousTest?.juggling_right)} />
                      </div>
                    </div>
                    <div className="bg-gs-gray-100 p-4 rounded-lg">
                      <p className="text-sm text-gs-gray-600 mb-1">Straight Line (Both)</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">{latestTest.straight_line_both ?? '-'}<span className="text-sm">s</span></p>
                        <TrendIcon trend={getTrend(latestTest.straight_line_both, previousTest?.straight_line_both, true)} />
                      </div>
                    </div>
                    <div className="bg-gs-gray-100 p-4 rounded-lg">
                      <p className="text-sm text-gs-gray-600 mb-1">Straight Line (Left)</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">{latestTest.straight_line_left ?? '-'}<span className="text-sm">s</span></p>
                        <TrendIcon trend={getTrend(latestTest.straight_line_left, previousTest?.straight_line_left, true)} />
                      </div>
                    </div>
                    <div className="bg-gs-gray-100 p-4 rounded-lg">
                      <p className="text-sm text-gs-gray-600 mb-1">Straight Line (Right)</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">{latestTest.straight_line_right ?? '-'}<span className="text-sm">s</span></p>
                        <TrendIcon trend={getTrend(latestTest.straight_line_right, previousTest?.straight_line_right, true)} />
                      </div>
                    </div>
                  </div>
                </div>

                {latestTest.notes && (
                  <div className="mt-6 pt-6 border-t border-gs-gray-200">
                    <h3 className="font-semibold text-gs-gray-700 mb-2">Coach Notes</h3>
                    <p className="text-gs-gray-600">{latestTest.notes}</p>
                  </div>
                )}
              </div>

              {/* Test History */}
              {tests.length > 1 && (
                <div className="card">
                  <h2 className="text-xl font-bold mb-4">Test History</h2>
                  <div className="space-y-3">
                    {tests.map((test, index) => (
                      <div 
                        key={test.id} 
                        className={`p-4 rounded-lg ${index === 0 ? 'bg-gs-green bg-opacity-10 border border-gs-green' : 'bg-gs-gray-100'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{formatDate(test.test_date)}</p>
                            {index === 0 && <span className="text-xs text-gs-green font-medium">Latest</span>}
                          </div>
                          <div className="text-right text-sm text-gs-gray-600">
                            <p>Juggling: {test.juggling_both ?? '-'}</p>
                            <p>20yd: {test.dribble_20_yard ?? '-'}s</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
