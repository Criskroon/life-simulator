import type { GameEvent, ResolvedChoice } from '../types/events';
import type { PlayerState } from '../types/gameState';
import { calculateActionBudget } from './actionBudget';
import { resetActionUsage } from './actionCooldowns';
import { getEducationState, progressEducation } from './educationProgressionEngine';
import { applyEffectsWithFeedback } from './effectsApplier';
import { selectYearEvents } from './eventSelector';
import { enrichGeneratedRelationships } from './nameGenerator';
import { resolveChoice } from './outcomeResolver';
import { decayRelationships, ensureRelationshipState } from './relationshipEngine';
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

  // Education-state gate: a graduated stage hands control to the player —
  // ageUp can't advance until they pick a next stage or formally drop out.
  if (getEducationState(state).status === 'choosing_next') {
    return { state, pendingEvents: [] };
  }

  let next: PlayerState = ensureRelationshipState({
    ...state,
    age: state.age + 1,
    currentYear: state.currentYear + 1,
  });

  next = applyPassiveEffects(next);
  // Tier-system tick: ages every relationship by 1, expires casual exes
  // past their decay year, fades unmaintained friends, caps significant
  // exes. Replaces the old ageRelationships pass.
  next = decayRelationships(next);
  // Education progression — auto-enrol at school start age, advance enrolled
  // year, or graduate (which may flip status to choosing_next; the next
  // ageUp will then early-exit until the player resolves the choice).
  next = progressEducation(next, rng);
  // Refresh the activities budget for the new year. Anything left over from
  // last year evaporates; the player has to spend or lose them.
  next = { ...next, actionsRemainingThisYear: calculateActionBudget(next) };
  // Wipe last year's interaction-cooldown ledger so light-tier actions
  // become available again on the new year.
  next = resetActionUsage(next);

  const pendingEvents = selectYearEvents(next, events, rng);
  return { state: next, pendingEvents };
}

export interface ResolveEventResult {
  state: PlayerState;
  resolved: ResolvedChoice;
}

/**
 * Apply a choice to state and append a history entry. UI calls this once
 * per event the player resolves. The `Rng` argument is used to weighted-pick
 * among probabilistic outcomes when the choice has any.
 */
export function resolveEvent(
  state: PlayerState,
  event: GameEvent,
  choiceIndex: number,
  rng: Rng,
): ResolveEventResult {
  const choice = event.choices[choiceIndex];
  if (!choice) {
    return {
      state,
      resolved: { appliedEffects: [], narrative: null, deltas: [], specials: [] },
    };
  }

  const picked = resolveChoice(choice, rng);
  const renderedNarrative = picked.narrative ? renderTemplate(picked.narrative, state) : null;
  const enrichedEffects = enrichGeneratedRelationships(picked.effects, state, rng);
  const { state: afterEffects, deltas, specials } = applyEffectsWithFeedback(state, enrichedEffects);

  const triggered = afterEffects.triggeredEventIds.includes(event.id)
    ? afterEffects.triggeredEventIds
    : [...afterEffects.triggeredEventIds, event.id];

  const next: PlayerState = {
    ...afterEffects,
    triggeredEventIds: triggered,
    history: [
      ...afterEffects.history,
      {
        year: afterEffects.currentYear,
        age: afterEffects.age,
        eventId: event.id,
        description: renderTemplate(event.description, afterEffects),
        choiceLabel: choice.label,
        ...(renderedNarrative ? { outcomeNarrative: renderedNarrative } : {}),
      },
    ],
  };

  return {
    state: next,
    resolved: {
      appliedEffects: enrichedEffects,
      narrative: renderedNarrative,
      deltas,
      specials,
      followUpEventId: picked.followUpEventId,
    },
  };
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
    const cause = state.age >= 65 ? 'old age' : 'an unexpected illness';
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

/** Yearly drift: salary income, lifetime health curve, job tenure increment. */
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

  // Lifetime health curve. Young bodies recover quickly from event hits,
  // adults keep healing gently into their forties, then a slow decline
  // begins at 50 and steepens through old age. Tuned so the average life
  // ends from the mortality curve, not from random event hits adding up.
  const currentHealth = next.stats.health;
  let nextHealth = currentHealth;
  if (state.age < 30) {
    nextHealth = Math.min(100, currentHealth + 2);
  } else if (state.age < 50) {
    nextHealth = Math.min(100, currentHealth + 1);
  } else if (state.age >= 80) {
    nextHealth = Math.max(0, currentHealth - 2);
  } else if (state.age >= 65) {
    nextHealth = Math.max(0, currentHealth - 1);
  } else {
    nextHealth = Math.max(0, currentHealth - 1);
  }
  if (nextHealth !== currentHealth) {
    next = { ...next, stats: { ...next.stats, health: nextHealth } };
  }

  // Friendship/casual-ex decay is handled by decayRelationships() in the
  // tier-system tick — see the call in ageUp().
  return next;
}

/**
 * Probability of dying at the end of a given year. Tuned for a median
 * lifespan around 70-75: very low through middle age, climbing steeply
 * after 65, near-certain by 105. Poor health pulls the curve forward.
 */
function mortalityCurve(age: number, health: number): number {
  const healthFactor = 1 + (100 - health) / 50; // 1.0 at full health, ~3.0 at zero
  if (age < 40) return 0.0006 * healthFactor;
  if (age < 60) return 0.0025 * healthFactor;
  if (age < 70) return 0.014 * healthFactor;
  if (age < 80) return 0.035 * healthFactor;
  if (age < 90) return 0.08 * healthFactor;
  if (age < 100) return 0.25 * healthFactor;
  return 0.6 * healthFactor;
}
