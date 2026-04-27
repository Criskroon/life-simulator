import type { SVGProps } from 'react';

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  size?: number;
}

/**
 * Sun + swirl: signature motif of Sunny Side. Used in the Age+1 FAB
 * and anywhere "another year passes" needs a glyph.
 */
export function AgeUpIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 7.6 a4.4 4.4 0 1 0 0.05 0.05 z" />
      <path d="M12 2.6 v2.1" />
      <path d="M12 19.4 v2.05" />
      <path d="M2.6 12 h2.1" />
      <path d="M19.3 12 h2.1" />
      <path d="M5.3 5.4 l1.55 1.55" />
      <path d="M17.15 17.15 l1.55 1.55" />
      <path d="M5.3 18.7 l1.55 -1.55" />
      <path d="M17.15 6.95 l1.55 -1.55" />
    </svg>
  );
}
