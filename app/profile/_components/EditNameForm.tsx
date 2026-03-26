'use client'

import { useState } from 'react'
import { createClient } from '@/src/lib/supabase/client'

export default function EditNameForm({ initialName }: { initialName: string }) {
  const [editing, setEditing] = useState(false)
  const [name, setName]       = useState(initialName)
  const [draft, setDraft]     = useState(initialName)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleSave() {
    if (!draft.trim() || saving) return
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setSaving(false); return }
    const { error: err } = await supabase
      .from('profiles')
      .update({ name: draft.trim() })
      .eq('id', user.id)
    if (err) {
      setError(err.message)
    } else {
      setName(draft.trim())
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
    setSaving(false)
  }

  function handleCancel() {
    setDraft(name)
    setEditing(false)
    setError(null)
  }

  if (!editing) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">{name || '—'}</span>
          <button
            onClick={() => { setDraft(name); setEditing(true); setSaved(false) }}
            className="rounded-full px-3 py-1 text-xs font-bold font-mono border border-[#E86A4A]/25 bg-[#E86A4A]/10 text-[#E86A4A] hover:bg-[#E86A4A]/20 hover:border-[#E86A4A] transition-all duration-200"
          >
            Edit
          </button>
        </div>
        {saved && (
          <p className="text-xs font-mono animate-in fade-in duration-300" style={{ color: '#4ade80' }}>
            ✓ Name updated
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 flex-wrap">
        <input
          autoFocus
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel() }}
          disabled={saving}
          className="rounded-2xl px-4 py-2 text-lg font-bold outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#E86A4A] glass"
          style={{ color: '#0066CC', border: '1.5px solid #E86A4A', minWidth: '180px' }}
        />
        <button
          onClick={handleSave}
          disabled={saving || !draft.trim()}
          className="rounded-full px-4 py-2 text-xs font-bold transition-all duration-200"
          style={{ background: '#E86A4A', color: '#1F2B6B', opacity: saving || !draft.trim() ? 0.5 : 1 }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={handleCancel}
          className="rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 border border-white/10 hover:border-white/25"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-xs font-mono" style={{ color: '#f87171' }}>{error}</p>}
    </div>
  )
}
