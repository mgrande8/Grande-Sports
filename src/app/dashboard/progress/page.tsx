'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { PageLoader } from '@/components/LoadingSpinner'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, Activity, TrendingUp, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface TechnicalTest {
  id: string
  test_date: string
  drill_180: number | null
  drill_open_90: number | null
  dribble_20_yard: number | null
  dribble_t: number | null
  juggling_both: number | null
  notes: string | null
}

// Simple Line Chart Component
function LineChart({
  data,
  label,
  color = '#067A3A',
  lowerIsBetter = false,
  unit = ''
}: {
  data: { date: string; value: number | null }[]
  label: string
  color?: string
  lowerIsBetter?: boolean
  unit?: string
}) {
  const validData = data.filter(d => d.value !== null) as { date: string; value: number }[]

  if (validData.length === 0) {
    return (
      <div className="bg-white rounded-lg p-4 border border-gs-gray-200">
        <h3 className="font-semibold mb-4">{label}</h3>
        <div className="h-48 flex items-center justify-center text-gs-gray-400">
          No data yet
        </div>
      </div>
    )
  }

  const values = validData.map(d => d.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const range = maxValue - minValue || 1
  const padding = range * 0.1

  const chartMin = minValue - padding
  const chartMax = maxValue + padding
  const chartRange = chartMax - chartMin

  const width = 100
  const height = 100
  const xStep = validData.length > 1 ? width / (validData.length - 1) : width / 2

  const points = validData.map((d, i) => {
    const x = validData.length > 1 ? i * xStep : width / 2
    const y = height - ((d.value - chartMin) / chartRange) * height
    return `${x},${y}`
  }).join(' ')

  const latestValue = validData[validData.length - 1]?.value
  const previousValue = validData[validData.length - 2]?.value

  let trend: 'up' | 'down' | 'same' | null = null
  if (latestValue !== undefined && previousValue !== undefined) {
    if (latestValue === previousValue) trend = 'same'
    else if (lowerIsBetter) trend = latestValue < previousValue ? 'up' : 'down'
    else trend = latestValue > previousValue ? 'up' : 'down'
  }

  return (
    <div className="bg-white rounded-lg p-4 border border-gs-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{label}</h3>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-gray-400'}`}>
            {trend === 'up' && <TrendingUp size={16} />}
            {trend === 'down' && <TrendingDown size={16} />}
            {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
          </div>
        )}
      </div>

      <div className="flex items-end gap-4">
        <div className="text-3xl font-bold" style={{ color }}>
          {latestValue}{unit}
        </div>
        <div className="text-sm text-gs-gray-500 mb-1">
          Latest score
        </div>
      </div>

      <div className="mt-4 h-48 relative">
        <svg viewBox={`-5 -5 ${width + 10} ${height + 10}`} className="w-full h-full" preserveAspectRatio="none">
          {/* Grid lines */}
          <line x1="0" y1={height} x2={width} y2={height} stroke="#e5e5e5" strokeWidth="0.5" />
          <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="#e5e5e5" strokeWidth="0.5" strokeDasharray="2" />
          <line x1="0" y1="0" x2={width} y2="0" stroke="#e5e5e5" strokeWidth="0.5" strokeDasharray="2" />

          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {validData.map((d, i) => {
            const x = validData.length > 1 ? i * xStep : width / 2
            const y = height - ((d.value - chartMin) / chartRange) * height
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="3"
                fill={color}
              />
            )
          })}
        </svg>

        {/* X-axis labels */}
        <div className="flex justify-between mt-2 text-xs text-gs-gray-500">
          {validData.length > 0 && (
            <>
              <span>{format(new Date(validData[0].date), 'MMM yy')}</span>
              {validData.length > 1 && (
                <span>{format(new Date(validData[validData.length - 1].date), 'MMM yy')}</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Value labels */}
      <div className="flex justify-between text-xs text-gs-gray-400 mt-1">
        <span>Low: {minValue}{unit}</span>
        <span>High: {maxValue}{unit}</span>
      </div>
    </div>
  )
}

export default function ProgressPage() {
  const [tests, setTests] = useState<TechnicalTest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'passing' | 'dribbling' | 'juggling'>('overview')
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

    // Use API to bypass RLS
    try {
      const response = await fetch('/api/my-tests')
      const data = await response.json()

      if (data.tests) {
        setTests(data.tests)
      }
    } catch (error) {
      console.error('Failed to fetch tests:', error)
    }
    setLoading(false)
  }

  // Prepare chart data
  const getChartData = (field: keyof TechnicalTest) => {
    return tests.map(t => ({
      date: t.test_date,
      value: t[field] as number | null
    }))
  }

  const latestTest = tests[tests.length - 1]

  if (loading) {
    return <PageLoader />
  }

  return (
    <div className="min-h-screen flex flex-col bg-gs-gray-100">
      <Header />

      <main className="flex-1 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <Link href="/dashboard" className="inline-flex items-center text-gs-gray-600 hover:text-gs-black mb-6">
            <ArrowLeft size={16} className="mr-1" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gs-green rounded-full flex items-center justify-center">
              <Activity className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">My Progress</h1>
              <p className="text-gs-gray-600">Track your technical testing results over time</p>
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
              {/* Tabs */}
              <div className="flex gap-2 mb-6 overflow-x-auto">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'passing', label: 'Technical Passing' },
                  { id: 'dribbling', label: 'Dribbling' },
                  { id: 'juggling', label: 'Ball Control' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'bg-gs-green text-white'
                        : 'bg-white text-gs-gray-600 hover:bg-gs-gray-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="card">
                    <h2 className="text-xl font-bold mb-4">Latest Results</h2>
                    <p className="text-sm text-gs-gray-500 mb-4">
                      Test Date: {latestTest ? formatDate(latestTest.test_date) : 'N/A'}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="bg-gs-gray-100 p-4 rounded-lg text-center">
                        <p className="text-sm text-gs-gray-600 mb-1">Open 90</p>
                        <p className="text-2xl font-bold text-gs-green">{latestTest?.drill_open_90 ?? '-'}</p>
                      </div>
                      <div className="bg-gs-gray-100 p-4 rounded-lg text-center">
                        <p className="text-sm text-gs-gray-600 mb-1">180 Drill</p>
                        <p className="text-2xl font-bold text-gs-green">{latestTest?.drill_180 ?? '-'}</p>
                      </div>
                      <div className="bg-gs-gray-100 p-4 rounded-lg text-center">
                        <p className="text-sm text-gs-gray-600 mb-1">20 Yard Dribble</p>
                        <p className="text-2xl font-bold text-blue-600">{latestTest?.dribble_20_yard ?? '-'}s</p>
                      </div>
                      <div className="bg-gs-gray-100 p-4 rounded-lg text-center">
                        <p className="text-sm text-gs-gray-600 mb-1">T Dribble</p>
                        <p className="text-2xl font-bold text-blue-600">{latestTest?.dribble_t ?? '-'}s</p>
                      </div>
                      <div className="bg-gs-gray-100 p-4 rounded-lg text-center">
                        <p className="text-sm text-gs-gray-600 mb-1">Juggles (60s)</p>
                        <p className="text-2xl font-bold text-purple-600">{latestTest?.juggling_both ?? '-'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <LineChart
                      data={getChartData('drill_open_90')}
                      label="Open 90 Drill"
                      color="#067A3A"
                    />
                    <LineChart
                      data={getChartData('drill_180')}
                      label="180 Drill"
                      color="#067A3A"
                    />
                    <LineChart
                      data={getChartData('dribble_20_yard')}
                      label="20 Yard Dribble"
                      color="#2563eb"
                      lowerIsBetter={true}
                      unit="s"
                    />
                    <LineChart
                      data={getChartData('dribble_t')}
                      label="T Dribble"
                      color="#2563eb"
                      lowerIsBetter={true}
                      unit="s"
                    />
                  </div>

                  <LineChart
                    data={getChartData('juggling_both')}
                    label="Juggles in 60 Seconds"
                    color="#9333ea"
                  />
                </div>
              )}

              {/* Passing Tab */}
              {activeTab === 'passing' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <LineChart
                    data={getChartData('drill_open_90')}
                    label="Open 90 Drill (Score)"
                    color="#067A3A"
                  />
                  <LineChart
                    data={getChartData('drill_180')}
                    label="180 Drill (Score)"
                    color="#067A3A"
                  />
                </div>
              )}

              {/* Dribbling Tab */}
              {activeTab === 'dribbling' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <LineChart
                    data={getChartData('dribble_20_yard')}
                    label="20 Yard Dribble (Time)"
                    color="#2563eb"
                    lowerIsBetter={true}
                    unit="s"
                  />
                  <LineChart
                    data={getChartData('dribble_t')}
                    label="T Dribble (Time)"
                    color="#2563eb"
                    lowerIsBetter={true}
                    unit="s"
                  />
                </div>
              )}

              {/* Juggling Tab */}
              {activeTab === 'juggling' && (
                <div className="space-y-6">
                  <LineChart
                    data={getChartData('juggling_both')}
                    label="Juggles in 60 Seconds (Count)"
                    color="#9333ea"
                  />
                </div>
              )}

              {/* Test History */}
              <div className="card mt-6">
                <h2 className="text-xl font-bold mb-4">Test History</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gs-gray-200">
                        <th className="text-left py-3 px-2 font-semibold">Date</th>
                        <th className="text-center py-3 px-2 font-semibold">Open 90</th>
                        <th className="text-center py-3 px-2 font-semibold">180</th>
                        <th className="text-center py-3 px-2 font-semibold">20yd</th>
                        <th className="text-center py-3 px-2 font-semibold">T Dribble</th>
                        <th className="text-center py-3 px-2 font-semibold">Juggles</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...tests].reverse().map((test, index) => (
                        <tr key={test.id} className={index === 0 ? 'bg-green-50' : ''}>
                          <td className="py-3 px-2">
                            {format(new Date(test.test_date), 'MMM d, yyyy')}
                            {index === 0 && <span className="ml-2 text-xs text-gs-green font-medium">Latest</span>}
                          </td>
                          <td className="text-center py-3 px-2">{test.drill_open_90 ?? '-'}</td>
                          <td className="text-center py-3 px-2">{test.drill_180 ?? '-'}</td>
                          <td className="text-center py-3 px-2">{test.dribble_20_yard ? `${test.dribble_20_yard}s` : '-'}</td>
                          <td className="text-center py-3 px-2">{test.dribble_t ? `${test.dribble_t}s` : '-'}</td>
                          <td className="text-center py-3 px-2">{test.juggling_both ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
