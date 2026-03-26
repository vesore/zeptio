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
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#1a1a2e' }}
    >
      <div className="w-full max-w-sm">
        <p
          className="text-center font-mono font-bold tracking-widest text-sm uppercase mb-8"
          style={{ color: '#E8FF47' }}
        >
          Zeptio
        </p>

        <div
          className="rounded-2xl p-8"
          style={{ backgroundColor: '#12122a', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <h1 className="text-xl font-bold text-white mb-1">Let&apos;s play.</h1>
          <p className="text-sm mb-6" style={{ color: '#9ca3af' }}>
            Sign in or create your account.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-xs font-mono tracking-widest uppercase"
                style={{ color: '#ffffff' }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (state === 'error') setState('idle') }}
                disabled={state === 'loading'}
                className="w-full rounded-xl px-4 py-3 text-lg placeholder:text-white/50 outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#E8FF47]"
                style={{
                  backgroundColor: '#1a1a2e',
                  border: `1.5px solid ${state === 'error' ? '#f87171' : 'rgba(255,255,255,0.1)'}`,
                  color: '#ffffff',
                }}
                onFocus={(e) => { if (state !== 'error') e.target.style.borderColor = '#E8FF47' }}
                onBlur={(e)  => { if (state !== 'error') e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-xs font-mono tracking-widest uppercase"
                style={{ color: '#ffffff' }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (state === 'error') setState('idle') }}
                disabled={state === 'loading'}
                className="w-full rounded-xl px-4 py-3 text-lg placeholder:text-white/50 outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#E8FF47]"
                style={{
                  backgroundColor: '#1a1a2e',
                  border: `1.5px solid ${state === 'error' ? '#f87171' : 'rgba(255,255,255,0.1)'}`,
                  color: '#ffffff',
                }}
                onFocus={(e) => { if (state !== 'error') e.target.style.borderColor = '#E8FF47' }}
                onBlur={(e)  => { if (state !== 'error') e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
              />
            </div>

            {state === 'error' && (
              <p
                role="alert"
                className="text-xs rounded-lg px-3 py-2 font-mono break-all"
                style={{ backgroundColor: '#2d1515', color: '#f87171' }}
              >
                {errMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={!ready}
              className="w-full rounded-xl py-3 text-sm font-bold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8FF47] focus-visible:ring-offset-2 focus-visible:ring-offset-[#12122a]"
              style={{
                backgroundColor: ready ? '#E8FF47' : 'rgba(232,255,71,0.12)',
                color:           ready ? '#1a1a2e' : 'rgba(232,255,71,0.35)',
                cursor:          ready ? 'pointer'  : 'not-allowed',
              }}
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
