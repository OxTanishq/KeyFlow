export interface LessonDefinition {
  id: string;
  sequenceNumber: number;
  title: string;
  subtitle: string;
  description: string;
  stageLabel: string;
  coveredKeys: string[];
  requiredAccuracy: number; // 0 for exploratory Lesson 1
  isExploratory: boolean;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tip: string;
  content: string;
}

export interface LessonProgressRecord {
  lessonId: string;
  bestAccuracy: number;
  bestWpm: number;
  stars: number;
  completed: boolean;
  attempts: number;
  updatedAt: string;
}

export type LessonUnlockState = 'completed' | 'in_progress' | 'available' | 'locked';

export const LESSONS: LessonDefinition[] = [
  {
    id: 'meet-the-keyboard',
    sequenceNumber: 1,
    title: 'Meet the Keyboard',
    subtitle: 'Find out which finger belongs on which key.',
    description:
      'An introduction to the keyboard layout, left and right hand zones, home row bumps on F and J, and individual finger responsibilities. Press any key freely with no timer or accuracy threshold.',
    stageLabel: 'Home position',
    coveredKeys: ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';'],
    requiredAccuracy: 0,
    isExploratory: true,
    difficulty: 'Beginner',
    tip: 'Rest your index fingers on F and J — feel the small tactile ridges on those two keys.',
    content: 'asdf jkl; fjdk slaj fdsa ;lkj',
  },
  {
    id: 'home-row',
    sequenceNumber: 2,
    title: 'Home Row',
    subtitle: 'The eight keys your fingers always come back to.',
    description:
      'Master A, S, D, and F with your left hand and J, K, L, and ; with your right hand. Build steady rhythm while returning every finger to its anchor position.',
    stageLabel: 'Home position',
    coveredKeys: ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';'],
    requiredAccuracy: 85,
    isExploratory: false,
    difficulty: 'Beginner',
    tip: 'Keep your wrists floating lightly above the desk and tap with crisp, even strokes.',
    content:
      'asdf jkl; fjdk slaj aass ddff jjkk ll;; sad lad fad dad ask flask fall all salad; jaff kads lass; ask a lad; fall all salad;',
  },
  {
    id: 'left-hand',
    sequenceNumber: 3,
    title: 'Left Hand',
    subtitle: 'Give your left fingers keys of their own.',
    description:
      'Strengthen left-hand coordination across A, S, D, F, G, E, R, T, C, and V. Practice clean upward and downward reaches without looking down.',
    stageLabel: 'One hand at a time',
    coveredKeys: ['A', 'S', 'D', 'F', 'G', 'E', 'R', 'T', 'C', 'V'],
    requiredAccuracy: 85,
    isExploratory: false,
    difficulty: 'Beginner',
    tip: 'Your left index finger covers F, G, R, T, and V. Return it to F between words.',
    content:
      'fast rest cast gear tear fear card care dare gate rate great create craft trace stage react crave verse',
  },
  {
    id: 'right-hand',
    sequenceNumber: 4,
    title: 'Right Hand',
    subtitle: 'Now build dexterity for your right fingers.',
    description:
      'Practice right-hand reaches for J, K, L, ;, H, U, I, O, N, and M. Train your right index, middle, and ring fingers to move independently.',
    stageLabel: 'One hand at a time',
    coveredKeys: ['J', 'K', 'L', ';', 'H', 'U', 'I', 'O', 'N', 'M'],
    requiredAccuracy: 85,
    isExploratory: false,
    difficulty: 'Beginner',
    tip: 'Right index handles J, H, U, N, and M while right pinky anchors on semicolon.',
    content:
      'join lion moon noun hum ink oil hill mill kiln union minimum honor onion; look loom noon john;',
  },
  {
    id: 'top-row',
    sequenceNumber: 5,
    title: 'Top Row',
    subtitle: 'Reach up smoothly, then return straight to home.',
    description:
      'Learn all ten keys of the upper alphabetic row: Q, W, E, R, T, Y, U, I, O, and P. Keep your palm steady as each finger extends upward and snaps back.',
    stageLabel: 'The rows above and below',
    coveredKeys: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    requiredAccuracy: 85,
    isExploratory: false,
    difficulty: 'Intermediate',
    tip: 'Stretch only the single finger needed for the top row — keep the other fingers resting near home.',
    content:
      'quit type write power quiet route query poetry report tower equip your true purpose require wire',
  },
  {
    id: 'bottom-row',
    sequenceNumber: 6,
    title: 'Bottom Row',
    subtitle: 'Tackle the downward reaches cleanly.',
    description:
      'Practice Z, X, C, V, B, N, and M with deliberate downward curl movements. Avoid twisting your wrists on the Z and X pinky/ring reaches.',
    stageLabel: 'The rows above and below',
    coveredKeys: ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
    requiredAccuracy: 85,
    isExploratory: false,
    difficulty: 'Intermediate',
    tip: 'Curl your finger slightly downward rather than sliding your whole hand back toward your body.',
    content:
      'zinc exam cave van ban man zen box mix calm combine vibrant maximum balance exact nimble',
  },
  {
    id: 'complete-alphabet',
    sequenceNumber: 7,
    title: 'Complete Alphabet',
    subtitle: 'Every letter, all three rows working together.',
    description:
      'Combine home, top, and bottom rows into fluid English words and longer multi-row transitions. Build consistency across all 26 letters.',
    stageLabel: 'The whole alphabet',
    coveredKeys: ['A–Z'],
    requiredAccuracy: 88,
    isExploratory: false,
    difficulty: 'Intermediate',
    tip: 'Read one word ahead of your fingers so transitions between rows stay continuous.',
    content:
      'quick brown foxes jump over lazy dogs while bright sparks glow above calm mountain trails and quiet coastal harbors',
  },
  {
    id: 'numbers',
    sequenceNumber: 8,
    title: 'Numbers',
    subtitle: 'Master the longest reach on the keyboard.',
    description:
      'Practice 1, 2, 3, 4, 5, 6, 7, 8, 9, and 0 along the top number row while maintaining your home-row reference point.',
    stageLabel: 'Numbers and Shift',
    coveredKeys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    requiredAccuracy: 85,
    isExploratory: false,
    difficulty: 'Intermediate',
    tip: 'Keep one anchor finger lightly touching the home row so you always find your way back without looking.',
    content:
      '10 24 38 49 57 62 71 85 93 06 room 204 gate 18 flight 390 code 7516 year 2026 score 9840',
  },
  {
    id: 'capitals-and-shift',
    sequenceNumber: 9,
    title: 'Capital Letters and Shift',
    subtitle: 'Use the opposite-hand Shift technique.',
    description:
      'Hold the right Shift key with your right pinky when typing left-hand capitals, and hold the left Shift key with your left pinky for right-hand capitals.',
    stageLabel: 'Numbers and Shift',
    coveredKeys: ['L-Shift', 'R-Shift', 'A–Z'],
    requiredAccuracy: 85,
    isExploratory: false,
    difficulty: 'Intermediate',
    tip: 'Never press Shift and the letter with the same hand — opposite hands keep your rhythm unbroken.',
    content:
      'Alice Bob Clara David Elena Frank Grace Henry Isaac Julia Kevin Liam Maya Noah Olivia Peter Quinn Ruby',
  },
  {
    id: 'real-sentences',
    sequenceNumber: 10,
    title: 'Real Sentences',
    subtitle: 'Put it all together with punctuation and flow.',
    description:
      'Combine full words, capital letters, spaces, commas, periods, apostrophes, and numbers into realistic everyday typing passages.',
    stageLabel: 'Real sentences',
    coveredKeys: ['A–Z', '0–9', 'Shift', ',', '.', "'", '?'],
    requiredAccuracy: 90,
    isExploratory: false,
    difficulty: 'Advanced',
    tip: 'Prioritize accuracy over raw speed; smooth, error-free phrasing naturally accelerates your WPM.',
    content:
      "Clear writing begins with steady finger habits. When your hands know where every key lives, your mind stays focused on ideas rather than spelling. Practice 15 minutes daily, and by Friday you'll notice sharper accuracy!",
  },
];

export function getLessonById(lessonId: string): LessonDefinition | undefined {
  return LESSONS.find((l) => l.id === lessonId);
}

export function getLessonUnlockStates(
  progressMap: Record<string, LessonProgressRecord>
): Record<string, LessonUnlockState> {
  const result: Record<string, LessonUnlockState> = {};
  let previousCompleted = true; // Lesson 1 is always unlocked

  for (const lesson of LESSONS) {
    const rec = progressMap[lesson.id];
    if (rec?.completed) {
      result[lesson.id] = 'completed';
      previousCompleted = true;
    } else if (previousCompleted) {
      result[lesson.id] = rec && rec.attempts > 0 ? 'in_progress' : 'available';
      previousCompleted = false;
    } else {
      result[lesson.id] = 'locked';
      previousCompleted = false;
    }
  }

  return result;
}

export function mergeLessonProgress(
  localMap: Record<string, LessonProgressRecord>,
  remoteMap: Record<string, LessonProgressRecord>
): Record<string, LessonProgressRecord> {
  const merged: Record<string, LessonProgressRecord> = { ...remoteMap };
  for (const [lessonId, localRec] of Object.entries(localMap)) {
    const remoteRec = merged[lessonId];
    if (!remoteRec) {
      merged[lessonId] = localRec;
      continue;
    }
    const localTime = Date.parse(localRec.updatedAt) || 0;
    const remoteTime = Date.parse(remoteRec.updatedAt) || 0;
    merged[lessonId] = {
      lessonId,
      bestAccuracy: Math.max(localRec.bestAccuracy, remoteRec.bestAccuracy),
      bestWpm: Math.max(localRec.bestWpm, remoteRec.bestWpm),
      stars: Math.max(localRec.stars, remoteRec.stars),
      completed: localRec.completed || remoteRec.completed,
      attempts: Math.max(localRec.attempts, remoteRec.attempts),
      updatedAt: localTime >= remoteTime ? localRec.updatedAt : remoteRec.updatedAt,
    };
  }
  return merged;
}
