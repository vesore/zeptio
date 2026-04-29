import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import WaitlistForm from './_components/WaitlistForm'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <main
      className="min-h-screen w-full max-w-full overflow-x-hidden flex items-center justify-center"
      style={{ background: '#FFFFFF' }}
    >
      {/* Top-right Sign In text link */}
      <div className="fixed top-4 right-4 z-20">
        <a
          href="/auth/login"
          className="text-xs transition-opacity duration-200 hover:opacity-60"
          style={{ color: '#4A90E2' }}
        >
          Sign in →
        </a>
      </div>

      {/* Subtle green radial glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 60%, rgba(74,144,226,0.04) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center gap-8">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <img
            src="/icon.svg"
            alt="Zeptio"
            width={120}
            height={120}
            style={{ borderRadius: '24px', filter: 'drop-shadow(0 0 24px rgba(74,144,226,0.3))' }}
          />
          <p
            className="fredoka font-black text-7xl"
            style={{ color: '#4A90E2', textShadow: '0 0 32px rgba(74,144,226,0.5), 0 0 64px rgba(74,144,226,0.2)' }}
          >
            ZEPTIO
          </p>
          <p className="text-lg" style={{ color: '#666666' }}>
            Build your robot. Master AI prompting.
          </p>
        </div>

        <WaitlistForm />

        {/* Footer links */}
        <div className="flex gap-5 text-xs" style={{ color: 'rgba(232,232,232,0.2)' }}>
          <a href="/privacy" className="hover:text-[#00FF88] transition-colors duration-200">Privacy</a>
          <a href="/terms"   className="hover:text-[#00FF88] transition-colors duration-200">Terms</a>
          <a href="/support" className="hover:text-[#00FF88] transition-colors duration-200">Support</a>
        </div>

      </div>
    </main>
  )
}
