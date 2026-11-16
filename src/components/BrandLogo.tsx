import React from 'react';

interface BrandLogoProps {
  className?: string;
  showWordmark?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  showWordmark = true,
}) => {
  return (
    <span className={`inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 ${className}`}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          x="2"
          y="2"
          width="28"
          height="28"
          rx="8"
          fill="#6558F5"
        />
        <rect
          x="6.5"
          y="7"
          width="19"
          height="15"
          rx="4"
          fill="#FFFFFF"
          fillOpacity="0.16"
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />
        <path
          d="M11 11.5L15 14.5L11 17.5"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line
          x1="16.5"
          y1="17.5"
          x2="21.5"
          y2="17.5"
          stroke="#22C5A8"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
      {showWordmark && (
        <span className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
          KeyFlow
        </span>
      )}
    </span>
  );
};
