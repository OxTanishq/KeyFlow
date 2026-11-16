export type PracticeCategory =
  | 'common-words'
  | 'short-words'
  | 'long-words'
  | 'sentences'
  | 'numbers'
  | 'punctuation'
  | 'capitals'
  | 'code-symbols'
  | 'custom'
  | 'weak-keys';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface PracticeCategoryInfo {
  id: PracticeCategory;
  label: string;
  description: string;
}

export const PRACTICE_CATEGORIES: PracticeCategoryInfo[] = [
  { id: 'common-words', label: 'Common English Words', description: 'High-frequency everyday vocabulary for steady flow.' },
  { id: 'short-words', label: 'Short Words', description: 'Rapid 2–4 letter bursts to build finger snap.' },
  { id: 'long-words', label: 'Long Words', description: 'Multi-syllable words testing sustained accuracy.' },
  { id: 'sentences', label: 'Sentences', description: 'Complete natural prose with standard phrasing.' },
  { id: 'numbers', label: 'Numbers', description: 'Top-row digits and realistic numeric strings.' },
  { id: 'punctuation', label: 'Punctuation', description: 'Commas, quotes, colons, hyphens, and stops.' },
  { id: 'capitals', label: 'Capital Letters', description: 'Opposite-hand Shift drills across proper nouns.' },
  { id: 'code-symbols', label: 'Programming Symbols', description: 'Brackets, operators, arrows, and syntax tokens.' },
  { id: 'weak-keys', label: 'Weak-Key Practice', description: 'Deterministic drills targeting your highest-error keys.' },
  { id: 'custom', label: 'Custom Text', description: 'Paste or write your own plain-text passage.' },
];

const COMMON_WORDS = [
  'about', 'above', 'after', 'again', 'always', 'around', 'because', 'before',
  'between', 'build', 'carry', 'change', 'clean', 'clear', 'close', 'could',
  'create', 'every', 'first', 'focus', 'follow', 'found', 'great', 'group',
  'house', 'learn', 'light', 'might', 'model', 'music', 'never', 'night',
  'often', 'order', 'other', 'place', 'plant', 'point', 'power', 'press',
  'quick', 'quite', 'reach', 'ready', 'right', 'river', 'round', 'scale',
  'sense', 'shape', 'share', 'short', 'since', 'skill', 'small', 'sound',
  'space', 'speak', 'speed', 'start', 'state', 'still', 'story', 'study',
  'style', 'table', 'their', 'there', 'these', 'thing', 'think', 'three',
  'today', 'track', 'train', 'under', 'until', 'value', 'voice', 'water',
  'where', 'which', 'while', 'world', 'would', 'write', 'young',
];

const SHORT_WORDS = [
  'act', 'add', 'age', 'air', 'all', 'and', 'any', 'are', 'arm', 'art',
  'ask', 'bad', 'bag', 'bar', 'bed', 'bit', 'box', 'boy', 'but', 'can',
  'car', 'cat', 'cup', 'cut', 'day', 'did', 'dog', 'dry', 'ear', 'eat',
  'end', 'far', 'few', 'fit', 'fix', 'fly', 'for', 'fun', 'get', 'had',
  'has', 'hat', 'her', 'him', 'his', 'hot', 'how', 'ice', 'job', 'key',
  'kid', 'law', 'lay', 'let', 'lot', 'low', 'man', 'map', 'may', 'mix',
  'new', 'not', 'now', 'off', 'old', 'one', 'our', 'out', 'own', 'pay',
  'pen', 'put', 'ran', 'red', 'run', 'sat', 'saw', 'say', 'see', 'set',
  'she', 'sit', 'six', 'sun', 'tap', 'ten', 'the', 'top', 'try', 'two',
  'use', 'van', 'way', 'web', 'who', 'why', 'win', 'yes', 'yet', 'you',
];

const LONG_WORDS = [
  'acceleration', 'accessibility', 'achievement', 'architecture', 'calibration',
  'collaboration', 'communication', 'composition', 'concentrate', 'consistency',
  'coordination', 'craftsmanship', 'demonstration', 'determination', 'development',
  'distribution', 'educational', 'engineering', 'environment', 'equilibrium',
  'exploration', 'foundation', 'improvement', 'independent', 'information',
  'inspiration', 'interaction', 'keyboarding', 'measurement', 'methodology',
  'navigation', 'observation', 'optimization', 'organization', 'performance',
  'persistence', 'philosophy', 'precision', 'preparation', 'progression',
  'recognition', 'reliability', 'repetition', 'resolution', 'responsibility',
  'satisfaction', 'significant', 'simplicity', 'specialization', 'sustainability',
  'technique', 'technology', 'temperature', 'trajectory', 'transparency',
];

const SENTENCES = [
  'Touch typing turns hesitation into effortless muscle memory when you keep your eyes on the screen.',
  'Good posture and relaxed shoulders reduce fatigue during long writing and coding sessions.',
  'Accuracy always comes first; consistent speed follows naturally once errors disappear.',
  'Short, daily practice sessions build stronger neural pathways than occasional marathon drills.',
  'Every finger has a clear home territory, allowing your hands to cover the board with minimal motion.',
  'Modern software teams rely on clear documentation, crisp commits, and thoughtful code reviews.',
  'Calm breathing and steady keystrokes help maintain high precision even under strict time limits.',
  'Returning your fingers to the home row after each reach keeps your spatial bearings intact.',
];

const CAPITAL_WORDS = [
  'Atlas', 'Berlin', 'Cascade', 'Denver', 'Eclipse', 'Falcon', 'Geneva', 'Harbor',
  'Iceland', 'Jupiter', 'Kyoto', 'Lisbon', 'Mercury', 'Nairobi', 'Olympia', 'Pacific',
  'Quebec', 'Riviera', 'Saturn', 'Toronto', 'Utopia', 'Valencia', 'Windsor', 'Xavier',
  'Yokohama', 'Zurich', 'KeyFlow', 'Nexora', 'Monday', 'Friday', 'October', 'January',
];

const CODE_SNIPPETS = [
  'const wpm = Math.round((chars / 5) / minutes);',
  'function clamp(v: number, min = 0, max = 100) { return Math.min(max, Math.max(min, v)); }',
  'const [score, setScore] = useState<number>(0);',
  'export interface SessionResult { netWpm: number; accuracy: number; }',
  'if (accuracy >= 95 && errors === 0) { stars = 3; }',
  'const keys = entries.filter((item) => item.status !== "untyped");',
  'return items.reduce((acc, cur) => acc + cur.value, 0);',
];

const PUNCTUATION_SENTENCES = [
  '"Wait," she asked, "did you check version 2.4 — or was it 2.5?"',
  'Items needed: notebook, mechanical keyboard (65%), USB-C cable, and timer!',
  'Yes; however, it is best to double-check semi-colons, hyphens, and parentheses.',
  "Don't rush through commas, periods, or apostrophes: precision matters more than haste.",
  'Order #408-B shipped at 09:45 AM; tracking updates arrive every 30 minutes.',
];

function pickDeterministicOrSeeded<T>(pool: T[], count: number, seed: number): T[] {
  const result: T[] = [];
  let state = (seed % 2147483647) || 1337;
  for (let i = 0; i < count; i++) {
    state = (state * 48271) % 2147483647;
    result.push(pool[state % pool.length]);
  }
  return result;
}

export interface PracticeOptions {
  category: PracticeCategory;
  wordCount: number;
  difficulty: DifficultyLevel;
  includeNumbers?: boolean;
  includePunctuation?: boolean;
  customText?: string;
  weakKeys?: string[];
  seed?: number;
}

export function sanitizeCustomText(raw: string): string {
  // Strip any control characters except space/newline, collapse whitespace, plain text only
  return raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 5000);
}

export function generatePracticeText(options: PracticeOptions): string {
  const {
    category,
    wordCount = 25,
    difficulty = 'intermediate',
    includeNumbers = false,
    includePunctuation = false,
    customText = '',
    weakKeys = [],
    seed = Date.now(),
  } = options;

  if (category === 'custom') {
    const cleaned = sanitizeCustomText(customText);
    return cleaned.length >= 10
      ? cleaned
      : 'Type or paste at least ten characters of custom text to start practicing.';
  }

  const targetCount = Math.max(10, Math.min(120, wordCount));

  if (category === 'sentences') {
    const picked = pickDeterministicOrSeeded(SENTENCES, Math.max(2, Math.ceil(targetCount / 14)), seed);
    return picked.join(' ');
  }

  if (category === 'punctuation') {
    const picked = pickDeterministicOrSeeded(PUNCTUATION_SENTENCES, Math.max(2, Math.ceil(targetCount / 12)), seed);
    return picked.join(' ');
  }

  if (category === 'code-symbols') {
    const picked = pickDeterministicOrSeeded(CODE_SNIPPETS, Math.max(2, Math.ceil(targetCount / 10)), seed);
    return picked.join(' ');
  }

  if (category === 'numbers') {
    const tokens: string[] = [];
    let state = (seed % 2147483647) || 7919;
    for (let i = 0; i < targetCount; i++) {
      state = (state * 48271) % 2147483647;
      const digits = difficulty === 'beginner' ? 2 : difficulty === 'intermediate' ? 3 : 4;
      const min = Math.pow(10, digits - 1);
      const max = Math.pow(10, digits) - 1;
      tokens.push(String(min + (state % (max - min + 1))));
    }
    return tokens.join(' ');
  }

  if (category === 'weak-keys') {
    const EXTRA_TARGETED_WORDS = [
      'zero', 'zone', 'zoom', 'zest', 'zinc', 'zeal', 'zenith', 'zigzag', 'puzzle', 'quiz', 'fizz', 'jazz', 'buzz', 'cozy', 'lazy', 'breeze', 'freeze', 'horizon',
      'quick', 'quiet', 'quite', 'quote', 'query', 'quest', 'queen', 'equip', 'equal', 'square', 'unique', 'liquid', 'squad', 'quartz', 'sequence', 'technique',
      'exact', 'exam', 'exit', 'extra', 'next', 'text', 'index', 'pixel', 'relax', 'fix', 'mix', 'six', 'box', 'fox', 'wax', 'axis', 'oxygen', 'syntax',
      'jump', 'just', 'join', 'jazz', 'joke', 'joy', 'jade', 'jar', 'jet', 'job', 'major', 'adjust', 'object', 'project', 'subject', 'enjoy',
      'keep', 'key', 'kick', 'kind', 'king', 'kite', 'know', 'keen', 'desk', 'task', 'risk', 'mark', 'work', 'spark', 'skill', 'keyboard',
      'very', 'view', 'vast', 'verb', 'vote', 'wave', 'save', 'move', 'live', 'give', 'five', 'every', 'value', 'voice', 'verify', 'solve',
    ];
    const keys = weakKeys.length > 0 ? weakKeys.slice(0, 5) : ['q', 'z', 'x', 'p', ';'];
    const allWords = Array.from(new Set([...COMMON_WORDS, ...SHORT_WORDS, ...LONG_WORDS, ...EXTRA_TARGETED_WORDS]));
    const matchingWords = allWords.filter((w) =>
      keys.some((k) => w.toLowerCase().includes(k.toLowerCase()))
    );
    const pool =
      matchingWords.length >= 4
        ? matchingWords
        : keys.map((k) => `${k}${k}a ${k}s${k}`).concat(COMMON_WORDS.slice(0, 4));
    const picked = pickDeterministicOrSeeded(pool, targetCount, seed);
    return picked.join(' ');
  }

  let basePool = COMMON_WORDS;
  if (category === 'short-words') basePool = SHORT_WORDS;
  else if (category === 'long-words') basePool = LONG_WORDS;
  else if (category === 'capitals') basePool = CAPITAL_WORDS;
  else if (difficulty === 'beginner') basePool = SHORT_WORDS;
  else if (difficulty === 'advanced') basePool = [...COMMON_WORDS, ...LONG_WORDS];

  const words = pickDeterministicOrSeeded(basePool, targetCount, seed);

  return words
    .map((w, idx) => {
      let token = w;
      if (includeNumbers && idx % 6 === 4) {
        token = String(10 + ((seed + idx * 17) % 89));
      }
      if (includePunctuation && idx % 5 === 3) {
        token = `${token},`;
      } else if (includePunctuation && idx % 8 === 7) {
        token = `${token}.`;
      }
      return token;
    })
    .join(' ');
}

export function generateTestPassage(wordCount = 60, seed = Date.now()): string {
  const pool = [...COMMON_WORDS, ...SHORT_WORDS.slice(0, 30)];
  return pickDeterministicOrSeeded(pool, wordCount, seed).join(' ');
}
