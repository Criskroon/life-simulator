import type { PetColor, PetSpecies } from './types';

interface PetAvatarProps {
  species: PetSpecies;
  color: PetColor;
  /** Stable identifier — used as a deterministic tiebreaker for unspecified
   *  fields. Optional; defaults to a constant so deterministic test renders
   *  don't drift. */
  id?: string;
  size?: number;
}

const PALETTES: Record<
  PetColor,
  { fur: string; dark: string; light: string; collar: string }
> = {
  golden: { fur: '#e8b878', dark: '#c89048', light: '#fff5e2', collar: '#3a8c8b' },
  chocolate: { fur: '#7d4d2c', dark: '#5a3520', light: '#fff5e2', collar: '#ff7a59' },
  blackcat: { fur: '#3a2820', dark: '#1a0e08', light: '#888', collar: '#ffb02e' },
  gingercat: { fur: '#e88c4a', dark: '#c46a2c', light: '#fff5e2', collar: '#ff97a7' },
};

const INK = '#1f1a17';

/**
 * Hand-drawn pet illustration ported from phase-5 kit5.jsx. Two species
 * (dog / cat) × four palettes — deterministic, no randomness. Drawn at a
 * 64-unit canvas and scaled to `size` so it composes the same in a 40px
 * row avatar and a 68px profile hero.
 */
export function PetAvatar({ species, color, size = 56 }: PetAvatarProps) {
  const c = PALETTES[color];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      style={{ display: 'block' }}
      aria-hidden="true"
    >
      <circle
        cx={32}
        cy={32}
        r={31}
        fill={c.light}
        stroke={INK}
        strokeWidth={1.2}
      />
      {species === 'dog' ? (
        <g>
          {/* ears */}
          <path
            d="M14 26 Q12 14 22 18 Q24 22 22 30 Z"
            fill={c.dark}
            stroke={INK}
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
          <path
            d="M50 26 Q52 14 42 18 Q40 22 42 30 Z"
            fill={c.dark}
            stroke={INK}
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
          {/* head */}
          <ellipse cx={32} cy={36} rx={17} ry={18} fill={c.fur} stroke={INK} strokeWidth={1.3} />
          {/* snout */}
          <ellipse cx={32} cy={44} rx={9} ry={7} fill={c.light} stroke={INK} strokeWidth={1.2} />
          {/* eyes */}
          <circle cx={26} cy={34} r={1.6} fill={INK} />
          <circle cx={38} cy={34} r={1.6} fill={INK} />
          <circle cx={26.5} cy={33.5} r={0.5} fill="#fff" />
          <circle cx={38.5} cy={33.5} r={0.5} fill="#fff" />
          {/* nose */}
          <ellipse cx={32} cy={41} rx={2.4} ry={1.6} fill={INK} />
          {/* mouth */}
          <path
            d="M30 45 Q32 47 34 45"
            fill="none"
            stroke={INK}
            strokeWidth={1.1}
            strokeLinecap="round"
          />
          {/* tongue */}
          <path
            d="M31 46 Q32 48.5 33 46"
            fill="#ff97a7"
            stroke={INK}
            strokeWidth={0.9}
            strokeLinejoin="round"
          />
          {/* collar */}
          <path
            d="M19 50 Q32 56 45 50"
            fill="none"
            stroke={c.collar}
            strokeWidth={3}
            strokeLinecap="round"
          />
        </g>
      ) : (
        <g>
          {/* ears */}
          <path
            d="M16 24 L20 12 L26 22 Z"
            fill={c.fur}
            stroke={INK}
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
          <path
            d="M48 24 L44 12 L38 22 Z"
            fill={c.fur}
            stroke={INK}
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
          <path d="M19 22 L21 16 L24 21 Z" fill={c.dark} />
          <path d="M45 22 L43 16 L40 21 Z" fill={c.dark} />
          {/* head */}
          <ellipse cx={32} cy={34} rx={16} ry={16} fill={c.fur} stroke={INK} strokeWidth={1.3} />
          {/* eyes */}
          <ellipse cx={26} cy={32} rx={2.6} ry={2} fill="#9ec64a" stroke={INK} strokeWidth={1} />
          <ellipse cx={38} cy={32} rx={2.6} ry={2} fill="#9ec64a" stroke={INK} strokeWidth={1} />
          <ellipse cx={26} cy={32} rx={0.5} ry={1.7} fill={INK} />
          <ellipse cx={38} cy={32} rx={0.5} ry={1.7} fill={INK} />
          {/* nose */}
          <path
            d="M30.5 38 L33.5 38 L32 40 Z"
            fill={c.dark}
            stroke={INK}
            strokeWidth={1}
            strokeLinejoin="round"
          />
          {/* mouth */}
          <path
            d="M32 40 V42 M32 42 Q30 44 28.5 43 M32 42 Q34 44 35.5 43"
            fill="none"
            stroke={INK}
            strokeWidth={1.1}
            strokeLinecap="round"
          />
          {/* whiskers */}
          <path
            d="M22 38 H17 M22 40 H17 M42 38 H47 M42 40 H47"
            stroke={INK}
            strokeWidth={0.8}
            strokeLinecap="round"
          />
        </g>
      )}
    </svg>
  );
}
