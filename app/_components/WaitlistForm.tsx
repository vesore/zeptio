'use client'

import { useState, useRef, useCallback } from 'react'

/* ─── NDA text ─────────────────────────────────────────────────────────── */
const NDA_TEXT = `BETA TESTER NON-DISCLOSURE AGREEMENT

This Beta Tester Non-Disclosure Agreement ("Agreement") is entered into as of the date of electronic signature below, between Zeptio LLC, an Ohio Limited Liability Company ("Company"), and the individual whose name appears in the signature block below ("Beta Tester").

1. CONFIDENTIALITY

Beta Tester acknowledges that during participation in the Zeptio closed beta program, they may be exposed to non-public information including, without limitation, unreleased features, product roadmaps, source code, data, business strategies, user data, pricing, and other proprietary or sensitive materials (collectively, "Confidential Information"). Beta Tester agrees to hold all Confidential Information in strict confidence and shall not disclose, share, publish, or transmit any Confidential Information to any third party without the prior written consent of the Company.

2. NO SCREENSHOTS OR RECORDINGS

Beta Tester expressly agrees not to capture, record, publish, share, post, or otherwise distribute screenshots, screen recordings, photographs, audio recordings, or any other visual or audio reproduction of the Zeptio platform, its interface, content, levels, or features — publicly or privately — including but not limited to social media, forums, group chats, or any other digital medium, without express written permission from the Company.

3. NON-COMPETE AND NON-DERIVATION

Beta Tester agrees that they will not use knowledge, ideas, pedagogical methodologies, game mechanics, level structures, user experience patterns, or other insights gained through participation in the Zeptio beta program to design, develop, build, contribute to, or advise any competing product or service that teaches, trains, or gamifies AI prompting, prompt engineering, or related skills. This restriction shall apply for a period of twelve (12) months following the conclusion of Beta Tester's participation in the beta program.

4. FEEDBACK LICENSE

Any feedback, suggestions, bug reports, feature requests, ideas, or other input provided by Beta Tester to the Company ("Feedback") may be incorporated into, used to improve, or otherwise leveraged by Zeptio without restriction, compensation, attribution, or obligation of any kind. Beta Tester hereby irrevocably assigns to the Company all rights, title, and interest in and to any Feedback.

5. BINDING AGREEMENT

Beta Tester acknowledges that this Agreement constitutes a legally binding contract. By entering their full name in the signature field and clicking "I Agree & Request Access," Beta Tester affirms that they have read and fully understood this Agreement and agree to be bound by all of its terms and conditions. An electronic signature is considered valid and enforceable to the same extent as a handwritten signature under applicable law.

6. GOVERNING LAW

This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, United States of America, without regard to its conflict of law provisions. Any disputes arising out of or in connection with this Agreement shall be subject to the exclusive jurisdiction of the federal and state courts located in the State of Delaware.

7. TERM AND SURVIVAL

This Agreement is effective upon electronic signature and shall remain in full force and effect for the duration of Beta Tester's participation in the Zeptio beta program and for a period of two (2) years thereafter with respect to any Confidential Information received during the beta period. Sections 1, 2, 3, 4, and 6 shall survive termination of this Agreement.

8. REMEDIES

Beta Tester acknowledges that any breach of this Agreement may cause irreparable harm to the Company for which monetary damages may be an inadequate remedy, and that the Company shall be entitled to seek equitable relief, including injunction and specific performance, in addition to all other remedies available at law or in equity.

9. ENTIRE AGREEMENT

This Agreement constitutes the entire agreement between the parties with respect to its subject matter and supersedes all prior or contemporaneous negotiations, representations, warranties, or agreements, whether written or oral, relating thereto. This Agreement may not be modified except by a written instrument signed by both parties.`

/* ─── Types ─────────────────────────────────────────────────────────────── */
type Phase       = 'form' | 'nda' | 'success'
type SubmitState = 'idle' | 'loading' | 'error'

/* ─── Shared input style helpers ────────────────────────────────────────── */
const inputBase =
  'w-full rounded-xl px-4 py-3.5 text-base font-bold placeholder:text-white/25 outline-none transition-all duration-200'

function inputStyle(focused: boolean, hasError: boolean): React.CSSProperties {
  return {
    background: 'rgba(255,255,255,0.04)',
    border: `1.5px solid ${hasError ? '#f87171' : focused ? '#B87333' : 'rgba(232,232,232,0.12)'}`,
    color: '#E8E8E8',
  }
}

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function WaitlistForm() {
  /* form fields */
  const [firstName,  setFirstName]  = useState('')
  const [lastName,   setLastName]   = useState('')
  const [email,      setEmail]      = useState('')

  /* focus tracking for copper border on focus */
  const [focusedField, setFocusedField] = useState<string | null>(null)

  /* nda modal */
  const [phase,            setPhase]            = useState<Phase>('form')
  const [scrollProgress,   setScrollProgress]   = useState(0)
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const [signature,        setSignature]        = useState('')
  const [emailCopy,        setEmailCopy]        = useState(false)

  /* submission */
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [errMsg,      setErrMsg]      = useState('')

  const ndaRef = useRef<HTMLDivElement>(null)

  const fullName      = `${firstName.trim()} ${lastName.trim()}`
  const signatureValid = signature.trim().toLowerCase() === fullName.toLowerCase() && signature.trim().length > 0
  const canSubmit      = scrolledToBottom && signatureValid && submitState !== 'loading'
  const formReady      = firstName.trim() && lastName.trim() && email.trim()

  /* ── scroll tracking ── */
  const handleNdaScroll = useCallback(() => {
    const el = ndaRef.current
    if (!el) return
    const progress = (el.scrollTop + el.clientHeight) / el.scrollHeight
    const clamped = Math.min(progress, 1)
    setScrollProgress(clamped)
    if (clamped >= 0.97) setScrolledToBottom(true)
  }, [])

  /* ── open NDA ── */
  function openNda(e: React.FormEvent) {
    e.preventDefault()
    if (!formReady) return
    setPhase('nda')
    setScrollProgress(0)
    setScrolledToBottom(false)
    setSignature('')
    setEmailCopy(false)
    setSubmitState('idle')
    setErrMsg('')
  }

  /* ── agree & submit ── */
  async function handleAgree() {
    if (!canSubmit) return
    setSubmitState('loading')
    setErrMsg('')

    const res = await fetch('/api/nda', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:      fullName,
        email:     email.trim().toLowerCase(),
        signature: signature.trim(),
        wantsCopy: emailCopy,
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setErrMsg((data as { error?: string }).error ?? 'Something went wrong. Please try again.')
      setSubmitState('error')
      return
    }

    setPhase('success')
  }

  /* ── success view ── */
  if (phase === 'success') {
    return (
      <div className="flex flex-col items-center gap-6 py-4 text-center">
        <p
          className="font-mono font-black tracking-widest text-2xl"
          style={{ color: '#B87333', textShadow: '0 0 20px rgba(184,115,51,0.5)' }}
        >
          Zeptio
        </p>
        <div
          className="rounded-2xl px-8 py-6 flex flex-col gap-3"
          style={{
            background: 'rgba(184,115,51,0.06)',
            border: '1.5px solid rgba(184,115,51,0.3)',
          }}
        >
          <p className="text-base font-bold" style={{ color: '#E8E8E8' }}>
            Your request is under review.
          </p>
          <p className="text-sm" style={{ color: 'rgba(232,232,232,0.45)' }}>
            You&apos;ll hear from us soon.
          </p>
        </div>
        <a
          href="/auth/login"
          className="text-xs font-mono transition-opacity duration-200 hover:opacity-60"
          style={{ color: 'rgba(232,232,232,0.3)' }}
        >
          Already have access? Log in →
        </a>
      </div>
    )
  }

  /* ── main render ── */
  return (
    <>
      {/* ── Landing form ────────────────────────────────────────────── */}
      <form onSubmit={openNda} className="w-full flex flex-col gap-3" noValidate>

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
            style={inputStyle(focusedField === 'first', false)}
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
            style={inputStyle(focusedField === 'last', false)}
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
          style={inputStyle(focusedField === 'email', false)}
        />

        {/* Submit */}
        <button
          type="submit"
          disabled={!formReady}
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
          Review &amp; Sign NDA
        </button>

      </form>

      {/* ── NDA Full-screen Modal ────────────────────────────────────── */}
      {phase === 'nda' && (
        <div
          className="fixed inset-x-0 top-0 z-50 flex flex-col"
          style={{ background: '#0F0F0F', height: '100dvh' }}
          role="dialog"
          aria-modal="true"
          aria-label="Beta Tester Non-Disclosure Agreement"
        >

          {/* Top bar */}
          <div
            className="shrink-0 flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid rgba(232,232,232,0.08)' }}
          >
            <button
              onClick={() => setPhase('form')}
              className="text-sm font-mono transition-opacity duration-200 hover:opacity-60"
              style={{ color: 'rgba(232,232,232,0.4)' }}
              aria-label="Close NDA modal"
            >
              ← Back
            </button>
            <span
              className="font-mono font-black tracking-widest text-sm"
              style={{ color: '#B87333' }}
            >
              Zeptio
            </span>
            <div className="w-12" aria-hidden="true" />
          </div>

          {/* Scroll progress bar */}
          <div
            className="shrink-0 h-0.5 transition-all duration-300"
            style={{
              background: 'rgba(232,232,232,0.06)',
              position: 'relative',
            }}
            aria-hidden="true"
          >
            <div
              className="absolute inset-y-0 left-0 transition-all duration-200"
              style={{
                width: `${scrollProgress * 100}%`,
                background: scrolledToBottom
                  ? 'linear-gradient(90deg, #B87333, #E8A84A)'
                  : 'linear-gradient(90deg, rgba(184,115,51,0.5), rgba(184,115,51,0.8))',
              }}
            />
          </div>

          {/* NDA body — scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="max-w-2xl mx-auto w-full px-5 pt-1 pb-4 flex flex-col gap-0 sm:gap-3">

              {/* Title */}
              <h1
                className="text-base font-black tracking-wide text-center leading-snug"
                style={{ color: '#E8E8E8' }}
              >
                Beta Tester Non-Disclosure Agreement
              </h1>

              {/* Scroll hint */}
              {!scrolledToBottom && (
                <p
                  className="text-xs font-mono text-center pt-1"
                  style={{ color: 'rgba(184,115,51,0.6)' }}
                >
                  Scroll to the bottom of the agreement to unlock the signature field
                </p>
              )}

              {/* NDA text — viewport-capped scrollable box */}
              <div
                ref={ndaRef}
                onScroll={handleNdaScroll}
                className="rounded-xl px-5 py-5 text-xs font-mono leading-relaxed whitespace-pre-wrap overflow-y-scroll mt-2"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(232,232,232,0.08)',
                  color: 'rgba(232,232,232,0.55)',
                  maxHeight: 'min(16rem, 30vh)',
                  minHeight: '8rem',
                }}
              >
                {NDA_TEXT}
              </div>

              {/* Scroll complete badge */}
              {scrolledToBottom && (
                <div
                  className="flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-mono mt-2"
                  style={{
                    background: 'rgba(184,115,51,0.08)',
                    border: '1px solid rgba(184,115,51,0.25)',
                    color: '#B87333',
                  }}
                >
                  <span aria-hidden="true">✓</span>
                  Agreement reviewed — please sign below
                </div>
              )}

              {/* Signature field */}
              <div className="flex flex-col gap-1.5 mt-2">
                <label
                  className="text-xs font-mono"
                  style={{ color: scrolledToBottom ? 'rgba(232,232,232,0.5)' : 'rgba(232,232,232,0.2)' }}
                  htmlFor="nda-signature"
                >
                  Digital signature — type your full name exactly as entered
                  <span className="ml-1 font-bold" style={{ color: scrolledToBottom ? '#B87333' : 'rgba(184,115,51,0.3)' }}>
                    ({fullName})
                  </span>
                </label>
                <input
                  id="nda-signature"
                  type="text"
                  autoComplete="off"
                  placeholder={scrolledToBottom ? fullName : 'Scroll to the bottom of the NDA first'}
                  value={signature}
                  onChange={e => setSignature(e.target.value)}
                  disabled={!scrolledToBottom}
                  className={`${inputBase} font-mono`}
                  style={{
                    background: scrolledToBottom ? 'rgba(184,115,51,0.04)' : 'rgba(255,255,255,0.02)',
                    border: `1.5px solid ${
                      !scrolledToBottom
                        ? 'rgba(232,232,232,0.06)'
                        : signatureValid
                        ? '#B87333'
                        : 'rgba(232,232,232,0.15)'
                    }`,
                    color: signatureValid ? '#B87333' : '#E8E8E8',
                    cursor: scrolledToBottom ? 'text' : 'not-allowed',
                    opacity: scrolledToBottom ? 1 : 0.35,
                  }}
                  aria-disabled={!scrolledToBottom}
                />
                {signature.length > 0 && !signatureValid && scrolledToBottom && (
                  <p className="text-[10px] font-mono" style={{ color: 'rgba(248,113,113,0.7)' }}>
                    Must match &quot;{fullName}&quot; exactly
                  </p>
                )}
                {signatureValid && (
                  <p className="text-[10px] font-mono" style={{ color: '#B87333' }}>
                    ✓ Signature accepted
                  </p>
                )}
              </div>

              {/* Optional email copy checkbox */}
              <label
                className="flex items-start gap-3 cursor-pointer select-none rounded-xl px-4 py-3 transition-colors duration-150 mt-1"
                style={{
                  opacity: scrolledToBottom ? 1 : 0.3,
                  background: emailCopy ? 'rgba(184,115,51,0.06)' : 'rgba(255,255,255,0.02)',
                  border: `1.5px solid ${emailCopy ? 'rgba(184,115,51,0.3)' : 'rgba(232,232,232,0.08)'}`,
                }}
              >
                <div className="relative mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={emailCopy}
                    onChange={e => setEmailCopy(e.target.checked)}
                    disabled={!scrolledToBottom}
                    className="sr-only"
                  />
                  <div
                    className="rounded flex items-center justify-center transition-all duration-150"
                    style={{
                      width: '22px', height: '22px',
                      background: emailCopy ? '#B87333' : 'rgba(255,255,255,0.04)',
                      border: `2px solid ${emailCopy ? '#B87333' : 'rgba(232,232,232,0.25)'}`,
                    }}
                    aria-hidden="true"
                  >
                    {emailCopy && (
                      <svg width="13" height="10" viewBox="0 0 13 11" fill="none">
                        <path d="M1 5.5L5 9.5L12 1" stroke="#0F0F0F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold" style={{ color: 'rgba(232,232,232,0.6)' }}>
                    Optional: Email me a copy of this NDA
                  </span>
                  <span className="text-[10px] font-mono" style={{ color: 'rgba(232,232,232,0.3)' }}>
                    We&apos;ll send the full agreement text to {email || 'your email'}
                  </span>
                </div>
              </label>

            </div>
          </div>

          {/* Sticky footer — accept button always visible above keyboard */}
          <div
            className="shrink-0 px-5 py-4 max-w-2xl mx-auto w-full"
            style={{ borderTop: '1px solid rgba(232,232,232,0.06)' }}
          >
            {submitState === 'error' && (
              <p
                role="alert"
                className="text-xs font-mono rounded-xl px-4 py-3 break-all mb-3"
                style={{
                  background: 'rgba(248,113,113,0.08)',
                  border: '1px solid rgba(248,113,113,0.2)',
                  color: '#f87171',
                }}
              >
                {errMsg}
              </p>
            )}
            <button
              type="button"
              onClick={handleAgree}
              disabled={!canSubmit}
              className="w-full py-4 rounded-xl text-base font-black tracking-widest uppercase transition-all duration-200 focus-visible:outline-none"
              style={{
                background: canSubmit ? '#00FF88' : 'rgba(0,255,136,0.06)',
                color: canSubmit ? '#0F0F0F' : 'rgba(0,255,136,0.2)',
                border: `1.5px solid ${canSubmit ? '#00FF88' : 'rgba(0,255,136,0.15)'}`,
                boxShadow: canSubmit ? '0 0 28px rgba(0,255,136,0.4)' : 'none',
                cursor: canSubmit ? 'pointer' : 'not-allowed',
              }}
              aria-disabled={!canSubmit}
            >
              {submitState === 'loading' ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    aria-hidden="true"
                    className="inline-block w-4 h-4 rounded-full border-2 animate-spin"
                    style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#0F0F0F' }}
                  />
                  Submitting…
                </span>
              ) : (
                'I Accept & Request Access'
              )}
            </button>
          </div>

        </div>
      )}
    </>
  )
}
