'use client'

import { useState } from 'react'
import { createClient } from '@/src/lib/supabase/client'

type State = 'idle' | 'loading' | 'success' | 'error'

const inputClass = "w-full rounded-2xl px-4 py-3 text-base placeholder:text-white/30 outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#E8FF47] glass"
const inputStyle = (hasError: boolean) => ({
  border: `1.5px solid ${hasError ? '#f87171' : 'rgba(255,255,255,0.1)'}`,
  color: '#0066CC',
  fontWeight: 700,
  background: 'rgba(255,255,255,0.05)',
})

export default function WaitlistForm() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [email, setEmail]         = useState('')
  const [agreed, setAgreed]       = useState(false)
  const [state, setState]         = useState<State>('idle')
  const [errMsg, setErrMsg]       = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !agreed || state === 'loading') return

    setState('loading')
    setErrMsg('')

    const supabase = createClient()
    const { error } = await supabase.from('waitlist').upsert(
      { name: `${firstName.trim()} ${lastName.trim()}`, email: email.trim().toLowerCase(), accepted_nda: true },
      { onConflict: 'email' }
    )

    if (error) {
      setErrMsg(error.message)
      setState('error')
    } else {
      setState('success')
    }
  }

  const ready = !!firstName.trim() && !!lastName.trim() && !!email.trim() && agreed && state !== 'loading'
  const hasError = state === 'error'

  const handleChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value)
    if (hasError) setState('idle')
  }
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!hasError) e.target.style.borderColor = '#E8FF47'
  }
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!hasError) e.target.style.borderColor = 'rgba(255,255,255,0.1)'
  }

  return (
    <>
      {state === 'success' ? (
        <div className="flex flex-col items-center gap-4 py-4">
          <div
            className="rounded-3xl px-6 py-5 text-center glass"
            style={{ border: '1px solid rgba(232,255,71,0.2)' }}
          >
            <p className="text-base font-semibold text-white mb-2">
              You&apos;re on the list!
            </p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              We&apos;ll be in touch soon.
            </p>
          </div>
          <a
            href="/auth/login"
            className="text-sm font-medium transition-colors duration-200 hover:opacity-80"
            style={{ color: '#E8FF47' }}
          >
            Already have access? Log in →
          </a>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4" noValidate>

          {/* Name row */}
          <div className="flex gap-3">
            <input
              type="text"
              autoComplete="given-name"
              autoFocus
              placeholder="First Name"
              value={firstName}
              onChange={handleChange(setFirstName)}
              disabled={state === 'loading'}
              className={inputClass}
              style={inputStyle(hasError)}
              onFocus={onFocus}
              onBlur={onBlur}
            />
            <input
              type="text"
              autoComplete="family-name"
              placeholder="Last Name"
              value={lastName}
              onChange={handleChange(setLastName)}
              disabled={state === 'loading'}
              className={inputClass}
              style={inputStyle(hasError)}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </div>

          {/* Email */}
          <input
            type="email"
            autoComplete="email"
            placeholder="your@email.com"
            value={email}
            onChange={handleChange(setEmail)}
            disabled={state === 'loading'}
            className={inputClass}
            style={inputStyle(hasError)}
            onFocus={onFocus}
            onBlur={onBlur}
          />

          {/* NDA checkbox */}
          <div
            className="rounded-2xl p-4 flex flex-col gap-3 glass"
            style={{ border: '1.5px solid rgba(232,255,71,0.4)' }}
          >
            <p className="text-sm font-bold text-left text-white">
              Before you continue:
            </p>
            <label className="flex items-start gap-3 text-left cursor-pointer select-none">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className="rounded-md flex items-center justify-center transition-all duration-150"
                  style={{
                    width: '20px', height: '20px',
                    backgroundColor: agreed ? '#E8FF47' : 'rgba(255,255,255,0.05)',
                    border: `2px solid ${agreed ? '#E8FF47' : 'rgba(255,255,255,0.3)'}`,
                  }}
                  aria-hidden="true"
                >
                  {agreed && (
                    <svg width="13" height="11" viewBox="0 0 13 11" fill="none">
                      <path d="M1 5.5L5 9.5L12 1" stroke="#0d0d1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm font-medium leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
                I agree to keep this beta confidential and not share screenshots publicly.
              </span>
            </label>
          </div>

          {/* Error */}
          {state === 'error' && (
            <p role="alert" className="text-xs font-mono break-all rounded-2xl px-4 py-3" style={{ backgroundColor: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
              {errMsg}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!ready}
            className="w-full py-3.5 text-sm font-bold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8FF47] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent btn-primary"
          >
            {state === 'loading' ? (
              <span className="flex items-center justify-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block w-4 h-4 rounded-full border-2 animate-spin"
                  style={{ borderColor: 'rgba(13,13,26,0.2)', borderTopColor: '#0d0d1a' }}
                />
                Submitting…
              </span>
            ) : (
              'Request Access'
            )}
          </button>

        </form>
      )}
    </>
  )
}
