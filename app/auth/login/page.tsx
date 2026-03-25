'use client'

import { useState } from 'react'
import { createClient } from '@/src/lib/supabase/client'

type State = 'idle' | 'loading' | 'sent' | 'error'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>('idle')
  const [errMsg, setErrMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || state === 'loading') return

    setState('loading')
    setErrMsg('')

    const supabase = createClient()
    const normalizedEmail = email.trim().toLowerCase()

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: 'zeptio2024',
    })

    // If signUp succeeded and we have a user id, seed the profile + streak rows
    if (!error && data.user?.id) {
      await Promise.all([
        supabase
          .from('profiles')
          .upsert({ id: data.user.id, email: normalizedEmail }, { onConflict: 'id' }),
        supabase
          .from('streaks')
          .upsert({ user_id: data.user.id }, { onConflict: 'user_id' }),
      ])
    }

    // "User already registered" is not a real error — the magic link will still work
    const isExisting = error?.message?.toLowerCase().includes('already registered')

    if (error && !isExisting) {
      setErrMsg(error.message)
      setState('error')
    } else {
      setState('sent')
    }
  }

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
          {state === 'sent' ? (
            <div className="text-center py-4">
              <p className="text-2xl mb-4">📬</p>
              <h1 className="text-lg font-bold text-white mb-2">Check your email</h1>
              <p className="text-sm" style={{ color: '#9ca3af' }}>
                We sent a magic link to{' '}
                <span className="font-mono" style={{ color: '#E8FF47' }}>{email}</span>.
              </p>
              <button
                onClick={() => { setState('idle'); setEmail('') }}
                className="mt-6 text-xs font-mono underline underline-offset-2"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-white mb-1">Let&apos;s play.</h1>
              <p className="text-sm mb-6" style={{ color: '#9ca3af' }}>
                Enter your email to get a magic link.
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
                  disabled={!email.trim() || state === 'loading'}
                  className="w-full rounded-xl py-3 text-sm font-bold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8FF47] focus-visible:ring-offset-2 focus-visible:ring-offset-[#12122a]"
                  style={{
                    backgroundColor: email.trim() && state !== 'loading' ? '#E8FF47' : 'rgba(232,255,71,0.12)',
                    color:           email.trim() && state !== 'loading' ? '#1a1a2e' : 'rgba(232,255,71,0.35)',
                    cursor:          email.trim() && state !== 'loading' ? 'pointer'  : 'not-allowed',
                  }}
                >
                  {state === 'loading' ? (
                    <span className="flex items-center justify-center gap-2">
                      <span
                        aria-hidden="true"
                        className="inline-block w-4 h-4 rounded-full border-2 animate-spin"
                        style={{ borderColor: 'rgba(232,255,71,0.15)', borderTopColor: 'rgba(232,255,71,0.65)' }}
                      />
                      Sending…
                    </span>
                  ) : (
                    'Start Playing'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
