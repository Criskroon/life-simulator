import type { PlayerState } from '../types/gameState';
import type { ActionTier, RelationshipAction } from '../types/interactions';

/**
 * Cooldown ledger for direct relationship interactions. The contract is
 * "once per (person × action × year)" for any action whose effective
 * cooldown is greater than zero — light tier defaults to 1, big tier to 0.
 *
 * State shape: `actionUsageThisYear: string[]` on PlayerState. Each entry is
 * `${personId}|${actionId}`. The list is reset to `[]` by `ageUp` so the
 * yearly cycle is automatic; no per-action year stamps are needed. If the
 * design ever needs multi-year cooldowns we'd swap to a Record<key, year>.
 *
 * Pure: every helper returns a new state. The engine module never reads or
 * writes the field outside of these helpers.
 */

const ENTRY_SEPARATOR = '|';

export function cooldownKey(personId: string, actionId: string): string {
  return `${personId}${ENTRY_SEPARATOR}${actionId}`;
}

/**
 * Default cooldown by tier. Light actions are free but capped to 1/year;
 * big actions are gated by the action-point budget instead. An action can
 * opt into a different value by future-extending the type — for X3 every
 * entry uses the tier default.
 */
export function effectiveCooldownYears(tier: ActionTier): number {
  return tier === 'light' ? 1 : 0;
}

export function actionHasCooldown(action: RelationshipAction): boolean {
  return effectiveCooldownYears(action.tier) > 0;
}

/**
 * True when a (person, action) pair has already fired this year and the
 * action carries a non-zero cooldown. Big-tier actions always return false
 * here — their gating lives in the action-point budget.
 */
export function isActionOnCooldown(
  state: PlayerState,
  personId: string,
  action: RelationshipAction,
): boolean {
  if (!actionHasCooldown(action)) return false;
  const used = state.actionUsageThisYear ?? [];
  return used.includes(cooldownKey(personId, action.id));
}

/**
 * Append the (person, action) pair to this year's ledger. No-op when the
 * action has no cooldown or the pair is already recorded — keeps the list
 * compact and avoids duplicate entries even if a caller fires twice in the
 * same tick.
 */
export function recordActionUsage(
  state: PlayerState,
  personId: string,
  action: RelationshipAction,
): PlayerState {
  if (!actionHasCooldown(action)) return state;
  const key = cooldownKey(personId, action.id);
  const used = state.actionUsageThisYear ?? [];
  if (used.includes(key)) return state;
  return { ...state, actionUsageThisYear: [...used, key] };
}

/** Wipe the ledger. Called by `ageUp` once per yearly tick. */
export function resetActionUsage(state: PlayerState): PlayerState {
  return { ...state, actionUsageThisYear: [] };
}
