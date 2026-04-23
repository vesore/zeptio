'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'

type State = 'idle' | 'loading' | 'error'

const inputBase =
  'w-full rounded-xl px-4 py-3.5 text-base font-bold placeholder:text-white/25 outline-none transition-all duration-200'

function inputStyle(focused: boolean): React.CSSProperties {
  return {
    background: 'rgba(255,255,255,0.04)',
    border: `1.5px solid ${focused ? '#00FF88' : 'rgba(232,232,232,0.12)'}`,
    color: '#E8E8E8',
  }
}

export default function WaitlistForm() {
  const router = useRouter()
  const [firstName,    setFirstName]    = useState('')
  const [lastName,     setLastName]     = useState('')
  const [email,        setEmail]        = useState('')
  const [agreed,       setAgreed]       = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [state,        setState]        = useState<State>('idle')
  const [errMsg,       setErrMsg]       = useState('')

  const formReady = firstName.trim() && lastName.trim() && email.trim() && agreed

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formReady || state === 'loading') return

    setState('loading')
    setErrMsg('')

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName:  lastName.trim(),
          email:     email.trim(),
        }),
      })

      const data = await res.json()

      if (data.exists) {
        router.push('/auth/login?welcome=1')
        return
      }

      if (!res.ok || data.error) {
        setErrMsg(data.error ?? 'Something went wrong. Please try again.')
        setState('error')
        return
      }

      // Sign in with the newly created account
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: 'Zeptio2026',
      })

      if (signInError) {
        setErrMsg('Account created! Please sign in at the login page.')
        setState('error')
        return
      }

      router.push('/dashboard')
    } catch {
      setErrMsg('Something went wrong. Please try again.')
      setState('error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3" noValidate>

      {/* Name row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          autoComplete="given-name"
          autoFocus
          placeholder="First name"
          value={firstName}
          onChange={e => { setFirstName(e.target.value); if (state === 'error') setState('idle') }}
          onFocus={() => setFocusedField('first')}
          onBlur={() => setFocusedField(null)}
          disabled={state === 'loading'}
          className={inputBase}
          style={inputStyle(focusedField === 'first')}
        />
        <input
          type="text"
          autoComplete="family-name"
          placeholder="Last name"
          value={lastName}
          onChange={e => { setLastName(e.target.value); if (state === 'error') setState('idle') }}
          onFocus={() => setFocusedField('last')}
          onBlur={() => setFocusedField(null)}
          disabled={state === 'loading'}
          className={inputBase}
          style={inputStyle(focusedField === 'last')}
        />
      </div>

      {/* Email */}
      <input
        type="email"
        autoComplete="email"
        placeholder="your@email.com"
        value={email}
        onChange={e => { setEmail(e.target.value); if (state === 'error') setState('idle') }}
        onFocus={() => setFocusedField('email')}
        onBlur={() => setFocusedField(null)}
        disabled={state === 'loading'}
        className={inputBase}
        style={inputStyle(focusedField === 'email')}
      />

      {/* NDA checkbox */}
      <label className="flex items-start gap-3 cursor-pointer select-none">
        <div className="relative flex-shrink-0 mt-0.5">
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            disabled={state === 'loading'}
            className="sr-only"
          />
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center transition-all duration-200"
            style={{
              background: agreed ? '#00FF88' : 'rgba(255,255,255,0.04)',
              border: `1.5px solid ${agreed ? '#00FF88' : 'rgba(232,232,232,0.2)'}`,
            }}
          >
            {agreed && (
              <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                <path d="M1 4L4 7L10 1" stroke="#0F0F0F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
        </div>
        <span className="text-sm" style={{ color: 'rgba(232,232,232,0.55)' }}>
          I agree to keep Zeptio beta confidential
        </span>
      </label>

      {/* Error */}
      {state === 'error' && (
        <p
          role="alert"
          className="text-xs rounded-xl px-4 py-3 font-mono"
          style={{ backgroundColor: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}
        >
          {errMsg}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!formReady || state === 'loading'}
        className="w-full py-4 rounded-xl text-sm font-black tracking-widest uppercase transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF88]"
        style={{
          background: formReady ? '#00FF88' : 'rgba(0,255,136,0.08)',
          color: formReady ? '#0F0F0F' : 'rgba(0,255,136,0.3)',
          border: '1.5px solid rgba(0,255,136,0.3)',
          cursor: formReady ? 'pointer' : 'not-allowed',
        }}
      >
        {state === 'loading' ? (
          <span className="flex items-center justify-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block w-4 h-4 rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(0,255,136,0.15)', borderTopColor: 'rgba(0,255,136,0.65)' }}
            />
            Joining…
          </span>
        ) : (
          'Join Beta'
        )}
      </button>

      {/* Returning user link */}
      <p className="text-center text-xs" style={{ color: 'rgba(232,232,232,0.3)' }}>
        Already have access?{' '}
        <a
          href="/auth/login"
          className="transition-opacity duration-200 hover:opacity-60"
          style={{ color: 'rgba(232,232,232,0.5)' }}
        >
          Sign in →
        </a>
      </p>

    </form>
  )
}
