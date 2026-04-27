import type { SVGProps } from 'react';

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  size?: number;
}

/**
 * Sparkle cluster: one large four-point star + two small companions.
 * Suggests "things you can do", picked over a compass to avoid Pinterest-y
 * navigation cliché.
 */
export function ActivitiesIcon({ size = 24, ...props }: IconProps) {
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
      <path d="M11.9 4.1 c0.4 2.6 1.4 4.5 3 5.6 c1.6 1.1 3.4 1.6 5.5 1.6 c-2.1 0 -3.9 0.55 -5.5 1.65 c-1.6 1.1 -2.6 3 -3 5.6 c-0.4 -2.6 -1.4 -4.5 -3 -5.6 c-1.6 -1.1 -3.4 -1.65 -5.5 -1.65 c2.1 0 3.9 -0.5 5.5 -1.6 c1.6 -1.1 2.6 -3 3 -5.6 z" />
      <path d="M19 16.4 c0.15 1 0.55 1.7 1.2 2.1 c0.65 0.4 1.35 0.6 2.1 0.6 c-0.75 0 -1.45 0.2 -2.1 0.6 c-0.65 0.4 -1.05 1.1 -1.2 2.1 c-0.15 -1 -0.55 -1.7 -1.2 -2.1 c-0.65 -0.4 -1.35 -0.6 -2.1 -0.6 c0.75 0 1.45 -0.2 2.1 -0.6 c0.65 -0.4 1.05 -1.1 1.2 -2.1 z" />
    </svg>
  );
}
