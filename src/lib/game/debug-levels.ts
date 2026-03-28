export interface DebugLevel {
  id: number       // 31–40 (avoids collision with Clarity 1–10, Constraints 11–20, Structure 21–30)
  title: string
  concept: string
  description: string
  goal: string
  wordLimit: number
  criteria: string[]
  max_xp: number
}

export const DEBUG_LEVELS: DebugLevel[] = [
  {
    id: 31,
    title: 'Sharpen the Focus',
    concept: 'Vagueness Fix',
    description: "\"Write something about dogs\" is broken. Identify what's wrong and make it specific.",
    goal: "Rewrite this vague prompt to be specific: 'Write something about dogs'",
    wordLimit: 30,
    criteria: [
      "The vague task ('write something') is replaced with a concrete action",
      'The subject is narrowed to a specific aspect of dogs',
      'An audience, format, or use case is included',
    ],
    max_xp: 100,
  },
  {
    id: 32,
    title: 'Name What\'s Broken',
    concept: 'Ambiguity Fix',
    description: "'Make it better' is not a prompt — it's a wish. Fix it by naming exactly what 'better' means.",
    goal: "Fix this ambiguous prompt: 'Make it better'",
    wordLimit: 25,
    criteria: [
      "'Better' is replaced with specific, measurable improvement criteria",
      'The subject to be improved is identified',
      'At least one concrete direction or constraint is given',
    ],
    max_xp: 150,
  },
  {
    id: 33,
    title: 'Contradiction Detected',
    concept: 'Contradiction Fix',
    description: "'Simply complicated' is a contradiction that will confuse any AI. Resolve it cleanly.",
    goal: "Identify and fix what's wrong: 'Explain quantum physics simply complicated'",
    wordLimit: 35,
    criteria: [
      "The contradiction ('simply' vs 'complicated') is identified and resolved",
      'A clear, consistent complexity level is specified',
      'The audience or depth of explanation is explicitly defined',
    ],
    max_xp: 150,
  },
  {
    id: 34,
    title: 'Neutral Ground',
    concept: 'Bias Removal',
    description: "'Obviously superior' is bias built into the prompt. Remove it or you've pre-written the answer.",
    goal: "Rewrite to remove bias: 'Write why electric cars are obviously superior'",
    wordLimit: 40,
    criteria: [
      "Loaded language is removed ('obviously superior')",
      'The prompt allows for balanced, evidence-based analysis',
      'A clear task is maintained without pre-determining the conclusion',
    ],
    max_xp: 200,
  },
  {
    id: 35,
    title: 'One Thing at a Time',
    concept: 'Goal Conflict Fix',
    description: "'Long summary in one word' is physically impossible. Identify the conflict and resolve it.",
    goal: "Fix this contradictory prompt: 'Write a long summary in one word'",
    wordLimit: 30,
    criteria: [
      "The contradiction between 'long' and 'one word' is identified and resolved",
      'A coherent and achievable length constraint is chosen and stated',
      'The core task (summary) is preserved with clear parameters',
    ],
    max_xp: 200,
  },
  {
    id: 36,
    title: 'Fill the Gaps',
    concept: 'Missing Context Fix',
    description: "'The meeting' — which meeting? Who's the email for? An AI can't ask. You have to tell it.",
    goal: "Rewrite to add the missing context: 'Write an email about the meeting'",
    wordLimit: 45,
    criteria: [
      "The email recipient and their relationship to the sender are specified",
      "The meeting's purpose, outcome, or key decision is described",
      'The desired tone and any required action are made explicit',
    ],
    max_xp: 250,
  },
  {
    id: 37,
    title: 'Resolve the Paradox',
    concept: 'Conflicting Instruction Fix',
    description: "'Be creative but follow all rules exactly' is a paradox. Creativity requires room. Make room.",
    goal: "Fix this prompt that will confuse an AI: 'Be creative but follow all rules exactly'",
    wordLimit: 40,
    criteria: [
      "The paradox between creativity and exact rule-following is explicitly resolved",
      'Specific rules or constraints replace the vague phrase "all rules"',
      'Creative latitude is defined within clear, compatible boundaries',
    ],
    max_xp: 300,
  },
  {
    id: 38,
    title: 'Idea Engineering',
    concept: 'Specificity Upgrade',
    description: "'Give me some ideas' is three vague words. Fix every dimension of it.",
    goal: "Rewrite to be far more specific: 'Give me some ideas'",
    wordLimit: 35,
    criteria: [
      'The domain or topic for the ideas is specified',
      'The quantity of ideas is explicitly defined',
      'The format or level of depth for each idea is indicated',
    ],
    max_xp: 300,
  },
  {
    id: 39,
    title: 'Single Objective',
    concept: 'Goal Reduction',
    description: "A poem that teaches math, is funny, and is under 5 words is impossible. Pick one goal.",
    goal: "Fix this prompt with too many conflicting goals: 'Write a poem that teaches math and is funny and is under 5 words'",
    wordLimit: 45,
    criteria: [
      'The conflicting or impossible goals are identified',
      'One primary objective is preserved and clearly stated',
      'Realistic constraints replace the impossible "5 word" limit',
    ],
    max_xp: 400,
  },
  {
    id: 40,
    title: 'Full Debug Run',
    concept: 'Complete Prompt Overhaul',
    description: 'Every technique you\'ve learned — applied to the worst possible prompt. Turn garbage into gold.',
    goal: 'Debug and completely rewrite the worst possible prompt into the best possible prompt',
    wordLimit: 60,
    criteria: [
      'All vague, contradictory, biased, or ambiguous elements are identified and removed',
      'The rewritten prompt includes role, task, context, format, and tone',
      'All constraints are specific, coherent, and non-contradictory',
      'The result is comprehensive yet concise — every word earns its place',
    ],
    max_xp: 600,
  },
]
