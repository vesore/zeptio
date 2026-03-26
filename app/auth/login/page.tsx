'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'

type State = 'idle' | 'loading' | 'error'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('zeptio2024')
  const [state, setState]       = useState<State>('idle')
  const [errMsg, setErrMsg]     = useState('')

  async function handleGoogleSignIn() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'https://zeptio.app/auth/callback' },
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password || state === 'loading') return

    setState('loading')
    setErrMsg('')

    const supabase = createClient()
    const normalizedEmail = email.trim().toLowerCase()

    // Try signing in first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (!signInError) {
      router.push('/dashboard')
      return
    }

    // Sign-in failed — only attempt sign-up for "Invalid login credentials"
    if (!signInError.message.toLowerCase().includes('invalid login credentials')) {
      setErrMsg(signInError.message)
      setState('error')
      return
    }

    // Check if this email already has a profile (i.e. user exists in auth.users)
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (existingProfile) {
      // User exists but credentials are wrong — don't attempt sign-up
      setErrMsg('Invalid login credentials')
      setState('error')
      return
    }

    // New user — attempt sign-up
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
    })

    if (signUpError) {
      setErrMsg(signUpError.message)
      setState('error')
      return
    }

    // Seed profile + streak rows for the new user
    if (data.user?.id) {
      await Promise.all([
        supabase
          .from('profiles')
          .upsert({ id: data.user.id, email: normalizedEmail }, { onConflict: 'id' }),
        supabase
          .from('streaks')
          .upsert({ user_id: data.user.id }, { onConflict: 'user_id' }),
      ])
    }

    // Sign in with the newly created account
    const { error: finalSignInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (finalSignInError) {
      setErrMsg(finalSignInError.message)
      setState('error')
      return
    }

    router.push('/dashboard')
  }

  const ready = !!email.trim() && !!password && state !== 'loading'

  return (
    <main className="min-h-screen flex items-center justify-center lime-radial-glow">
      <div className="w-full max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p
          className="text-center font-mono font-bold tracking-widest text-sm uppercase mb-8"
          style={{ color: '#E86A4A' }}
        >
          Zeptio
        </p>

        <div className="rounded-3xl p-6 sm:p-8 glass">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-1">Let&apos;s play.</h1>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Sign in or create your account.
          </p>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 rounded-full py-4 font-bold text-sm tracking-wide transition-all duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E86A4A]"
            style={{ backgroundColor: '#ffffff', color: '#1a1a1a' }}
          >
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black"
              style={{ backgroundColor: '#4285F4', color: '#ffffff' }}
            >
              G
            </span>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <span className="text-xs font-mono tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>or</span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-xs font-mono tracking-widest uppercase"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="off"
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (state === 'error') setState('idle') }}
                disabled={state === 'loading'}
                className="w-full rounded-2xl px-4 py-3.5 text-base placeholder:text-white/30 outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#E86A4A] glass"
                style={{
                  border: `1.5px solid ${state === 'error' ? '#f87171' : 'rgba(255,255,255,0.1)'}`,
                  color: '#0066CC',
                  fontWeight: 700,
                }}
                onFocus={(e) => { if (state !== 'error') e.target.style.borderColor = '#E86A4A' }}
                onBlur={(e)  => { if (state !== 'error') e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-xs font-mono tracking-widest uppercase"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (state === 'error') setState('idle') }}
                disabled={state === 'loading'}
                className="w-full rounded-2xl px-4 py-3.5 text-base placeholder:text-white/30 outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#E86A4A] glass"
                style={{
                  border: `1.5px solid ${state === 'error' ? '#f87171' : 'rgba(255,255,255,0.1)'}`,
                  color: '#0066CC',
                  fontWeight: 700,
                }}
                onFocus={(e) => { if (state !== 'error') e.target.style.borderColor = '#E86A4A' }}
                onBlur={(e)  => { if (state !== 'error') e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
              />
            </div>

            {state === 'error' && (
              <p
                role="alert"
                className="text-xs rounded-2xl px-4 py-3 font-mono break-all"
                style={{ backgroundColor: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}
              >
                {errMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={!ready}
              className="w-full py-4 text-sm font-bold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E86A4A] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent btn-primary"
            >
              {state === 'loading' ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    aria-hidden="true"
                    className="inline-block w-4 h-4 rounded-full border-2 animate-spin"
                    style={{ borderColor: 'rgba(232,255,71,0.15)', borderTopColor: 'rgba(232,255,71,0.65)' }}
                  />
                  Signing in…
                </span>
              ) : (
                'Start Playing'
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
