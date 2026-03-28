export interface StructureLevel {
  id: number       // 21–30 (avoids collision with Clarity 1–10, Constraints 11–20)
  title: string
  concept: string
  description: string
  goal: string
  wordLimit: number
  criteria: string[]
  max_xp: number
}

export const STRUCTURE_LEVELS: StructureLevel[] = [
  {
    id: 21,
    title: 'Step by Step',
    concept: 'Sequential Structure',
    description: 'The clearest outputs follow numbered steps. You have to ask for them explicitly.',
    goal: 'Write a prompt that gets an AI to create a numbered step-by-step plan',
    wordLimit: 30,
    criteria: [
      'A numbered or step-by-step format is explicitly requested',
      'The topic or task for the plan is clearly stated',
      'The desired scope or end goal of the plan is indicated',
    ],
    max_xp: 100,
  },
  {
    id: 22,
    title: 'Side by Side',
    concept: 'Comparative Format',
    description: 'Comparison only works when you define the structure. Vague "compare X and Y" produces mush.',
    goal: 'Ask an AI to compare two things using a specific format you define',
    wordLimit: 35,
    criteria: [
      'Two distinct things to compare are clearly identified',
      'A specific comparison format is explicitly defined (e.g. table, paired bullets, columns)',
      'The basis or dimensions of comparison are stated',
    ],
    max_xp: 150,
  },
  {
    id: 23,
    title: 'Three Columns',
    concept: 'Table Structure',
    description: "Tables eliminate ambiguity. Name the columns — don't leave the AI guessing what goes where.",
    goal: 'Write a prompt requesting output in a table with 3 specific columns',
    wordLimit: 40,
    criteria: [
      'A table format is explicitly requested',
      'Exactly 3 specific column names or categories are stated',
      'The content or data to populate the table is described',
    ],
    max_xp: 200,
  },
  {
    id: 24,
    title: 'Balanced View',
    concept: 'Symmetrical Structure',
    description: 'Asking for pros AND cons sounds obvious — until you forget to lock the quantity on both sides.',
    goal: 'Create a prompt that asks for exactly 3 pros and 3 cons',
    wordLimit: 30,
    criteria: [
      'Both pros and cons are explicitly requested',
      'Quantity is locked on both sides (exactly 3 each)',
      'The subject being evaluated is clearly identified',
    ],
    max_xp: 200,
  },
  {
    id: 25,
    title: 'Tight Summary',
    concept: 'Length Structure',
    description: 'Structure includes length. "3 sentences" is a structural rule, not just a preference.',
    goal: 'Write a prompt asking for a summary in exactly 3 sentences',
    wordLimit: 25,
    criteria: [
      'A summary is explicitly requested',
      'The sentence count is precisely fixed (exactly 3)',
      'The topic or content to be summarized is identified',
    ],
    max_xp: 200,
  },
  {
    id: 26,
    title: 'Three Parts',
    concept: 'Narrative Structure',
    description: "Intro, body, conclusion — the oldest structure in writing. Don't assume the AI will use it.",
    goal: 'Ask an AI to write something with a clear intro, middle, and conclusion',
    wordLimit: 40,
    criteria: [
      'All three structural sections are named (intro/opening, middle/body, conclusion/closing)',
      'The content or topic is specified',
      'The expected style, tone, or length of the piece is indicated',
    ],
    max_xp: 250,
  },
  {
    id: 27,
    title: 'Ranked and Explained',
    concept: 'Annotated Ranking',
    description: 'A ranked list without explanations is just a list. Ask for both, and define the ranking criterion.',
    goal: 'Write a prompt that requests a ranked list with explanations for each item',
    wordLimit: 45,
    criteria: [
      'Ranking is explicitly requested (e.g. top N, ordered by a criterion)',
      'Explanations or justifications for each item are requested',
      'The ranking criterion or subject domain is specified',
    ],
    max_xp: 300,
  },
  {
    id: 28,
    title: 'JSON Output',
    concept: 'Machine-Readable Structure',
    description: "JSON is the ultimate structured output. Define every field — the AI won't guess your schema.",
    goal: 'Create a prompt asking for output in JSON format with specific fields defined',
    wordLimit: 50,
    criteria: [
      'JSON format is explicitly requested',
      'At least 3 specific field names are listed',
      'The content or data the fields should contain is described',
    ],
    max_xp: 350,
  },
  {
    id: 29,
    title: 'Before and After',
    concept: 'State Comparison',
    description: 'Before/after is one of the most powerful structures in writing. It has to be explicitly requested.',
    goal: 'Write a prompt that asks for a before and after comparison with both states shown',
    wordLimit: 40,
    criteria: [
      'Both before and after states are explicitly requested',
      'The subject of the comparison is clearly defined',
      'The format for presenting both states is specified',
    ],
    max_xp: 400,
  },
  {
    id: 30,
    title: 'Total Control',
    concept: 'Master Structure',
    description: 'Every structural lever — format, length, sections, tone, order — pulled at once. Nothing left to chance.',
    goal: 'Write the most structured prompt possible that controls every aspect of the output',
    wordLimit: 60,
    criteria: [
      'Output format is fully specified',
      'Length or quantity is explicitly bounded',
      'Tone and style are defined',
      'The task and context are completely established',
      'At least 4 distinct structural constraints are included',
      'Nothing about the output structure is left ambiguous',
    ],
    max_xp: 600,
  },
]
