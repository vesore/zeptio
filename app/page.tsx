'use client'

import { useState } from 'react'
import { createClient } from '@/src/lib/supabase/client'

type State = 'idle' | 'loading' | 'success' | 'error'

export default function LandingPage() {
  const [email, setEmail]   = useState('')
  const [agreed, setAgreed] = useState(false)
  const [state, setState]   = useState<State>('idle')
  const [errMsg, setErrMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !agreed || state === 'loading') return

    setState('loading')
    setErrMsg('')

    const supabase = createClient()
    const { error } = await supabase.from('waitlist').upsert(
      { email: email.trim().toLowerCase(), accepted_nda: true },
      { onConflict: 'email' }
    )

    if (error) {
      setErrMsg(error.message)
      setState('error')
    } else {
      setState('success')
    }
  }

  const ready = !!email.trim() && agreed && state !== 'loading'

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6"
      style={{ backgroundColor: '#1a1a2e' }}
    >
      <div className="w-full max-w-sm flex flex-col items-center text-center gap-6">

        {/* Logo */}
        <p className="font-mono font-bold tracking-widest text-sm uppercase" style={{ color: '#E8FF47' }}>
          Zeptio
        </p>

        {/* Tagline */}
        <h1 className="text-2xl font-bold text-white leading-snug">
          Learn AI prompting through play.
        </h1>

        {state === 'success' ? (
          <p className="text-base" style={{ color: 'rgba(255,255,255,0.6)' }}>
            You&apos;re in. We&apos;ll send you access soon.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4" noValidate>

            {/* Email */}
            <input
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="your@email.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (state === 'error') setState('idle') }}
              disabled={state === 'loading'}
              className="w-full rounded-xl px-4 py-3 text-base placeholder:text-white/30 outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#E8FF47]"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: `1.5px solid ${state === 'error' ? '#f87171' : 'rgba(255,255,255,0.1)'}`,
                color: '#ffffff',
              }}
              onFocus={(e) => { if (state !== 'error') e.target.style.borderColor = '#E8FF47' }}
              onBlur={(e)  => { if (state !== 'error') e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
            />

            {/* NDA checkbox */}
            <label className="flex items-start gap-3 text-left cursor-pointer select-none">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className="w-5 h-5 rounded flex items-center justify-center transition-all duration-150"
                  style={{
                    backgroundColor: agreed ? '#E8FF47' : 'rgba(255,255,255,0.05)',
                    border: `1.5px solid ${agreed ? '#E8FF47' : 'rgba(255,255,255,0.2)'}`,
                  }}
                  aria-hidden="true"
                >
                  {agreed && (
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                      <path d="M1 4.5L4 7.5L10 1" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm leading-relaxed" style={{ color: '#ffffff' }}>
                I agree to keep this beta confidential and not share screenshots publicly.
              </span>
            </label>

            {/* Error */}
            {state === 'error' && (
              <p role="alert" className="text-xs font-mono break-all rounded-lg px-3 py-2" style={{ backgroundColor: '#2d1515', color: '#f87171' }}>
                {errMsg}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!ready}
              className="w-full rounded-xl py-3 text-sm font-bold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8FF47] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a2e]"
              style={{
                backgroundColor: ready ? '#E8FF47' : 'rgba(232,255,71,0.08)',
                color:           ready ? '#1a1a2e' : 'rgba(232,255,71,0.25)',
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
                  Submitting…
                </span>
              ) : (
                'Request Access'
              )}
            </button>

          </form>
        )}

      </div>
    </main>
  )
}
