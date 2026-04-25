import type { GameEvent, EventCategory } from '../types/events';
import type { PlayerState } from '../types/gameState';
import { evaluateAllConditions } from './conditionEvaluator';
import type { Rng } from './rng';

export interface SelectOptions {
  /** Min and max number of events to surface for the year. */
  minPerYear?: number;
  maxPerYear?: number;
  /** Bias toward picking events from distinct categories. */
  preferDiversity?: boolean;
}

const DEFAULTS: Required<SelectOptions> = {
  minPerYear: 2,
  maxPerYear: 5,
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
 * Pick 2-5 events for this year using weighted random selection. When
 * `preferDiversity` is on, after each pick we down-weight everything in the
 * same category so the year doesn't end up with five career events in a row.
 */
export function selectYearEvents(
  state: PlayerState,
  events: GameEvent[],
  rng: Rng,
  options: SelectOptions = {},
): GameEvent[] {
  const opts = { ...DEFAULTS, ...options };
  const eligible = getEligibleEvents(state, events);
  if (eligible.length === 0) return [];

  const targetCount = rng.int(opts.minPerYear, opts.maxPerYear);
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
