'use client'

import { useState } from 'react'
import { createClient } from '@/src/lib/supabase/client'

const WORLD_OPTIONS = [
  { value: '',            label: 'None selected',          disabled: false },
  { value: 'clarity',    label: '◎ Clarity',              disabled: false },
  { value: 'constraints', label: '⬡ Constraints',         disabled: false },
  { value: 'structure',  label: '▦ Structure (coming soon)', disabled: true },
  { value: 'debug',      label: '⟁ Debug (coming soon)',  disabled: true },
]

interface ProfileExtrasFormProps {
  initialBio: string
  initialFavoriteWorld: string
}

export default function ProfileExtrasForm({ initialBio, initialFavoriteWorld }: ProfileExtrasFormProps) {
  const [bio, setBio]                   = useState(initialBio)
  const [favoriteWorld, setFavoriteWorld] = useState(initialFavoriteWorld)
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)
  const [error, setError]               = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Not authenticated'); return }
      const { error: err } = await supabase
        .from('profiles')
        .update({ bio: bio.trim(), favorite_world: favoriteWorld })
        .eq('id', user.id)
      if (err) {
        setError(err.message)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Bio */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="bio-input"
          className="text-xs font-mono font-semibold uppercase tracking-widest"
          style={{ color: '#00FF88' }}
        >
          Bio
        </label>
        <div className="relative">
          <input
            id="bio-input"
            type="text"
            value={bio}
            onChange={e => { setBio(e.target.value.slice(0, 60)); setSaved(false) }}
            placeholder="Describe yourself in one line…"
            maxLength={60}
            className="w-full rounded-2xl px-4 py-3 pr-14 text-sm font-medium outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#00FF88] glass placeholder:text-white/25"
            style={{ color: 'white', border: '1.5px solid rgba(255,255,255,0.1)' }}
            onFocus={e => { e.target.style.borderColor = '#00FF88' }}
            onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
          />
          <span
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono tabular-nums pointer-events-none"
            style={{ color: bio.length >= 55 ? '#f87171' : 'rgba(255,255,255,0.25)' }}
          >
            {bio.length}/60
          </span>
        </div>
      </div>

      {/* Favorite World */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="world-select"
          className="text-xs font-mono font-semibold uppercase tracking-widest"
          style={{ color: '#00FF88' }}
        >
          Favorite World
        </label>
        <select
          id="world-select"
          value={favoriteWorld}
          onChange={e => { setFavoriteWorld(e.target.value); setSaved(false) }}
          className="w-full rounded-2xl px-4 py-3 text-sm font-medium outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#00FF88] glass appearance-none"
          style={{
            color: favoriteWorld ? 'white' : 'rgba(255,255,255,0.4)',
            border: '1.5px solid rgba(255,255,255,0.1)',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='rgba(176,224,32,0.6)' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 1rem center',
          }}
        >
          {WORLD_OPTIONS.map(opt => (
            <option
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled}
              style={{ background: '#0F0F0F', color: opt.disabled ? 'rgba(255,255,255,0.3)' : 'white' }}
            >
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-xs font-mono rounded-xl px-4 py-2" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
          {error}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 rounded-full font-bold text-sm tracking-wide transition-all duration-200 btn-primary"
      >
        {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Profile'}
      </button>

    </div>
  )
}
