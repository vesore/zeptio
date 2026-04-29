'use client'

import { useState, useEffect } from 'react'
import { getSoundEnabled, setSoundEnabled } from '@/src/lib/sounds'

export default function SoundToggle() {
  const [on, setOn] = useState(false)

  useEffect(() => {
    setOn(getSoundEnabled())
  }, [])

  function toggle() {
    const next = !on
    setOn(next)
    setSoundEnabled(next)
  }

  return (
    <button
      onClick={toggle}
      aria-label={on ? 'Mute sounds' : 'Enable sounds'}
      title={on ? 'Sound on' : 'Sound off'}
      className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200"
      style={{
        background: on ? '#F0F0F0' : 'transparent',
        border: `1.5px solid ${on ? '#D0D0D0' : '#E8E8E8'}`,
        color: on ? '#1A1A1A' : '#BBBBBB',
        fontSize: '15px',
        cursor: 'pointer',
      }}
    >
      {on ? '🔊' : '🔇'}
    </button>
  )
}
