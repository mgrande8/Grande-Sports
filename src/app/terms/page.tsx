'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gs-gray-100">
      <Header />

      <main className="flex-1 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="card">
            <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
            <p className="text-gs-gray-500 text-sm mb-8">Last updated: April 2026</p>

            <div className="prose prose-sm max-w-none space-y-6 text-gs-gray-700">
              <section>
                <h2 className="text-xl font-semibold text-gs-black mb-3">1. Acceptance of Terms</h2>
                <p>
                  By booking a training session or using any services provided by Grande Sports Training, LLC
                  ("Grande Sports," "we," "us," or "our"), you agree to be bound by these Terms of Service.
                  If you do not agree to these terms, please do not use our services.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gs-black mb-3">2. Assumption of Risk & Liability Waiver</h2>
                <p className="font-medium text-gs-black">
                  PLEASE READ THIS SECTION CAREFULLY AS IT AFFECTS YOUR LEGAL RIGHTS.
                </p>
                <p className="mt-2">
                  You acknowledge that participation in soccer training and athletic activities involves inherent
                  risks, including but not limited to: physical injury, sprains, strains, fractures, concussions,
                  heat-related illness, cardiac events, and in rare cases, serious injury or death.
                </p>
                <p className="mt-2">
                  By booking and participating in any training session with Grande Sports, you voluntarily assume
                  all risks associated with such participation. You agree to release, waive, discharge, and hold
                  harmless Grande Sports Training, LLC, its owners, employees, coaches, agents, and affiliates
                  from any and all liability, claims, demands, or causes of action that you may have or acquire
                  against them arising out of or related to any loss, damage, or injury, including death, that
                  may be sustained by you while participating in any training activities.
                </p>
                <p className="mt-2">
                  This release applies to injuries or damages caused by the negligence of Grande Sports or any
                  other person, as well as injuries caused by equipment, facilities, or premises used during training.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gs-black mb-3">3. Medical Acknowledgment</h2>
                <p>
                  You confirm that you (or the participant, if booking for a minor) are physically fit and have
                  no medical condition that would prevent safe participation in athletic training activities.
                  You agree to inform your coach of any injuries, medical conditions, or limitations prior to
                  each session. If booking for a minor, you represent that you are the parent or legal guardian
                  and have the authority to agree to these terms on their behalf.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gs-black mb-3">4. Cancellation Policy</h2>
                <p>
                  Sessions may be cancelled or rescheduled with at least 24 hours notice for a full refund or
                  credit. Cancellations made less than 24 hours before a scheduled session are non-refundable.
                  In case of inclement weather (heavy rain, lightning, or unsafe conditions), sessions will be
                  rescheduled at no additional cost.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gs-black mb-3">5. Payment</h2>
                <p>
                  All payments are processed securely through Stripe. By providing payment information, you
                  authorize us to charge the applicable fees for your booked sessions. Prices are subject to
                  change, but confirmed bookings will be honored at the price paid.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gs-black mb-3">6. Code of Conduct</h2>
                <p>
                  All participants are expected to behave respectfully toward coaches, staff, and other
                  participants. Grande Sports reserves the right to refuse service or terminate a session
                  without refund for any participant who engages in unsafe, disrespectful, or disruptive behavior.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gs-black mb-3">7. Photo & Video Release</h2>
                <p>
                  By participating in training sessions, you grant Grande Sports permission to use photographs
                  or video recordings taken during sessions for promotional purposes, including social media,
                  website, and marketing materials. If you do not wish to be photographed or recorded, please
                  inform your coach before the session.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gs-black mb-3">8. Limitation of Liability</h2>
                <p>
                  To the maximum extent permitted by law, Grande Sports Training, LLC shall not be liable for
                  any indirect, incidental, special, consequential, or punitive damages, regardless of the
                  cause of action. Our total liability to you for any claim arising from our services shall
                  not exceed the amount paid by you for the specific session giving rise to the claim.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gs-black mb-3">9. Governing Law</h2>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the State of
                  Florida, without regard to its conflict of law provisions. Any disputes arising under these
                  terms shall be resolved in the courts of Broward County, Florida.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gs-black mb-3">10. Contact Information</h2>
                <p>
                  If you have any questions about these Terms of Service, please contact us at:
                </p>
                <p className="mt-2">
                  <strong>Grande Sports Training, LLC</strong><br />
                  Email: info@grandesportstraining.com
                </p>
              </section>

              <section className="border-t border-gs-gray-200 pt-6 mt-8">
                <p className="text-sm text-gs-gray-500">
                  By booking a session with Grande Sports, you acknowledge that you have read, understood,
                  and agree to be bound by these Terms of Service, including the assumption of risk and
                  liability waiver provisions.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
