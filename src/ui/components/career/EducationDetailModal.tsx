import { useState } from 'react';
import { getCountry } from '../../../game/data/countries';
import {
  canEnterStage,
  getEducationStage,
} from '../../../game/engine/educationEngine';
import { useGameStore } from '../../../game/state/gameStore';
import type { SpecializationField } from '../../../game/types/country';
import type { EducationState, PlayerState } from '../../../game/types/gameState';
import { formatSpecialization, stageDisplayName } from './educationFormat';

interface EducationDetailModalProps {
  player: PlayerState;
  state: EducationState;
  onClose: () => void;
}

/**
 * Detail view for education status. Two surfaces:
 *
 *   - `enrolled`: progress (year, GPA, specialisation) + Drop-out action.
 *   - `not_enrolled`: re-enrol picker — list of stages the player can
 *     currently enter (filtered via `canEnterStage`). Stages with
 *     `hasSpecialization` route through a second-step specialisation
 *     picker before calling `reEnrollInStage`.
 *
 * The `choosing_next` state is owned by StageTransitionModal — this
 * component won't be opened in that case.
 */
export function EducationDetailModal({
  player,
  state,
  onClose,
}: EducationDetailModalProps) {
  const dropOutOfSchool = useGameStore((s) => s.dropOutOfSchool);
  const reEnrollInStage = useGameStore((s) => s.reEnrollInStage);
  const country = getCountry(player.country);
  const stage = state.currentStageId
    ? getEducationStage(country, state.currentStageId)
    : undefined;

  // Two-phase picker for stages with hasSpecialization (mirrors the
  // StageTransitionModal pattern so behaviour is consistent across
  // entry points).
  const [pendingStageId, setPendingStageId] = useState<string | null>(null);
  const pendingStage = pendingStageId
    ? getEducationStage(country, pendingStageId)
    : null;

  const completedStageIds = state.diplomas
    .filter((d) => d.graduated)
    .map((d) => d.stageId);

  const availableStages =
    state.status === 'not_enrolled'
      ? country.education.stages.filter((s) => {
          // Special case: basisschool / primary is normally non-selectable
          // (auto-enrol at school-start age). But a young drop-out who
          // never graduated it has *zero* selectable stages otherwise —
          // every later stage requires it as a prerequisite. Surface
          // basisschool here so the player can climb back on the ladder.
          if (!s.isSelectable) {
            if (s.id === 'basisschool') {
              const alreadyGraduated = state.diplomas.some(
                (d) => d.stageId === 'basisschool' && d.graduated,
              );
              return !alreadyGraduated;
            }
            return false;
          }
          return canEnterStage(
            country,
            s.id,
            completedStageIds,
            player.stats.smarts,
          );
        })
      : [];

  const handlePickStage = (stageId: string) => {
    const target = getEducationStage(country, stageId);
    if (target?.hasSpecialization && target.availableSpecializations?.length) {
      setPendingStageId(stageId);
      return;
    }
    reEnrollInStage(stageId);
    onClose();
  };

  const handlePickSpec = (spec: SpecializationField) => {
    if (!pendingStageId) return;
    reEnrollInStage(pendingStageId, spec);
    onClose();
  };

  // ───── Phase 2: specialisation picker for the pending stage
  if (pendingStage) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/60 px-4">
        <div
          data-testid="education-detail-modal"
          className="w-full max-w-md rounded-2xl bg-cream-light border border-cream-dark shadow-warm p-5 max-h-[90vh] overflow-y-auto"
        >
          <button
            type="button"
            data-testid="education-detail-spec-back"
            onClick={() => setPendingStageId(null)}
            className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-soft"
          >
            ← Back
          </button>
          <h2 className="font-display text-[22px] font-bold leading-tight tracking-[-0.02em] text-ink">
            Pick a {pendingStage.nameLocal} specialisation
          </h2>
          <p className="mt-2 font-sans text-[13px] leading-snug text-ink-soft">
            This shapes which industries hire you later.
          </p>
          <div className="mt-4 space-y-2">
            {pendingStage.availableSpecializations?.map((spec) => (
              <button
                key={spec}
                type="button"
                data-testid={`education-detail-spec-${spec}`}
                onClick={() => handlePickSpec(spec)}
                className="block w-full rounded-2xl border border-cream-dark bg-cream px-4 py-3 text-left transition active:scale-[0.99]"
              >
                <div className="font-display text-[14px] font-bold tracking-[-0.01em] text-ink">
                  {formatSpecialization(spec)}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ───── Phase 1: enrolled progress, OR not_enrolled stage list
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
              disabled={player.age < country.education.compulsoryUntilAge}
              onClick={() => {
                dropOutOfSchool();
                onClose();
              }}
              className={`mt-4 w-full rounded-[12px] border border-cream-dark px-3 py-2 font-sans text-[13px] font-semibold transition ${
                player.age < country.education.compulsoryUntilAge
                  ? 'bg-cream/60 text-ink-soft cursor-not-allowed'
                  : 'bg-cream text-danger active:scale-[0.99]'
              }`}
            >
              Drop out
              {player.age < country.education.compulsoryUntilAge && (
                <span className="block font-sans text-[11px] font-medium text-ink-soft mt-[2px]">
                  You can't drop out until age {country.education.compulsoryUntilAge}
                </span>
              )}
            </button>
          </>
        )}

        {state.status === 'not_enrolled' && (
          <>
            <p className="mt-2 font-sans text-[13px] leading-snug text-ink-soft">
              {state.dropOutReason === 'graduated'
                ? `You graduated ${
                    state.diplomas.at(-1)
                      ? stageDisplayName(state.diplomas.at(-1)!.stageId, country)
                      : 'school'
                  }.`
                : state.dropOutReason === 'dropped_out'
                ? "You're not currently enrolled."
                : "You haven't started school yet."}
            </p>

            <div className="mt-4 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-brass">
              Available paths
            </div>
            {availableStages.length === 0 ? (
              <p
                data-testid="education-detail-no-paths"
                className="mt-2 font-sans text-[13px] leading-snug text-ink-soft"
              >
                No more education paths available based on your diplomas.
              </p>
            ) : (
              <div className="mt-2 space-y-2">
                {availableStages.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    data-testid={`education-detail-stage-${s.id}`}
                    onClick={() => handlePickStage(s.id)}
                    className="block w-full rounded-2xl border border-cream-dark bg-cream px-4 py-3 text-left transition active:scale-[0.99]"
                  >
                    <div className="font-display text-[15px] font-bold tracking-[-0.01em] text-ink">
                      {s.nameLocal}
                    </div>
                    <div className="mt-[2px] font-sans text-[12px] leading-snug text-ink-soft">
                      {s.duration} year{s.duration === 1 ? '' : 's'} · {s.description}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
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
