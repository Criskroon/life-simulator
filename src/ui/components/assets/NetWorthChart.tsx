interface NetWorthChartProps {
  /** Oldest-first series of yearly totals — last entry is the current year. */
  history: ReadonlyArray<number>;
  /** Year of the last (rightmost) bar. The first label is rendered as
   *  the year `history.length - 1` years before that. */
  endYear: number;
}

const VIEW_WIDTH = 220;
const VIEW_HEIGHT = 44;
const BAR_GAP = 4;
const TOP_PADDING = 4;

/**
 * Compact 9-bar history chart for the Net Worth hero card. Pure inline
 * SVG — no charting library. Bars share the same baseline and scale
 * against the series max so growth reads visually even when the absolute
 * numbers shift across players. The last bar is coral to ground the eye
 * on the current year; earlier bars sit in muted teal so they read as
 * context, not focal points.
 */
export function NetWorthChart({ history, endYear }: NetWorthChartProps) {
  const safeMax = Math.max(1, ...history);
  const slot = (VIEW_WIDTH - BAR_GAP * (history.length - 1)) / history.length;
  const drawableHeight = VIEW_HEIGHT - TOP_PADDING;
  const startYear = endYear - (history.length - 1);
  const startLabel = `'${String(startYear).slice(-2)}`;
  const endLabel = `'${String(endYear).slice(-2)}`;

  return (
    <div data-testid="assets-networth-chart">
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        preserveAspectRatio="none"
        className="block h-11 w-full"
        role="img"
        aria-label={`Net worth from ${startLabel} to ${endLabel}`}
      >
        <g className="text-section-mind/30">
          {history.slice(0, -1).map((value, i) => {
            const h = Math.max(2, Math.round((value / safeMax) * drawableHeight));
            const x = i * (slot + BAR_GAP);
            const y = VIEW_HEIGHT - h;
            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={slot}
                height={h}
                rx={1.5}
                fill="currentColor"
              />
            );
          })}
        </g>
        <g className="text-coral">
          {(() => {
            const lastIdx = history.length - 1;
            const value = history[lastIdx] ?? 0;
            const h = Math.max(2, Math.round((value / safeMax) * drawableHeight));
            const x = lastIdx * (slot + BAR_GAP);
            const y = VIEW_HEIGHT - h;
            return (
              <rect
                x={x}
                y={y}
                width={slot}
                height={h}
                rx={1.5}
                fill="currentColor"
              />
            );
          })()}
        </g>
      </svg>
      <div className="mt-1 flex justify-between font-mono text-[9.5px] font-medium uppercase tracking-[0.06em] text-ink-faint">
        <span>{startLabel}</span>
        <span>{endLabel}</span>
      </div>
    </div>
  );
}
