import type { Job } from '../../../game/types/gameState';

interface CurrentPositionCardProps {
  job: Job;
  /** Pre-formatted, country-localised salary string (e.g. "€45,200/yr"). */
  salaryLabel: string;
}

/**
 * Block summarising the player's current job. Pure presentational —
 * the screen above it owns the empty state when `player.job === null`.
 * Performance value is shown as a slim bar so the player can read at a
 * glance whether they're cruising, surviving, or about to be let go.
 */
export function CurrentPositionCard({
  job,
  salaryLabel,
}: CurrentPositionCardProps) {
  const performance = Math.max(0, Math.min(100, job.performance));
  return (
    <div
      data-testid="career-current-position-card"
      className="rounded-2xl border border-cream-dark bg-cream px-4 py-3 shadow-warm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-display text-[18px] font-semibold leading-tight tracking-[-0.02em] text-ink">
            {job.title}
          </div>
          <div className="mt-[2px] font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-ink-soft">
            {humaniseCareer(job.careerId)} · Level {job.level}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-display text-[16px] font-semibold tabular-nums text-ink">
            {salaryLabel}
          </div>
          <div className="mt-[2px] font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-ink-faint">
            {job.yearsAtJob === 0
              ? 'New this year'
              : `${job.yearsAtJob}y at company`}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-ink-soft">
            Performance
          </span>
          <span className="font-mono text-[10px] font-medium tabular-nums text-ink-faint">
            {performance}/100
          </span>
        </div>
        <div className="mt-1 h-[4px] w-full overflow-hidden rounded-full bg-cream-dark">
          <div
            className="h-full rounded-full bg-brass"
            style={{ width: `${performance}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Tiny presentation helper — turns a careerId snake-case slug into a
 * Title Case string. Intentionally not exposed: the engine owns the
 * canonical names; this is just for the UI when only the id is in scope.
 */
function humaniseCareer(careerId: string): string {
  return careerId
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
