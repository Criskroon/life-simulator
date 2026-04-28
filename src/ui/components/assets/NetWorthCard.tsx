import { NetWorthChart } from './NetWorthChart';

interface NetWorthCardProps {
  /** Pre-formatted total ("€342,000"). */
  totalLabel: string;
  /** Mock year-over-year delta amount, already symbol-formatted. */
  deltaLabel: string;
  /** Qualitative label — "ahead of pace" / "steady" / "falling behind"
   *  / "first year". Drives both the copy and the arrow tone. */
  qualitative: 'ahead of pace' | 'steady' | 'falling behind' | 'first year';
  history: ReadonlyArray<number>;
  endYear: number;
}

/**
 * Hero card pinned to the top of the Assets screen. Always visible (not
 * collapsible) per the mockup. Lays out as: NET WORTH eyebrow, big
 * display number, a coloured delta line with a directional glyph, then
 * the 9-bar history chart. Number is the only place on the screen using
 * the larger display weight — sets the visual anchor for the rest of
 * the rows.
 */
export function NetWorthCard({
  totalLabel,
  deltaLabel,
  qualitative,
  history,
  endYear,
}: NetWorthCardProps) {
  const isFirstYear = qualitative === 'first year';
  const isFalling = qualitative === 'falling behind';
  const arrow = isFirstYear ? '·' : isFalling ? '↓' : '↑';
  const deltaColor = isFirstYear
    ? 'text-ink-soft'
    : isFalling
      ? 'text-danger'
      : 'text-success';

  return (
    <div
      data-testid="assets-networth-card"
      className="rounded-2xl border border-cream-dark bg-cream-light px-4 py-4 shadow-warm"
    >
      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-brass">
        Net worth
      </div>
      <div
        data-testid="assets-networth-total"
        className="mt-[2px] font-display text-[30px] font-semibold leading-[1.05] tracking-[-0.025em] text-ink"
      >
        {totalLabel}
      </div>
      <div
        data-testid="assets-networth-delta"
        className={`mt-1 font-mono text-[11px] font-semibold tracking-[0.02em] ${deltaColor}`}
      >
        <span aria-hidden="true">{arrow} </span>
        {isFirstYear ? (
          <>First year on record</>
        ) : (
          <>
            {deltaLabel} vs last year · {qualitative}
          </>
        )}
      </div>
      <div className="mt-3">
        <NetWorthChart history={history} endYear={endYear} />
      </div>
    </div>
  );
}
