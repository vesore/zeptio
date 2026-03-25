import { createClient } from '@/src/lib/supabase/server'
import { scoreResponse, type LevelConfig } from '@/src/lib/scoring/engine'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  // Validate auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse and validate body
  let body: { user_prompt?: unknown; level_config?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { user_prompt, level_config } = body

  if (typeof user_prompt !== 'string' || !user_prompt.trim()) {
    return NextResponse.json({ error: 'user_prompt must be a non-empty string' }, { status: 400 })
  }

  if (!level_config || typeof level_config !== 'object') {
    return NextResponse.json({ error: 'level_config must be an object' }, { status: 400 })
  }

  // Call the scoring engine
  try {
    const result = await scoreResponse(user_prompt, level_config as LevelConfig)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: 'Scoring service misconfigured' }, { status: 500 })
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: 'Scoring service busy, please retry' }, { status: 429 })
    }
    if (error instanceof Anthropic.APIError) {
      console.error('[score] Anthropic.APIError', error.status, error.message, error.error)
      return NextResponse.json({ error: 'Scoring service error' }, { status: 502 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
