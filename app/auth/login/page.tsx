'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'

const DEFAULT_PASSWORD = 'zeptio2024'

type State = 'idle' | 'loading' | 'error'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>('idle')
  const [errMsg, setErrMsg] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || state === 'loading') return

    setState('loading')
    setErrMsg('')

    const supabase = createClient()
    const trimmed = email.trim().toLowerCase()

    // 1. Try OTP (works instantly if Supabase has "Confirm email" disabled)
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { shouldCreateUser: true },
    })

    if (!otpError) {
      router.push('/dashboard')
      return
    }

    // 2. Returning user — sign in with fixed password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: trimmed,
      password: DEFAULT_PASSWORD,
    })

    if (!signInError) {
      router.push('/dashboard')
      return
    }

    // 3. New user — create account with fixed password, then sign in
    const { error: signUpError } = await supabase.auth.signUp({
      email: trimmed,
      password: DEFAULT_PASSWORD,
    })

    // "User already registered" means the account exists but OTP + password both failed
    // (e.g. confirmation still pending). Try password sign-in one more time.
    if (signUpError?.message?.toLowerCase().includes('user already registered')) {
      const { error: retryError } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password: DEFAULT_PASSWORD,
      })
      if (!retryError) {
        router.push('/dashboard')
        return
      }
      setErrMsg(retryError.message)
      setState('error')
      return
    }

    if (signUpError) {
      setErrMsg(signUpError.message)
      setState('error')
      return
    }

    // Sign in to get the session (and user id) immediately after signup
    const { data: signInData, error: signInAfterSignUpError } = await supabase.auth.signInWithPassword({
      email: trimmed,
      password: DEFAULT_PASSWORD,
    })

    if (!signInAfterSignUpError && signInData.user) {
      const newUserId = signInData.user.id
      await Promise.all([
        supabase.from('profiles').upsert(
          { id: newUserId, email: trimmed },
          { onConflict: 'id' }
        ),
        supabase.from('streaks').upsert(
          { user_id: newUserId },
          { onConflict: 'user_id' }
        ),
      ])
      router.push('/dashboard')
      return
    }

    // signUp succeeded but signIn failed — email confirmation is likely still required
    setErrMsg('Check your email to confirm your account, then try again.')
    setState('error')
  }

  const canSubmit = email.trim().length > 0 && state !== 'loading'

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
            Enter your email to jump in.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
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
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (state === 'error') setState('idle')
                }}
                disabled={state === 'loading'}
                className="w-full rounded-xl px-4 py-3 text-lg placeholder:text-white/50 outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#E8FF47]"
                style={{
                  backgroundColor: '#1a1a2e',
                  border: `1.5px solid ${state === 'error' ? '#f87171' : 'rgba(255,255,255,0.1)'}`,
                  color: '#ffffff',
                }}
                onFocus={(e) => { if (state !== 'error') e.target.style.borderColor = '#E8FF47' }}
                onBlur={(e)  => { if (state !== 'error') e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
                aria-describedby={state === 'error' ? 'login-error' : undefined}
                aria-invalid={state === 'error'}
              />
            </div>

            {state === 'error' && (
              <p
                id="login-error"
                role="alert"
                className="text-xs rounded-lg px-3 py-2"
                style={{ backgroundColor: '#2d1515', color: '#f87171' }}
              >
                {errMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              aria-disabled={!canSubmit}
              aria-busy={state === 'loading'}
              className="w-full rounded-xl py-3 text-sm font-bold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8FF47] focus-visible:ring-offset-2 focus-visible:ring-offset-[#12122a]"
              style={{
                backgroundColor: canSubmit ? '#E8FF47' : 'rgba(232,255,71,0.12)',
                color:           canSubmit ? '#1a1a2e' : 'rgba(232,255,71,0.35)',
                cursor:          canSubmit ? 'pointer'  : 'not-allowed',
              }}
            >
              {state === 'loading' ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    aria-hidden="true"
                    className="inline-block w-4 h-4 rounded-full border-2 animate-spin"
                    style={{
                      borderColor:    'rgba(232,255,71,0.15)',
                      borderTopColor: 'rgba(232,255,71,0.65)',
                    }}
                  />
                  Starting…
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
