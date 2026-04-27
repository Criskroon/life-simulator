import { type ReactNode } from 'react';

interface AssetRowProps {
  /** Leading icon glyph rendered inside the accent square. */
  icon: ReactNode;
  /** Tailwind colour class for the icon's accent square (e.g. "bg-section-mind"). */
  accentClass: string;
  /** Primary line — "Apartment · Jordaan", "ASML · 220 shares". */
  title: string;
  /** Secondary line — "Owned 3y · €18k mortgage left". */
  subtitle?: string;
  /** Optional tertiary mono chip status — "ACCESSIBLE TODAY". */
  status?: string;
  /** Pre-formatted right-rail money string ("€235,000"). */
  amountLabel: string;
  /**
   * Optional progress bar shown beneath the secondary line. `value` and
   * `total` are unitless numbers; the row converts them to a percentage
   * and clamps to 0..100. The bar's filled portion uses
   * `progressColorClass`; the unfilled rail is always cream-dark.
   */
  progress?: {
    value: number;
    total: number;
    progressColorClass: string;
    /** Optional small label rendered above the bar ("65% paid"). */
    label?: string;
  };
  testId?: string;
}

/**
 * Single asset line on the Assets screen. Mirrors `ActivityRow`'s rhythm
 * — cream card, ink-bordered accent square on the left — but the right
 * rail is a stacked title + amount stack rather than a cost / AP cluster.
 * The optional progress bar fills two distinct jobs: mortgage paid-off
 * for properties (green = paid) and condition for vehicles (green =
 * good shape, fading to cream as condition drops).
 */
export function AssetRow({
  icon,
  accentClass,
  title,
  subtitle,
  status,
  amountLabel,
  progress,
  testId,
}: AssetRowProps) {
  return (
    <div
      data-testid={testId}
      className="flex w-full items-start gap-3 rounded-[14px] border border-cream-dark bg-cream px-3 py-[10px] shadow-[0_2px_0_rgba(0,0,0,0.03)]"
    >
      <div
        aria-hidden="true"
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-ink text-cream-light ${accentClass}`}
        style={{ boxShadow: '0 1.5px 0 rgba(0,0,0,0.08)' }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <div className="min-w-0 truncate font-bold text-[13.5px] tracking-[-0.01em] text-ink">
            {title}
          </div>
          <div className="shrink-0 font-mono text-[12.5px] font-bold tabular-nums text-ink">
            {amountLabel}
          </div>
        </div>
        {subtitle && (
          <div className="mt-[1px] truncate text-[11.5px] leading-[1.3] text-ink-soft">
            {subtitle}
          </div>
        )}
        {status && (
          <div className="mt-[2px] font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
            {status}
          </div>
        )}
        {progress && <ProgressBar {...progress} />}
      </div>
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  total: number;
  progressColorClass: string;
  label?: string;
}

function ProgressBar({
  value,
  total,
  progressColorClass,
  label,
}: ProgressBarProps) {
  const pct =
    total <= 0 ? 0 : Math.max(0, Math.min(100, Math.round((value / total) * 100)));
  return (
    <div className="mt-2">
      {label && (
        <div className="mb-[2px] font-mono text-[9.5px] font-medium uppercase tracking-[0.06em] text-ink-faint">
          {label}
        </div>
      )}
      <div className="h-[5px] w-full overflow-hidden rounded-full bg-cream-dark">
        <div
          className={`h-full rounded-full ${progressColorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
