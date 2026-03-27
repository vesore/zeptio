'use client'

import { useState } from 'react'

interface WaitlistRow {
  id: number
  name: string | null
  email: string
  created_at: string
  accepted_nda: boolean
  status: string | null
}

export default function WaitlistTable({ rows: initialRows }: { rows: WaitlistRow[] }) {
  const [rows, setRows] = useState(initialRows)
  const [loading, setLoading] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleApprove(row: WaitlistRow) {
    setLoading(row.id)
    setError(null)
    try {
      const res = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: row.email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setRows(prev => prev.map(r => r.id === row.id ? { ...r, status: 'approved' } : r))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(null)
    }
  }

  const pending = rows.filter(r => r.status !== 'approved').length

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Waitlist</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Manage beta access approvals
          </p>
        </div>
        <span
          className="rounded-full px-4 py-2 text-sm font-bold"
          style={{
            background: pending > 0 ? 'rgba(176,224,32,0.12)' : 'rgba(255,255,255,0.06)',
            color: pending > 0 ? '#B0E020' : 'rgba(255,255,255,0.4)',
            border: `1px solid ${pending > 0 ? 'rgba(176,224,32,0.3)' : 'rgba(255,255,255,0.1)'}`,
          }}
        >
          {pending} pending approval{pending !== 1 ? 's' : ''}
        </span>
      </div>

      {error && (
        <p
          className="text-sm rounded-2xl px-4 py-3"
          style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}
        >
          {error}
        </p>
      )}

      {/* Table */}
      <div className="rounded-3xl overflow-hidden glass" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Name', 'Email', 'Date Signed Up', 'NDA Accepted', 'Status'].map(col => (
                <th
                  key={col}
                  className="text-left px-5 py-4 font-mono text-xs uppercase tracking-widest font-semibold"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  No signups yet.
                </td>
              </tr>
            )}
            {rows.map((row, i) => (
              <tr
                key={row.id}
                style={{
                  borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  background: row.status === 'approved' ? 'rgba(34,197,94,0.03)' : 'transparent',
                }}
              >
                <td className="px-5 py-4 font-medium text-white">
                  {row.name ?? <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>}
                </td>
                <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  {row.email}
                </td>
                <td className="px-5 py-4 font-mono text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {new Date(row.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </td>
                <td className="px-5 py-4">
                  {row.accepted_nda ? (
                    <span
                      className="rounded-full px-3 py-1 text-xs font-bold"
                      style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}
                    >
                      Yes
                    </span>
                  ) : (
                    <span
                      className="rounded-full px-3 py-1 text-xs font-bold"
                      style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}
                    >
                      No
                    </span>
                  )}
                </td>
                <td className="px-5 py-4">
                  {row.status === 'approved' ? (
                    <span
                      className="rounded-full px-3 py-1 text-xs font-bold"
                      style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}
                    >
                      Approved
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApprove(row)}
                      disabled={loading === row.id}
                      className="rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200"
                      style={{
                        background: 'rgba(176,224,32,0.1)',
                        color: '#B0E020',
                        border: '1px solid rgba(176,224,32,0.3)',
                        cursor: loading === row.id ? 'not-allowed' : 'pointer',
                        opacity: loading === row.id ? 0.5 : 1,
                      }}
                      onMouseEnter={e => { if (loading !== row.id) { e.currentTarget.style.background = 'rgba(176,224,32,0.2)'; e.currentTarget.style.borderColor = '#B0E020' }}}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(176,224,32,0.1)'; e.currentTarget.style.borderColor = 'rgba(176,224,32,0.3)' }}
                    >
                      {loading === row.id ? 'Sending…' : 'Approve'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
