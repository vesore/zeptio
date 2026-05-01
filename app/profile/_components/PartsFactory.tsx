'use client'

import { useState } from 'react'
import {
  ALL_PARTS,
  PARTS_BY_WORLD,
  WORLD_ACCENT,
  WORLD_SLOT,
  PART_BY_ID,
  type WorldName,
  type PartBodySlot,
  type PartDef,
} from '@/src/lib/seedParts'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PartsFactoryProps {
  worldPoints: Record<string, number>
  ownedPartIds: string[]
  equippedPartIds: string[]
}

// ── World metadata ────────────────────────────────────────────────────────────

const WORLD_ORDER: WorldName[] = ['clarity', 'constraints', 'structure', 'debug', 'mastery']

const WORLD_EMOJI: Record<WorldName, string> = {
  clarity:     '🧠',
  constraints: '⚙️',
  structure:   '🦾',
  debug:       '🔍',
  mastery:     '✨',
}

const WORLD_LABEL: Record<WorldName, string> = {
  clarity:     'Clarity',
  constraints: 'Constraints',
  structure:   'Structure',
  debug:       'Debug',
  mastery:     'Mastery',
}

// ── Robot Preview ─────────────────────────────────────────────────────────────

function SlotCircle({ label }: { label: string }) {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        border: '2px dashed #C8C8C8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#BBBBBB',
        fontSize: 14,
        fontWeight: 700,
        background: '#F5F5F5',
      }}
      title={label}
    >
      +
    </div>
  )
}

interface RobotPreviewProps {
  equipped: string[]
}

function RobotPreview({ equipped }: RobotPreviewProps) {
  // Find the best equipped part for each slot
  const slotPart: Partial<Record<PartBodySlot, PartDef>> = {}
  for (const id of equipped) {
    const part = PART_BY_ID[id]
    if (part) slotPart[part.slot] = part
  }

  function SlotIcon({ slot, label }: { slot: PartBodySlot; label: string }) {
    const part = slotPart[slot]
    if (!part) return <SlotCircle label={label} />
    const accent = WORLD_ACCENT[part.world]
    return <part.Icon color={accent} size={36} />
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        animation: 'robotBob 2s ease-in-out infinite',
      }}
    >
      <style>{`
        @keyframes robotBob {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-3px); }
        }
      `}</style>

      {/* Head */}
      <div
        style={{
          width: 72,
          height: 64,
          background: '#FFFFFF',
          border: '2px solid #D0D0D0',
          borderRadius: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        {/* Eyes slot — centered in head */}
        <SlotIcon slot="eyes" label="Eyes" />
        {/* Brain slot — top-left corner */}
        <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)' }}>
          <SlotIcon slot="brain" label="Brain" />
        </div>
      </div>

      {/* Neck */}
      <div
        style={{
          width: 20,
          height: 10,
          background: '#E0E0E0',
          borderRadius: 4,
        }}
      />

      {/* Torso row: left arm + torso + right arm */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
        {/* Left arm */}
        <div
          style={{
            width: 32,
            height: 80,
            background: '#FFFFFF',
            border: '2px solid #D0D0D0',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <SlotIcon slot="arms" label="Arms" />
        </div>

        {/* Torso */}
        <div
          style={{
            width: 72,
            height: 96,
            background: '#FFFFFF',
            border: '2px solid #D0D0D0',
            borderRadius: 16,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          {/* Core slot — center torso */}
          <SlotIcon slot="core" label="Core" />
          {/* Gears slot — lower torso */}
          <SlotIcon slot="gears" label="Gears" />
        </div>

        {/* Right arm (mirror) */}
        <div
          style={{
            width: 32,
            height: 80,
            background: '#FFFFFF',
            border: '2px solid #D0D0D0',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <SlotIcon slot="arms" label="Arms" />
        </div>
      </div>

      {/* Legs */}
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        {[0, 1].map(i => (
          <div
            key={i}
            style={{
              width: 24,
              height: 28,
              background: '#E8E8E8',
              borderRadius: '0 0 10px 10px',
              border: '2px solid #D0D0D0',
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ── Part Card ─────────────────────────────────────────────────────────────────

interface PartCardProps {
  part: PartDef
  isOwned: boolean
  isEquipped: boolean
  balance: number
  onEquip: (partId: string, equip: boolean) => void
  onBuy: (partId: string) => void
}

function PartCard({ part, isOwned, isEquipped, balance, onEquip, onBuy }: PartCardProps) {
  const accent = WORLD_ACCENT[part.world]
  const isAccessory = part.tier === 'accessory'
  const canAfford = isAccessory && !isOwned && (balance >= (part.cost ?? 0))
  const tooExpensive = isAccessory && !isOwned && !canAfford

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: isEquipped ? `1.5px solid ${accent}` : '1.5px solid #E8E8E8',
        borderRadius: 16,
        padding: 10,
        width: 88,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        opacity: tooExpensive ? 0.6 : (!isOwned && !isAccessory ? 0.5 : 1),
        position: 'relative',
      }}
    >
      {/* Icon */}
      <part.Icon color={isOwned ? accent : '#BBBBBB'} size={32} />

      {/* Name */}
      <p
        className="nunito"
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: '#1A1A1A',
          textAlign: 'center',
          lineHeight: 1.2,
          margin: 0,
        }}
      >
        {part.name}
      </p>

      {/* Status / action */}
      {isOwned && isEquipped && (
        <>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              background: `${accent}22`,
              color: accent,
              borderRadius: 9999,
              padding: '2px 6px',
              letterSpacing: '0.03em',
            }}
          >
            Equipped
          </span>
          <button
            onClick={() => onEquip(part.id, false)}
            style={{
              background: `${accent}18`,
              color: accent,
              borderRadius: 9999,
              padding: '4px 8px',
              fontSize: 10,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Unequip
          </button>
        </>
      )}

      {isOwned && !isEquipped && (
        <button
          onClick={() => onEquip(part.id, true)}
          style={{
            background: accent,
            color: '#FFFFFF',
            borderRadius: 9999,
            padding: '4px 8px',
            fontSize: 10,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Equip
        </button>
      )}

      {!isOwned && isAccessory && canAfford && (
        <button
          onClick={() => onBuy(part.id)}
          style={{
            background: accent,
            color: '#FFFFFF',
            borderRadius: 9999,
            padding: '4px 8px',
            fontSize: 10,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'center',
          }}
        >
          Buy — {part.cost} pts
        </button>
      )}

      {!isOwned && isAccessory && tooExpensive && (
        <p
          style={{
            fontSize: 10,
            color: '#AAAAAA',
            fontWeight: 600,
            textAlign: 'center',
            margin: 0,
          }}
        >
          {part.cost} pts
        </p>
      )}

      {!isOwned && !isAccessory && (
        <p
          style={{
            fontSize: 9,
            color: '#AAAAAA',
            textAlign: 'center',
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          🔒 {part.description}
        </p>
      )}
    </div>
  )
}

// ── Scrollable row with hidden scrollbar ──────────────────────────────────────

function ScrollRow({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        .parts-scroll-row::-webkit-scrollbar { display: none; }
        .parts-scroll-row { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <div
        className="parts-scroll-row"
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 4,
        }}
      >
        {children}
      </div>
    </>
  )
}

// ── World Section ─────────────────────────────────────────────────────────────

interface WorldSectionProps {
  world: WorldName
  parts: PartDef[]
  balance: number
  owned: string[]
  equipped: string[]
  onEquip: (partId: string, equip: boolean) => void
  onBuy: (partId: string) => void
}

function WorldSection({ world, parts, balance, owned, equipped, onEquip, onBuy }: WorldSectionProps) {
  const accent = WORLD_ACCENT[world]
  const autoParts = parts.filter(p => p.tier !== 'accessory')
  const accessories = parts.filter(p => p.tier === 'accessory')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Section header */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E8E8E8',
          borderRadius: 16,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>{WORLD_EMOJI[world]}</span>
          <span
            className="fredoka"
            style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}
          >
            {WORLD_LABEL[world]}
          </span>
        </div>
        <span
          style={{
            background: `${accent}18`,
            color: accent,
            borderRadius: 9999,
            padding: '3px 10px',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {balance} pts
        </span>
      </div>

      {/* Auto-unlock row */}
      <ScrollRow>
        {autoParts.map(part => (
          <PartCard
            key={part.id}
            part={part}
            isOwned={owned.includes(part.id)}
            isEquipped={equipped.includes(part.id)}
            balance={balance}
            onEquip={onEquip}
            onBuy={onBuy}
          />
        ))}
      </ScrollRow>

      {/* Accessories row */}
      {accessories.length > 0 && (
        <>
          <p
            className="nunito"
            style={{ fontSize: 11, fontWeight: 700, color: '#999999', margin: 0, paddingLeft: 2, letterSpacing: '0.04em', textTransform: 'uppercase' }}
          >
            Accessories
          </p>
          <ScrollRow>
            {accessories.map(part => (
              <PartCard
                key={part.id}
                part={part}
                isOwned={owned.includes(part.id)}
                isEquipped={equipped.includes(part.id)}
                balance={balance}
                onEquip={onEquip}
                onBuy={onBuy}
              />
            ))}
          </ScrollRow>
        </>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PartsFactory({
  worldPoints,
  ownedPartIds,
  equippedPartIds,
}: PartsFactoryProps) {
  const [owned, setOwned] = useState<string[]>(ownedPartIds)
  const [equipped, setEquipped] = useState<string[]>(equippedPartIds)
  const [balances, setBalances] = useState<Record<string, number>>(worldPoints)

  async function handleEquip(partId: string, equip: boolean) {
    // Optimistic update
    setEquipped(prev =>
      equip ? [...prev, partId] : prev.filter(id => id !== partId)
    )

    try {
      await fetch('/api/parts/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ part_id: partId, equipped: equip }),
      })
    } catch {
      // Revert on error
      setEquipped(prev =>
        equip ? prev.filter(id => id !== partId) : [...prev, partId]
      )
    }
  }

  async function handleBuy(partId: string) {
    const part = PART_BY_ID[partId]
    if (!part || part.cost == null) return

    const world = part.world
    const currentBalance = balances[world] ?? 0
    if (currentBalance < part.cost) return

    try {
      const res = await fetch('/api/parts/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ part_id: partId }),
      })
      if (res.ok) {
        setOwned(prev => [...prev, partId])
        setBalances(prev => ({
          ...prev,
          [world]: (prev[world] ?? 0) - part.cost!,
        }))
      }
    } catch {
      // silently ignore
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Robot Preview */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8, paddingBottom: 8 }}>
        <RobotPreview equipped={equipped} />
        <p
          className="nunito"
          style={{ fontSize: 11, color: '#AAAAAA', fontWeight: 600, marginTop: 10, letterSpacing: '0.04em' }}
        >
          EQUIPPED PARTS PREVIEW
        </p>
      </div>

      {/* World Sections */}
      {WORLD_ORDER.map(world => (
        <WorldSection
          key={world}
          world={world}
          parts={PARTS_BY_WORLD[world] ?? []}
          balance={balances[world] ?? 0}
          owned={owned}
          equipped={equipped}
          onEquip={handleEquip}
          onBuy={handleBuy}
        />
      ))}

    </div>
  )
}
