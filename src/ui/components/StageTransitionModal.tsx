import { useState } from 'react';
import { getCountry } from '../../game/data/countries';
import { getEducationStage } from '../../game/engine/educationEngine';
import { useGameStore } from '../../game/state/gameStore';
import type { SpecializationField } from '../../game/types/country';
import type { PlayerState } from '../../game/types/gameState';
import { formatSpecialization, stageDisplayName } from './career/educationFormat';

interface StageTransitionModalProps {
  player: PlayerState;
}

/**
 * Auto-show modal that appears whenever `educationState.status === 'choosing_next'`.
 * Two-phase: first the player picks a next stage, then if that stage has a
 * specialisation they pick one too. Drop-out is also offered, with a
 * compulsory-school warning that's a soft nudge — the engine never blocks.
 */
export function StageTransitionModal({ player }: StageTransitionModalProps) {
  const chooseNextStage = useGameStore((s) => s.chooseNextStage);
  const dropOutOfSchool = useGameStore((s) => s.dropOutOfSchool);
  const country = getCountry(player.country);
  const state = player.educationState!;
  const lastDiploma = state.diplomas.at(-1);
  const [pendingStageId, setPendingStageId] = useState<string | null>(null);

  const pendingStage = pendingStageId
    ? getEducationStage(country, pendingStageId)
    : null;

  const onPickStage = (stageId: string) => {
    const stage = getEducationStage(country, stageId);
    if (stage?.hasSpecialization && stage.availableSpecializations?.length) {
      setPendingStageId(stageId);
      return;
    }
    chooseNextStage(stageId);
  };

  const onPickSpec = (spec: SpecializationField) => {
    if (!pendingStageId) return;
    chooseNextStage(pendingStageId, spec);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/60 px-4">
      <div
        data-testid="stage-transition-modal"
        className="w-full max-w-md rounded-2xl bg-cream-light border border-cream-dark shadow-warm p-5 max-h-[90vh] overflow-y-auto"
      >
        {!pendingStage ? (
          <>
            <h2 className="font-display text-[22px] font-bold leading-tight tracking-[-0.02em] text-ink">
              Time to choose your next school
            </h2>
            {lastDiploma && (
              <p className="mt-2 font-sans text-[13px] leading-snug text-ink-soft">
                You finished{' '}
                <span className="font-semibold text-ink">
                  {stageDisplayName(lastDiploma.stageId, country)}
                </span>{' '}
                with a GPA of{' '}
                <span className="font-semibold text-ink">
                  {lastDiploma.finalGpa.toFixed(1)}
                </span>
                .
              </p>
            )}
            {state.teacherAdvice && (
              <p className="mt-2 font-sans text-[13px] leading-snug text-ink-soft">
                Your teacher recommends{' '}
                <span className="font-semibold text-ink uppercase">
                  {state.teacherAdvice}
                </span>{' '}
                based on your performance.
              </p>
            )}

            <div className="mt-4 space-y-2">
              {state.availableNextStages?.map((stageId) => {
                const stage = getEducationStage(country, stageId);
                if (!stage) return null;
                const recommended = stageId === state.teacherAdvice;
                return (
                  <button
                    key={stageId}
                    type="button"
                    data-testid={`stage-option-${stageId}`}
                    onClick={() => onPickStage(stageId)}
                    className={`block w-full rounded-2xl border px-4 py-3 text-left transition active:scale-[0.99] ${
                      recommended
                        ? 'border-coral bg-peach-light'
                        : 'border-cream-dark bg-cream'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-display text-[15px] font-bold tracking-[-0.01em] text-ink">
                        {stage.nameLocal}
                      </span>
                      {recommended && (
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-coral">
                          Recommended
                        </span>
                      )}
                    </div>
                    <div className="mt-[2px] font-sans text-[12px] leading-snug text-ink-soft">
                      {stage.description}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 border-t border-cream-dark pt-4">
              <button
                type="button"
                data-testid="stage-transition-dropout"
                onClick={dropOutOfSchool}
                className="w-full rounded-[12px] border border-cream-dark bg-cream px-3 py-2 font-sans text-[13px] font-semibold text-danger transition active:scale-[0.99]"
              >
                Stop education
                {player.age < country.education.compulsoryUntilAge && (
                  <span className="block font-sans text-[11px] font-medium text-ink-soft mt-[2px]">
                    ⚠ Compulsory until age {country.education.compulsoryUntilAge}
                  </span>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
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
                  data-testid={`spec-option-${spec}`}
                  onClick={() => onPickSpec(spec)}
                  className="block w-full rounded-2xl border border-cream-dark bg-cream px-4 py-3 text-left transition active:scale-[0.99]"
                >
                  <div className="font-display text-[14px] font-bold tracking-[-0.01em] text-ink">
                    {formatSpecialization(spec)}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
