import type { Condition, Effect, Outcome } from './events';
import type { RelationshipType } from './gameState';

/**
 * Direct relationship interactions — the player taps a name in SidePanel
 * and picks an action from a status-aware list. Lives alongside events and
 * activities as a third surface the player drives the world through.
 *
 * Two tiers control the spend rhythm (see docs/architecture/relationship-interactions.md):
 *   - `light`: free, but capped to once per (person × action × year). The
 *     player can sprinkle attention across all their relationships per year.
 *   - `big`: costs an action point from the same yearly budget the
 *     Activities menu draws from. Mutually exclusive with other big spends.
 */
export type ActionTier = 'big' | 'light';

/**
 * One action a player can perform on a specific Person. Choice-compatible:
 * the executor wraps it in a synthetic Choice so `outcomeResolver` and
 * `applyEffectsWithFeedback` run unchanged.
 *
 * Authoring rule: an action MUST set either `effects` (deterministic) OR
 * `outcomes` (probabilistic), not both. Same as event Choice. Validated at
 * test time so a malformed action fails the build.
 */
export interface RelationshipAction {
  /** Stable id, e.g. `partner.propose`. Conventionally `<targetType>.<verb>`. */
  id: string;
  /** Player-facing button label, e.g. "Propose marriage". */
  label: string;
  /** Optional one-line description shown beneath the label. */
  description?: string;
  tier: ActionTier;
  /** Which relationship-slot types this action can target. */
  applicableTo: RelationshipType[];
  /**
   * Action-budget cost. Big actions default to 1; light actions are 0.
   * Set explicitly when overriding (e.g. a heavy big action that costs 2).
   */
  actionCost?: number;
  /**
   * Money cost (negative = player pays). Country-adjusted at apply via the
   * same path events use, so author values stay in baseline (GB) units.
   * Informative only on the button — the actual mutation lives in effects.
   */
  cost?: number;
  /**
   * Gates that must all evaluate true. Paths starting with `target.` resolve
   * against the targeted Person; everything else falls through to the
   * existing PlayerState evaluator. Examples:
   *   { path: 'target.relationshipLevel', op: '>=', value: 60 }
   *   { path: 'target.age', op: '>=', value: 18 }
   *   { path: 'money', op: '>=', value: 4500 }
   */
  conditions?: Condition[];
  /** Deterministic path. Mutually exclusive with `outcomes`. */
  effects?: Effect[];
  /** Probabilistic path. Mutually exclusive with `effects`. ≥2 entries. */
  outcomes?: Outcome[];
}

/**
 * Why an action is unavailable, used by the UI to render a disabled state
 * with a reason instead of hiding the action entirely. `null` reason means
 * the action is enabled.
 */
export type ActionDisabledReason =
  | 'insufficient_actions'
  | 'insufficient_money'
  | 'condition_failed'
  | 'deceased';

/**
 * What the UI receives per action: the action itself plus an enabled flag
 * and (when disabled) the first reason the gate failed. Status-aware
 * filtering happens upstream — this list never includes actions that don't
 * apply to the target's slot type.
 */
export interface AvailableAction {
  action: RelationshipAction;
  enabled: boolean;
  disabledReason: ActionDisabledReason | null;
}
