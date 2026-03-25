export interface ClarityLevel {
  id: number
  title: string
  concept: string
  description: string
  goal: string
  wordLimit: number
  criteria: string[]
  max_xp: number
}

export const CLARITY_LEVELS: ClarityLevel[] = [
  {
    id: 1,
    title: 'Name the Task',
    concept: 'Task Clarity',
    description: 'The most basic skill: tell the AI exactly what you want it to do.',
    goal: 'Ask an AI to summarize the key decisions from a 1-hour team meeting.',
    wordLimit: 20,
    criteria: [
      'The core task (summarize) is clearly and directly stated',
      'The subject (decisions) is specific, not vague',
      'The scope is defined (1-hour team meeting)',
    ],
    max_xp: 100,
  },
  {
    id: 2,
    title: 'Know Your Audience',
    concept: 'Audience Specification',
    description: "Who reads the output changes everything. Always tell the AI who it's writing for.",
    goal: 'Ask an AI to explain why the stock market goes up and down — for a curious 12-year-old.',
    wordLimit: 25,
    criteria: [
      'The audience is explicitly identified (12-year-old)',
      'The appropriate complexity level or tone is clear',
      'The core topic is stated precisely',
    ],
    max_xp: 150,
  },
  {
    id: 3,
    title: 'Shape the Output',
    concept: 'Output Format',
    description: "Don't let the AI pick the format. You decide how the response should be structured.",
    goal: 'Ask an AI to create a beginner workout plan for someone who can only exercise 3 days a week.',
    wordLimit: 30,
    criteria: [
      'Output format or structure is explicitly specified',
      'Relevant constraints are included (beginner, 3 days, duration/length)',
      'The goal of the plan is clearly stated',
    ],
    max_xp: 200,
  },
  {
    id: 4,
    title: 'Load the Context',
    concept: 'Context & Background',
    description: 'The more relevant background you give, the less the AI has to guess.',
    goal: 'Ask an AI to help you draft a message to a colleague who missed an important project deadline.',
    wordLimit: 35,
    criteria: [
      'Relevant context is provided (colleague, project, deadline)',
      'The desired outcome is clearly stated',
      'Tone or relationship dynamic is specified',
      'Key constraints or boundaries are included',
    ],
    max_xp: 250,
  },
  {
    id: 5,
    title: 'The Master Prompt',
    concept: 'Full Composition',
    description: 'Combine task, audience, format, context, and constraints into one powerful prompt.',
    goal: 'Ask an AI to help you prepare answers for a job interview at a fast-growing tech startup.',
    wordLimit: 50,
    criteria: [
      'The task is precisely and completely stated',
      'Audience or role context is established',
      'Output format or structure is specified',
      'Relevant background context is included',
      'Constraints, tone, or style requirements are defined',
    ],
    max_xp: 500,
  },
]
