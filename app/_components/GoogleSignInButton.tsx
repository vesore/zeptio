'use client'

import { createClient } from '@/src/lib/supabase/client'

export default function GoogleSignInButton() {
  async function handleGoogleSignIn() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'https://zeptio.app/auth/callback' },
    })
  }

  return (
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
  )
}
