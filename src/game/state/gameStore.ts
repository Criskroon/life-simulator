import { create } from 'zustand';
import { ALL_EVENTS } from '../data/events';
import { ageUp, endYear, resolveEvent } from '../engine/gameLoop';
import { createRng, hashSeed, type Rng } from '../engine/rng';
import type { GameEvent, ResolvedChoice } from '../types/events';
import type { PlayerState } from '../types/gameState';
import { createNewLife, type NewLifeOptions } from './newLife';
import { deleteSave, loadGame, saveGame } from './persistence';

export type Screen = 'menu' | 'newLife' | 'game' | 'death';

interface GameStore {
  player: PlayerState | null;
  pendingEvents: GameEvent[];
  screen: Screen;
  rngState: number;
  /** Result of the last resolved choice; consumed by StatFeedback overlay. */
  lastResolution: ResolvedChoice | null;
  /** Increments on each resolution so the UI can re-trigger animations even on identical resolutions. */
  resolutionTick: number;

  // actions
  startNewLife: (options?: NewLifeOptions) => void;
  ageUpYear: () => void;
  resolveCurrentEvent: (choiceIndex: number) => void;
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

export const useGameStore = create<GameStore>((set, get) => ({
  player: null,
  pendingEvents: [],
  screen: 'menu',
  rngState: 0,
  lastResolution: null,
  resolutionTick: 0,

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
    });
    void saveGame(player);
  },

  ageUpYear: () => {
    const { player, rngState } = get();
    if (!player || !player.alive) return;
    if (get().pendingEvents.length > 0) return;

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
    });
    if (remaining.length === 0) {
      get().endCurrentYear();
    } else {
      void saveGame(next);
    }
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
    });
    void saveGame(nextPlayer);
  },

  goToMenu: () => {
    set({ screen: 'menu', pendingEvents: [], lastResolution: null });
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
    });
    return true;
  },

  hasSave: async () => {
    const player = await loadGame();
    return player !== null;
  },

  deleteCurrentSave: async () => {
    await deleteSave();
    set({ player: null, pendingEvents: [], screen: 'menu', lastResolution: null });
  },

  clearLastResolution: () => {
    set({ lastResolution: null });
  },
}));
