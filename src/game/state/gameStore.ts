import { create } from 'zustand';
import { ACTIONS_BY_TYPE } from '../data/actions';
import { ALL_ACTIVITIES } from '../data/activities';
import { ALL_EVENTS } from '../data/events';
import { executeActivity, getAvailableActivities } from '../engine/activityEngine';
import { canAffordChoice } from '../engine/choicePreview';
import { applyEffectsWithFeedback } from '../engine/effectsApplier';
import { ageUp, endYear, resolveEvent } from '../engine/gameLoop';
import { executeAction } from '../engine/interactions';
import { createRng, hashSeed, type Rng } from '../engine/rng';
import type { Effect, GameEvent, ResolvedChoice } from '../types/events';
import type { Person, PlayerState, RelationshipType } from '../types/gameState';
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
  /**
   * Set when the player has tapped a relationship row in SidePanel. Carries
   * both the Person and the slot type (`partner` vs `casualEx` etc) so the
   * interactions engine can look up the right action set without re-deriving
   * the type from the relationship state.
   */
  profileTarget: { person: Person; type: RelationshipType } | null;

  // actions
  startNewLife: (options?: NewLifeOptions) => void;
  ageUpYear: () => void;
  resolveCurrentEvent: (choiceIndex: number) => void;
  confirmInsufficientChoice: () => void;
  cancelInsufficientChoice: () => void;
  openActivitiesMenu: () => void;
  closeActivitiesMenu: () => void;
  executeActivityAction: (activityId: string) => void;
  openProfile: (person: Person, type: RelationshipType) => void;
  closeProfile: () => void;
  executeRelationshipAction: (actionId: string) => void;
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

// True when the resolution has anything worth showing: a narrative, at least
// one stat delta, or at least one special-effect chip. A handful of choices
// (e.g. random_lottery_win → "Save your money") have no narrative and an
// empty effects array — the modal would render a blank card with only a
// Continue button. We skip the modal entirely in that case to match BitLife
// behavior: the player picks, the resolution is silent, the game advances.
function hasResolutionContent(r: ResolvedChoice): boolean {
  return Boolean(r.narrative) || r.deltas.length > 0 || r.specials.length > 0;
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
  profileTarget: null,

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
      profileTarget: null,
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
    // (with an embarrassment penalty if they push through anyway). Uses the
    // shared helper so events and activities stay in lockstep — including
    // country cost-of-living adjustments.
    if (!canAffordChoice(player, choice)) {
      set({ pendingInsufficientChoice: choiceIndex });
      return;
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
    const showModal = hasResolutionContent(finalResolution);
    const yearShouldEnd = remaining.length === 0;
    set({
      player: finalState,
      pendingEvents: remaining,
      rngState: newRngState,
      lastResolution: showModal ? finalResolution : null,
      resolutionTick: resolutionTick + 1,
      // If the modal is skipped we'll trigger endCurrentYear inline below,
      // so don't leave yearAwaitingEnd dangling for clearLastResolution.
      yearAwaitingEnd: showModal && yearShouldEnd,
      pendingDowngrade: false,
    });
    void saveGame(finalState);
    if (!showModal && yearShouldEnd) {
      get().endCurrentYear();
    }
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

    // Money gate — same intercept as events.
    if (!canAffordChoice(player, { label: activity.name, cost: activity.cost })) {
      set({ pendingInsufficientActivity: activityId });
      return;
    }

    const rng = createRng(rngState);
    const result = executeActivity(player, activityId, rng);
    if (!result.ok) return;

    const showModal = hasResolutionContent(result.resolved);
    set({
      player: result.state,
      rngState: rng.getState(),
      lastResolution: showModal ? result.resolved : null,
      resolutionTick: resolutionTick + 1,
    });
    void saveGame(result.state);
  },

  openProfile: (person, type) => {
    if (!get().player?.alive) return;
    if (get().pendingEvents.length > 0) return;
    if (get().lastResolution) return;
    if (get().activitiesMenuOpen) return;
    set({ profileTarget: { person, type } });
  },

  closeProfile: () => {
    set({ profileTarget: null });
  },

  executeRelationshipAction: (actionId) => {
    const { player, profileTarget, rngState, resolutionTick } = get();
    if (!player || !profileTarget) return;
    const { person, type } = profileTarget;
    const list = ACTIONS_BY_TYPE[type] ?? [];
    const action = list.find((a) => a.id === actionId);
    if (!action) return;

    const rng = createRng(rngState);
    const result = executeAction(player, action, person, type, rng);
    if (!result.ok) return;

    const showModal = hasResolutionContent(result.resolved);
    // Close the profile so the resolution modal takes over without being
    // stacked behind a stale profile (the targeted person may have been
    // promoted/demoted by the action — partner→fiance after a successful
    // propose, partner→casualEx after a rejection).
    set({
      player: result.state,
      rngState: rng.getState(),
      lastResolution: showModal ? result.resolved : null,
      resolutionTick: resolutionTick + 1,
      profileTarget: null,
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
      profileTarget: null,
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
      profileTarget: null,
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
      profileTarget: null,
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
