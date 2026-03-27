import Link from 'next/link'

export default function TermsPage() {
  return (
    <main className="min-h-screen py-16 px-6">
      <div className="max-w-2xl mx-auto">

        <Link href="/" className="text-sm font-mono transition-colors duration-200 hover:text-[#00FF88] mb-10 inline-block" style={{ color: 'rgba(255,255,255,0.4)' }}>
          ← Back
        </Link>

        <p className="font-mono font-bold tracking-widest text-sm uppercase mb-4" style={{ color: '#00FF88' }}>Zeptio</p>
        <h1 className="text-4xl font-black tracking-tight text-white mb-2">Terms of Service</h1>
        <p className="text-sm mb-12" style={{ color: 'rgba(255,255,255,0.4)' }}>Last updated: March 2026</p>

        <div className="flex flex-col gap-10 text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>

          <section>
            <h2 className="text-xl font-black tracking-tight text-white mb-3">What is Zeptio</h2>
            <p>Zeptio is a game that teaches AI prompting through interactive challenges. It is currently in private beta, which means access is limited and the product is still actively being developed. Features may change, and things may break.</p>
          </section>

          <section>
            <h2 className="text-xl font-black tracking-tight text-white mb-3">Acceptable use</h2>
            <p>You agree to use Zeptio only for its intended purpose — learning and practicing AI prompting skills. You may not attempt to reverse-engineer the scoring system, automate submissions, share beta access with others, or use the platform in any way that could harm other users or the service itself.</p>
          </section>

          <section>
            <h2 className="text-xl font-black tracking-tight text-white mb-3">No guarantee during beta</h2>
            <p>Zeptio is provided as-is during the beta period. We make no guarantees of uptime, data persistence, or feature availability. Your scores and progress may be reset as we iterate on the product. We appreciate your patience and feedback as we build.</p>
          </section>

          <section>
            <h2 className="text-xl font-black tracking-tight text-white mb-3">Intellectual property</h2>
            <p>Zeptio — including its design, challenges, scoring engine, and code — is owned by Zeptio. The prompts you write during gameplay are your own. We do not claim ownership of your input, and we do not use your prompts for any purpose other than scoring your response in the moment.</p>
          </section>

          <section>
            <h2 className="text-xl font-black tracking-tight text-white mb-3">Limitation of liability</h2>
            <p>To the fullest extent permitted by law, Zeptio is not liable for any indirect, incidental, or consequential damages arising from your use of the service. Our total liability for any claim is limited to the amount you paid us — which during the beta is zero.</p>
          </section>

          <section>
            <h2 className="text-xl font-black tracking-tight text-white mb-3">Contact</h2>
            <p>
              Questions or concerns? Email us at{' '}
              <a href="mailto:contact@zeptio.app" className="font-bold transition-colors duration-200 hover:opacity-80" style={{ color: '#00FF88' }}>
                contact@zeptio.app
              </a>
            </p>
          </section>

        </div>

        <div className="mt-16 pt-8 flex gap-6 text-sm" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}>
          <Link href="/privacy" className="hover:text-[#00FF88] transition-colors duration-200">Privacy Policy</Link>
          <Link href="/support" className="hover:text-[#00FF88] transition-colors duration-200">Support</Link>
        </div>

      </div>
    </main>
  )
}
