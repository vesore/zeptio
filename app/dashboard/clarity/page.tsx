import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'
import WordBudget from '@/src/components/game/WordBudget'

const LEVEL_CONFIG = {
  world: 'clarity' as const,
  level: 1,
  challenge: 'Explain what Zeptio does to someone who has never heard of it',
  criteria: [
    'The explanation is clear and understandable to a non-technical person',
    'The core value proposition is communicated concisely',
    'No jargon or unexplained buzzwords are used',
  ],
  max_xp: 100,
}

export default async function ClarityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <WordBudget
      goal="Explain what Zeptio does to someone who has never heard of it"
      wordLimit={30}
      levelId={1}
      levelConfig={LEVEL_CONFIG}
    />
  )
}
