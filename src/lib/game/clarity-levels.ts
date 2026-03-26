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
      'Relevant constraints are included (beginner, 3 days)',
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
    title: 'Set the Tone',
    concept: 'Voice & Tone',
    description: 'Precise tone instructions turn generic responses into exactly what you needed.',
    goal: 'Ask an AI to write a rejection email to a job applicant — warm but professional.',
    wordLimit: 30,
    criteria: [
      'The tone is explicitly described (warm, professional)',
      'The task and recipient are clearly defined',
      'Any constraints on what to include or avoid are stated',
    ],
    max_xp: 300,
  },
  {
    id: 6,
    title: 'Define the Scope',
    concept: 'Boundaries & Limits',
    description: "Tell the AI what NOT to do. Limits are as powerful as instructions.",
    goal: 'Ask an AI to explain climate change — only the science, no politics or policy.',
    wordLimit: 30,
    criteria: [
      'The topic is clearly stated',
      'Explicit boundaries are set on what to exclude',
      'The intended depth or length is indicated',
    ],
    max_xp: 300,
  },
  {
    id: 7,
    title: 'Give an Example',
    concept: 'Few-Shot Prompting',
    description: "One good example is worth a thousand adjectives. Show the AI what you mean.",
    goal: 'Ask an AI to generate product names for a new energy drink — in the style of "Surge", "Jolt", "Amp".',
    wordLimit: 35,
    criteria: [
      'A concrete example or reference is provided',
      'The pattern or style to follow is clear',
      'The quantity or scope of output is specified',
    ],
    max_xp: 350,
  },
  {
    id: 8,
    title: 'Assign a Role',
    concept: 'Role Prompting',
    description: 'Giving the AI a role changes how it reasons, not just how it sounds.',
    goal: 'Ask an AI — acting as a senior UX designer — to review a signup flow and identify friction points.',
    wordLimit: 35,
    criteria: [
      'A specific expert role is assigned to the AI',
      'The task is clearly stated and relevant to that role',
      'The output or deliverable is defined',
    ],
    max_xp: 350,
  },
  {
    id: 9,
    title: 'Chain the Steps',
    concept: 'Sequential Reasoning',
    description: 'Complex tasks need ordered steps. Walk the AI through your thinking.',
    goal: 'Ask an AI to help you plan a product launch: first identify risks, then suggest mitigations, then prioritize.',
    wordLimit: 45,
    criteria: [
      'The task is broken into explicit sequential steps',
      'Each step builds logically on the previous',
      'The final desired output is clear',
      'The domain context is established',
    ],
    max_xp: 400,
  },
  {
    id: 10,
    title: 'The Expert Brief',
    concept: 'Full Composition',
    description: 'Every element working together: role, task, context, format, tone, scope, and constraints.',
    goal: 'Ask an AI to help a first-time manager prepare for a performance review conversation with an underperforming employee.',
    wordLimit: 60,
    criteria: [
      'A role or perspective is established',
      'The task is completely and precisely stated',
      'Relevant context and background are included',
      'Output format or structure is specified',
      'Tone and constraints are defined',
      'The scope is bounded — nothing is left ambiguous',
    ],
    max_xp: 600,
  },
]
