export interface ConstraintsLevel {
  id: number       // 11–20 (DB identifier, avoids collision with Clarity 1–10)
  title: string
  concept: string
  description: string
  goal: string
  wordLimit: number
  criteria: string[]
  max_xp: number
}

export const CONSTRAINTS_LEVELS: ConstraintsLevel[] = [
  {
    id: 11,
    title: 'Under the Limit',
    concept: 'Word Constraint',
    description: 'The tightest constraint is a word count. Learn to demand brevity from the start.',
    goal: 'Ask an AI to give you 3 tips for better sleep — in 10 words or fewer total.',
    wordLimit: 15,
    criteria: [
      'The output word limit is explicitly stated (10 words or fewer)',
      'The number of items is specified (3 tips)',
      'The topic is clearly stated',
    ],
    max_xp: 100,
  },
  {
    id: 12,
    title: "Child's Terms",
    concept: 'Simplicity Constraint',
    description: 'Forcing plain language reveals how well you understand what you want explained.',
    goal: 'Ask an AI to explain what a password manager does — using only words a 7-year-old would understand.',
    wordLimit: 20,
    criteria: [
      'Audience reading level is explicitly set (7-year-old vocabulary)',
      'The topic is precisely stated',
      'The simplicity constraint is unambiguous',
    ],
    max_xp: 150,
  },
  {
    id: 13,
    title: 'Format Lock',
    concept: 'Format Constraint',
    description: "Prohibiting a format is as powerful as requiring one. Tell the AI what it can't do.",
    goal: 'Ask an AI to list the main benefits of drinking water — as bullet points only, no full sentences or prose.',
    wordLimit: 20,
    criteria: [
      'Output format is explicitly specified (bullet points only)',
      'Prose is explicitly prohibited',
      'The topic is clearly stated',
    ],
    max_xp: 150,
  },
  {
    id: 14,
    title: 'Short + Simple',
    concept: 'Dual Constraints',
    description: 'Two constraints together: a word cap and an audience. Neither works without the other.',
    goal: 'Ask an AI to explain what a firewall does — in under 20 words, for someone who has never worked in tech.',
    wordLimit: 25,
    criteria: [
      'Output word limit is specified (under 20 words)',
      'Audience is defined (no tech background)',
      'The topic is precisely stated',
    ],
    max_xp: 200,
  },
  {
    id: 15,
    title: 'Tone + Structure',
    concept: 'Combined Constraints',
    description: 'Tone tells the AI how to sound. Structure tells it how to arrange. Both together is a real constraint.',
    goal: 'Ask an AI to outline 3 risks of social media for teenagers — in a formal tone, as a numbered list.',
    wordLimit: 30,
    criteria: [
      'Tone is explicitly specified (formal)',
      'Output structure is defined (numbered list)',
      'The quantity is bounded (3 risks)',
      'Target subject is specified (teenagers)',
    ],
    max_xp: 250,
  },
  {
    id: 16,
    title: 'No Jargon',
    concept: 'Language Constraint',
    description: "Banning jargon forces clarity. It's one of the most practical constraints in professional prompting.",
    goal: 'Ask an AI to describe how a recommendation algorithm works — without using any technical terms, in under 50 words.',
    wordLimit: 30,
    criteria: [
      'Technical language is explicitly prohibited',
      'Output length is capped',
      'The topic is clearly stated',
    ],
    max_xp: 300,
  },
  {
    id: 17,
    title: 'Triple Lock',
    concept: 'Three Constraints',
    description: 'Three constraints at once — audience, format, and per-item length. Every element must be explicit.',
    goal: 'Ask an AI to explain the benefits of daily exercise — for time-pressed professionals, in exactly 3 bullet points, each under 15 words.',
    wordLimit: 35,
    criteria: [
      'Audience is specified (time-pressed professionals)',
      'Output format is locked (bullet points with exact count)',
      'Per-item word count is explicitly constrained',
      'The topic is clearly stated',
    ],
    max_xp: 350,
  },
  {
    id: 18,
    title: 'Executive Brief',
    concept: 'Real-World Multi-Constraint',
    description: 'A real board brief needs audience, tone, format, and language rules — all at once. No guessing allowed.',
    goal: 'Ask an AI to summarize the top 3 risks of adopting AI tools in a business — for a non-technical board of directors, formal tone, no buzzwords, bullet points.',
    wordLimit: 40,
    criteria: [
      'Audience is defined (non-technical board)',
      'Tone is specified (formal)',
      'Prohibited language is stated (no buzzwords)',
      'Format is specified (bullet points)',
      'Quantity is bounded (top 3 risks)',
    ],
    max_xp: 400,
  },
  {
    id: 19,
    title: 'The Tight Brief',
    concept: 'Role + Multi-Constraint',
    description: 'Combining a role with strict output constraints is expert-level prompting. Every word must earn its place.',
    goal: 'Ask an AI — acting as a brand strategist — to write a tagline for an eco-friendly water bottle: under 8 words, no environmental clichés, targeting urban millennials.',
    wordLimit: 45,
    criteria: [
      'A specific expert role is assigned to the AI',
      'Output length is strictly capped (under 8 words)',
      'A content prohibition is stated (no clichés)',
      'Target audience is defined (urban millennials)',
      'Product context is clearly established',
    ],
    max_xp: 450,
  },
  {
    id: 20,
    title: 'Full Constraint Stack',
    concept: 'Master Composition',
    description: 'Every constraint type in one prompt: tone, length, structure, style rule, and content requirement. This is the ceiling.',
    goal: 'Ask an AI to write a client email explaining a 2-week project delay — formal tone, under 100 words, 3 short paragraphs, active voice only, final paragraph must include next steps and a specific date.',
    wordLimit: 55,
    criteria: [
      'Tone is precisely specified (formal)',
      'Output length is capped (under 100 words)',
      'Structure is fully defined (3 short paragraphs)',
      'A stylistic rule is stated (active voice only)',
      'A content requirement for the final paragraph is explicit (next steps + date)',
      'Full context is established (client email, project delay)',
    ],
    max_xp: 600,
  },
]
