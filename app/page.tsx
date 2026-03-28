import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import WaitlistForm from './_components/WaitlistForm'

interface Props {
  searchParams: Promise<{ error?: string }>
}

export default async function LandingPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  const { error } = await searchParams

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
        <p
          className="font-mono font-black tracking-widest text-sm uppercase"
          style={{ color: '#B87333', textShadow: '0 0 16px rgba(184,115,51,0.4)' }}
        >
          Zeptio
        </p>

        {/* Tagline */}
        <h1
          className="text-3xl sm:text-4xl font-black tracking-tight leading-tight"
          style={{ color: '#E8E8E8' }}
        >
          Learn AI prompting<br />through play.
        </h1>

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
