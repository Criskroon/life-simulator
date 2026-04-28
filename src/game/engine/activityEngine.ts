import { ALL_ACTIVITIES } from '../data/activities';
import type { Activity } from '../types/activities';
import type { Choice, ResolvedChoice } from '../types/events';
import type { PlayerState } from '../types/gameState';
import { useActions } from './actionBudget';
import { evaluateAllConditions } from './conditionEvaluator';
import { getCurrentCountry } from './countryEngine';
import { applyEffectsWithFeedback } from './effectsApplier';
import { enrichGeneratedRelationships } from './nameGenerator';
import { resolveChoice } from './outcomeResolver';
import type { Rng } from './rng';
import { renderTemplate } from './templates';

/**
 * Activity engine — surfaces the player-initiated half of the game. It's a
 * thin layer over the existing event resolver: an Activity is treated as a
 * synthetic Choice so the same Outcome / Effect pipeline runs end-to-end.
 *
 * No direct mutation. `executeActivity` returns a new state and a
 * ResolvedChoice the UI feeds straight into the existing ResolutionModal.
 */

/**
 * Country gating is hardcoded for the V1 lottery activity. When a second
 * gated activity ships, replace this with a `requireLegalFlag?: keyof Legal`
 * field on Activity and check that flag generically.
 */
function passesCountryGate(activity: Activity, state: PlayerState): boolean {
  if (!activity.countryGated) return true;
  const country = getCurrentCountry(state);
  if (activity.id === 'lottery_ticket') return country.legal.gamblingLegal;
  return true;
}

/**
 * Filter ALL_ACTIVITIES down to those the player can see right now. A
 * filtered-out activity is invisible — the menu doesn't even hint that it
 * exists. This keeps the UI uncluttered: a 7-year-old never sees "Visit
 * the doctor" or "Buy a lottery ticket" cluttering their menu.
 *
 * Affordability and action-budget are NOT checked here — those are surfaced
 * as disabled-but-visible states by the menu so the player can see what
 * they're aiming for.
 */
export function getAvailableActivities(state: PlayerState): Activity[] {
  return ALL_ACTIVITIES.filter((activity) => {
    if (activity.minAge !== undefined && state.age < activity.minAge) return false;
    if (activity.maxAge !== undefined && state.age > activity.maxAge) return false;
    if (!evaluateAllConditions(state, activity.conditions)) return false;
    if (!passesCountryGate(activity, state)) return false;
    return true;
  });
}

export type ExecuteActivityFailure =
  | { kind: 'unknown' }
  | { kind: 'ineligible' }
  | { kind: 'insufficient_actions'; required: number; remaining: number };

export interface ExecuteActivitySuccess {
  state: PlayerState;
  resolved: ResolvedChoice;
}

export type ExecuteActivityResult =
  | ({ ok: true } & ExecuteActivitySuccess)
  | ({ ok: false } & ExecuteActivityFailure);

/**
 * Run an activity. Decrements the action budget, applies the activity's
 * effects (probabilistic or deterministic), and returns the new state plus
 * a ResolvedChoice for the UI. Affordability gating (money) is the store's
 * responsibility — same intercept as events — so this engine call always
 * proceeds with the assumption that the player is willing to pay.
 */
export function executeActivity(
  state: PlayerState,
  activityId: string,
  rng: Rng,
): ExecuteActivityResult {
  const activity = ALL_ACTIVITIES.find((a) => a.id === activityId);
  if (!activity) return { ok: false, kind: 'unknown' };

  if (!getAvailableActivities(state).some((a) => a.id === activityId)) {
    return { ok: false, kind: 'ineligible' };
  }

  const afterBudget = useActions(state, activity.actionCost);
  if (afterBudget === null) {
    return {
      ok: false,
      kind: 'insufficient_actions',
      required: activity.actionCost,
      remaining: state.actionsRemainingThisYear,
    };
  }

  // Wrap the activity as a synthetic Choice so we can reuse the resolver.
  const syntheticChoice: Choice = {
    label: activity.name,
    effects: activity.effects,
    outcomes: activity.outcomes,
  };
  const picked = resolveChoice(syntheticChoice, rng);
  const renderedNarrative = picked.narrative
    ? renderTemplate(picked.narrative, afterBudget)
    : null;

  const enrichedEffects = enrichGeneratedRelationships(picked.effects, afterBudget, rng);
  const { state: afterEffects, deltas, specials } = applyEffectsWithFeedback(
    afterBudget,
    enrichedEffects,
  );

  return {
    ok: true,
    state: afterEffects,
    resolved: {
      appliedEffects: enrichedEffects,
      narrative: renderedNarrative,
      deltas,
      specials,
    },
  };
}
