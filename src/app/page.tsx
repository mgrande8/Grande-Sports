import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Calendar, CreditCard, BarChart3, Users, CheckCircle, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="bg-gs-black text-gs-white py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Book Your Training Session
            </h1>
            <p className="text-xl text-gs-gray-400 mb-8">
              Private, semi-private, and group soccer training sessions in Miami. 
              Book online, pay securely, and track your progress.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/book" className="btn-green text-center text-lg px-8 py-4">
                Book a Session
                <ArrowRight className="inline ml-2" size={20} />
              </Link>
              <Link href="/auth/register" className="btn-secondary text-center text-lg px-8 py-4">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Session Types */}
      <section className="py-20 bg-gs-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Training Options</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Private */}
            <div className="card text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-purple-600" size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Private Session</h3>
              <p className="text-3xl font-bold text-gs-green mb-4">$95</p>
              <p className="text-gs-gray-600 mb-4">
                One-on-one focused training tailored to your specific needs and goals.
              </p>
              <ul className="text-sm text-gs-gray-600 space-y-2">
                <li className="flex items-center justify-center gap-2">
                  <CheckCircle size={16} className="text-gs-green" />
                  Personalized attention
                </li>
                <li className="flex items-center justify-center gap-2">
                  <CheckCircle size={16} className="text-gs-green" />
                  Custom training plan
                </li>
                <li className="flex items-center justify-center gap-2">
                  <CheckCircle size={16} className="text-gs-green" />
                  Flexible scheduling
                </li>
              </ul>
            </div>

            {/* Semi-Private */}
            <div className="card text-center border-gs-green border-2">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-blue-600" size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Semi-Private Session</h3>
              <p className="text-3xl font-bold text-gs-green mb-4">$70<span className="text-sm font-normal">/player</span></p>
              <p className="text-gs-gray-600 mb-4">
                Train with a partner. Great for friends or players at similar levels.
              </p>
              <ul className="text-sm text-gs-gray-600 space-y-2">
                <li className="flex items-center justify-center gap-2">
                  <CheckCircle size={16} className="text-gs-green" />
                  2 players max
                </li>
                <li className="flex items-center justify-center gap-2">
                  <CheckCircle size={16} className="text-gs-green" />
                  Partner drills
                </li>
                <li className="flex items-center justify-center gap-2">
                  <CheckCircle size={16} className="text-gs-green" />
                  Competitive element
                </li>
              </ul>
            </div>

            {/* Group */}
            <div className="card text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-green-600" size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Group Session</h3>
              <p className="text-3xl font-bold text-gs-green mb-4">$40<span className="text-sm font-normal">/player</span></p>
              <p className="text-gs-gray-600 mb-4">
                Train in a group setting with 3-8 players. Build teamwork and compete.
              </p>
              <ul className="text-sm text-gs-gray-600 space-y-2">
                <li className="flex items-center justify-center gap-2">
                  <CheckCircle size={16} className="text-gs-green" />
                  3-8 players
                </li>
                <li className="flex items-center justify-center gap-2">
                  <CheckCircle size={16} className="text-gs-green" />
                  Game situations
                </li>
                <li className="flex items-center justify-center gap-2">
                  <CheckCircle size={16} className="text-gs-green" />
                  Most affordable
                </li>
              </ul>
            </div>
          </div>

        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gs-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gs-green rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">1. Book Online</h3>
              <p className="text-gs-gray-600">
                Browse available sessions and pick the time that works for you. Book up to one month in advance.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gs-green rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">2. Pay Securely</h3>
              <p className="text-gs-gray-600">
                Secure payment via Stripe. Your spot is confirmed instantly once payment is processed.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gs-green rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">3. Track Progress</h3>
              <p className="text-gs-gray-600">
                View your session history and technical testing results in your personal dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gs-green text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Level Up?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join Grande Sports and take your game to the next level.
          </p>
          <Link href="/book" className="bg-white text-gs-green px-8 py-4 font-bold text-lg hover:bg-gs-gray-100 transition-colors inline-block">
            Book Your First Session
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
