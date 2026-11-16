export type FingerId =
  | 'left-pinky'
  | 'left-ring'
  | 'left-middle'
  | 'left-index'
  | 'right-index'
  | 'right-middle'
  | 'right-ring'
  | 'right-pinky'
  | 'thumb';

export interface FingerMeta {
  id: FingerId;
  label: string;
  shortLabel: string;
  hand: 'left' | 'right' | 'both';
  colorHex: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
}

export const FINGER_META: Record<FingerId, FingerMeta> = {
  'left-pinky': {
    id: 'left-pinky',
    label: 'Left Pinky',
    shortLabel: 'L Pinky',
    hand: 'left',
    colorHex: '#0D9488',
    bgClass: 'bg-teal-600/15 dark:bg-teal-400/20',
    borderClass: 'border-teal-600/50 dark:border-teal-400/50',
    textClass: 'text-teal-700 dark:text-teal-300',
  },
  'left-ring': {
    id: 'left-ring',
    label: 'Left Ring',
    shortLabel: 'L Ring',
    hand: 'left',
    colorHex: '#2563EB',
    bgClass: 'bg-blue-600/15 dark:bg-blue-400/20',
    borderClass: 'border-blue-600/50 dark:border-blue-400/50',
    textClass: 'text-blue-700 dark:text-blue-300',
  },
  'left-middle': {
    id: 'left-middle',
    label: 'Left Middle',
    shortLabel: 'L Middle',
    hand: 'left',
    colorHex: '#6558F5',
    bgClass: 'bg-indigo-600/15 dark:bg-indigo-400/20',
    borderClass: 'border-indigo-600/50 dark:border-indigo-400/50',
    textClass: 'text-indigo-700 dark:text-indigo-300',
  },
  'left-index': {
    id: 'left-index',
    label: 'Left Index',
    shortLabel: 'L Index',
    hand: 'left',
    colorHex: '#9333EA',
    bgClass: 'bg-purple-600/15 dark:bg-purple-400/20',
    borderClass: 'border-purple-600/50 dark:border-purple-400/50',
    textClass: 'text-purple-700 dark:text-purple-300',
  },
  'right-index': {
    id: 'right-index',
    label: 'Right Index',
    shortLabel: 'R Index',
    hand: 'right',
    colorHex: '#E11D48',
    bgClass: 'bg-rose-600/15 dark:bg-rose-400/20',
    borderClass: 'border-rose-600/50 dark:border-rose-400/50',
    textClass: 'text-rose-700 dark:text-rose-300',
  },
  'right-middle': {
    id: 'right-middle',
    label: 'Right Middle',
    shortLabel: 'R Middle',
    hand: 'right',
    colorHex: '#D97706',
    bgClass: 'bg-amber-600/15 dark:bg-amber-400/20',
    borderClass: 'border-amber-600/50 dark:border-amber-400/50',
    textClass: 'text-amber-700 dark:text-amber-300',
  },
  'right-ring': {
    id: 'right-ring',
    label: 'Right Ring',
    shortLabel: 'R Ring',
    hand: 'right',
    colorHex: '#65A30D',
    bgClass: 'bg-lime-600/15 dark:bg-lime-400/20',
    borderClass: 'border-lime-600/50 dark:border-lime-400/50',
    textClass: 'text-lime-700 dark:text-lime-300',
  },
  'right-pinky': {
    id: 'right-pinky',
    label: 'Right Pinky',
    shortLabel: 'R Pinky',
    hand: 'right',
    colorHex: '#059669',
    bgClass: 'bg-emerald-600/15 dark:bg-emerald-400/20',
    borderClass: 'border-emerald-600/50 dark:border-emerald-400/50',
    textClass: 'text-emerald-700 dark:text-emerald-300',
  },
  thumb: {
    id: 'thumb',
    label: 'Thumb',
    shortLabel: 'Thumb',
    hand: 'both',
    colorHex: '#475569',
    bgClass: 'bg-slate-600/15 dark:bg-slate-400/20',
    borderClass: 'border-slate-500/50 dark:border-slate-400/50',
    textClass: 'text-slate-700 dark:text-slate-300',
  },
};

export interface KeyDefinition {
  id: string; // e.g. 'KeyA', 'Space', 'ShiftLeft'
  label: string; // Primary display label
  shiftLabel?: string; // Upper character when shifted
  char?: string; // Lowercase character produced
  shiftChar?: string; // Shifted character produced
  widthUnits: number; // Standard keycap = 1
  finger: FingerId;
  isHomeRow?: boolean;
  hasBump?: boolean;
  isModifier?: boolean;
}

export const KEYBOARD_ROWS: KeyDefinition[][] = [
  [
    { id: 'Backquote', label: '`', shiftLabel: '~', char: '`', shiftChar: '~', widthUnits: 1, finger: 'left-pinky' },
    { id: 'Digit1', label: '1', shiftLabel: '!', char: '1', shiftChar: '!', widthUnits: 1, finger: 'left-pinky' },
    { id: 'Digit2', label: '2', shiftLabel: '@', char: '2', shiftChar: '@', widthUnits: 1, finger: 'left-ring' },
    { id: 'Digit3', label: '3', shiftLabel: '#', char: '3', shiftChar: '#', widthUnits: 1, finger: 'left-middle' },
    { id: 'Digit4', label: '4', shiftLabel: '$', char: '4', shiftChar: '$', widthUnits: 1, finger: 'left-index' },
    { id: 'Digit5', label: '5', shiftLabel: '%', char: '5', shiftChar: '%', widthUnits: 1, finger: 'left-index' },
    { id: 'Digit6', label: '6', shiftLabel: '^', char: '6', shiftChar: '^', widthUnits: 1, finger: 'right-index' },
    { id: 'Digit7', label: '7', shiftLabel: '&', char: '7', shiftChar: '&', widthUnits: 1, finger: 'right-index' },
    { id: 'Digit8', label: '8', shiftLabel: '*', char: '8', shiftChar: '*', widthUnits: 1, finger: 'right-middle' },
    { id: 'Digit9', label: '9', shiftLabel: '(', char: '9', shiftChar: '(', widthUnits: 1, finger: 'right-ring' },
    { id: 'Digit0', label: '0', shiftLabel: ')', char: '0', shiftChar: ')', widthUnits: 1, finger: 'right-pinky' },
    { id: 'Minus', label: '-', shiftLabel: '_', char: '-', shiftChar: '_', widthUnits: 1, finger: 'right-pinky' },
    { id: 'Equal', label: '=', shiftLabel: '+', char: '=', shiftChar: '+', widthUnits: 1, finger: 'right-pinky' },
    { id: 'Backspace', label: 'Backspace', widthUnits: 2, finger: 'right-pinky', isModifier: true },
  ],
  [
    { id: 'Tab', label: 'Tab', widthUnits: 1.5, finger: 'left-pinky', isModifier: true },
    { id: 'KeyQ', label: 'Q', char: 'q', shiftChar: 'Q', widthUnits: 1, finger: 'left-pinky' },
    { id: 'KeyW', label: 'W', char: 'w', shiftChar: 'W', widthUnits: 1, finger: 'left-ring' },
    { id: 'KeyE', label: 'E', char: 'e', shiftChar: 'E', widthUnits: 1, finger: 'left-middle' },
    { id: 'KeyR', label: 'R', char: 'r', shiftChar: 'R', widthUnits: 1, finger: 'left-index' },
    { id: 'KeyT', label: 'T', char: 't', shiftChar: 'T', widthUnits: 1, finger: 'left-index' },
    { id: 'KeyY', label: 'Y', char: 'y', shiftChar: 'Y', widthUnits: 1, finger: 'right-index' },
    { id: 'KeyU', label: 'U', char: 'u', shiftChar: 'U', widthUnits: 1, finger: 'right-index' },
    { id: 'KeyI', label: 'I', char: 'i', shiftChar: 'I', widthUnits: 1, finger: 'right-middle' },
    { id: 'KeyO', label: 'O', char: 'o', shiftChar: 'O', widthUnits: 1, finger: 'right-ring' },
    { id: 'KeyP', label: 'P', char: 'p', shiftChar: 'P', widthUnits: 1, finger: 'right-pinky' },
    { id: 'BracketLeft', label: '[', shiftLabel: '{', char: '[', shiftChar: '{', widthUnits: 1, finger: 'right-pinky' },
    { id: 'BracketRight', label: ']', shiftLabel: '}', char: ']', shiftChar: '}', widthUnits: 1, finger: 'right-pinky' },
    { id: 'Backslash', label: '\\', shiftLabel: '|', char: '\\', shiftChar: '|', widthUnits: 1.5, finger: 'right-pinky' },
  ],
  [
    { id: 'CapsLock', label: 'Caps', widthUnits: 1.75, finger: 'left-pinky', isModifier: true },
    { id: 'KeyA', label: 'A', char: 'a', shiftChar: 'A', widthUnits: 1, finger: 'left-pinky', isHomeRow: true },
    { id: 'KeyS', label: 'S', char: 's', shiftChar: 'S', widthUnits: 1, finger: 'left-ring', isHomeRow: true },
    { id: 'KeyD', label: 'D', char: 'd', shiftChar: 'D', widthUnits: 1, finger: 'left-middle', isHomeRow: true },
    { id: 'KeyF', label: 'F', char: 'f', shiftChar: 'F', widthUnits: 1, finger: 'left-index', isHomeRow: true, hasBump: true },
    { id: 'KeyG', label: 'G', char: 'g', shiftChar: 'G', widthUnits: 1, finger: 'left-index' },
    { id: 'KeyH', label: 'H', char: 'h', shiftChar: 'H', widthUnits: 1, finger: 'right-index' },
    { id: 'KeyJ', label: 'J', char: 'j', shiftChar: 'J', widthUnits: 1, finger: 'right-index', isHomeRow: true, hasBump: true },
    { id: 'KeyK', label: 'K', char: 'k', shiftChar: 'K', widthUnits: 1, finger: 'right-middle', isHomeRow: true },
    { id: 'KeyL', label: 'L', char: 'l', shiftChar: 'L', widthUnits: 1, finger: 'right-ring', isHomeRow: true },
    { id: 'Semicolon', label: ';', shiftLabel: ':', char: ';', shiftChar: ':', widthUnits: 1, finger: 'right-pinky', isHomeRow: true },
    { id: 'Quote', label: "'", shiftLabel: '"', char: "'", shiftChar: '"', widthUnits: 1, finger: 'right-pinky' },
    { id: 'Enter', label: 'Enter', widthUnits: 2.25, finger: 'right-pinky', isModifier: true },
  ],
  [
    { id: 'ShiftLeft', label: 'Shift', widthUnits: 2.25, finger: 'left-pinky', isModifier: true },
    { id: 'KeyZ', label: 'Z', char: 'z', shiftChar: 'Z', widthUnits: 1, finger: 'left-pinky' },
    { id: 'KeyX', label: 'X', char: 'x', shiftChar: 'X', widthUnits: 1, finger: 'left-ring' },
    { id: 'KeyC', label: 'C', char: 'c', shiftChar: 'C', widthUnits: 1, finger: 'left-middle' },
    { id: 'KeyV', label: 'V', char: 'v', shiftChar: 'V', widthUnits: 1, finger: 'left-index' },
    { id: 'KeyB', label: 'B', char: 'b', shiftChar: 'B', widthUnits: 1, finger: 'left-index' },
    { id: 'KeyN', label: 'N', char: 'n', shiftChar: 'N', widthUnits: 1, finger: 'right-index' },
    { id: 'KeyM', label: 'M', char: 'm', shiftChar: 'M', widthUnits: 1, finger: 'right-index' },
    { id: 'Comma', label: ',', shiftLabel: '<', char: ',', shiftChar: '<', widthUnits: 1, finger: 'right-middle' },
    { id: 'Period', label: '.', shiftLabel: '>', char: '.', shiftChar: '>', widthUnits: 1, finger: 'right-ring' },
    { id: 'Slash', label: '/', shiftLabel: '?', char: '/', shiftChar: '?', widthUnits: 1, finger: 'right-pinky' },
    { id: 'ShiftRight', label: 'Shift', widthUnits: 2.75, finger: 'right-pinky', isModifier: true },
  ],
  [
    { id: 'ControlLeft', label: 'Ctrl', widthUnits: 1.5, finger: 'left-pinky', isModifier: true },
    { id: 'AltLeft', label: 'Alt', widthUnits: 1.5, finger: 'thumb', isModifier: true },
    { id: 'Space', label: 'Space', char: ' ', shiftChar: ' ', widthUnits: 8, finger: 'thumb' },
    { id: 'AltRight', label: 'Alt', widthUnits: 1.5, finger: 'thumb', isModifier: true },
    { id: 'ControlRight', label: 'Ctrl', widthUnits: 2.5, finger: 'right-pinky', isModifier: true },
  ],
];

const FLAT_KEYS = KEYBOARD_ROWS.flat();
const BY_ID = new Map<string, KeyDefinition>(FLAT_KEYS.map((k) => [k.id, k]));

export interface TargetKeyGuide {
  keyDef: KeyDefinition;
  finger: FingerMeta;
  needsShift: boolean;
  shiftKeyId: 'ShiftLeft' | 'ShiftRight' | null;
  shiftFinger: FingerMeta | null;
}

export function findKeyByEvent(code: string, key: string): KeyDefinition | null {
  if (code && BY_ID.has(code)) {
    return BY_ID.get(code) ?? null;
  }
  const normalized = key === ' ' ? ' ' : key;
  for (const k of FLAT_KEYS) {
    if (k.char === normalized || k.shiftChar === normalized || k.label.toLowerCase() === normalized.toLowerCase()) {
      return k;
    }
  }
  return null;
}

export function getTargetKeyGuide(targetChar: string): TargetKeyGuide | null {
  for (const k of FLAT_KEYS) {
    if (k.char === targetChar) {
      return {
        keyDef: k,
        finger: FINGER_META[k.finger],
        needsShift: false,
        shiftKeyId: null,
        shiftFinger: null,
      };
    }
    if (k.shiftChar === targetChar) {
      const hand = FINGER_META[k.finger].hand;
      // Opposite-hand Shift technique: left-hand char uses ShiftRight, right-hand char uses ShiftLeft
      const shiftKeyId: 'ShiftLeft' | 'ShiftRight' = hand === 'left' ? 'ShiftRight' : 'ShiftLeft';
      const shiftFingerId: FingerId = shiftKeyId === 'ShiftRight' ? 'right-pinky' : 'left-pinky';
      return {
        keyDef: k,
        finger: FINGER_META[k.finger],
        needsShift: true,
        shiftKeyId,
        shiftFinger: FINGER_META[shiftFingerId],
      };
    }
  }
  return null;
}

export function normalizeKeyStatisticId(char: string): string {
  if (char === ' ') return 'Space';
  return char.toLowerCase();
}
