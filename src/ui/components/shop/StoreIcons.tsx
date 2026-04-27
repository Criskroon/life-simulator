import type { StoreIconKey } from './shopData';

interface StoreIconProps {
  iconKey: StoreIconKey;
  size?: number;
}

/**
 * Single icon glyph for a Shop Hub store card. Uses currentColor so the
 * caller controls the stroke colour via `text-cream-light` (or any other
 * tailwind text utility). All glyphs share the same 24×24 viewBox and a
 * 1.6 stroke weight so they read as a family.
 */
export function StoreIcon({ iconKey, size = 28 }: StoreIconProps) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (iconKey) {
    case 'car':
      return (
        <svg {...props}>
          <path d="M4 14 L5.5 9 H18.5 L20 14" />
          <path d="M3 14 H21 V18 H3 Z" />
          <circle cx={7} cy={18} r={1.4} />
          <circle cx={17} cy={18} r={1.4} />
        </svg>
      );
    case 'house':
      return (
        <svg {...props}>
          <path d="M3 11 L12 4 L21 11" />
          <path d="M5 10 V20 H19 V10" />
          <path d="M10 20 V14 H14 V20" />
        </svg>
      );
    case 'gem':
      return (
        <svg {...props}>
          <path d="M6 4 H18 L21 9 L12 21 L3 9 Z" />
          <path d="M3 9 H21" />
          <path d="M9 4 L12 21" />
          <path d="M15 4 L12 21" />
        </svg>
      );
    case 'watch':
      return (
        <svg {...props}>
          <circle cx={12} cy={12} r={6} />
          <path d="M9 4 H15" />
          <path d="M9 20 H15" />
          <path d="M12 9 V12 L14 14" />
        </svg>
      );
    case 'frame':
      return (
        <svg {...props}>
          <rect x={4} y={4} width={16} height={16} rx={1} />
          <path d="M7 17 L10 13 L13 16 L17 11 L17 17 Z" />
          <circle cx={9} cy={9} r={1.2} />
        </svg>
      );
    case 'boat':
      return (
        <svg {...props}>
          <path d="M3 16 L5 20 H19 L21 16 Z" />
          <path d="M5 16 V12 H19 V16" />
          <path d="M12 4 V12" />
          <path d="M12 6 L17 12 H12" />
        </svg>
      );
    case 'tv':
      return (
        <svg {...props}>
          <rect x={3} y={5} width={18} height={12} rx={1.5} />
          <path d="M8 21 H16" />
          <path d="M12 17 V21" />
        </svg>
      );
    case 'shirt':
      return (
        <svg {...props}>
          <path d="M5 7 L9 4 L12 6 L15 4 L19 7 L17 11 L15 10 V20 H9 V10 L7 11 Z" />
        </svg>
      );
    case 'paw':
      return (
        <svg {...props}>
          <circle cx={6} cy={10} r={1.6} />
          <circle cx={10} cy={6} r={1.6} />
          <circle cx={14} cy={6} r={1.6} />
          <circle cx={18} cy={10} r={1.6} />
          <path d="M8 16 Q12 11 16 16 Q18 19 16 20 H8 Q6 19 8 16 Z" />
        </svg>
      );
    default:
      return null;
  }
}
