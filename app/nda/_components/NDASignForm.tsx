'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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

Beta Tester acknowledges that this Agreement constitutes a legally binding contract. By entering their full name in the signature field and clicking "I Accept & Request Access," Beta Tester affirms that they have read and fully understood this Agreement and agree to be bound by all of its terms and conditions. An electronic signature is considered valid and enforceable to the same extent as a handwritten signature under applicable law.

6. GOVERNING LAW

This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, United States of America, without regard to its conflict of law provisions. Any disputes arising out of or in connection with this Agreement shall be subject to the exclusive jurisdiction of the federal and state courts located in the State of Delaware.

7. TERM AND SURVIVAL

This Agreement is effective upon electronic signature and shall remain in full force and effect for the duration of Beta Tester's participation in the Zeptio beta program and for a period of two (2) years thereafter with respect to any Confidential Information received during the beta period. Sections 1, 2, 3, 4, and 6 shall survive termination of this Agreement.

8. REMEDIES

Beta Tester acknowledges that any breach of this Agreement may cause irreparable harm to the Company for which monetary damages may be an inadequate remedy, and that the Company shall be entitled to seek equitable relief, including injunction and specific performance, in addition to all other remedies available at law or in equity.

9. ENTIRE AGREEMENT

This Agreement constitutes the entire agreement between the parties with respect to its subject matter and supersedes all prior or contemporaneous negotiations, representations, warranties, or agreements, whether written or oral, relating thereto. This Agreement may not be modified except by a written instrument signed by both parties.`

const inputBase =
  'w-full rounded-xl px-4 py-3.5 text-base font-bold placeholder:text-white/25 outline-none transition-all duration-200'

interface Props {
  firstName: string
  lastName: string
  email: string
}

export default function NDASignForm({ firstName, lastName, email }: Props) {
  const router = useRouter()
  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()

  const [signature,  setSignature]  = useState('')
  const [emailCopy,  setEmailCopy]  = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [errMsg,     setErrMsg]     = useState('')

  const signatureValid = signature.trim().toLowerCase() === fullName.toLowerCase() && signature.trim().length > 0
  const canSubmit      = signatureValid && !loading

  async function handleAccept() {
    if (!canSubmit) return
    setLoading(true)
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
      setLoading(false)
      return
    }

    router.push('/?success=1')
  }

  return (
    <main
      className="min-h-screen w-full overflow-x-hidden"
      style={{ background: '#0F0F0F', color: '#E8E8E8' }}
    >
      <div className="max-w-2xl mx-auto px-5 pt-10 pb-16 flex flex-col gap-8">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3 text-center">
          <img
            src="/icon.svg"
            alt="Zeptio"
            width={72}
            height={72}
            style={{ borderRadius: '16px', filter: 'drop-shadow(0 0 18px rgba(0,255,136,0.25))' }}
          />
          <p
            className="font-mono font-black tracking-widest text-4xl uppercase"
            style={{ color: '#00FF88', textShadow: '0 0 24px rgba(0,255,136,0.4)' }}
          >
            ZEPTIO
          </p>
        </div>

        {/* Back link */}
        <a
          href="/"
          className="text-sm font-mono transition-opacity duration-200 hover:opacity-60 -mt-4"
          style={{ color: 'rgba(232,232,232,0.35)' }}
        >
          ← Back
        </a>

        {/* Heading */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black tracking-tight" style={{ color: '#E8E8E8' }}>
            Beta Tester NDA
          </h1>
          <p className="text-sm font-mono" style={{ color: 'rgba(232,232,232,0.4)' }}>
            Signing as <span style={{ color: '#B87333' }}>{fullName || 'unknown'}</span>
            {email && <> &middot; {email}</>}
          </p>
        </div>

        {/* NDA text — full, just scrolls with the page */}
        <div
          className="rounded-xl px-5 py-6 text-xs font-mono leading-relaxed whitespace-pre-wrap"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(232,232,232,0.08)',
            color: 'rgba(232,232,232,0.6)',
          }}
        >
          {NDA_TEXT}
        </div>

        {/* Signature */}
        <div className="flex flex-col gap-2">
          <label
            className="text-sm font-bold"
            style={{ color: '#B87333' }}
            htmlFor="signature"
          >
            Type your full name to sign:
            <span className="ml-1 font-mono text-xs font-normal" style={{ color: 'rgba(232,232,232,0.35)' }}>
              (must match &ldquo;{fullName}&rdquo;)
            </span>
          </label>
          <input
            id="signature"
            type="text"
            autoComplete="off"
            placeholder="Type your exact full name here"
            value={signature}
            onChange={e => setSignature(e.target.value)}
            className={inputBase}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1.5px solid ${signatureValid ? '#B87333' : signature.length > 0 ? '#f87171' : 'rgba(184,115,51,0.4)'}`,
              color: '#E8E8E8',
            }}
          />
          {signature.length > 0 && !signatureValid && (
            <p className="text-xs font-mono" style={{ color: 'rgba(248,113,113,0.7)' }}>
              Must match &quot;{fullName}&quot; exactly
            </p>
          )}
          {signatureValid && (
            <p className="text-xs font-mono" style={{ color: '#B87333' }}>
              ✓ Signature accepted
            </p>
          )}
          <p className="text-[11px] font-mono" style={{ color: 'rgba(232,232,232,0.25)' }}>
            Your typed name serves as your legally binding digital signature
          </p>
        </div>

        {/* Optional email copy */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={emailCopy}
            onChange={e => setEmailCopy(e.target.checked)}
            className="w-4 h-4 rounded cursor-pointer"
            style={{ accentColor: '#B87333' }}
          />
          <span className="text-sm font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Optional: Send me a copy of this agreement via email
          </span>
        </label>

        {/* Error */}
        {errMsg && (
          <p
            role="alert"
            className="text-xs font-mono rounded-xl px-4 py-3 break-all"
            style={{
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.2)',
              color: '#f87171',
            }}
          >
            {errMsg}
          </p>
        )}

        {/* Accept button */}
        <button
          type="button"
          onClick={handleAccept}
          disabled={!canSubmit}
          className="w-full py-5 rounded-xl text-base font-black tracking-widest uppercase transition-all duration-200 focus-visible:outline-none"
          style={{
            background: canSubmit ? '#00FF88' : 'rgba(0,255,136,0.06)',
            color: canSubmit ? '#0F0F0F' : 'rgba(0,255,136,0.2)',
            border: `1.5px solid ${canSubmit ? '#00FF88' : 'rgba(0,255,136,0.15)'}`,
            boxShadow: canSubmit ? '0 0 28px rgba(0,255,136,0.35)' : 'none',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
          aria-disabled={!canSubmit}
        >
          {loading ? (
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

        <p className="text-xs font-mono text-center" style={{ color: 'rgba(232,232,232,0.2)' }}>
          © 2026 Zeptio LLC. All rights reserved.
        </p>

      </div>
    </main>
  )
}
