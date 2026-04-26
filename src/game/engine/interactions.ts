/**
 * Direct relationship interactions — third surface alongside events and
 * activities. The player taps a name in SidePanel, gets a status-aware list
 * of actions, and resolves through the same `outcomeResolver` /
 * `applyEffectsWithFeedback` pipeline that events and activities use.
 *
 * Pure functions; no DOM. Affordability gating (money) lives in the store
 * intercept, mirroring `executeActivity`. The engine call assumes the
 * player is willing to pay.
 */
import { ACTIONS_BY_TYPE } from '../data/actions';
import type { Choice, Condition, Effect, ResolvedChoice } from '../types/events';
import type { Person, PlayerState, RelationshipType } from '../types/gameState';
import type {
  ActionDisabledReason,
  AvailableAction,
  RelationshipAction,
} from '../types/interactions';
import { useActions } from './actionBudget';
import { isActionOnCooldown, recordActionUsage } from './actionCooldowns';
import { canAffordChoice } from './choicePreview';
import { evaluateCondition } from './conditionEvaluator';
import { applyEffectsWithFeedback } from './effectsApplier';
import { enrichGeneratedRelationships } from './nameGenerator';
import { resolveChoice } from './outcomeResolver';
import type { Rng } from './rng';
import { renderTemplate } from './templates';

/**
 * Resolve a condition against either the targeted Person (when path starts
 * with `target.`) or the PlayerState (everything else). Reuses the existing
 * `evaluateCondition` for the player-side path so behavior stays in lockstep
 * with event conditions — same ops, same coercion rules.
 */
export function evaluateActionConditions(
  state: PlayerState,
  target: Person,
  conditions: Condition[] | undefined,
): boolean {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every((c) => {
    if (c.path.startsWith('target.')) {
      const sub = c.path.slice('target.'.length);
      // Strip `target.` and pretend the Person is the state root for the
      // existing evaluator — it walks dotted paths against any object.
      return evaluateCondition(target as unknown as PlayerState, {
        ...c,
        path: sub,
      });
    }
    return evaluateCondition(state, c);
  });
}

/** Cost in action points: light = 0, big = override or default 1. */
function actionPointCost(action: RelationshipAction): number {
  if (action.tier === 'light') return action.actionCost ?? 0;
  return action.actionCost ?? 1;
}

/** Synthesize a Choice for affordability/preview helpers. */
function asChoice(action: RelationshipAction): Choice {
  return {
    label: action.label,
    cost: action.cost,
    effects: action.effects,
    outcomes: action.outcomes,
  };
}

/**
 * First-failed-gate reason, in priority order: deceased > condition >
 * cooldown > money > actions. Cooldown sits above money so a player who
 * already used a free interaction this year sees "Already this year"
 * instead of being told to bring cash.
 */
function disabledReasonFor(
  state: PlayerState,
  target: Person,
  action: RelationshipAction,
): ActionDisabledReason | null {
  if (!target.alive) return 'deceased';
  if (!evaluateActionConditions(state, target, action.conditions)) {
    return 'condition_failed';
  }
  if (isActionOnCooldown(state, target.id, action)) return 'on_cooldown';
  if (!canAffordChoice(state, asChoice(action))) return 'insufficient_money';
  const cost = actionPointCost(action);
  if (cost > 0 && state.actionsRemainingThisYear < cost) {
    return 'insufficient_actions';
  }
  return null;
}

/**
 * Status-aware action list for a specific person. Filters by `applicableTo`
 * (a propose action never shows on a friend) and annotates each entry with
 * an enabled flag + reason — disabled actions stay visible with a grey
 * button so the player understands what they're aiming for.
 */
export function getActionsFor(
  target: Person,
  targetType: RelationshipType,
  state: PlayerState,
): AvailableAction[] {
  const actions = ACTIONS_BY_TYPE[targetType] ?? [];
  return actions
    .filter((a) => a.applicableTo.includes(targetType))
    .map((action) => {
      const reason = disabledReasonFor(state, target, action);
      return {
        action,
        enabled: reason === null,
        disabledReason: reason,
      };
    });
}

/**
 * Walk the effects array and inject `targetId` into specials that target a
 * specific person but didn't get one from the author. For X2 only
 * `adjustRelationshipLevel` needs this — extending the set is a one-line
 * change. Pure: returns a new array.
 */
const TARGETED_SPECIALS = new Set(['adjustRelationshipLevel']);

function injectTargetId(effects: Effect[], target: Person): Effect[] {
  return effects.map((effect) => {
    if (!effect.special || !TARGETED_SPECIALS.has(effect.special)) return effect;
    const payload = effect.payload ?? {};
    if (payload.targetId) return effect;
    return {
      ...effect,
      payload: { ...payload, targetId: target.id },
    };
  });
}

export type ExecuteActionFailure =
  | { kind: 'unknown' }
  | { kind: 'ineligible' }
  | { kind: 'condition_failed' }
  | { kind: 'deceased' }
  | { kind: 'on_cooldown' }
  | { kind: 'insufficient_actions'; required: number; remaining: number };

export interface ExecuteActionSuccess {
  state: PlayerState;
  resolved: ResolvedChoice;
}

export type ExecuteActionResult =
  | ({ ok: true } & ExecuteActionSuccess)
  | ({ ok: false } & ExecuteActionFailure);

/**
 * Run an action. Symmetric with `executeActivity`: validates, decrements the
 * action budget if applicable, picks an outcome, applies effects, and
 * returns a ResolvedChoice the UI feeds straight to the existing
 * ResolutionModal. The store handles the money intercept just like activities.
 */
export function executeAction(
  state: PlayerState,
  action: RelationshipAction,
  target: Person,
  targetType: RelationshipType,
  rng: Rng,
): ExecuteActionResult {
  if (!action.applicableTo.includes(targetType)) {
    return { ok: false, kind: 'ineligible' };
  }
  if (!target.alive) return { ok: false, kind: 'deceased' };
  if (!evaluateActionConditions(state, target, action.conditions)) {
    return { ok: false, kind: 'condition_failed' };
  }
  if (isActionOnCooldown(state, target.id, action)) {
    return { ok: false, kind: 'on_cooldown' };
  }

  const cost = actionPointCost(action);
  let next: PlayerState = state;
  if (cost > 0) {
    const after = useActions(state, cost);
    if (after === null) {
      return {
        ok: false,
        kind: 'insufficient_actions',
        required: cost,
        remaining: state.actionsRemainingThisYear,
      };
    }
    next = after;
  }
  next = recordActionUsage(next, target.id, action);

  const picked = resolveChoice(asChoice(action), rng);
  const targetedEffects = injectTargetId(picked.effects, target);
  const enrichedEffects = enrichGeneratedRelationships(targetedEffects, next, rng);
  const renderedNarrative = picked.narrative
    ? renderTemplate(picked.narrative, next)
    : null;
  const { state: afterEffects, deltas, specials } = applyEffectsWithFeedback(
    next,
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
