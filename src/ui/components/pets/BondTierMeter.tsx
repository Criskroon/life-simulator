interface BondTierMeterProps {
  /** 0..100 */
  value: number;
  /** Tier stop labels — meter is divided into N equal segments. Default is
   *  the pet bond ladder from phase-5 (ALOOF · WARMING · BONDED · INSEPARABLE). */
  tiers?: readonly string[];
  /** Tailwind class for the fill (e.g. `bg-section-body`). Defaults to
   *  the Sunny Side meadow green which reads as "vital". */
  fillClass?: string;
  /** Bar height in px. */
  height?: number;
}

const DEFAULT_TIERS = ['ALOOF', 'WARMING', 'BONDED', 'INSEPARABLE'] as const;

/**
 * Pet-bond tier meter ported from phase-5 kit5.jsx. Like a normal progress
 * bar but with named stops so the player can read tier without consulting
 * a numerical Bond value. The big number lives in the parent (BondHero),
 * this component is only the bar + labels.
 */
export function BondTierMeter({
  value,
  tiers = DEFAULT_TIERS,
  fillClass = 'bg-section-body',
  height = 10,
}: BondTierMeterProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div
        className="relative rounded-full overflow-hidden bg-cream-dark"
        style={{ height }}
      >
        <div
          className={`h-full rounded-full transition-all ${fillClass}`}
          style={{ width: `${clamped}%` }}
        />
        {tiers.slice(1).map((_, i) => (
          <div
            key={i}
            aria-hidden="true"
            className="absolute top-0 bottom-0 bg-cream-light/85"
            style={{
              left: `${((i + 1) / tiers.length) * 100}%`,
              width: 1,
            }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-[5px] font-mono text-[9px] text-ink-faint tracking-[0.04em]">
        {tiers.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  );
}
