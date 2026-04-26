import { ALL_EVENTS } from '../../src/game/data/events';
import { canAffordChoice } from '../../src/game/engine/choicePreview';
import { ageUp, endYear, resolveEvent } from '../../src/game/engine/gameLoop';
import { createRng, type Rng } from '../../src/game/engine/rng';
import { setStorageAdapter } from '../../src/game/state/persistence';
import { createNewLife, type NewLifeOptions } from '../../src/game/state/newLife';
import type { GameEvent } from '../../src/game/types/events';
import type { PlayerState } from '../../src/game/types/gameState';
import { createMemoryStorageAdapter } from '../fixtures/memoryStorage';

// Make sure no engine code accidentally hits the user's real localStorage
// when imported in a Node process.
setStorageAdapter(createMemoryStorageAdapter());

export interface SimulatedLife {
  finalState: PlayerState;
  /** Years lived (== final age, since age starts at 0). */
  yearsLived: number;
  causeOfDeath: string;
  /** Count of how many times each event id was triggered across the life. */
  eventTriggerCounts: Map<string, number>;
  /** Stat snapshot per age, captured after endYear. */
  statTimeline: Array<{
    age: number;
    health: number;
    happiness: number;
    smarts: number;
    looks: number;
    money: number;
  }>;
  /** True if at any point a stat exceeded the 0..100 bound. */
  statBoundsViolation: boolean;
}

export interface SimulateOptions {
  seed: number;
  newLife?: NewLifeOptions;
  /** Hard cap; default 130 — guard against an infinite life from a bad event. */
  maxAge?: number;
  /** Choice strategy. Default: weighted random with the given rng. */
  chooseIndex?: (event: GameEvent, state: PlayerState, rng: Rng) => number;
}

const STAT_KEYS = ['health', 'happiness', 'smarts', 'looks'] as const;

/**
 * Default choice strategy. Filters to affordable options first — the real
 * game's store would intercept an unaffordable pick with the
 * InsufficientFundsModal, so the simulator should mirror that. Fallback to
 * the cheapest choice when nothing fits the budget.
 */
function defaultChooser(event: GameEvent, state: PlayerState, rng: Rng): number {
  const indices = event.choices.map((_, i) => i);
  const affordable = indices.filter((i) =>
    canAffordChoice(state, event.choices[i]!),
  );
  if (affordable.length > 0) {
    return affordable[rng.int(0, affordable.length - 1)]!;
  }
  let best = 0;
  let bestCost = Number.NEGATIVE_INFINITY;
  for (const i of indices) {
    const c = event.choices[i]!.cost ?? 0;
    if (c > bestCost) {
      bestCost = c;
      best = i;
    }
  }
  return best;
}

/**
 * Drive an entire life from birth to death using the pure engine functions.
 * Returns rich diagnostics for analysis.
 */
export function simulateLife(opts: SimulateOptions): SimulatedLife {
  const rng = createRng(opts.seed);
  const choose = opts.chooseIndex ?? defaultChooser;
  const maxAge = opts.maxAge ?? 130;

  let state = createNewLife(rng, opts.newLife ?? {});
  const eventTriggerCounts = new Map<string, number>();
  const statTimeline: SimulatedLife['statTimeline'] = [];
  let statBoundsViolation = false;

  const recordSnapshot = (s: PlayerState) => {
    statTimeline.push({
      age: s.age,
      health: s.stats.health,
      happiness: s.stats.happiness,
      smarts: s.stats.smarts,
      looks: s.stats.looks,
      money: s.money,
    });
    for (const k of STAT_KEYS) {
      const v = s.stats[k];
      if (v < 0 || v > 100) statBoundsViolation = true;
    }
  };

  recordSnapshot(state);

  while (state.alive && state.age < maxAge) {
    const ageResult = ageUp(state, ALL_EVENTS, rng);
    state = ageResult.state;

    for (const event of ageResult.pendingEvents) {
      const idx = choose(event, state, rng);
      const safeIdx = Math.min(Math.max(0, idx), event.choices.length - 1);
      const result = resolveEvent(state, event, safeIdx, rng);
      state = result.state;
      eventTriggerCounts.set(
        event.id,
        (eventTriggerCounts.get(event.id) ?? 0) + 1,
      );
      if (!state.alive) break;
    }

    if (!state.alive) {
      recordSnapshot(state);
      break;
    }

    state = endYear(state, rng);
    recordSnapshot(state);
  }

  return {
    finalState: state,
    yearsLived: state.age,
    causeOfDeath: state.causeOfDeath ?? 'still alive (max age cap)',
    eventTriggerCounts,
    statTimeline,
    statBoundsViolation,
  };
}
