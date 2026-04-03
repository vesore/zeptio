import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import WaitlistForm from './_components/WaitlistForm'

interface Props {
  searchParams: Promise<{ error?: string; success?: string }>
}

export default async function LandingPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  const { error, success } = await searchParams

  return (
    <main
      className="min-h-screen w-full max-w-full overflow-x-hidden flex items-center justify-center"
      style={{ background: '#0F0F0F' }}
    >
      {/* Subtle copper radial glow behind content */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 60%, rgba(184,115,51,0.07) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center gap-8">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          {/* Z circuit board icon */}
          <img
            src="/icon.svg"
            alt="Zeptio"
            width={120}
            height={120}
            style={{ borderRadius: '24px', filter: 'drop-shadow(0 0 24px rgba(0,255,136,0.3))' }}
          />
          {/* Wordmark */}
          <p
            className="font-mono font-black tracking-widest text-7xl uppercase"
            style={{ color: '#00FF88', textShadow: '0 0 32px rgba(0,255,136,0.5), 0 0 64px rgba(0,255,136,0.2)' }}
          >
            ZEPTIO
          </p>
          {/* Tagline */}
          <p className="text-lg" style={{ color: '#8B8FA8' }}>
            Learn AI prompting through play.
          </p>
        </div>

        {/* Success state — returned from /nda */}
        {success === '1' ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div
              className="w-full rounded-2xl px-8 py-6 flex flex-col gap-3"
              style={{ background: 'rgba(0,255,136,0.05)', border: '1.5px solid rgba(0,255,136,0.2)' }}
            >
              <p className="text-base font-bold" style={{ color: '#E8E8E8' }}>
                Your request is under review.
              </p>
              <p className="text-sm" style={{ color: 'rgba(232,232,232,0.45)' }}>
                You&apos;ll hear from us soon.
              </p>
            </div>
            <a
              href="/auth/login"
              className="text-xs font-mono transition-opacity duration-200 hover:opacity-60"
              style={{ color: 'rgba(232,232,232,0.3)' }}
            >
              Already have access? Log in →
            </a>
          </div>
        ) : (
          <>
            {/* Access required error */}
            {error === 'access_required' && (
              <div
                className="w-full rounded-2xl px-5 py-4 text-sm text-center"
                style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}
              >
                Please request access first. Sign up below and we&apos;ll be in touch.
              </div>
            )}
            <WaitlistForm />
          </>
        )}

        {/* Footer links */}
        <div className="flex gap-5 text-xs" style={{ color: 'rgba(232,232,232,0.2)' }}>
          <a href="/privacy" className="hover:text-[#B87333] transition-colors duration-200">Privacy</a>
          <a href="/terms"   className="hover:text-[#B87333] transition-colors duration-200">Terms</a>
          <a href="/support" className="hover:text-[#B87333] transition-colors duration-200">Support</a>
        </div>

      </div>
    </main>
  )
}
