import type { WorldIconKey } from './worlds';

interface WorldIconProps {
  iconKey: WorldIconKey;
  size?: number;
}

/**
 * Inline SVG icon set for the eight Worlds. Stroke style follows the
 * Sunny Side icon spec (1.8px, round caps/joins, currentColor).
 * Drawing language matches `sunny-kit.jsx` Icon glyphs so the family
 * stays visually consistent if more screens reuse them later.
 */
export function WorldIcon({ iconKey, size = 28 }: WorldIconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (iconKey) {
    case 'gym':
      return (
        <svg {...common}>
          <rect x={3} y={9} width={3} height={6} rx={1} />
          <rect x={18} y={9} width={3} height={6} rx={1} />
          <rect x={6} y={11} width={2} height={2} />
          <rect x={16} y={11} width={2} height={2} />
          <rect x={8} y={11} width={8} height={2} />
        </svg>
      );
    case 'book':
      return (
        <svg {...common}>
          <path d="M5 5 Q5 4 6 4 H11 Q12 4 12 5 V20 Q12 19 11 19 H6 Q5 19 5 20 Z" />
          <path d="M19 5 Q19 4 18 4 H13 Q12 4 12 5 V20 Q12 19 13 19 H18 Q19 19 19 20 Z" />
          <path d="M7 8 H10 M7 11 H10 M14 8 H17 M14 11 H17" />
        </svg>
      );
    case 'cup':
      return (
        <svg {...common}>
          <path d="M6 5 H18 V11 Q18 15 14 16 V19 H17 V20 H7 V19 H10 V16 Q6 15 6 11 Z" />
          <path d="M18 7 H20 Q21 7 21 8 V11 Q21 13 18 13" />
        </svg>
      );
    case 'heart':
      return (
        <svg {...common}>
          <path d="M12 20 Q4 14 4 9 Q4 6 7 6 Q10 6 12 9 Q14 6 17 6 Q20 6 20 9 Q20 14 12 20 Z" />
        </svg>
      );
    case 'coin':
      return (
        <svg {...common}>
          <circle cx={12} cy={12} r={8.5} />
          <path d="M9.5 14.5 Q9.5 16 12 16 Q14.5 16 14.5 14.5 Q14.5 13 12 13 Q9.5 13 9.5 11.5 Q9.5 10 12 10 Q14.5 10 14.5 11.5" />
          <path d="M12 8 V9 M12 16 V17" />
        </svg>
      );
    case 'bag':
      return (
        <svg {...common}>
          <path d="M5 8 H19 L18 20 Q18 21 17 21 H7 Q6 21 6 20 Z" />
          <path d="M9 8 V6 Q9 3 12 3 Q15 3 15 6 V8" />
        </svg>
      );
    case 'mask':
      return (
        <svg {...common}>
          <path d="M4 9 Q4 7 6 7 H10 Q11 7 11.5 8 Q12 8.5 12.5 8 Q13 7 14 7 H18 Q20 7 20 9 V12 Q20 16 16 16 Q14 16 13 14 Q12.5 13.5 12 13.5 Q11.5 13.5 11 14 Q10 16 8 16 Q4 16 4 12 Z" />
          <circle cx={8} cy={11} r={0.9} fill="currentColor" stroke="none" />
          <circle cx={16} cy={11} r={0.9} fill="currentColor" stroke="none" />
        </svg>
      );
    case 'sparkles':
      return (
        <svg {...common}>
          <path
            d="M12 4 L13.2 9 L18 10 L13.2 11 L12 16 L10.8 11 L6 10 L10.8 9 Z"
            fill="currentColor"
            stroke="none"
          />
          <path
            d="M18 16 L18.6 18 L20.6 18.6 L18.6 19.2 L18 21 L17.4 19.2 L15.4 18.6 L17.4 18 Z"
            fill="currentColor"
            stroke="none"
          />
        </svg>
      );
    default:
      return null;
  }
}
