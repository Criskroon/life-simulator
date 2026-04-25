import type { GameEvent } from '../types/events';
import type { PlayerState } from '../types/gameState';
import { applyEffects } from './effectsApplier';
import { selectYearEvents } from './eventSelector';
import type { Rng } from './rng';
import { renderTemplate } from './templates';

export interface AgeUpResult {
  state: PlayerState;
  /** Events the player must resolve this year, in order. */
  pendingEvents: GameEvent[];
}

/**
 * Advance the player one year. Pure: returns a new state and the events the
 * UI should walk the player through. Death checks happen after the player
 * resolves all events for the year (see `endYear`), so a final lottery win
 * can be enjoyed before old age catches up.
 */
export function ageUp(
  state: PlayerState,
  events: GameEvent[],
  rng: Rng,
): AgeUpResult {
  if (!state.alive) {
    return { state, pendingEvents: [] };
  }

  let next: PlayerState = {
    ...state,
    age: state.age + 1,
    currentYear: state.currentYear + 1,
  };

  next = applyPassiveEffects(next);
  next = ageRelationships(next);

  const pendingEvents = selectYearEvents(next, events, rng);
  return { state: next, pendingEvents };
}

/**
 * Apply choice effects to state and append a history entry. UI calls this
 * once per event the player resolves.
 */
export function resolveEvent(
  state: PlayerState,
  event: GameEvent,
  choiceIndex: number,
): PlayerState {
  const choice = event.choices[choiceIndex];
  if (!choice) return state;

  let next = applyEffects(state, choice.effects);

  const triggered = next.triggeredEventIds.includes(event.id)
    ? next.triggeredEventIds
    : [...next.triggeredEventIds, event.id];

  next = {
    ...next,
    triggeredEventIds: triggered,
    history: [
      ...next.history,
      {
        year: next.currentYear,
        age: next.age,
        eventId: event.id,
        description: renderTemplate(event.description, next),
        choiceLabel: choice.label,
      },
    ],
  };

  return next;
}

/**
 * Called after the player has resolved all events for the year — checks
 * mortality conditions and marks death if any apply.
 */
export function endYear(state: PlayerState, rng: Rng): PlayerState {
  if (!state.alive) return state;

  if (state.stats.health <= 0) {
    return killPlayer(state, 'poor health');
  }

  const mortalityChance = mortalityCurve(state.age, state.stats.health);
  if (rng.next() < mortalityChance) {
    const cause = state.age >= 70 ? 'old age' : 'an unexpected illness';
    return killPlayer(state, cause);
  }

  // Rare accidents independent of age
  if (rng.next() < 0.001) {
    return killPlayer(state, 'a freak accident');
  }

  return state;
}

function killPlayer(state: PlayerState, cause: string): PlayerState {
  return {
    ...state,
    alive: false,
    causeOfDeath: cause,
    history: [
      ...state.history,
      {
        year: state.currentYear,
        age: state.age,
        eventId: 'death',
        description: `${state.firstName} died of ${cause} at age ${state.age}.`,
      },
    ],
  };
}

/** Yearly drift: salary income, slight stat decay, job tenure increment. */
function applyPassiveEffects(state: PlayerState): PlayerState {
  let next = state;

  if (state.job) {
    next = {
      ...next,
      money: next.money + state.job.salary,
      job: {
        ...state.job,
        yearsAtJob: state.job.yearsAtJob + 1,
      },
    };
  }

  // Health drifts down slowly with age past 30.
  if (state.age >= 30) {
    const drop = state.age >= 60 ? 2 : 1;
    next = {
      ...next,
      stats: {
        ...next.stats,
        health: Math.max(0, next.stats.health - drop),
      },
    };
  }

  // Friendships fade if not maintained — small decay each year.
  next = {
    ...next,
    relationships: next.relationships.map((r) =>
      r.type === 'friend'
        ? { ...r, relationshipLevel: Math.max(0, r.relationshipLevel - 1) }
        : r,
    ),
  };

  return next;
}

function ageRelationships(state: PlayerState): PlayerState {
  return {
    ...state,
    relationships: state.relationships.map((r) =>
      r.alive ? { ...r, age: r.age + 1 } : r,
    ),
  };
}

/**
 * Probability of dying at the end of a given year. Tuned to roughly match
 * intuitive lifespans: very low through middle age, ramping up after 60,
 * near-certain by 110. Poor health pulls the curve forward.
 */
function mortalityCurve(age: number, health: number): number {
  const healthFactor = 1 + (100 - health) / 50; // 1.0 at full health, ~3.0 at zero
  if (age < 40) return 0.0005 * healthFactor;
  if (age < 60) return 0.002 * healthFactor;
  if (age < 75) return 0.01 * healthFactor;
  if (age < 90) return 0.05 * healthFactor;
  if (age < 105) return 0.2 * healthFactor;
  return 0.6 * healthFactor;
}
