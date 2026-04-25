import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../../src/game/state/gameStore';
import { setStorageAdapter, type StorageAdapter } from '../../src/game/state/persistence';
import type { GameEvent } from '../../src/game/types/events';
import type { PlayerState } from '../../src/game/types/gameState';

/**
 * Store-level coverage for the insufficient-funds intercept. We're not
 * testing UI here — just the state transitions: choose unaffordable, see
 * the modal flag, confirm to take the penalty (without resolving the event),
 * cancel to back out.
 */

const noopAdapter: StorageAdapter = {
  async get() {
    return null;
  },
  async set() {
    // discard
  },
  async remove() {
    // discard
  },
};

const expensiveEvent: GameEvent = {
  id: 'test_expensive',
  category: 'random',
  weight: 1,
  title: 'Expensive Test',
  description: 'A choice you can\'t afford.',
  choices: [
    {
      label: 'Buy the thing',
      cost: -10000,
      effects: [{ path: 'money', op: '-', value: 10000 }],
    },
    {
      label: 'Walk away',
      effects: [{ path: 'stats.happiness', op: '-', value: 1 }],
    },
  ],
};

function makePlayer(money: number): PlayerState {
  return {
    id: 'p1',
    firstName: 'Test',
    lastName: 'Player',
    age: 25,
    gender: 'female',
    country: 'GB',
    alive: true,
    birthYear: 2000,
    currentYear: 2025,
    stats: { health: 80, happiness: 70, smarts: 65, looks: 50 },
    money,
    job: null,
    education: [],
    relationships: [],
    assets: [],
    criminalRecord: [],
    history: [],
    triggeredEventIds: [],
    actionsRemainingThisYear: 3,
  };
}

describe('insufficient-funds flow', () => {
  beforeEach(() => {
    // Disable persistence so the store can't try to write to localStorage
    // in a Node test environment.
    setStorageAdapter(noopAdapter);
    useGameStore.setState({
      player: makePlayer(500),
      pendingEvents: [expensiveEvent],
      screen: 'game',
      lastResolution: null,
      resolutionTick: 0,
      pendingInsufficientChoice: null,
      pendingInsufficientActivity: null,
      pendingDowngrade: false,
      yearAwaitingEnd: false,
      activitiesMenuOpen: false,
      rngState: 1,
    });
  });

  it('flags pendingInsufficientChoice when the player picks an unaffordable choice', () => {
    useGameStore.getState().resolveCurrentEvent(0);
    const s = useGameStore.getState();
    expect(s.pendingInsufficientChoice).toBe(0);
    // Event must still be in the queue and untouched.
    expect(s.pendingEvents.length).toBe(1);
    expect(s.pendingEvents[0]?.id).toBe('test_expensive');
    // No resolution yet — modal won't show.
    expect(s.lastResolution).toBeNull();
    // Money unchanged.
    expect(s.player?.money).toBe(500);
    // The event was NOT marked as triggered.
    expect(s.player?.triggeredEventIds).not.toContain('test_expensive');
  });

  it('resolves cleanly when the player picks an affordable choice', () => {
    useGameStore.getState().resolveCurrentEvent(1);
    const s = useGameStore.getState();
    expect(s.pendingInsufficientChoice).toBeNull();
    expect(s.lastResolution).not.toBeNull();
    expect(s.lastResolution?.deltas.some((d) => d.path === 'stats.happiness')).toBe(true);
    expect(s.player?.triggeredEventIds).toContain('test_expensive');
    // Last event of the year — yearAwaitingEnd should be flipped on so
    // clearLastResolution will run endYear.
    expect(s.yearAwaitingEnd).toBe(true);
  });

  describe('after the player tries the unaffordable choice', () => {
    beforeEach(() => {
      useGameStore.getState().resolveCurrentEvent(0);
    });

    it('confirmInsufficientChoice applies the penalty without resolving the event', () => {
      const happinessBefore = useGameStore.getState().player?.stats.happiness ?? 0;
      const looksBefore = useGameStore.getState().player?.stats.looks ?? 0;
      useGameStore.getState().confirmInsufficientChoice();
      const s = useGameStore.getState();
      expect(s.pendingInsufficientChoice).toBeNull();
      // Penalty resolution is set so the modal can show it.
      expect(s.lastResolution).not.toBeNull();
      expect(s.lastResolution?.narrative).toContain('Embarrassing');
      // Penalty buffed in V1 of activities work: -5 happiness, -2 looks.
      expect(s.player?.stats.happiness).toBe(happinessBefore - 5);
      expect(s.player?.stats.looks).toBe(looksBefore - 2);
      // The pendingDowngrade flag is set so the next chosen alternative
      // takes an additional -3 happiness hit.
      expect(s.pendingDowngrade).toBe(true);
      // Event is STILL in the queue — the player has to pick again.
      expect(s.pendingEvents.length).toBe(1);
      expect(s.pendingEvents[0]?.id).toBe('test_expensive');
      // Event must NOT be marked triggered.
      expect(s.player?.triggeredEventIds).not.toContain('test_expensive');
      // Year is not over either — the unresolved event blocks endYear.
      expect(s.yearAwaitingEnd).toBe(false);
    });

    it('cancelInsufficientChoice just dismisses the modal without side effects', () => {
      const moneyBefore = useGameStore.getState().player?.money ?? 0;
      const happinessBefore = useGameStore.getState().player?.stats.happiness ?? 0;
      useGameStore.getState().cancelInsufficientChoice();
      const s = useGameStore.getState();
      expect(s.pendingInsufficientChoice).toBeNull();
      expect(s.lastResolution).toBeNull();
      expect(s.player?.money).toBe(moneyBefore);
      expect(s.player?.stats.happiness).toBe(happinessBefore);
      expect(s.pendingEvents.length).toBe(1);
    });

    it('lets the player pick the cheap choice on the second pass', () => {
      // Confirm the embarrassment penalty first.
      useGameStore.getState().confirmInsufficientChoice();
      // Clear the penalty modal — back to event view.
      useGameStore.getState().clearLastResolution();
      // Now pick the affordable option.
      useGameStore.getState().resolveCurrentEvent(1);
      const s = useGameStore.getState();
      expect(s.pendingInsufficientChoice).toBeNull();
      expect(s.player?.triggeredEventIds).toContain('test_expensive');
    });

    it('applies the downgrade penalty (-3 happiness) on the cheaper alternative', () => {
      // Snapshot AFTER the embarrassment penalty so we measure only the
      // downgrade hit on the alternative — not the embarrassment itself.
      useGameStore.getState().confirmInsufficientChoice();
      useGameStore.getState().clearLastResolution();
      const happinessBeforeAlt = useGameStore.getState().player?.stats.happiness ?? 0;
      // The alternative choice already says "stats.happiness -1". With the
      // downgrade hit, total drop should be 1 + 3 = 4.
      useGameStore.getState().resolveCurrentEvent(1);
      const s = useGameStore.getState();
      expect(s.player?.stats.happiness).toBe(happinessBeforeAlt - 4);
      expect(s.pendingDowngrade).toBe(false);
      expect(s.lastResolution?.narrative ?? '').toContain('settled for less');
    });
  });
});
