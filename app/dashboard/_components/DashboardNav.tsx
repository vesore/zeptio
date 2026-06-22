'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

export default function DashboardNav() {
  const router   = useRouter()
  const pathname = usePathname()
  const isHome   = pathname === '/dashboard'

  return (
    <div className="fixed top-3 left-3 z-50 flex items-center gap-1">
      {!isHome && (
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-150 hover:bg-black/8 active:scale-95"
          style={{ color: '#AAAAAA' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      <Link
        href="/dashboard"
        aria-label="Home"
        className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-150 active:scale-95"
        style={{
          color:      isHome ? '#4A90E2' : '#AAAAAA',
          background: isHome ? 'rgba(74,144,226,0.12)' : 'transparent',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M2 6.5L8 2L14 6.5V13.5C14 13.78 13.78 14 13.5 14H10V10H6V14H2.5C2.22 14 2 13.78 2 13.5V6.5Z" stroke="currentColor" strokeWidth={isHome ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>
    </div>
  )
}
