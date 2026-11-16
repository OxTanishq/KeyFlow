import React from 'react';
import { FINGER_META, type FingerId } from '../core/keyboardLayout';

interface HandDiagramProps {
  activeFinger?: FingerId | null;
  secondaryFinger?: FingerId | null;
}

export const HandDiagram: React.FC<HandDiagramProps> = ({
  activeFinger = null,
  secondaryFinger = null,
}) => {
  const isHighlighted = (fId: FingerId) => activeFinger === fId || secondaryFinger === fId;

  const getFill = (fId: FingerId) =>
    isHighlighted(fId) ? FINGER_META[fId].colorHex : 'currentColor';

  const getOpacity = (fId: FingerId) => (isHighlighted(fId) ? 0.95 : 0.16);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center justify-center gap-6 text-[var(--text-secondary)]">
        {/* Left Hand SVG */}
        <svg
          width="112"
          height="92"
          viewBox="0 0 120 100"
          fill="none"
          aria-label="Left hand finger placement diagram"
          className="overflow-visible"
        >
          {/* Palm */}
          <rect
            x="24"
            y="48"
            width="64"
            height="42"
            rx="16"
            fill="currentColor"
            fillOpacity="0.08"
            stroke="currentColor"
            strokeOpacity="0.25"
            strokeWidth="1.5"
          />
          {/* Left Pinky */}
          <rect
            x="16"
            y="24"
            width="13"
            height="34"
            rx="6.5"
            fill={getFill('left-pinky')}
            fillOpacity={getOpacity('left-pinky')}
            stroke={FINGER_META['left-pinky'].colorHex}
            strokeWidth={isHighlighted('left-pinky') ? 2 : 1}
          />
          {/* Left Ring */}
          <rect
            x="33"
            y="12"
            width="14"
            height="42"
            rx="7"
            fill={getFill('left-ring')}
            fillOpacity={getOpacity('left-ring')}
            stroke={FINGER_META['left-ring'].colorHex}
            strokeWidth={isHighlighted('left-ring') ? 2 : 1}
          />
          {/* Left Middle */}
          <rect
            x="51"
            y="6"
            width="14"
            height="47"
            rx="7"
            fill={getFill('left-middle')}
            fillOpacity={getOpacity('left-middle')}
            stroke={FINGER_META['left-middle'].colorHex}
            strokeWidth={isHighlighted('left-middle') ? 2 : 1}
          />
          {/* Left Index */}
          <rect
            x="69"
            y="14"
            width="14"
            height="40"
            rx="7"
            fill={getFill('left-index')}
            fillOpacity={getOpacity('left-index')}
            stroke={FINGER_META['left-index'].colorHex}
            strokeWidth={isHighlighted('left-index') ? 2 : 1}
          />
          {/* Left Thumb */}
          <rect
            x="89"
            y="48"
            width="16"
            height="30"
            rx="8"
            transform="rotate(-25 89 48)"
            fill={getFill('thumb')}
            fillOpacity={getOpacity('thumb')}
            stroke={FINGER_META.thumb.colorHex}
            strokeWidth={isHighlighted('thumb') ? 2 : 1}
          />
        </svg>

        {/* Right Hand SVG */}
        <svg
          width="112"
          height="92"
          viewBox="0 0 120 100"
          fill="none"
          aria-label="Right hand finger placement diagram"
          className="overflow-visible"
        >
          {/* Palm */}
          <rect
            x="32"
            y="48"
            width="64"
            height="42"
            rx="16"
            fill="currentColor"
            fillOpacity="0.08"
            stroke="currentColor"
            strokeOpacity="0.25"
            strokeWidth="1.5"
          />
          {/* Right Thumb */}
          <rect
            x="15"
            y="42"
            width="16"
            height="30"
            rx="8"
            transform="rotate(25 15 42)"
            fill={getFill('thumb')}
            fillOpacity={getOpacity('thumb')}
            stroke={FINGER_META.thumb.colorHex}
            strokeWidth={isHighlighted('thumb') ? 2 : 1}
          />
          {/* Right Index */}
          <rect
            x="37"
            y="14"
            width="14"
            height="40"
            rx="7"
            fill={getFill('right-index')}
            fillOpacity={getOpacity('right-index')}
            stroke={FINGER_META['right-index'].colorHex}
            strokeWidth={isHighlighted('right-index') ? 2 : 1}
          />
          {/* Right Middle */}
          <rect
            x="55"
            y="6"
            width="14"
            height="47"
            rx="7"
            fill={getFill('right-middle')}
            fillOpacity={getOpacity('right-middle')}
            stroke={FINGER_META['right-middle'].colorHex}
            strokeWidth={isHighlighted('right-middle') ? 2 : 1}
          />
          {/* Right Ring */}
          <rect
            x="73"
            y="12"
            width="14"
            height="42"
            rx="7"
            fill={getFill('right-ring')}
            fillOpacity={getOpacity('right-ring')}
            stroke={FINGER_META['right-ring'].colorHex}
            strokeWidth={isHighlighted('right-ring') ? 2 : 1}
          />
          {/* Right Pinky */}
          <rect
            x="91"
            y="24"
            width="13"
            height="34"
            rx="6.5"
            fill={getFill('right-pinky')}
            fillOpacity={getOpacity('right-pinky')}
            stroke={FINGER_META['right-pinky'].colorHex}
            strokeWidth={isHighlighted('right-pinky') ? 2 : 1}
          />
        </svg>
      </div>

      {activeFinger && (
        <p className="text-xs font-medium text-[var(--text-primary)]">
          Finger:{' '}
          <span className="font-semibold" style={{ color: FINGER_META[activeFinger].colorHex }}>
            {FINGER_META[activeFinger].label}
          </span>
          {secondaryFinger && (
            <>
              {' + '}
              <span className="font-semibold" style={{ color: FINGER_META[secondaryFinger].colorHex }}>
                {FINGER_META[secondaryFinger].label} (Shift)
              </span>
            </>
          )}
        </p>
      )}
    </div>
  );
};
