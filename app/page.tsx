'use client'

import { useState } from 'react'
import { createClient } from '@/src/lib/supabase/client'

type State = 'idle' | 'loading' | 'success' | 'error'

export default function LandingPage() {
  const [email, setEmail]     = useState('')
  const [agreed, setAgreed]   = useState(false)
  const [state, setState]     = useState<State>('idle')
  const [errMsg, setErrMsg]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !agreed || state === 'loading') return

    setState('loading')
    setErrMsg('')

    const supabase = createClient()
    const { error } = await supabase.from('waitlist').insert({
      email: email.trim().toLowerCase(),
      accepted_nda: true,
    })

    if (error) {
      // Duplicate email — treat as success so we don't leak info
      if (error.code === '23505') {
        setState('success')
        return
      }
      setErrMsg(error.message)
      setState('error')
    } else {
      setState('success')
    }
  }

  const ready = !!email.trim() && agreed && state !== 'loading'

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}
    >
      {/* Nav */}
      <header className="px-8 py-6 flex items-center justify-between border-b border-white/5">
        <span
          className="font-mono font-bold tracking-widest text-sm uppercase"
          style={{ color: '#E8FF47' }}
        >
          Zeptio
        </span>
        <a
          href="/auth/login"
          className="text-xs font-mono tracking-widest uppercase transition-colors duration-200"
          style={{ color: 'rgba(255,255,255,0.35)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#E8FF47')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
        >
          Sign in →
        </a>
      </header>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-24">
        <div className="w-full max-w-lg text-center">

          {/* Eyebrow */}
          <p
            className="font-mono text-xs tracking-widest uppercase mb-6 inline-flex items-center gap-2"
            style={{ color: 'rgba(232,255,71,0.7)' }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: '#E8FF47' }}
            />
            Private Beta
          </p>

          {/* Headline */}
          <h1
            className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-5"
          >
            Learn AI prompting<br />
            <span style={{ color: '#E8FF47' }}>through play.</span>
          </h1>

          {/* Subheadline */}
          <p
            className="text-lg leading-relaxed mb-12 mx-auto max-w-md"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            Join the beta and be the first to master the skill that separates
            good AI users from great ones.
          </p>

          {/* Card */}
          <div
            className="rounded-2xl p-8 text-left"
            style={{
              backgroundColor: '#12122a',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {state === 'success' ? (
              <div className="text-center py-4">
                <p className="text-3xl mb-4">✦</p>
                <h2 className="text-lg font-bold text-white mb-2">
                  You&apos;re on the list.
                </h2>
                <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                  We&apos;ll be in touch soon.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
                {/* Email field */}
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
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (state === 'error') setState('idle')
                    }}
                    disabled={state === 'loading'}
                    className="w-full rounded-xl px-4 py-3 text-base placeholder:text-white/30 outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#E8FF47]"
                    style={{
                      backgroundColor: '#1a1a2e',
                      border: `1.5px solid ${state === 'error' ? '#f87171' : 'rgba(255,255,255,0.1)'}`,
                      color: '#ffffff',
                    }}
                    onFocus={(e) => {
                      if (state !== 'error') e.target.style.borderColor = '#E8FF47'
                    }}
                    onBlur={(e) => {
                      if (state !== 'error') e.target.style.borderColor = 'rgba(255,255,255,0.1)'
                    }}
                  />
                </div>

                {/* NDA checkbox */}
                <label className="flex items-start gap-3 cursor-pointer select-none group">
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
                          <path
                            d="M1 4.5L4 7.5L10 1"
                            stroke="#1a1a2e"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span
                    className="text-sm leading-relaxed"
                    style={{ color: agreed ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)' }}
                  >
                    I agree to keep this beta confidential and not share screenshots
                    or details publicly.
                  </span>
                </label>

                {/* Error */}
                {state === 'error' && (
                  <p
                    role="alert"
                    className="text-xs rounded-lg px-3 py-2 font-mono break-all"
                    style={{ backgroundColor: '#2d1515', color: '#f87171' }}
                  >
                    {errMsg}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!ready}
                  className="w-full rounded-xl py-3.5 text-sm font-bold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8FF47] focus-visible:ring-offset-2 focus-visible:ring-offset-[#12122a]"
                  style={{
                    backgroundColor: ready ? '#E8FF47' : 'rgba(232,255,71,0.10)',
                    color:           ready ? '#1a1a2e' : 'rgba(232,255,71,0.3)',
                    cursor:          ready ? 'pointer'  : 'not-allowed',
                  }}
                >
                  {state === 'loading' ? (
                    <span className="flex items-center justify-center gap-2">
                      <span
                        aria-hidden="true"
                        className="inline-block w-4 h-4 rounded-full border-2 animate-spin"
                        style={{
                          borderColor: 'rgba(232,255,71,0.15)',
                          borderTopColor: 'rgba(232,255,71,0.65)',
                        }}
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

          {/* World pills */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {[
              { icon: '◎', name: 'Clarity' },
              { icon: '⬡', name: 'Constraints' },
              { icon: '▦', name: 'Structure' },
              { icon: '⟁', name: 'Debug' },
            ].map((w) => (
              <span
                key={w.name}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-mono"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.35)',
                }}
              >
                <span style={{ color: 'rgba(232,255,71,0.5)' }}>{w.icon}</span>
                {w.name}
              </span>
            ))}
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="px-8 py-5 border-t border-white/5 text-center">
        <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
          © {new Date().getFullYear()} Zeptio. All rights reserved.
        </p>
      </footer>
    </main>
  )
}
