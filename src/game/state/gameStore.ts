import { create } from 'zustand';
import { ALL_EVENTS } from '../data/events';
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
   * Set to a choice index when the player picks an unaffordable choice.
   * UI shows the InsufficientFundsModal until they confirm or cancel.
   */
  pendingInsufficientChoice: number | null;
  /**
   * After the last event in a year is resolved, we defer endYear() until the
   * player clears the resolution modal — otherwise the death screen would
   * jump in before they could read what happened.
   */
  yearAwaitingEnd: boolean;

  // actions
  startNewLife: (options?: NewLifeOptions) => void;
  ageUpYear: () => void;
  resolveCurrentEvent: (choiceIndex: number) => void;
  confirmInsufficientChoice: () => void;
  cancelInsufficientChoice: () => void;
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

const INSUFFICIENT_FUNDS_PENALTY: Effect[] = [
  { path: 'stats.happiness', op: '-', value: 3 },
  { path: 'stats.looks', op: '-', value: 2 },
];
const INSUFFICIENT_FUNDS_NARRATIVE = 'You tried to pay but came up short. Embarrassing.';

export const useGameStore = create<GameStore>((set, get) => ({
  player: null,
  pendingEvents: [],
  screen: 'menu',
  rngState: 0,
  lastResolution: null,
  resolutionTick: 0,
  pendingInsufficientChoice: null,
  yearAwaitingEnd: false,

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
      yearAwaitingEnd: false,
    });
    void saveGame(player);
  },

  ageUpYear: () => {
    const { player, rngState } = get();
    if (!player || !player.alive) return;
    if (get().pendingEvents.length > 0) return;
    if (get().lastResolution) return;

    const rng = createRng(rngState);
    const result = ageUp(player, ALL_EVENTS, rng);
    set({
      player: result.state,
      pendingEvents: result.pendingEvents,
      rngState: rng.getState(),
    });
    void saveGame(result.state);
  },

  resolveCurrentEvent: (choiceIndex) => {
    const { player, pendingEvents, rngState, resolutionTick } = get();
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

    const remaining = pendingEvents.slice(1);
    set({
      player: next,
      pendingEvents: remaining,
      rngState: newRngState,
      lastResolution: resolved,
      resolutionTick: resolutionTick + 1,
      yearAwaitingEnd: remaining.length === 0,
    });
    void saveGame(next);
  },

  confirmInsufficientChoice: () => {
    const { player, pendingInsufficientChoice, resolutionTick } = get();
    if (!player || pendingInsufficientChoice === null) return;

    // Apply the embarrassment penalty as a synthetic resolution: it does NOT
    // mark the original event as triggered — the player still has to pick
    // something they can actually afford (or eat the penalty again).
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
      // Year is not over — the original event is still in the queue.
      yearAwaitingEnd: false,
    });
    void saveGame(next);
  },

  cancelInsufficientChoice: () => {
    set({ pendingInsufficientChoice: null });
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
      yearAwaitingEnd: false,
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
      yearAwaitingEnd: false,
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
      yearAwaitingEnd: false,
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
