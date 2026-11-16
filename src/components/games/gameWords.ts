export const GAME_WORDS_EASY = [
  'air', 'art', 'ask', 'box', 'car', 'cat', 'cup', 'day', 'dog', 'ear',
  'end', 'far', 'fast', 'fit', 'fix', 'fly', 'fun', 'get', 'hat', 'ice',
  'job', 'key', 'kid', 'map', 'mix', 'new', 'now', 'one', 'out', 'pen',
  'red', 'run', 'see', 'set', 'six', 'sky', 'sun', 'tap', 'ten', 'top',
  'try', 'use', 'way', 'web', 'win', 'yes', 'zen', 'blue', 'calm', 'code',
  'data', 'flow', 'glow', 'grid', 'hand', 'home', 'jump', 'keep', 'kind',
  'leaf', 'line', 'link', 'loop', 'mint', 'moon', 'note', 'pace', 'peak',
  'play', 'pure', 'rain', 'read', 'ring', 'road', 'rock', 'safe', 'sand',
  'ship', 'soft', 'song', 'star', 'step', 'time', 'tone', 'tree', 'tune',
  'wave', 'wind', 'wise', 'word', 'work', 'zero', 'zone',
];

export const GAME_WORDS_MEDIUM = [
  'anchor', 'beacon', 'branch', 'breeze', 'bridge', 'bright', 'canvas',
  'castle', 'center', 'chance', 'circle', 'coding', 'corner', 'create',
  'cursor', 'custom', 'design', 'device', 'direct', 'driven', 'editor',
  'energy', 'engine', 'escape', 'falcon', 'filter', 'finger', 'flight',
  'forest', 'future', 'garden', 'gentle', 'harbor', 'height', 'impact',
  'invent', 'island', 'jacket', 'jungle', 'kernel', 'launch', 'layout',
  'leader', 'lesson', 'letter', 'listen', 'manner', 'market', 'matrix',
  'meadow', 'memory', 'method', 'metric', 'mirror', 'mobile', 'modern',
  'motion', 'nature', 'neural', 'object', 'office', 'orange', 'output',
  'palace', 'parcel', 'pathos', 'pencil', 'planet', 'pocket', 'polish',
  'portal', 'powder', 'praise', 'prompt', 'puzzle', 'quartz', 'radial',
  'random', 'reason', 'record', 'reflex', 'render', 'report', 'rescue',
  'rhythm', 'ribbon', 'rocket', 'router', 'sample', 'screen', 'script',
  'search', 'sensor', 'series', 'shadow', 'shield', 'signal', 'silver',
  'simple', 'sketch', 'smooth', 'socket', 'source', 'sphere', 'spirit',
  'spring', 'sprint', 'square', 'stable', 'status', 'stream', 'street',
  'stride', 'strike', 'string', 'studio', 'submit', 'summit', 'switch',
  'symbol', 'syntax', 'system', 'tablet', 'target', 'temple', 'thread',
  'timber', 'toggle', 'travel', 'tunnel', 'typing', 'unique', 'update',
  'upload', 'vector', 'velvet', 'verify', 'vertex', 'vessel', 'vision',
  'visual', 'window', 'winter', 'wonder', 'writer', 'zenith',
];

export const GAME_WORDS_HARD = [
  'algorithm', 'architecture', 'benchmark', 'blueprint', 'calibration',
  'capacitor', 'championship', 'chronicle', 'collaborate', 'combination',
  'complement', 'compression', 'concentrate', 'confidence', 'consistency',
  'coordination', 'cryptography', 'declaration', 'determinism', 'development',
  'diagnostics', 'distribution', 'efficiency', 'engineering', 'environment',
  'equilibrium', 'exploration', 'foundation', 'framework', 'frequency',
  'illumination', 'implementation', 'improvement', 'independence', 'infrastructure',
  'inspiration', 'integration', 'interaction', 'keyboarding', 'measurement',
  'methodology', 'navigation', 'observation', 'optimization', 'orchestrate',
  'orientation', 'performance', 'persistence', 'philosophy', 'precision',
  'progression', 'refactoring', 'reliability', 'repetition', 'resolution',
  'responsibility', 'satisfaction', 'sequential', 'simulation', 'specialization',
  'sustainability', 'synchronization', 'telemetry', 'temperature', 'trajectory',
  'transformation', 'transparency', 'velocity', 'verification', 'visualization',
];

export const RACE_PASSAGES = [
  'Steady fingers across the home row keep your vehicle accelerating down the straightaway while clean punctuation carries momentum into every turn.',
  'Speed without accuracy spins your wheels at the starting line; crisp deliberate keystrokes unlock smooth velocity from the first corner to the checkered flag.',
  'Focus ahead of the active character, keep your wrists relaxed above the desk, and let consistent rhythm drive your race car toward a new personal record.',
];

export function pickWordForLevel(level: number): string {
  const pool =
    level <= 2
      ? GAME_WORDS_EASY
      : level <= 5
      ? [...GAME_WORDS_EASY, ...GAME_WORDS_MEDIUM]
      : [...GAME_WORDS_MEDIUM, ...GAME_WORDS_HARD];
  return pool[Math.floor(Math.random() * pool.length)];
}
