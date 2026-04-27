import type { SVGProps } from 'react';

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  size?: number;
}

export function PeopleIcon({ size = 24, ...props }: IconProps) {
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
      <path d="M16.4 20.4 v-1.6 a3.6 3.6 0 0 0 -3.6 -3.6 H6.2 a3.6 3.6 0 0 0 -3.6 3.6 v1.65" />
      <path d="M9.45 11.45 a3.5 3.5 0 1 0 -0.05 -0.05 z" />
      <path d="M21.4 20.4 v-1.5 a3.6 3.6 0 0 0 -2.7 -3.5" />
      <path d="M15.4 3.6 a3.6 3.6 0 0 1 0 7" />
    </svg>
  );
}
