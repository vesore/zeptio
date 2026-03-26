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
    <main className="min-h-screen flex items-center justify-center px-6 lime-radial-glow">
      <div className="w-full max-w-sm flex flex-col items-center text-center gap-8">

        {/* Logo */}
        <p className="font-mono font-bold tracking-widest text-sm uppercase" style={{ color: '#E8FF47' }}>
          Zeptio
        </p>

        {/* Tagline */}
        <h1 className="text-4xl font-black tracking-tight text-white leading-tight">
          Learn AI prompting<br />through play.
        </h1>

        {/* Access required error */}
        {error === 'access_required' && (
          <div
            className="w-full rounded-2xl px-5 py-4 text-sm text-center"
            style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' }}
          >
            Please request access first. Sign up below and we&apos;ll be in touch.
          </div>
        )}

        <WaitlistForm />

        {/* Footer links */}
        <div className="flex gap-5 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          <a href="/privacy" className="hover:text-[#E8FF47] transition-colors duration-200">Privacy</a>
          <a href="/terms" className="hover:text-[#E8FF47] transition-colors duration-200">Terms</a>
          <a href="/support" className="hover:text-[#E8FF47] transition-colors duration-200">Support</a>
        </div>

      </div>
    </main>
  )
}
