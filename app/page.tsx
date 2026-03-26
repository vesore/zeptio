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

        <WaitlistForm />

      </div>
    </main>
  )
}
