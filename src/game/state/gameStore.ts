import { create } from 'zustand';
import { ALL_ACTIVITIES } from '../data/activities';
import { ALL_EVENTS } from '../data/events';
import { executeActivity, getAvailableActivities } from '../engine/activityEngine';
import { getChoicePreview } from '../engine/choicePreview';
import { applyEffectsWithFeedback } from '../engine/effectsApplier';
import { ageUp, endYear, resolveEvent } from '../engine/gameLoop';
import { createRng, hashSeed, type Rng } from '../engine/rng';
import type { Effect, GameEvent, ResolvedChoice } from '../types/events';
import type { PlayerState } from '../types/gameState';
import { createNewLife, type NewLifeOptions } from './newLife';
import { deleteSave, loadGame, saveGame } from './persistence';

export type Screen = 'menu' | 'newLife' | 'game' | 'death';

interface GameStore {
  player: PlayerState | null;
  pendingEvents: GameEvent[];
  screen: Screen;
  rngState: number;
  /** Result of the last resolved choice; consumed by the ResolutionModal overlay. */
  lastResolution: ResolvedChoice | null;
  /** Increments on each resolution so the UI can re-trigger animations even on identical resolutions. */
  resolutionTick: number;
  /**
   * Set to a choice index when the player picks an unaffordable event choice.
   * UI shows the InsufficientFundsModal until they confirm or cancel.
   */
  pendingInsufficientChoice: number | null;
  /**
   * Same flow but for an unaffordable activity. Mutually exclusive with
   * pendingInsufficientChoice — only one source of "too expensive" is active
   * at a time.
   */
  pendingInsufficientActivity: string | null;
  /**
   * After taking the embarrassment penalty for an unaffordable EVENT choice,
   * we mark the player as "downgraded" — the next successful choice in the
   * same event applies an extra happiness penalty. Cleared once consumed
   * or when the event is resolved by any other path. Activities don't use
   * this — there's no "alternative within the same activity" to downgrade to.
   */
  pendingDowngrade: boolean;
  /**
   * After the last event in a year is resolved, we defer endYear() until the
   * player clears the resolution modal — otherwise the death screen would
   * jump in before they could read what happened.
   */
  yearAwaitingEnd: boolean;
  /** True when the Activities menu modal is open. */
  activitiesMenuOpen: boolean;

  // actions
  startNewLife: (options?: NewLifeOptions) => void;
  ageUpYear: () => void;
  resolveCurrentEvent: (choiceIndex: number) => void;
  confirmInsufficientChoice: () => void;
  cancelInsufficientChoice: () => void;
  openActivitiesMenu: () => void;
  closeActivitiesMenu: () => void;
  executeActivityAction: (activityId: string) => void;
  endCurrentYear: () => void;
  goToMenu: () => void;
  loadSavedGame: () => Promise<boolean>;
  hasSave: () => Promise<boolean>;
  deleteCurrentSave: () => Promise<void>;
  clearLastResolution: () => void;
}

function freshRngSeed(): number {
  // Cryptographic randomness isn't necessary; we just want different seeds
  // across new lives in the same browser session.
  return hashSeed(`${Date.now()}-${Math.random()}`);
}

function withRng(seed: number, fn: (rng: Rng) => void): number {
  const rng = createRng(seed);
  fn(rng);
  return rng.getState();
}

// Buffed embarrassment penalty (was -3 / -2). The bigger hit makes
// "Try anyway" feel like a real consequence rather than a free shrug.
const INSUFFICIENT_FUNDS_PENALTY: Effect[] = [
  { path: 'stats.happiness', op: '-', value: 5 },
  { path: 'stats.looks', op: '-', value: 2 },
];
const INSUFFICIENT_FUNDS_NARRATIVE =
  'You tried to pay but came up short. Now you\'ll have to settle for something cheaper. Embarrassing.';
// Extra hit applied to the eventual cheaper alternative the player picks
// in the same event after a failed try-anyway. Activities don't use this —
// see pendingDowngrade docs.
const DOWNGRADE_PENALTY: Effect[] = [
  { path: 'stats.happiness', op: '-', value: 3 },
];
const DOWNGRADE_NARRATIVE_SUFFIX = '(You settled for less than you wanted.)';

function appendDowngradeNarrative(original: string | null): string {
  return original
    ? `${original} ${DOWNGRADE_NARRATIVE_SUFFIX}`
    : DOWNGRADE_NARRATIVE_SUFFIX;
}

export const useGameStore = create<GameStore>((set, get) => ({
  player: null,
  pendingEvents: [],
  screen: 'menu',
  rngState: 0,
  lastResolution: null,
  resolutionTick: 0,
  pendingInsufficientChoice: null,
  pendingInsufficientActivity: null,
  pendingDowngrade: false,
  yearAwaitingEnd: false,
  activitiesMenuOpen: false,

  startNewLife: (options) => {
    const seed = freshRngSeed();
    const rng = createRng(seed);
    const player = createNewLife(rng, options);
    set({
      player,
      pendingEvents: [],
      screen: 'game',
      rngState: rng.getState(),
      lastResolution: null,
      resolutionTick: 0,
      pendingInsufficientChoice: null,
      pendingInsufficientActivity: null,
      pendingDowngrade: false,
      yearAwaitingEnd: false,
      activitiesMenuOpen: false,
    });
    void saveGame(player);
  },

  ageUpYear: () => {
    const { player, rngState } = get();
    if (!player || !player.alive) return;
    if (get().pendingEvents.length > 0) return;
    if (get().lastResolution) return;
    if (get().activitiesMenuOpen) return;

    const rng = createRng(rngState);
    const result = ageUp(player, ALL_EVENTS, rng);
    set({
      player: result.state,
      pendingEvents: result.pendingEvents,
      rngState: rng.getState(),
      // A new year wipes any leftover downgrade state — it only applies
      // within a single event.
      pendingDowngrade: false,
    });
    void saveGame(result.state);
  },

  resolveCurrentEvent: (choiceIndex) => {
    const { player, pendingEvents, rngState, resolutionTick, pendingDowngrade } = get();
    if (!player || pendingEvents.length === 0) return;
    const event = pendingEvents[0] as GameEvent;
    const choice = event.choices[choiceIndex];
    if (!choice) return;

    // Affordability gate: detect "too expensive" before we apply effects so
    // the original event stays in the queue and the player gets a do-over
    // (with an embarrassment penalty if they push through anyway).
    if (typeof choice.cost === 'number' && choice.cost < 0) {
      const required = -choice.cost;
      if (player.money < required) {
        set({ pendingInsufficientChoice: choiceIndex });
        return;
      }
    }

    const rng = createRng(rngState);
    const { state: next, resolved } = resolveEvent(player, event, choiceIndex, rng);
    const newRngState = rng.getState();

    // If the player just took the embarrassment hit and is now picking a
    // cheaper alternative, tack on the downgrade penalty — extra happiness
    // hit and a narrative postscript so they feel the consolation prize.
    let finalState = next;
    let finalResolution = resolved;
    if (pendingDowngrade) {
      const { state: penalised, deltas: dDeltas, specials: dSpecials } =
        applyEffectsWithFeedback(next, DOWNGRADE_PENALTY);
      // Merge the deltas: the downgrade -3 happiness adds onto the original
      // resolution's deltas so the modal shows the combined hit.
      const mergedDeltas = [...resolved.deltas];
      for (const d of dDeltas) {
        const existing = mergedDeltas.find((m) => m.path === d.path);
        if (existing) {
          existing.after = d.after;
        } else {
          mergedDeltas.push(d);
        }
      }
      finalState = penalised;
      finalResolution = {
        ...resolved,
        appliedEffects: [...resolved.appliedEffects, ...DOWNGRADE_PENALTY],
        narrative: appendDowngradeNarrative(resolved.narrative),
        deltas: mergedDeltas,
        specials: [...resolved.specials, ...dSpecials],
      };
    }

    const remaining = pendingEvents.slice(1);
    set({
      player: finalState,
      pendingEvents: remaining,
      rngState: newRngState,
      lastResolution: finalResolution,
      resolutionTick: resolutionTick + 1,
      yearAwaitingEnd: remaining.length === 0,
      pendingDowngrade: false,
    });
    void saveGame(finalState);
  },

  confirmInsufficientChoice: () => {
    const {
      player,
      pendingInsufficientChoice,
      pendingInsufficientActivity,
      resolutionTick,
    } = get();
    if (!player) return;
    if (pendingInsufficientChoice === null && pendingInsufficientActivity === null) return;

    // Apply the embarrassment penalty as a synthetic resolution. Neither the
    // event nor the activity actually executes — the player has to pick
    // again (and potentially eat the penalty a second time).
    const { state: next, deltas, specials } = applyEffectsWithFeedback(
      player,
      INSUFFICIENT_FUNDS_PENALTY,
    );
    const penalty: ResolvedChoice = {
      appliedEffects: INSUFFICIENT_FUNDS_PENALTY,
      narrative: INSUFFICIENT_FUNDS_NARRATIVE,
      deltas,
      specials,
    };

    set({
      player: next,
      lastResolution: penalty,
      resolutionTick: resolutionTick + 1,
      pendingInsufficientChoice: null,
      pendingInsufficientActivity: null,
      // The event-only downgrade flag fires next time the player picks a
      // cheaper alternative within the same event. Activities skip this —
      // they're discrete actions, not "alternatives within the same event."
      pendingDowngrade: pendingInsufficientChoice !== null,
      yearAwaitingEnd: false,
    });
    void saveGame(next);
  },

  cancelInsufficientChoice: () => {
    set({
      pendingInsufficientChoice: null,
      pendingInsufficientActivity: null,
    });
  },

  openActivitiesMenu: () => {
    if (!get().player?.alive) return;
    if (get().pendingEvents.length > 0) return;
    if (get().lastResolution) return;
    set({ activitiesMenuOpen: true });
  },

  closeActivitiesMenu: () => {
    set({ activitiesMenuOpen: false });
  },

  executeActivityAction: (activityId) => {
    const { player, rngState, resolutionTick } = get();
    if (!player) return;
    const activity = ALL_ACTIVITIES.find((a) => a.id === activityId);
    if (!activity) return;
    if (!getAvailableActivities(player).some((a) => a.id === activityId)) return;

    // Money gate — same intercept as events. Reuses the InsufficientFundsModal.
    if (typeof activity.cost === 'number' && activity.cost < 0) {
      const preview = getChoicePreview(
        { label: activity.name, cost: activity.cost },
        player,
      );
      if (!preview.isAffordable) {
        set({ pendingInsufficientActivity: activityId });
        return;
      }
    }

    const rng = createRng(rngState);
    const result = executeActivity(player, activityId, rng);
    if (!result.ok) return;

    set({
      player: result.state,
      rngState: rng.getState(),
      lastResolution: result.resolved,
      resolutionTick: resolutionTick + 1,
    });
    void saveGame(result.state);
  },

  endCurrentYear: () => {
    const { player, rngState } = get();
    if (!player) return;
    let nextPlayer: PlayerState = player;
    const newRngState = withRng(rngState, (rng) => {
      nextPlayer = endYear(player, rng);
    });
    set({
      player: nextPlayer,
      rngState: newRngState,
      screen: nextPlayer.alive ? 'game' : 'death',
      yearAwaitingEnd: false,
    });
    void saveGame(nextPlayer);
  },

  goToMenu: () => {
    set({
      screen: 'menu',
      pendingEvents: [],
      lastResolution: null,
      pendingInsufficientChoice: null,
      pendingInsufficientActivity: null,
      pendingDowngrade: false,
      yearAwaitingEnd: false,
      activitiesMenuOpen: false,
    });
  },

  loadSavedGame: async () => {
    const player = await loadGame();
    if (!player) return false;
    set({
      player,
      pendingEvents: [],
      screen: player.alive ? 'game' : 'death',
      rngState: freshRngSeed(),
      lastResolution: null,
      resolutionTick: 0,
      pendingInsufficientChoice: null,
      pendingInsufficientActivity: null,
      pendingDowngrade: false,
      yearAwaitingEnd: false,
      activitiesMenuOpen: false,
    });
    return true;
  },

  hasSave: async () => {
    const player = await loadGame();
    return player !== null;
  },

  deleteCurrentSave: async () => {
    await deleteSave();
    set({
      player: null,
      pendingEvents: [],
      screen: 'menu',
      lastResolution: null,
      pendingInsufficientChoice: null,
      pendingInsufficientActivity: null,
      pendingDowngrade: false,
      yearAwaitingEnd: false,
      activitiesMenuOpen: false,
    });
  },

  clearLastResolution: () => {
    const { yearAwaitingEnd } = get();
    set({ lastResolution: null });
    if (yearAwaitingEnd) {
      get().endCurrentYear();
    }
  },
}));
