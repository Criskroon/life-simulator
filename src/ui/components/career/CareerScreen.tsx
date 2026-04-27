import { useState } from 'react';
import {
  adjustPrice,
  adjustSalary,
  getCurrentCountry,
} from '../../../game/engine/countryEngine';
import type {
  EducationLevel,
  EducationRecord,
  PlayerState,
} from '../../../game/types/gameState';
import { useComingSoon } from '../ComingSoonHandler';
import { CareerHistorySection } from './CareerHistorySection';
import { CollapsibleSection } from './CollapsibleSection';
import { CurrentPositionCard } from './CurrentPositionCard';
import { FIND_WORK_LISTINGS, SPECIAL_CAREERS } from './careerData';
import { InlineActionRows } from './InlineActionRows';
import { JobListing } from './JobListing';

interface CareerScreenProps {
  player: PlayerState;
}

/** GB-baseline price for a short professional course; localised at render. */
const TRAINING_COURSE_BASE_PRICE = 1200;

type SectionId = 'education' | 'find' | 'special';

const EDUCATION_LABEL: Record<EducationLevel, string> = {
  primary: 'Primary school',
  middle: 'Middle school',
  high_school: 'High school',
  community_college: 'Community college',
  university: 'University',
  graduate: 'Graduate school',
};

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

  const toggle = (id: SectionId) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const job = player.job;
  const currentEducation = pickCurrentEducation(player.education);
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

      {/* Education */}
      <CollapsibleSection
        sectionId="education"
        title="Education"
        eyebrow={
          currentEducation
            ? currentEducation.graduated
              ? `Done. ${EDUCATION_LABEL[currentEducation.level]} on the wall.`
              : `Still in ${EDUCATION_LABEL[currentEducation.level].toLowerCase()}.`
            : 'No school of your own choosing yet.'
        }
        meta={currentEducation ? EDUCATION_LABEL[currentEducation.level] : '9 paths'}
        open={openSections.has('education')}
        onToggle={() => toggle('education')}
      >
        <div className="space-y-3">
          {currentEducation && (
            <div
              data-testid="career-education-summary"
              className="rounded-2xl border border-cream-dark bg-cream px-4 py-3 shadow-warm"
            >
              <div className="font-display text-[15px] font-semibold tracking-[-0.01em] text-ink">
                {currentEducation.institutionName}
              </div>
              <div className="mt-[2px] font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-ink-soft">
                {EDUCATION_LABEL[currentEducation.level]} ·{' '}
                {currentEducation.graduated ? 'graduated' : 'in progress'}
              </div>
              {currentEducation.gpa > 0 && (
                <div className="mt-[2px] font-mono text-[10px] font-medium tabular-nums text-ink-faint">
                  GPA {currentEducation.gpa.toFixed(2)}
                </div>
              )}
            </div>
          )}
          <div className="space-y-2">
            <ActionPill
              label="Apply for university"
              hint="Pick a city you've never lived in."
              onClick={() =>
                showComingSoon(
                  'Apply for university',
                  'Higher-ed applications arrive with the school pass.',
                )
              }
              testId="career-action-apply-uni"
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
            <ActionPill
              label="Drop out"
              hint="Some doors close. Others were never yours."
              tone="danger"
              onClick={() =>
                showComingSoon(
                  'Drop out',
                  'Leaving school early arrives with the school pass.',
                )
              }
              testId="career-action-dropout"
            />
          </div>
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
 * Pick the most relevant single education record to show as the
 * player's current standing. Prefers an in-progress record (no endYear);
 * otherwise falls back to the most recently graduated one.
 */
function pickCurrentEducation(
  education: ReadonlyArray<EducationRecord>,
): EducationRecord | null {
  if (education.length === 0) return null;
  const inProgress = education.find((e) => e.endYear === null);
  if (inProgress) return inProgress;
  return [...education].sort((a, b) => (b.endYear ?? 0) - (a.endYear ?? 0))[0];
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
