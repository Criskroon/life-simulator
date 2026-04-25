import type { GameEvent, EventCategory } from '../types/events';
import type { PlayerState } from '../types/gameState';
import { evaluateAllConditions } from './conditionEvaluator';
import type { Rng } from './rng';

export interface SelectOptions {
  /**
   * Force a uniform `int(min, max)` count instead of the default weighted
   * distribution. Set both to pin a specific count for tests/fixtures.
   */
  minPerYear?: number;
  maxPerYear?: number;
  /** Bias toward picking events from distinct categories. */
  preferDiversity?: boolean;
  /**
   * Weighted distribution over how many events a year should produce.
   * Default favors quiet years: 30% zero, 40% one, 25% two, 5% three.
   * Ignored when both `minPerYear` and `maxPerYear` are provided.
   */
  countDistribution?: ReadonlyArray<{ count: number; weight: number }>;
}

/**
 * The default count distribution. Picked to create rhythm — some years are
 * quiet, others busy — without crowding the player into 4-5 events every year.
 */
const DEFAULT_COUNT_DISTRIBUTION: ReadonlyArray<{ count: number; weight: number }> = [
  { count: 0, weight: 30 },
  { count: 1, weight: 40 },
  { count: 2, weight: 25 },
  { count: 3, weight: 5 },
];

const DEFAULTS = {
  preferDiversity: true,
};

export function getEligibleEvents(
  state: PlayerState,
  events: GameEvent[],
): GameEvent[] {
  return events.filter((event) => {
    if (event.minAge !== undefined && state.age < event.minAge) return false;
    if (event.maxAge !== undefined && state.age > event.maxAge) return false;
    if (event.oncePerLife && state.triggeredEventIds.includes(event.id)) {
      return false;
    }
    if (!evaluateAllConditions(state, event.conditions)) return false;
    return true;
  });
}

/**
 * Decide how many events should fire this year. Uses an explicit min/max
 * range when both are provided (test fixtures pin counts that way); otherwise
 * the weighted DEFAULT_COUNT_DISTRIBUTION (or a custom one) controls the pick.
 */
function pickEventCount(rng: Rng, options: SelectOptions): number {
  if (options.minPerYear !== undefined && options.maxPerYear !== undefined) {
    return rng.int(options.minPerYear, options.maxPerYear);
  }
  const distribution = options.countDistribution ?? DEFAULT_COUNT_DISTRIBUTION;
  return rng.weighted(distribution.map((entry) => ({ item: entry.count, weight: entry.weight })));
}

/**
 * Pick events for this year using weighted random selection. The default
 * distribution favors quiet years (see DEFAULT_COUNT_DISTRIBUTION); pass
 * `minPerYear`/`maxPerYear` to override with a uniform range. When
 * `preferDiversity` is on, after each pick we down-weight everything in the
 * same category so a year doesn't end up with three career events in a row.
 */
export function selectYearEvents(
  state: PlayerState,
  events: GameEvent[],
  rng: Rng,
  options: SelectOptions = {},
): GameEvent[] {
  const opts = { ...DEFAULTS, ...options };
  const targetCount = pickEventCount(rng, options);
  if (targetCount <= 0) return [];

  const eligible = getEligibleEvents(state, events);
  if (eligible.length === 0) return [];

  const picked: GameEvent[] = [];
  const remaining = [...eligible];
  const usedCategories: EventCategory[] = [];

  while (picked.length < targetCount && remaining.length > 0) {
    const weighted = remaining.map((event) => {
      let weight = Math.max(0, event.weight);
      if (opts.preferDiversity && usedCategories.includes(event.category)) {
        weight *= 0.25;
      }
      return { item: event, weight };
    });

    const choice = rng.weighted(weighted);
    picked.push(choice);
    usedCategories.push(choice.category);

    const idx = remaining.indexOf(choice);
    if (idx >= 0) remaining.splice(idx, 1);
  }

  return picked;
}
