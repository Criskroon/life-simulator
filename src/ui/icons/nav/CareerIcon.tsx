import type { SVGProps } from 'react';

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  size?: number;
}

export function CareerIcon({ size = 24, ...props }: IconProps) {
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
      <path d="M3.4 8.2 h17 a1 1 0 0 1 1 1.05 v9 a1 1 0 0 1 -1 1 H3.5 a1 1 0 0 1 -1 -1 v-9 a1 1 0 0 1 0.9 -1.05 z" />
      <path d="M8.5 8.1 v-2 a2 2 0 0 1 2 -2 h3 a2 2 0 0 1 2 2 v2" />
      <path d="M2.6 13 c3.2 1.6 6.4 2.4 9.4 2.4 c3 0 6.1 -0.8 9.4 -2.3" />
      <path d="M11 13.5 h2.1" />
    </svg>
  );
}
