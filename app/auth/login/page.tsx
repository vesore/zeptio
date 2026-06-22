'use client'

import { createClient } from '@/src/lib/supabase/client'

export default function LoginPage() {
  async function handleGoogleSignIn() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'https://zeptio.app/auth/callback' },
    })
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center" style={{ background: '#EFEFEF' }}>
      <div className="w-full max-w-md mx-auto px-4 py-8 flex flex-col items-center gap-8">
        <p className="font-mono font-bold tracking-widest text-base uppercase" style={{ color: '#4A90E2' }}>
          Zeptio
        </p>

        <div className="w-full rounded-3xl p-8 flex flex-col items-center gap-6" style={{ background: '#FFFFFF', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <h1 className="fredoka text-5xl font-black tracking-tight" style={{ color: '#1A1A1A' }}>
            Let&apos;s play.
          </h1>

          <p
            className="text-sm font-medium text-center px-4 py-2 rounded-full"
            style={{ background: '#F0F7FF', color: '#4A90E2', border: '1px solid #D0E6FF' }}
          >
            🎉 Free access — just leave us a review after you play.
          </p>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 rounded-full py-5 font-black text-xl tracking-wide transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A90E2]"
            style={{ backgroundColor: '#4A90E2', color: '#FFFFFF', boxShadow: '0 4px 20px rgba(74,144,226,0.45)' }}
          >
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
              style={{ backgroundColor: '#FFFFFF', color: '#4285F4' }}
            >
              G
            </span>
            Continue with Google
          </button>
        </div>
      </div>
    </main>
  )
}
