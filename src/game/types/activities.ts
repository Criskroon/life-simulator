import type { Condition, Effect, Outcome } from './events';

/**
 * Player-initiated actions surfaced through the Activities menu, as opposed
 * to events (which the engine pushes onto the player). Activities reuse the
 * Outcome / Effect shape from events so the resolver and effects-applier
 * pipelines work unchanged — an activity is essentially a single Choice the
 * player triggers manually, gated by an action budget.
 */

export type ActivityCategory = 'mind_body' | 'love_social' | 'career_money';

export interface Activity {
  id: string;
  category: ActivityCategory;
  name: string;
  /** One-line UI description shown under the name in the menu. */
  description: string;

  // ---- Eligibility ----
  minAge?: number;
  maxAge?: number;
  /** Condition shape reused from events; ALL must pass to be eligible. */
  conditions?: Condition[];
  /**
   * Country-rule gate. Today this is a hardcoded check for `gambling` on
   * lottery_ticket. When more activities need rule gating, replace this
   * boolean with a `requireRule?: keyof CountryRules` field and let the
   * engine read whichever rule is named.
   */
  countryGated?: boolean;

  // ---- Costs ----
  /** Action-budget cost; default 1, vacation-style activities cost 2+. */
  actionCost: number;
  /**
   * Money preview cost (negative = the player pays). Same semantics as
   * Choice.cost — informative for the UI; the actual money mutation has to
   * live in `effects` or `outcomes` so it survives country adjustment.
   */
  cost?: number;

  // ---- Resolution ----
  /** Probabilistic path: weighted-pick one outcome. Mutually exclusive with effects. */
  outcomes?: Outcome[];
  /** Deterministic path. Mutually exclusive with outcomes. */
  effects?: Effect[];

  // ---- UI ----
  icon?: string;
}
