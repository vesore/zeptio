import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import GoogleSignInButton from './_components/GoogleSignInButton'
import BrandAboutSection from '@/src/components/landing/BrandAboutSection'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <main
      className="min-h-screen w-full max-w-full overflow-x-hidden flex items-center justify-center"
      style={{ background: '#EFEFEF' }}
    >
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 60%, rgba(74,144,226,0.06) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md mx-auto px-4 sm:px-6 flex flex-col items-center text-center gap-10 py-16">

        {/* Logo + wordmark */}
        <div className="flex flex-col items-center gap-3">
          <img
            src="/icon.svg"
            alt="Zeptio"
            width={96}
            height={96}
            style={{ borderRadius: '22px', filter: 'drop-shadow(0 0 28px rgba(74,144,226,0.35))' }}
          />
          <p className="fredoka font-black text-7xl" style={{ color: '#4A90E2' }}>
            ZEPTIO
          </p>
          <p className="text-lg font-semibold" style={{ color: '#666666' }}>
            Build your robot. Master AI prompting.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="w-full flex flex-col gap-3">
          {[
            { icon: '✍️', label: 'Write prompts', desc: 'Craft the best prompt you can for each challenge' },
            { icon: '🤖', label: 'AI scores you', desc: 'Get instant feedback and a score out of 100' },
            { icon: '⚡', label: 'Earn XP', desc: 'Level up, unlock robot parts, and climb the leaderboard' },
          ].map(({ icon, label, desc }) => (
            <div
              key={label}
              className="flex items-center gap-4 rounded-2xl px-5 py-4 text-left"
              style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
            >
              <span
                className="w-10 h-10 flex items-center justify-center rounded-xl text-xl flex-shrink-0"
                style={{ background: '#F0F7FF' }}
              >
                {icon}
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-black" style={{ color: '#1A1A1A' }}>{label}</span>
                <span className="text-xs" style={{ color: '#888888' }}>{desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Brand about section */}
        <BrandAboutSection />

        {/* Free access pill */}
        <p
          className="text-sm font-medium px-5 py-2 rounded-full"
          style={{ background: '#F0F7FF', color: '#4A90E2', border: '1px solid #D0E6FF' }}
        >
          🎉 Free access — just leave us a review after you play.
        </p>

        {/* Google sign-in */}
        <div className="w-full">
          <GoogleSignInButton />
        </div>

        {/* Footer */}
        <div className="flex gap-5 text-xs" style={{ color: '#CCCCCC' }}>
          <a href="/privacy" className="hover:text-[#4A90E2] transition-colors duration-200">Privacy</a>
          <a href="/terms"   className="hover:text-[#4A90E2] transition-colors duration-200">Terms</a>
          <a href="/support" className="hover:text-[#4A90E2] transition-colors duration-200">Support</a>
        </div>

      </div>
    </main>
  )
}
