'use client'

import { useState } from 'react'

interface Props {
  acceptAction: () => Promise<void>
}

export default function AgreementForm({ acceptAction }: Props) {
  const [agreed,  setAgreed]  = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!agreed || loading) return
    setLoading(true)
    await acceptAction()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Checkbox row */}
      <label
        className="flex items-start gap-3 cursor-pointer select-none group"
        htmlFor="agree-checkbox"
      >
        <div className="relative mt-0.5 shrink-0">
          <input
            id="agree-checkbox"
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="sr-only"
          />
          {/* Custom checkbox */}
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
        <span className="text-sm leading-relaxed" style={{ color: agreed ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)' }}>
          I have read the terms above and agree to keep Zeptio confidential during the beta.
        </span>
      </label>

      {/* Submit */}
      <button
        type="submit"
        disabled={!agreed || loading}
        aria-disabled={!agreed || loading}
        aria-busy={loading}
        className="w-full rounded-xl py-3.5 text-sm font-bold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8FF47] focus-visible:ring-offset-2 focus-visible:ring-offset-[#12122a]"
        style={{
          backgroundColor: agreed && !loading ? '#E8FF47' : 'rgba(232,255,71,0.12)',
          color:           agreed && !loading ? '#1a1a2e' : 'rgba(232,255,71,0.3)',
          cursor:          agreed && !loading ? 'pointer'  : 'not-allowed',
        }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block w-4 h-4 rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(232,255,71,0.15)', borderTopColor: 'rgba(232,255,71,0.6)' }}
            />
            Saving…
          </span>
        ) : (
          'I Agree — Take Me In →'
        )}
      </button>
    </form>
  )
}
