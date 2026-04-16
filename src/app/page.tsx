import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Calendar, CreditCard, BarChart3, Users, CheckCircle, ArrowRight, MapPin, Package, Video } from 'lucide-react'

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
              Private, semi-private, and group soccer training sessions in Davie, FL. 
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


      {/* Package Pricing */}
      <section className="py-16 bg-gs-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">
            <Package className="inline mr-2 mb-1" size={28} />
            Training Packages
          </h2>
          <p className="text-center text-gs-gray-600 mb-10">Save more when you commit to your development</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card text-center border-gs-green border-2 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gs-green text-white text-xs font-bold px-3 py-1 rounded-full">Best Value</span>
              <h3 className="font-bold text-lg mt-2">12-Session Pack</h3>
              <p className="text-3xl font-bold text-gs-black mt-3">$960</p>
              <p className="text-xs text-gs-gray-500">$80/session</p>
              <span className="inline-block bg-gs-green/10 text-gs-green text-xs font-semibold px-2 py-0.5 rounded mt-2">Save $180</span>
              <p className="text-sm text-gs-gray-600 mt-3">Twelve private training sessions. Must be used within 45 days of purchase.</p>
              <a href="mailto:td.grandesportstraining@gmail.com?subject=Package Inquiry - 12-Session Pack" className="btn-green mt-4 inline-block text-sm">Contact Us</a>
            </div>
            <div className="card text-center">
              <h3 className="font-bold text-lg">8-Session Pack</h3>
              <p className="text-3xl font-bold text-gs-black mt-3">$680</p>
              <p className="text-xs text-gs-gray-500">$85/session</p>
              <span className="inline-block bg-gs-green/10 text-gs-green text-xs font-semibold px-2 py-0.5 rounded mt-2">Save $80</span>
              <p className="text-sm text-gs-gray-600 mt-3">Eight private training sessions. Must be used within 45 days of purchase.</p>
              <a href="mailto:td.grandesportstraining@gmail.com?subject=Package Inquiry - 8-Session Pack" className="btn-secondary mt-4 inline-block text-sm">Contact Us</a>
            </div>
            <div className="card text-center">
              <h3 className="font-bold text-lg">4-Session Pack</h3>
              <p className="text-3xl font-bold text-gs-black mt-3">$360</p>
              <p className="text-xs text-gs-gray-500">$90/session</p>
              <span className="inline-block bg-gs-green/10 text-gs-green text-xs font-semibold px-2 py-0.5 rounded mt-2">Save $20</span>
              <p className="text-sm text-gs-gray-600 mt-3">Four private training sessions. Must be used within 45 days of purchase.</p>
              <a href="mailto:td.grandesportstraining@gmail.com?subject=Package Inquiry - 4-Session Pack" className="btn-secondary mt-4 inline-block text-sm">Contact Us</a>
            </div>
            <div className="card text-center">
              <h3 className="font-bold text-lg">Single Session</h3>
              <p className="text-3xl font-bold text-gs-black mt-3">$95</p>
              <p className="text-xs text-gs-gray-500">per session</p>
              <p className="text-sm text-gs-gray-600 mt-5">One private training session. Book online instantly.</p>
              <Link href="/book" className="btn-green mt-4 inline-block text-sm">Book Now</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Match Analysis */}
      <section className="py-20 bg-gs-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-gs-green/20 text-gs-green px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Video size={18} />
                Professional Analysis
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Match Analysis Service
              </h2>
              <p className="text-gs-gray-400 text-lg mb-6">
                Get a detailed breakdown of your game footage by our professional coaches.
                Receive personalized feedback and a 1-on-1 video review call.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-gs-green" />
                  <span>Full match video breakdown</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-gs-green" />
                  <span>1-on-1 video review call</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-gs-green" />
                  <span>Google Drive folder with all materials</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-gs-green" />
                  <span>3-5 business day turnaround</span>
                </li>
              </ul>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/match-analysis" className="btn-green text-center inline-flex items-center justify-center gap-2">
                  Get Match Analysis - $140
                  <ArrowRight size={18} />
                </Link>
                <Link href="/match-analysis/subscribe" className="btn-secondary text-center">
                  Monthly Plan - $500/mo
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gs-gray-800 rounded-xl p-8 border border-gs-gray-700">
                <div className="text-center">
                  <p className="text-5xl font-bold text-gs-green mb-2">$140</p>
                  <p className="text-gs-gray-400 mb-6">per analysis</p>
                  <div className="border-t border-gs-gray-700 pt-6">
                    <p className="text-sm text-gs-gray-400 mb-2">Or save with a subscription</p>
                    <p className="text-2xl font-bold">$500<span className="text-base font-normal text-gs-gray-400">/month</span></p>
                    <p className="text-gs-green text-sm">4 analyses included</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="py-20 bg-gs-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">Training Location</h2>
          <p className="text-center text-gs-gray-600 mb-8">
            <MapPin className="inline mr-1" size={18} />
            Bamford Park, Davie, FL 33314
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-lg overflow-hidden shadow-md">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3584.5!2d-80.2372!3d26.0726!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88d9a8c1e7c7a8a1%3A0x1234567890abcdef!2sBamford%20Park!5e0!3m2!1sen!2sus!4v1700000000000"
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Bamford Park Location"
              />
            </div>
            <div className="flex flex-col justify-center">
              <h3 className="text-xl font-bold mb-4">Bamford Park</h3>
              <div className="space-y-3 text-gs-gray-600">
                <p><strong>Address:</strong> Bamford Park, Davie, FL 33314</p>
                <p><strong>Parking:</strong> Free parking available on-site near the soccer fields.</p>
              </div>
              <a href="https://www.google.com/maps/search/Bamford+Park+Davie+FL+33314" target="_blank" rel="noopener noreferrer" className="btn-green inline-flex items-center gap-2 mt-6 w-fit">
                Get Directions
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Terms & Policies */}
      <section className="py-16 bg-gs-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-8">Terms & Policies</h2>
          <div className="space-y-4 text-sm text-gs-gray-600">
            <div className="flex items-start gap-3">
              <CheckCircle size={18} className="text-gs-green mt-0.5 shrink-0" />
              <p><strong>No Refunds.</strong> All session purchases are final. No refunds will be issued under any circumstances.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={18} className="text-gs-green mt-0.5 shrink-0" />
              <p><strong>Reschedules Only.</strong> If you cannot make a session, you may reschedule by contacting us at least 24 hours in advance.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={18} className="text-gs-green mt-0.5 shrink-0" />
              <p><strong>45-Day Expiration.</strong> All session packs (4, 8, and 12 sessions) must be used within 45 days of purchase. Unused sessions will be forfeited.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={18} className="text-gs-green mt-0.5 shrink-0" />
              <p><strong>Non-Transferable.</strong> Sessions are for the registered athlete only and cannot be transferred to another person.</p>
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
