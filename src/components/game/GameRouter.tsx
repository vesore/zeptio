'use client'

import { useState } from 'react'
import WordBudget from './WordBudget'
import FillInTheBlank from './FillInTheBlank'
import RewriteChallenge from './RewriteChallenge'
import AudienceSwap from './AudienceSwap'
import TheShrink from './TheShrink'
import SpeedRound from './SpeedRound'
import ToneTranslator from './ToneTranslator'
import PromptDetective from './PromptDetective'
import FormatMaster from './FormatMaster'
import RoleAssignment from './RoleAssignment'
import HeadToHead from './HeadToHead'
import ChainPrompting from './ChainPrompting'
import SpotTheFlaw from './SpotTheFlaw'
import Reorder from './Reorder'
import MultipleChoice from './MultipleChoice'
import { DEFAULT_ROBOT_CONFIG, type RobotConfig } from '@/app/profile/_components/RobotSVG'
import type { GameType } from '@/src/lib/gameRandomizer'
import type { GeneratedChoice } from '@/src/lib/levelGenerator'

interface LevelConfig {
  world: 'clarity' | 'constraints' | 'structure' | 'debug' | 'mastery'
  level: number
  challenge: string
  criteria: string[]
  max_xp: number
}

interface GameRouterProps {
  gameType: GameType
  wordLimit: number
  levelConfig: LevelConfig
  levelId: number
  nextLevelUrl?: string
  robotConfig?: RobotConfig
  keyRule?: string
  isFirstVisit?: boolean
  fragments?: string[]
  choices?: GeneratedChoice[]
}

export default function GameRouter({
  gameType,
  wordLimit,
  levelConfig,
  levelId,
  nextLevelUrl,
  robotConfig = DEFAULT_ROBOT_CONFIG,
  keyRule,
  isFirstVisit = false,
  fragments,
  choices,
}: GameRouterProps) {
  const [ruleDismissed, setRuleDismissed] = useState(!isFirstVisit || !keyRule)

  if (!ruleDismissed && keyRule) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center px-4" style={{ background: '#FFFFFF' }}>
        <div
          className="w-full max-w-2xl mx-auto"
          style={{
            background: '#FAFAFA',
            border: '1px solid rgba(74,144,226,0.2)',
            borderRadius: '24px',
            padding: '40px 32px',
            boxShadow: '0 0 40px rgba(74,144,226,0.06)',
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-6 text-center"
            style={{ color: 'rgba(74,144,226,0.5)' }}
          >
            Key Rule
          </p>
          <p
            className="text-2xl sm:text-3xl font-black text-center leading-tight mb-4"
            style={{
              color: '#1A1A1A',
              textShadow: '0 0 20px rgba(74,144,226,0.15)',
              fontFamily: 'var(--font-fredoka)',
              letterSpacing: '0.02em',
            }}
          >
            &ldquo;{keyRule}&rdquo;
          </p>
          <p
            className="text-xs font-mono text-center mb-10"
            style={{ color: '#AAAAAA' }}
          >
            Game mode: {gameType.replace(/([A-Z])/g, ' $1').trim()}
          </p>
          <button
            onClick={() => setRuleDismissed(true)}
            className="w-full py-4 font-bold text-sm tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A90E2] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent btn-primary"
            autoFocus
          >
            Got it, let&apos;s play →
          </button>
        </div>
      </div>
    )
  }

  const gameProps = { levelConfig, levelId, nextLevelUrl, robotConfig }

  switch (gameType) {
    case 'FillInTheBlank':
      return <FillInTheBlank {...gameProps} />
    case 'RewriteChallenge':
      return <RewriteChallenge {...gameProps} />
    case 'AudienceSwap':
      return <AudienceSwap {...gameProps} />
    case 'TheShrink':
      return <TheShrink {...gameProps} />
    case 'SpeedRound':
      return <SpeedRound {...gameProps} />
    case 'ToneTranslator':
      return <ToneTranslator {...gameProps} />
    case 'PromptDetective':
      return <PromptDetective {...gameProps} />
    case 'FormatMaster':
      return <FormatMaster {...gameProps} />
    case 'RoleAssignment':
      return <RoleAssignment {...gameProps} />
    case 'HeadToHead':
      return <HeadToHead {...gameProps} />
    case 'ChainPrompting':
      return <ChainPrompting {...gameProps} />
    case 'SpotTheFlaw':
      return <SpotTheFlaw {...gameProps} />
    case 'Reorder':
      return <Reorder {...gameProps} fragments={fragments} />
    case 'MultipleChoice':
      return <MultipleChoice {...gameProps} choices={choices} />
    case 'WordBudget':
    default:
      return (
        <WordBudget
          goal={levelConfig.challenge}
          wordLimit={wordLimit}
          levelId={levelId}
          levelConfig={levelConfig}
          nextLevelUrl={nextLevelUrl}
          robotConfig={robotConfig}
        />
      )
  }
}
