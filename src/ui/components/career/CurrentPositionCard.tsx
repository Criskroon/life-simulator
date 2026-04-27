import type { Job, PlayerState } from '../../../game/types/gameState';
import { getCareer } from '../../../game/data/careers';
import {
  CITY_BY_COUNTRY,
  COMPANY_BY_CAREER,
  VIGNETTE_BY_STARS,
} from './careerData';

interface CurrentPositionCardProps {
  player: PlayerState;
  job: Job;
  /** Pre-formatted, country-localised salary string (e.g. "€58,000/yr"). */
  salaryLabel: string;
  /** Currency symbol used to format the mock year-over-year delta. */
  currencySymbol: string;
}

/**
 * Rich Current Position card matching the design mockup. Combines real
 * engine fields (title, careerId, level, salary, performance, yearsAtJob)
 * with mock UI scaffolding for fields the engine does not yet hold
 * (employer name, city, salary delta, level-progression bar, vignette).
 *
 * Layout: header row (icon + title + level badge), sub-row (company ·
 * city · tenure), Salary block + Performance stars block side-by-side,
 * a slim progression bar toward the next level, and a one-line italic
 * vignette grounded in the performance bucket.
 */
export function CurrentPositionCard({
  player,
  job,
  salaryLabel,
  currencySymbol,
}: CurrentPositionCardProps) {
  const stars = performanceStars(job.performance);
  const career = getCareer(job.careerId);
  const company = COMPANY_BY_CAREER[job.careerId] ?? 'Independent';
  const city = CITY_BY_COUNTRY[player.country] ?? '—';
  const tenureLabel =
    job.yearsAtJob === 0
      ? 'New this year'
      : `${job.yearsAtJob}y at ${company}`;
  const salaryDelta = mockSalaryDelta(job, currencySymbol);
  const nextLevel = career?.levels[job.level + 1] ?? null;
  const performanceTarget = nextLevel?.minSmarts ?? 100;
  const towardLabel = nextLevel
    ? `Toward L${job.level + 2} · ${nextLevel.title}`
    : 'Top of this ladder';
  const vignette = VIGNETTE_BY_STARS[stars] ?? VIGNETTE_BY_STARS[3];

  return (
    <div
      data-testid="career-current-position-card"
      className="rounded-2xl border border-cream-dark bg-cream-light px-4 py-4 shadow-warm"
    >
      {/* Header: icon · (title / level badge) / sub-line */}
      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-cream-dark bg-cream text-brass"
        >
          <BriefcaseGlyph />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="font-display text-[19px] font-semibold leading-tight tracking-[-0.02em] text-ink">
              {job.title}
            </div>
            <div
              data-testid="career-level-badge"
              className="shrink-0 rounded-full border border-brass/60 bg-cream px-2 py-[1px] font-mono text-[10.5px] font-semibold tracking-[0.04em] text-brass"
            >
              L{job.level + 1}
            </div>
          </div>
          <div className="mt-[2px] truncate font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
            {company} · {city.toUpperCase()} · {tenureLabel.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Salary + Performance, side-by-side */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div data-testid="career-salary-block">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-ink-faint">
            Salary
          </div>
          <div className="mt-[2px] font-display text-[18px] font-semibold tabular-nums text-ink">
            {salaryLabel}
          </div>
          <div className="mt-[1px] font-mono text-[10px] font-medium tracking-[0.02em] text-ink-soft">
            {salaryDelta}
          </div>
        </div>
        <div data-testid="career-performance-block">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-ink-faint">
            Performance
          </div>
          <div className="mt-[2px] flex items-center gap-[2px]" aria-label={`${stars} of 5 stars`}>
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} filled={i < stars} />
            ))}
          </div>
          <div className="mt-[1px] font-mono text-[10px] font-medium uppercase tracking-[0.04em] text-ink-soft">
            {STARS_LABEL[stars]}
          </div>
        </div>
      </div>

      {/* Progression bar */}
      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-ink-soft">
            {towardLabel}
          </span>
          <span className="font-mono text-[10px] font-medium tabular-nums text-ink-faint">
            {Math.round(job.performance)} / {performanceTarget}
          </span>
        </div>
        <div className="mt-1 h-[5px] w-full overflow-hidden rounded-full bg-cream-dark">
          <div
            data-testid="career-progress-fill"
            className="h-full rounded-full bg-brass"
            style={{
              width: `${Math.min(100, Math.round((job.performance / performanceTarget) * 100))}%`,
            }}
          />
        </div>
      </div>

      {/* Vignette quote */}
      <p className="mt-3 font-sans text-[12.5px] italic leading-snug text-ink-soft">
        &ldquo;{vignette}&rdquo;
      </p>
    </div>
  );
}

const STARS_LABEL: Record<number, string> = {
  1: 'On thin ice',
  2: 'Below the bar',
  3: 'Meets expectations',
  4: 'Exceeds expectations',
  5: 'Outstanding',
};

/**
 * Bucket performance (0..100) into 1..5 stars. Floors of 20-point bands;
 * 0 still shows 1 filled star so the row never reads as a void. Pure —
 * the card never mutates job.performance, just renders against it.
 */
function performanceStars(performance: number): number {
  const clamped = Math.max(0, Math.min(100, performance));
  if (clamped >= 80) return 5;
  if (clamped >= 60) return 4;
  if (clamped >= 40) return 3;
  if (clamped >= 20) return 2;
  return 1;
}

/**
 * Mock year-over-year salary delta. The engine doesn't track last year's
 * salary, so we synthesise a plausible bump scaled to the player's current
 * salary band: ~7% rounded to the nearest thousand. First-year jobs get a
 * neutral string instead of a fake increase.
 */
function mockSalaryDelta(job: Job, symbol: string): string {
  if (job.yearsAtJob === 0) return 'First year';
  const bump = Math.max(1, Math.round((job.salary * 0.07) / 1000));
  return `↑ +${symbol}${bump}k vs last year`;
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={filled ? 'text-brass' : 'text-cream-dark'}
      aria-hidden="true"
    >
      <path d="M12 2 L14.6 8.6 L21.6 9.2 L16.3 13.8 L18 20.6 L12 17 L6 20.6 L7.7 13.8 L2.4 9.2 L9.4 8.6 Z" />
    </svg>
  );
}

function BriefcaseGlyph() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x={3} y={7} width={18} height={13} rx={2} />
      <path d="M9 7 V5 Q9 4 10 4 H14 Q15 4 15 5 V7" />
      <path d="M3 12 H21" />
    </svg>
  );
}
