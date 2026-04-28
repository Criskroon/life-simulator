import type { Country } from '../../../game/types/country';
import type { EducationState, PlayerState } from '../../../game/types/gameState';
import { getEducationStage } from '../../../game/engine/educationEngine';
import { formatSpecialization, stageDisplayName } from './educationFormat';

interface EducationCardProps {
  player: PlayerState;
  state: EducationState;
  country: Country;
  onClick: () => void;
}

/**
 * Compact summary of the player's current school standing. Shown in the
 * Career tab — clicking opens the full detail modal. Three visual modes
 * keyed off `state.status`:
 *   - enrolled        → year, GPA, specialisation
 *   - choosing_next   → "Time to choose" prompt
 *   - not_enrolled    → "Not in school" with a re-enrol nudge
 */
export function EducationCard({ player, state, country, onClick }: EducationCardProps) {
  const stage = state.currentStageId
    ? getEducationStage(country, state.currentStageId)
    : undefined;

  if (state.status === 'enrolled' && stage) {
    return (
      <button
        type="button"
        onClick={onClick}
        data-testid="education-card-enrolled"
        className="block w-full rounded-2xl border border-cream-dark bg-cream-light px-4 py-3 text-left shadow-warm transition active:scale-[0.99]"
      >
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-brass">
          {stage.level.replace('_', ' ')} · year {state.yearOfStage} of {stage.duration}
        </div>
        <div
          data-testid="education-card-title"
          className="mt-1 font-display text-[18px] font-bold leading-tight tracking-[-0.02em] text-ink"
        >
          {stage.nameLocal}
          {state.currentSpecialization && (
            <span data-testid="education-card-specialization" className="text-ink-soft font-semibold">
              {' '}— {formatSpecialization(state.currentSpecialization)}
            </span>
          )}
        </div>
        <div className="mt-[2px] font-sans text-[12.5px] leading-snug text-ink-soft">
          GPA {state.currentGpa.toFixed(1)}
        </div>
      </button>
    );
  }

  if (state.status === 'choosing_next') {
    return (
      <button
        type="button"
        onClick={onClick}
        data-testid="education-card-choosing"
        className="block w-full rounded-2xl border-2 border-coral bg-cream-light px-4 py-3 text-left shadow-warm transition active:scale-[0.99]"
      >
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-coral">
          Choice required
        </div>
        <div className="mt-1 font-display text-[18px] font-bold leading-tight tracking-[-0.02em] text-ink">
          Time to choose your next school
        </div>
        <div className="mt-[2px] font-sans text-[12.5px] leading-snug text-ink-soft">
          You finished {stageDisplayName(state.currentStageId, country)}. Pick your next stage to continue.
        </div>
      </button>
    );
  }

  // not_enrolled
  const lastDiploma = state.diplomas.at(-1);
  const headline =
    state.dropOutReason === 'graduated'
      ? `Graduated ${lastDiploma ? stageDisplayName(lastDiploma.stageId, country) : ''}`
      : state.dropOutReason === 'dropped_out'
      ? 'Out of school'
      : 'Not in school yet';
  const sub =
    player.age < country.education.compulsoryUntilAge
      ? `Compulsory until ${country.education.compulsoryUntilAge}.`
      : 'Tap to choose a school.';
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="education-card-not-enrolled"
      className="block w-full rounded-2xl border border-dashed border-cream-dark bg-cream-light px-4 py-3 text-left shadow-warm transition active:scale-[0.99]"
    >
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-brass">
        Education
      </div>
      <div className="mt-1 font-display text-[18px] font-bold leading-tight tracking-[-0.02em] text-ink">
        {headline}
      </div>
      <div className="mt-[2px] font-sans text-[12.5px] leading-snug text-ink-soft">{sub}</div>
    </button>
  );
}
