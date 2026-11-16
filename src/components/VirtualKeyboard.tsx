import React from 'react';
import {
  FINGER_META,
  KEYBOARD_ROWS,
  getTargetKeyGuide,
  type FingerId,
  type KeyDefinition,
} from '../core/keyboardLayout';
import type { KeyStatRecord } from '../core/analytics';

interface VirtualKeyboardProps {
  mode?: 'interactive' | 'lesson' | 'heatmap';
  activePressedCodes?: Set<string>;
  targetChar?: string | null;
  highlightedKeys?: string[];
  keyStats?: Record<string, KeyStatRecord>;
  selectedHeatmapKey?: string | null;
  onKeySelect?: (keyDef: KeyDefinition) => void;
  showLegend?: boolean;
  compact?: boolean;
}

function getHeatmapTone(stat?: KeyStatRecord): { bg: string; border: string; text: string } | null {
  if (!stat || stat.attempts === 0) return null;
  const rate = stat.errors / stat.attempts;
  if (stat.errors === 0 || rate < 0.03) {
    return {
      bg: 'bg-emerald-500/15 dark:bg-emerald-400/20',
      border: 'border-emerald-500/40',
      text: 'text-emerald-800 dark:text-emerald-200',
    };
  }
  if (rate < 0.1) {
    return {
      bg: 'bg-amber-500/20 dark:bg-amber-400/25',
      border: 'border-amber-500/50',
      text: 'text-amber-900 dark:text-amber-200',
    };
  }
  return {
    bg: 'bg-rose-500/25 dark:bg-rose-500/30',
    border: 'border-rose-500/60',
    text: 'text-rose-900 dark:text-rose-200',
  };
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  mode = 'interactive',
  activePressedCodes = new Set<string>(),
  targetChar = null,
  highlightedKeys = [],
  keyStats = {},
  selectedHeatmapKey = null,
  onKeySelect,
  showLegend = true,
  compact = false,
}) => {
  const targetGuide = targetChar ? getTargetKeyGuide(targetChar) : null;
  const normalizedHighlightSet = new Set(highlightedKeys.map((k) => k.toLowerCase()));

  const legendFingers: FingerId[] = [
    'left-pinky',
    'left-ring',
    'left-middle',
    'left-index',
    'thumb',
    'right-index',
    'right-middle',
    'right-ring',
    'right-pinky',
  ];

  return (
    <div className="w-full select-none" data-testid="virtual-keyboard">
      <div
        className={`rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/70 ${
          compact ? 'p-2 sm:p-3' : 'p-3 sm:p-4'
        }`}
      >
        <div className="flex flex-col gap-1.5 min-w-0">
          {KEYBOARD_ROWS.map((row, rowIdx) => (
            <div key={rowIdx} className="flex items-center gap-1 sm:gap-1.5 w-full">
              {row.map((keyDef) => {
                const isPressed = activePressedCodes.has(keyDef.id);
                const isTargetMain = targetGuide?.keyDef.id === keyDef.id;
                const isTargetShift =
                  targetGuide?.needsShift && targetGuide.shiftKeyId === keyDef.id;
                const isTarget = isTargetMain || isTargetShift;

                const isHighlightedInLesson =
                  normalizedHighlightSet.size > 0 &&
                  ((keyDef.char && normalizedHighlightSet.has(keyDef.char.toLowerCase())) ||
                    normalizedHighlightSet.has(keyDef.label.toLowerCase()) ||
                    (keyDef.id.startsWith('Shift') &&
                      (normalizedHighlightSet.has('l-shift') ||
                        normalizedHighlightSet.has('r-shift') ||
                        normalizedHighlightSet.has('shift'))));

                const fingerMeta = FINGER_META[keyDef.finger];

                const statLookupKey =
                  keyDef.id === 'Space'
                    ? 'Space'
                    : keyDef.char?.toLowerCase() ?? keyDef.label.toLowerCase();
                const heatmapTone = mode === 'heatmap' ? getHeatmapTone(keyStats[statLookupKey]) : null;
                const isHeatmapSelected =
                  mode === 'heatmap' &&
                  selectedHeatmapKey !== null &&
                  selectedHeatmapKey.toLowerCase() === statLookupKey.toLowerCase();

                let surfaceClasses =
                  'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-primary)]';

                if (mode === 'heatmap' && heatmapTone) {
                  surfaceClasses = `${heatmapTone.bg} ${heatmapTone.border} ${heatmapTone.text}`;
                } else if (isTarget) {
                  surfaceClasses = `${fingerMeta.bgClass} ${fingerMeta.borderClass} ${fingerMeta.textClass} ring-2 ring-[var(--accent-primary)]/40`;
                } else if (isPressed) {
                  surfaceClasses = `${fingerMeta.bgClass} ${fingerMeta.borderClass} ${fingerMeta.textClass}`;
                } else if (isHighlightedInLesson) {
                  surfaceClasses = `${fingerMeta.bgClass} ${fingerMeta.borderClass} ${fingerMeta.textClass}`;
                }

                return (
                  <button
                    key={keyDef.id}
                    type="button"
                    aria-label={`Key ${keyDef.label}${keyDef.shiftLabel ? ` / ${keyDef.shiftLabel}` : ''}, ${fingerMeta.label}`}
                    onClick={() => onKeySelect?.(keyDef)}
                    style={{ flexGrow: keyDef.widthUnits, flexBasis: 0 }}
                    className={`relative flex flex-col items-center justify-center rounded-lg border font-mono-typing transition-transform duration-75 ${
                      compact ? 'h-8 sm:h-9 text-[11px] sm:text-xs' : 'h-10 sm:h-12 text-xs sm:text-sm'
                    } ${surfaceClasses} ${
                      isPressed
                        ? 'translate-y-[2px] shadow-none'
                        : 'shadow-[0_2px_0_0_var(--border-subtle)] hover:border-[var(--accent-primary)]/50'
                    } ${
                      isHeatmapSelected ? 'ring-2 ring-[var(--accent-primary)]' : ''
                    } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]`}
                  >
                    {keyDef.shiftLabel && (
                      <span className="text-[9px] leading-none text-[var(--text-secondary)] mb-0.5 hidden sm:block">
                        {keyDef.shiftLabel}
                      </span>
                    )}
                    <span className="font-semibold leading-none truncate px-0.5">
                      {keyDef.label}
                    </span>
                    {keyDef.hasBump && (
                      <span
                        aria-hidden="true"
                        className="absolute bottom-1 w-2.5 h-0.5 rounded-full bg-[var(--text-secondary)]/60"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {showLegend && mode !== 'heatmap' && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-[var(--text-secondary)]">
          {legendFingers.map((fId) => {
            const meta = FINGER_META[fId];
            const isActiveFinger =
              targetGuide?.finger.id === fId || targetGuide?.shiftFinger?.id === fId;
            return (
              <span
                key={fId}
                className={`inline-flex items-center gap-1.5 ${
                  isActiveFinger ? 'font-semibold text-[var(--text-primary)]' : ''
                }`}
              >
                <span
                  aria-hidden="true"
                  className="inline-block w-2.5 h-2.5 rounded-xs"
                  style={{ backgroundColor: meta.colorHex }}
                />
                <span>{meta.shortLabel}</span>
              </span>
            );
          })}
        </div>
      )}

      {showLegend && mode === 'heatmap' && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-[var(--text-secondary)]">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-xs bg-emerald-500/25 border border-emerald-500/50" />
            <span>High Accuracy (&lt;3% errors)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-xs bg-amber-500/25 border border-amber-500/50" />
            <span>Needs Focus (3–10% errors)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-xs bg-rose-500/30 border border-rose-500/60" />
            <span>Weak Key (&gt;10% errors)</span>
          </span>
        </div>
      )}
    </div>
  );
};
