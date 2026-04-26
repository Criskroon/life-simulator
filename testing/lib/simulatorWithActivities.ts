/**
 * Activities-aware simulator. Mirrors `simulateLife` but, after events resolve
 * each year, runs an "AI player" pass over the Activities menu. The AI is
 * deliberately simple — not optimal-play, just a more realistic stand-in for
 * a real player than pure random:
 *
 *   - Per-year coin flip: 60% chance the player engages with activities at
 *     all, 40% they skip the menu.
 *   - When engaging, picks weighted-randomly from the eligible & affordable
 *     list, with light biases:
 *       Mind & Body weighted up when health/happiness/smarts are low.
 *       Career & Money weighted up when the player has a job.
 *       Love & Social weighted up when the friend count is low.
 *   - Skips activities the player can't afford (looks at `cost`).
 *   - Counter-friction: refuses to do the same activity more than twice in
 *     the same year.
 *   - Stops as soon as the action budget runs out, or after a hard cap of 5
 *     activities per year (a safety net against an infinite loop on a bug).
 *
 * The result type matches `SimulatedLife` and adds an
 * `activityTriggerCounts` field so the report can compare which activities
 * the AI chose.
 */
import { ALL_EVENTS } from '../../src/game/data/events';
import { ALL_ACTIVITIES } from '../../src/game/data/activities';
import { ageUp, endYear, resolveEvent } from '../../src/game/engine/gameLoop';
import {
  executeActivity,
  getAvailableActivities,
} from '../../src/game/engine/activityEngine';
import { canAffordChoice } from '../../src/game/engine/choicePreview';
import { createRng, type Rng } from '../../src/game/engine/rng';
import { setStorageAdapter } from '../../src/game/state/persistence';
import { createNewLife, type NewLifeOptions } from '../../src/game/state/newLife';
import type { Activity } from '../../src/game/types/activities';
import type { GameEvent } from '../../src/game/types/events';
import type { PlayerState } from '../../src/game/types/gameState';
import { createMemoryStorageAdapter } from '../fixtures/memoryStorage';

setStorageAdapter(createMemoryStorageAdapter());

export interface SimulatedLifeWithActivities {
  finalState: PlayerState;
  yearsLived: number;
  causeOfDeath: string;
  eventTriggerCounts: Map<string, number>;
  activityTriggerCounts: Map<string, number>;
  /** Per-year stat snapshots (after endYear). */
  statTimeline: Array<{
    age: number;
    health: number;
    happiness: number;
    smarts: number;
    looks: number;
    money: number;
    actionsUsedThisYear: number;
    actionsAvailableThisYear: number;
  }>;
  statBoundsViolation: boolean;
  /** Total activities executed across the life, summed across all years. */
  totalActivitiesExecuted: number;
}

export interface SimulateOptions {
  seed: number;
  newLife?: NewLifeOptions;
  maxAge?: number;
  /** Master switch — when false the simulator never picks activities. */
  enableActivities?: boolean;
  /**
   * Probability per year that the AI engages with activities at all.
   * Default 0.6.
   */
  activityEngagementProbability?: number;
  /** Hard cap on activities per year. Safety net only. Default 5. */
  maxActivitiesPerYear?: number;
}

const STAT_KEYS = ['health', 'happiness', 'smarts', 'looks'] as const;

/**
 * Pick an event choice index for the simulator AI. Mirrors the affordability
 * gate the real game enforces in the store: choices the player can't afford
 * are filtered out. If everything is unaffordable, fall back to the cheapest
 * one — modelling the player who, after the InsufficientFundsModal, finally
 * picks the alternative they should have picked first. (We don't separately
 * apply the embarrassment penalty here; that's a UX construct, not a balance
 * lever.)
 */
function defaultEventChooser(
  event: GameEvent,
  state: PlayerState,
  rng: Rng,
): number {
  const indices = event.choices.map((_, i) => i);
  const affordable = indices.filter((i) =>
    canAffordChoice(state, event.choices[i]!),
  );
  if (affordable.length > 0) {
    return affordable[rng.int(0, affordable.length - 1)]!;
  }
  // Nothing is affordable — pick the cheapest (least negative cost).
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

function activityCanBeAfforded(activity: Activity, state: PlayerState): boolean {
  // Use the shared affordability gate so activities and events stay in
  // lockstep — including country cost-of-living adjustments. The real game
  // store does the same intercept: an unaffordable activity triggers the
  // InsufficientFundsModal and never executes.
  return canAffordChoice(state, { label: activity.name, cost: activity.cost });
}

/**
 * Score how attractive an activity is given the current state. Higher score
 * = more likely to be picked. The bias factors are intentionally small so
 * randomness still dominates — the goal is "realistic player", not optimal.
 */
function scoreActivity(activity: Activity, state: PlayerState): number {
  let score = 1;
  const { health, happiness, smarts } = state.stats;
  const friendCount = state.relationships.filter((r) => r.type === 'friend').length;
  const hasJob = state.job !== null;

  if (activity.category === 'mind_body') {
    if (health < 60 || happiness < 60 || smarts < 60) score *= 1.6;
    else score *= 1.0;
  }
  if (activity.category === 'career_money') {
    if (hasJob) score *= 1.4;
    else score *= 0.7; // some career-money activities still apply (lottery, doctor)
  }
  if (activity.category === 'love_social') {
    if (friendCount < 2) score *= 1.5;
    else score *= 1.0;
  }
  return score;
}

/**
 * Pick one activity to execute this year, given the eligible set and
 * counter-friction (no more than 2 of the same activity per year). Returns
 * null when no activity is pickable.
 */
function pickActivityForYear(
  state: PlayerState,
  rng: Rng,
  alreadyDoneThisYear: Map<string, number>,
): Activity | null {
  const available = getAvailableActivities(state).filter((act) => {
    const cost = act.actionCost;
    if (state.actionsRemainingThisYear < cost) return false;
    if (!activityCanBeAfforded(act, state)) return false;
    if ((alreadyDoneThisYear.get(act.id) ?? 0) >= 2) return false;
    return true;
  });
  if (available.length === 0) return null;

  const weighted = available.map((item) => ({
    item,
    weight: scoreActivity(item, state),
  }));
  return rng.weighted(weighted);
}

/**
 * Drive a full life with the activity-AI active (when enableActivities=true).
 * Returns rich diagnostics including which activities the AI picked.
 */
export function simulateLifeWithActivities(
  opts: SimulateOptions,
): SimulatedLifeWithActivities {
  const rng = createRng(opts.seed);
  const maxAge = opts.maxAge ?? 130;
  const enable = opts.enableActivities ?? true;
  const engageP = opts.activityEngagementProbability ?? 0.6;
  const maxActsPerYear = opts.maxActivitiesPerYear ?? 5;

  let state = createNewLife(rng, opts.newLife ?? {});
  const eventTriggerCounts = new Map<string, number>();
  const activityTriggerCounts = new Map<string, number>();
  const statTimeline: SimulatedLifeWithActivities['statTimeline'] = [];
  let statBoundsViolation = false;
  let totalActivitiesExecuted = 0;

  const recordSnapshot = (s: PlayerState, used: number, available: number) => {
    statTimeline.push({
      age: s.age,
      health: s.stats.health,
      happiness: s.stats.happiness,
      smarts: s.stats.smarts,
      looks: s.stats.looks,
      money: s.money,
      actionsUsedThisYear: used,
      actionsAvailableThisYear: available,
    });
    for (const k of STAT_KEYS) {
      const v = s.stats[k];
      if (v < 0 || v > 100) statBoundsViolation = true;
    }
  };

  recordSnapshot(state, 0, state.actionsRemainingThisYear);

  while (state.alive && state.age < maxAge) {
    const ageResult = ageUp(state, ALL_EVENTS, rng);
    state = ageResult.state;
    const budgetThisYear = state.actionsRemainingThisYear;

    for (const event of ageResult.pendingEvents) {
      const idx = defaultEventChooser(event, state, rng);
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
      recordSnapshot(state, 0, budgetThisYear);
      break;
    }

    // ---- Activities-AI pass ----
    let actsThisYear = 0;
    if (enable && rng.next() < engageP) {
      const doneThisYear = new Map<string, number>();
      let safety = 0;
      while (
        state.actionsRemainingThisYear > 0 &&
        actsThisYear < maxActsPerYear &&
        safety < 20
      ) {
        safety += 1;
        const pick = pickActivityForYear(state, rng, doneThisYear);
        if (!pick) break;
        const result = executeActivity(state, pick.id, rng);
        if (!result.ok) break; // shouldn't happen but defensive
        state = result.state;
        actsThisYear += 1;
        totalActivitiesExecuted += 1;
        activityTriggerCounts.set(
          pick.id,
          (activityTriggerCounts.get(pick.id) ?? 0) + 1,
        );
        doneThisYear.set(pick.id, (doneThisYear.get(pick.id) ?? 0) + 1);
      }
    }

    state = endYear(state, rng);
    recordSnapshot(state, actsThisYear, budgetThisYear);
  }

  return {
    finalState: state,
    yearsLived: state.age,
    causeOfDeath: state.causeOfDeath ?? 'still alive (max age cap)',
    eventTriggerCounts,
    activityTriggerCounts,
    statTimeline,
    statBoundsViolation,
    totalActivitiesExecuted,
  };
}

export const ALL_ACTIVITY_IDS = ALL_ACTIVITIES.map((a) => a.id);
