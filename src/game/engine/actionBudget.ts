import type { PlayerState } from '../types/gameState';

/**
 * Action-budget engine for the Activities-menu system. Pure: a function of
 * the player's current state. The budget refreshes once per year (handled
 * by ageUp), and unused actions do NOT carry over — that's intentional, it
 * keeps players from hoarding actions and dumping them in a single decade.
 *
 * The phase numbers were picked so that:
 *   - kids have very few options (most childhood is on rails anyway)
 *   - teens get a real choice between gym / library / friends
 *   - working adults have enough budget to make tradeoffs feel meaningful
 *   - retirees have the most time on their hands — the curve flips back up
 *
 * Hard min of 2 even when modifiers push lower: a 0 budget would lock the
 * Activities menu entirely and make the feature feel broken to the player.
 */

const PHASE_BASE = {
  CHILD: 1, // ages 0..12
  TEEN: 2, // ages 13..17
  ADULT: 3, // ages 18..64
  SENIOR: 4, // ages 65+
} as const;

const MIN_BUDGET = 2;
const MAX_BUDGET = 5;

function basePhaseBudget(age: number): number {
  if (age < 13) return PHASE_BASE.CHILD;
  if (age < 18) return PHASE_BASE.TEEN;
  if (age < 65) return PHASE_BASE.ADULT;
  return PHASE_BASE.SENIOR;
}

/**
 * Compute how many activity actions the player gets this year.
 * Modifiers stack additively on the phase base, then the result is clamped
 * to [MIN_BUDGET, MAX_BUDGET].
 *
 * Modifiers:
 *   - unemployed (no job): +1 (more free time)
 *   - very ill (health < 20): -1
 *   - very old (age >= 80): -1
 */
export function calculateActionBudget(state: PlayerState): number {
  let budget = basePhaseBudget(state.age);

  if (state.job === null) budget += 1;
  if (state.stats.health < 20) budget -= 1;
  if (state.age >= 80) budget -= 1;

  return Math.max(MIN_BUDGET, Math.min(MAX_BUDGET, budget));
}

/**
 * Spend a single action. Returns the new state with the counter decremented;
 * returns null when the player has no actions left so callers can present a
 * "no actions remaining" message rather than silently failing.
 */
export function useAction(state: PlayerState): PlayerState | null {
  return useActions(state, 1);
}

/**
 * Spend `count` actions in one go (e.g. a vacation activity costs 2). Same
 * null-on-failure contract as useAction. Always check before applying any
 * other effects so the state stays consistent on a failed spend.
 */
export function useActions(state: PlayerState, count: number): PlayerState | null {
  if (count < 0) return state;
  if (state.actionsRemainingThisYear < count) return null;
  return {
    ...state,
    actionsRemainingThisYear: state.actionsRemainingThisYear - count,
  };
}
