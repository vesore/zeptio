'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface DailySuggestionProps {
  worldName: string
  worldHref: string
  worldAccent: string
}

const STORAGE_KEY = 'zeptio-suggestion-dismissed'

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0]
}

export default function DailySuggestion({ worldName, worldHref, worldAccent }: DailySuggestionProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY)
      if (dismissed !== getTodayKey()) {
        setVisible(true)
      }
    } catch {
      setVisible(true)
    }
  }, [])

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, getTodayKey())
    } catch {
      // ignore
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="relative rounded-xl flex items-center gap-3 px-4 py-3 shrink-0"
      style={{
        background: 'rgba(184,115,51,0.08)',
        border: '1px solid rgba(184,115,51,0.25)',
        boxShadow: '0 0 16px rgba(184,115,51,0.08)',
      }}
      role="status"
      aria-label={`Today's focus: ${worldName}`}
    >
      {/* Copper left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 rounded-l-xl"
        style={{ width: '3px', background: '#B87333' }}
        aria-hidden="true"
      />

      <div className="flex-1 pl-1">
        <p className="text-xs font-mono font-semibold uppercase tracking-widest" style={{ color: '#B87333' }}>
          Today&apos;s Focus
        </p>
        <p className="text-sm font-bold mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
          <Link
            href={worldHref}
            className="transition-colors duration-200"
            style={{ color: worldAccent }}
          >
            {worldName}
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>
            {' '}— You&apos;re weakest in this world
          </span>
        </p>
      </div>

      <button
        onClick={dismiss}
        className="shrink-0 text-xs font-mono rounded-full px-3 py-1 transition-all duration-200"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.3)',
        }}
        aria-label="Dismiss today's focus suggestion"
        onMouseEnter={(e) => { e.currentTarget.style.color = '#B87333'; e.currentTarget.style.borderColor = 'rgba(184,115,51,0.4)' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
      >
        Dismiss
      </button>
    </div>
  )
}
