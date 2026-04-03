'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type SubmitState = 'idle' | 'success'

const inputBase =
  'w-full rounded-xl px-4 py-3.5 text-base font-bold placeholder:text-white/25 outline-none transition-all duration-200'

function inputStyle(focused: boolean): React.CSSProperties {
  return {
    background: 'rgba(255,255,255,0.04)',
    border: `1.5px solid ${focused ? '#B87333' : 'rgba(232,232,232,0.12)'}`,
    color: '#E8E8E8',
  }
}

export default function WaitlistForm() {
  const router = useRouter()
  const [firstName,    setFirstName]    = useState('')
  const [lastName,     setLastName]     = useState('')
  const [email,        setEmail]        = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [submitState,  setSubmitState]  = useState<SubmitState>('idle')

  const formReady = firstName.trim() && lastName.trim() && email.trim()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formReady) return
    setSubmitState('success')
    const params = new URLSearchParams({
      firstName: firstName.trim(),
      lastName:  lastName.trim(),
      email:     email.trim().toLowerCase(),
    })
    router.push(`/nda?${params.toString()}`)
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
          onChange={e => setFirstName(e.target.value)}
          onFocus={() => setFocusedField('first')}
          onBlur={() => setFocusedField(null)}
          className={inputBase}
          style={inputStyle(focusedField === 'first')}
        />
        <input
          type="text"
          autoComplete="family-name"
          placeholder="Last name"
          value={lastName}
          onChange={e => setLastName(e.target.value)}
          onFocus={() => setFocusedField('last')}
          onBlur={() => setFocusedField(null)}
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
        onChange={e => setEmail(e.target.value)}
        onFocus={() => setFocusedField('email')}
        onBlur={() => setFocusedField(null)}
        className={inputBase}
        style={inputStyle(focusedField === 'email')}
      />

      {/* Submit */}
      <button
        type="submit"
        disabled={!formReady || submitState === 'success'}
        className="w-full py-4 rounded-xl text-sm font-black tracking-widest uppercase transition-all duration-200 focus-visible:outline-none"
        style={{
          background: formReady
            ? 'linear-gradient(135deg, #B87333 0%, #8B5E2A 100%)'
            : 'rgba(184,115,51,0.12)',
          color: formReady ? '#0F0F0F' : 'rgba(184,115,51,0.3)',
          border: '1.5px solid rgba(184,115,51,0.3)',
          cursor: formReady ? 'pointer' : 'not-allowed',
        }}
      >
        {submitState === 'success' ? 'Loading…' : 'Review & Sign NDA'}
      </button>

    </form>
  )
}
