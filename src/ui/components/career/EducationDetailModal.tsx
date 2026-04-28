import { getCountry } from '../../../game/data/countries';
import { getEducationStage } from '../../../game/engine/educationEngine';
import { useGameStore } from '../../../game/state/gameStore';
import type { EducationState, PlayerState } from '../../../game/types/gameState';
import { formatSpecialization, stageDisplayName } from './educationFormat';

interface EducationDetailModalProps {
  player: PlayerState;
  state: EducationState;
  onClose: () => void;
}

/**
 * Detail view for the player's current education. Shows stage, year,
 * GPA, specialisation; offers a Drop out action with a compulsory-school
 * warning (soft — the engine never blocks).
 *
 * Reachable via the EducationCard in Career → Education when status is
 * `enrolled` or `not_enrolled` (re-enrol surface). For `choosing_next`
 * the StageTransitionModal owns the surface, so this won't be opened.
 */
export function EducationDetailModal({
  player,
  state,
  onClose,
}: EducationDetailModalProps) {
  const dropOutOfSchool = useGameStore((s) => s.dropOutOfSchool);
  const country = getCountry(player.country);
  const stage = state.currentStageId
    ? getEducationStage(country, state.currentStageId)
    : undefined;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/60 px-4">
      <div
        data-testid="education-detail-modal"
        className="w-full max-w-md rounded-2xl bg-cream-light border border-cream-dark shadow-warm p-5 max-h-[90vh] overflow-y-auto"
      >
        <h2 className="font-display text-[22px] font-bold leading-tight tracking-[-0.02em] text-ink">
          {state.status === 'enrolled' && stage
            ? `${stage.nameLocal} — Year ${state.yearOfStage}`
            : 'Education'}
        </h2>

        {state.status === 'enrolled' && stage && (
          <>
            {state.currentSpecialization && (
              <p className="mt-2 font-sans text-[13px] leading-snug text-ink-soft">
                Specialisation:{' '}
                <span className="font-semibold text-ink">
                  {formatSpecialization(state.currentSpecialization)}
                </span>
              </p>
            )}
            <div className="mt-3 rounded-2xl border border-cream-dark bg-cream px-4 py-3">
              <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-brass">
                Progress
              </div>
              <div className="mt-1 font-sans text-[13px] text-ink">
                Year {state.yearOfStage} of {stage.duration} ·{' '}
                {Math.max(0, stage.duration - state.yearOfStage)} years until graduation
              </div>
              <div className="mt-1 font-sans text-[13px] text-ink">
                Current GPA: {state.currentGpa.toFixed(1)}
              </div>
            </div>
            <button
              type="button"
              data-testid="education-detail-dropout"
              onClick={() => {
                dropOutOfSchool();
                onClose();
              }}
              className="mt-4 w-full rounded-[12px] border border-cream-dark bg-cream px-3 py-2 font-sans text-[13px] font-semibold text-danger transition active:scale-[0.99]"
            >
              Drop out
              {player.age < country.education.compulsoryUntilAge && (
                <span className="block font-sans text-[11px] font-medium text-ink-soft mt-[2px]">
                  ⚠ Compulsory until age {country.education.compulsoryUntilAge}
                </span>
              )}
            </button>
          </>
        )}

        {state.status === 'not_enrolled' && (
          <p className="mt-2 font-sans text-[13px] leading-snug text-ink-soft">
            {state.dropOutReason === 'graduated'
              ? `You graduated ${
                  state.diplomas.at(-1)
                    ? stageDisplayName(state.diplomas.at(-1)!.stageId, country)
                    : 'school'
                }.`
              : state.dropOutReason === 'dropped_out'
              ? "You're not currently enrolled. Re-enrolment lands in a future session."
              : "You haven't started school yet."}
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-[12px] border border-cream-dark bg-cream px-3 py-2 font-sans text-[13px] font-semibold text-ink transition active:scale-[0.99]"
        >
          Close
        </button>
      </div>
    </div>
  );
}
