import { useState } from 'react';
import {
  adjustPrice,
  adjustSalary,
  getCurrentCountry,
} from '../../../game/engine/countryEngine';
import { getEducationState } from '../../../game/engine/educationProgressionEngine';
import type { PlayerState } from '../../../game/types/gameState';
import { useComingSoon } from '../ComingSoonHandler';
import { CareerHistorySection } from './CareerHistorySection';
import { CollapsibleSection } from './CollapsibleSection';
import { CurrentPositionCard } from './CurrentPositionCard';
import { FIND_WORK_LISTINGS, SPECIAL_CAREERS } from './careerData';
import { DiplomaHistorySection } from './DiplomaHistorySection';
import { EducationCard } from './EducationCard';
import { EducationDetailModal } from './EducationDetailModal';
import { stageDisplayName } from './educationFormat';
import { InlineActionRows } from './InlineActionRows';
import { JobListing } from './JobListing';

interface CareerScreenProps {
  player: PlayerState;
}

/** GB-baseline price for a short professional course; localised at render. */
const TRAINING_COURSE_BASE_PRICE = 1200;

type SectionId = 'education' | 'find' | 'special';

/**
 * Career tab — a status overview, not a flow. The screen reads top-down:
 * a header strip with life-stage / year / live job summary, then either
 * a rich Current Position card with embedded "this year" actions (when
 * employed) or an unemployed empty-state CTA, then collapsible sections
 * for Education / Find Work / Special Careers, and a quiet History
 * footer pinned to the bottom.
 *
 * All actions still route through `useComingSoon` until the career
 * engine wiring lands.
 */
export function CareerScreen({ player }: CareerScreenProps) {
  const { showComingSoon } = useComingSoon();
  const country = getCurrentCountry(player);
  const symbol = country.currency.symbol;
  const [openSections, setOpenSections] = useState<Set<SectionId>>(
    () => new Set<SectionId>(),
  );
  const [educationDetailOpen, setEducationDetailOpen] = useState(false);

  const toggle = (id: SectionId) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const job = player.job;
  const educationState = getEducationState(player);
  const lifeStage = lifeStageFor(player.age);

  const formatYearlySalary = (salary: number): string =>
    `${symbol}${salary.toLocaleString()}/yr`;

  const formatMonthlySalary = (annualBaseline: number): string => {
    const adjusted = adjustSalary(annualBaseline, country);
    const monthly = Math.round(adjusted / 12);
    return `${symbol}${monthly.toLocaleString()}/mo`;
  };

  const trainingCostLabel = `-${symbol}${adjustPrice(
    TRAINING_COURSE_BASE_PRICE,
    country,
  ).toLocaleString()}`;

  const subtitle = job
    ? `${job.title} · ${job.yearsAtJob === 0 ? 'New this year' : `${job.yearsAtJob}y on the job`}`
    : `Unemployed · ${player.currentYear}`;

  return (
    <div data-testid="career-screen" className="space-y-3 pb-2">
      {/* Header — eyebrow (life stage · year), display "Career", subtitle
          live job summary. No action-point pips here per mockup. */}
      <div className="rounded-2xl border border-cream-dark bg-cream-light px-4 py-3 shadow-warm">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-brass">
          {lifeStage} · {player.currentYear}
        </div>
        <h2 className="mt-1 font-display text-[24px] font-bold leading-[1.05] tracking-[-0.025em] text-ink">
          Career
        </h2>
        <p
          data-testid="career-header-subtitle"
          className="mt-1 font-sans text-[12.5px] leading-snug text-ink-soft"
        >
          {subtitle}
        </p>
      </div>

      {job ? (
        <>
          <CurrentPositionCard
            player={player}
            job={job}
            salaryLabel={formatYearlySalary(job.salary)}
            currencySymbol={symbol}
          />
          <InlineActionRows job={job} trainingCostLabel={trainingCostLabel} />
        </>
      ) : (
        <EmptyJobState
          onCta={() => {
            setOpenSections((prev) => {
              const next = new Set(prev);
              next.add('find');
              return next;
            });
          }}
        />
      )}

      {/* Education — driven by educationState since 2.2 */}
      <CollapsibleSection
        sectionId="education"
        title="Education"
        eyebrow={educationEyebrow(player, educationState, country)}
        meta={
          educationState.diplomas.length > 0
            ? `${educationState.diplomas.length} diploma${educationState.diplomas.length === 1 ? '' : 's'}`
            : '9 paths'
        }
        open={openSections.has('education')}
        onToggle={() => toggle('education')}
      >
        <div className="space-y-3">
          <EducationCard
            player={player}
            state={educationState}
            country={country}
            onClick={() => setEducationDetailOpen(true)}
          />
          <DiplomaHistorySection
            diplomas={educationState.diplomas}
            country={country}
          />
          <ActionPill
            label="Take a course"
            hint="Evening class. Two hours a week. Worth it."
            onClick={() =>
              showComingSoon(
                'Take a course',
                'Short courses land with the skills pass.',
              )
            }
            testId="career-action-course"
          />
        </div>
      </CollapsibleSection>

      {/* Find Work */}
      <CollapsibleSection
        sectionId="find"
        title="Find work"
        eyebrow="What's hiring this year, in your city."
        meta={`${FIND_WORK_LISTINGS.length} channels`}
        open={openSections.has('find')}
        onToggle={() => toggle('find')}
      >
        <div className="space-y-2">
          {FIND_WORK_LISTINGS.map((listing) => (
            <JobListing
              key={listing.id}
              testId={`career-job-${listing.id}`}
              title={listing.title}
              hook={listing.hook}
              meta={formatMonthlySalary(listing.baseAnnualSalary)}
              onClick={() =>
                showComingSoon(
                  listing.title,
                  'Job applications open once hiring is wired.',
                )
              }
            />
          ))}
        </div>
      </CollapsibleSection>

      {/* Special Careers */}
      <CollapsibleSection
        sectionId="special"
        title="Special careers"
        eyebrow="Different rules. Different odds."
        meta={`${SPECIAL_CAREERS.length} dreams`}
        open={openSections.has('special')}
        onToggle={() => toggle('special')}
      >
        <div className="space-y-2">
          {SPECIAL_CAREERS.map((path) => (
            <JobListing
              key={path.id}
              testId={`career-special-${path.id}`}
              title={path.title}
              hook={path.hook}
              meta={path.gateLabel}
              onClick={() => showComingSoon(path.title, path.toastDetail)}
            />
          ))}
        </div>
      </CollapsibleSection>

      {/* History — pinned, never collapsible. */}
      <CareerHistorySection />

      {educationDetailOpen && educationState.status !== 'choosing_next' && (
        <EducationDetailModal
          player={player}
          state={educationState}
          onClose={() => setEducationDetailOpen(false)}
        />
      )}
    </div>
  );
}

interface ActionPillProps {
  label: string;
  hint: string;
  onClick: () => void;
  tone?: 'default' | 'danger';
  testId?: string;
}

/**
 * Small text-only row for in-section actions (Apply for university,
 * Drop out). Visually quieter than `JobListing` so a section's actions
 * don't compete with its primary content.
 */
function ActionPill({ label, hint, onClick, tone = 'default', testId }: ActionPillProps) {
  const labelColor = tone === 'danger' ? 'text-danger' : 'text-ink';
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className="flex w-full items-center justify-between gap-3 rounded-[12px] border border-cream-dark bg-cream px-3 py-[8px] text-left transition hover:bg-peach-light/40 active:scale-[0.99]"
    >
      <div className="min-w-0">
        <div className={`font-bold text-[13px] tracking-[-0.01em] ${labelColor}`}>
          {label}
        </div>
        <div className="text-[11px] leading-[1.3] text-ink-soft">{hint}</div>
      </div>
      <span aria-hidden="true" className="text-[16px] leading-none text-ink-faint">
        ›
      </span>
    </button>
  );
}

interface EmptyJobStateProps {
  onCta: () => void;
}

/**
 * Shown in place of the rich position card when the player has no job.
 * The CTA pops Find Work open (rather than scrolling to it) so the
 * player sees something happen even if Find Work is below the fold.
 */
function EmptyJobState({ onCta }: EmptyJobStateProps) {
  return (
    <div
      data-testid="career-empty-job"
      className="flex items-center gap-3 rounded-2xl border border-dashed border-cream-dark bg-cream-light px-4 py-4 shadow-warm"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dashed border-cream-dark bg-cream text-ink-faint">
        <BriefcaseGlyph />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-bold text-[13.5px] tracking-[-0.01em] text-ink">
          Unemployed
        </div>
        <div className="mt-[1px] text-[11.5px] leading-[1.3] text-ink-soft">
          Free time, smaller wallet.
        </div>
      </div>
      <button
        type="button"
        onClick={onCta}
        data-testid="career-empty-find-work"
        className="shrink-0 rounded-[12px] border border-ink bg-coral px-3 py-[6px] font-sans text-[12px] font-semibold text-cream-light shadow-warm transition active:scale-[0.98]"
      >
        Find your first job
      </button>
    </div>
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

/**
 * One-line eyebrow for the Education collapsible header. Mirrors the three
 * states of `educationState.status` so the section reads sensibly even when
 * collapsed.
 */
function educationEyebrow(
  player: PlayerState,
  state: ReturnType<typeof getEducationState>,
  country: ReturnType<typeof getCurrentCountry>,
): string {
  if (state.status === 'enrolled' && state.currentStageId) {
    return `Year ${state.yearOfStage} of ${stageDisplayName(state.currentStageId, country)}.`;
  }
  if (state.status === 'choosing_next') {
    return 'Time to choose your next school.';
  }
  if (state.dropOutReason === 'graduated') {
    return 'Done with school. Diplomas on the wall.';
  }
  if (state.dropOutReason === 'dropped_out') {
    return 'Out of school for now.';
  }
  return player.age < country.education.schoolStartAge
    ? `Starts at ${country.education.schoolStartAge}.`
    : 'No school of your own choosing yet.';
}

/**
 * Bucket the player's age into a life-stage label for the header
 * eyebrow. Boundaries chosen to match the rough event-content tiers
 * (`childhood`, `youth`, `adulthood`, `later years`) without coupling
 * this label to the engine's content categories.
 */
function lifeStageFor(age: number): string {
  if (age < 13) return 'CHILDHOOD';
  if (age < 18) return 'YOUTH';
  if (age < 30) return 'YOUNG ADULTHOOD';
  if (age < 60) return 'ADULTHOOD';
  return 'LATER YEARS';
}
