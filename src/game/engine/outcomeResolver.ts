import type { Choice, Effect, Outcome } from '../types/events';
import type { Rng } from './rng';

export interface ResolvedOutcome {
  effects: Effect[];
  narrative: string | null;
  followUpEventId?: string;
}

/**
 * Pick an outcome for a choice. Deterministic choices return their effects
 * with `narrative: null`. Probabilistic choices use `rng.weighted()` so the
 * pick is reproducible from a seed — same seed, same outcome, every time.
 *
 * If a choice somehow has both `effects` and `outcomes`, `outcomes` wins.
 * The validator (eventValidator.ts) catches that shape at content-load time;
 * the runtime stays permissive so a bad event can't crash the engine.
 */
export function resolveChoice(choice: Choice, rng: Rng): ResolvedOutcome {
  if (choice.outcomes && choice.outcomes.length > 0) {
    const items = choice.outcomes.map((o) => ({
      item: o,
      weight: Math.max(0, o.weight),
    }));
    const picked: Outcome = rng.weighted(items);
    return {
      effects: picked.effects,
      narrative: picked.narrative,
      followUpEventId: picked.followUpEventId ?? choice.followUpEventId,
    };
  }

  return {
    effects: choice.effects ?? [],
    narrative: null,
    followUpEventId: choice.followUpEventId,
  };
}
