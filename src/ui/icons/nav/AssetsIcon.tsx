import type { SVGProps } from 'react';

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  size?: number;
}

export function AssetsIcon({ size = 24, ...props }: IconProps) {
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
      <path d="M3.2 7.3 a1 1 0 0 1 1 -1 h12.6 a1 1 0 0 1 1 1 v2.5" />
      <path d="M3.1 7.4 v10.4 a1 1 0 0 0 1 1 h15.6 a1 1 0 0 0 1 -1 v-7.6 a1 1 0 0 0 -1 -1 H4.1" />
      <path d="M16.8 14 a1.4 1.4 0 1 0 0 -0.05 z" />
      <path d="M6.5 6.3 c0 -1 0.7 -1.7 1.7 -1.8 l5.4 -0.7 c1 -0.1 1.7 0.4 1.7 1.4 v0.9" />
    </svg>
  );
}
