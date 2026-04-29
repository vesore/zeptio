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
    } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="relative rounded-xl flex items-center gap-3 px-4 py-3 shrink-0"
      style={{
        background: '#FAFAFA',
        border: '1px solid #EEEEEE',
        borderLeft: `4px solid ${worldAccent}`,
      }}
      role="status"
      aria-label={`Today's focus: ${worldName}`}
    >
      <div className="flex-1 pl-1">
        <p className="text-xs font-mono font-semibold uppercase tracking-widest" style={{ color: worldAccent }}>
          Today&apos;s Focus
        </p>
        <p className="text-sm font-bold mt-0.5">
          <Link
            href={worldHref}
            className="transition-colors duration-200"
            style={{ color: worldAccent }}
          >
            {worldName}
          </Link>
          <span style={{ color: '#AAAAAA' }}>
            {' '}— You&apos;re weakest in this world
          </span>
        </p>
      </div>

      <button
        onClick={dismiss}
        className="shrink-0 text-xs font-mono rounded-full px-3 py-1 transition-all duration-200"
        style={{
          background: '#F5F5F5',
          border: '1px solid #E8E8E8',
          color: '#AAAAAA',
          cursor: 'pointer',
        }}
        aria-label="Dismiss today's focus suggestion"
        onMouseEnter={(e) => { e.currentTarget.style.color = '#1A1A1A'; e.currentTarget.style.borderColor = '#CCCCCC' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#AAAAAA'; e.currentTarget.style.borderColor = '#E8E8E8' }}
      >
        Dismiss
      </button>
    </div>
  )
}
