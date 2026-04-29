import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen py-16 px-6">
      <div className="max-w-2xl mx-auto">

        <Link href="/" className="text-sm font-mono transition-colors duration-200 hover:text-[#00FF88] mb-10 inline-block" style={{ color: '#888888' }}>
          ← Back
        </Link>

        <p className="font-mono font-bold tracking-widest text-sm uppercase mb-4" style={{ color: '#4A90E2' }}>Zeptio LLC</p>
        <h1 className="text-4xl font-black tracking-tight text-white mb-2">Privacy Policy</h1>
        <p className="text-sm mb-12" style={{ color: '#888888' }}>Last updated: March 2026</p>

        <div className="flex flex-col gap-10 text-base leading-relaxed" style={{ color: '#444444' }}>

          <section>
            <h2 className="text-xl font-black tracking-tight text-white mb-3">What we collect</h2>
            <p>When you sign up for Zeptio, we collect your name and email address. As you play, we store your game scores and progress so we can track your improvement over time. We do not collect payment information during the beta.</p>
          </section>

          <section>
            <h2 className="text-xl font-black tracking-tight text-white mb-3">How we use it</h2>
            <p>We use your information to provide the Zeptio service — logging you in, saving your scores, and personalizing your experience. We also use aggregate, anonymized data to improve the game. Zeptio LLC will never sell your personal information to third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-black tracking-tight text-white mb-3">Data storage</h2>
            <p>Your data is stored securely using Supabase on servers located in the United States. We use industry-standard encryption in transit and at rest. During the beta period, data may be reset or migrated as we improve the platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-black tracking-tight text-white mb-3">Your rights</h2>
            <p>You can request deletion of your account and all associated data at any time by emailing us. You can also request an export of your data. We will respond to all requests within 30 days.</p>
          </section>

          <section>
            <h2 className="text-xl font-black tracking-tight text-white mb-3">Contact</h2>
            <p>
              Questions about your privacy? Email Zeptio LLC at{' '}
              <a href="mailto:contact@zeptio.app" className="font-bold transition-colors duration-200 hover:opacity-80" style={{ color: '#4A90E2' }}>
                contact@zeptio.app
              </a>
            </p>
          </section>

        </div>

        <p className="mt-12 text-xs font-mono" style={{ color: '#BBBBBB' }}>© 2026 Zeptio LLC. All rights reserved.</p>

        <div className="mt-6 pt-8 flex gap-6 text-sm" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', color: '#999999' }}>
          <Link href="/terms" className="hover:text-[#00FF88] transition-colors duration-200">Terms of Service</Link>
          <Link href="/support" className="hover:text-[#00FF88] transition-colors duration-200">Support</Link>
        </div>

      </div>
    </main>
  )
}
