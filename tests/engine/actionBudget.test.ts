import { describe, expect, it } from 'vitest';
import {
  calculateActionBudget,
  useAction,
  useActions,
} from '../../src/game/engine/actionBudget';
import type { PlayerState } from '../../src/game/types/gameState';

function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'p',
    firstName: 'Test',
    lastName: 'User',
    age: 25,
    gender: 'female',
    country: 'GB',
    alive: true,
    birthYear: 2000,
    currentYear: 2025,
    stats: { health: 80, happiness: 70, smarts: 65, looks: 50 },
    money: 0,
    job: null,
    education: [],
    relationships: [],
    assets: [],
    criminalRecord: [],
    history: [],
    triggeredEventIds: [],
    actionsRemainingThisYear: 3,
    ...overrides,
  };
}

describe('calculateActionBudget — phase base', () => {
  it('child age 5: base 1, +1 unemployed, clamped to min 2', () => {
    expect(calculateActionBudget(makePlayer({ age: 5 }))).toBe(2);
  });

  it('child age 12: still child phase', () => {
    expect(calculateActionBudget(makePlayer({ age: 12 }))).toBe(2);
  });

  it('teen age 13: base 2, +1 unemployed = 3', () => {
    expect(calculateActionBudget(makePlayer({ age: 13 }))).toBe(3);
  });

  it('teen age 17: still teen phase', () => {
    expect(calculateActionBudget(makePlayer({ age: 17 }))).toBe(3);
  });

  it('adult 18 unemployed: base 3 +1 = 4', () => {
    expect(calculateActionBudget(makePlayer({ age: 18 }))).toBe(4);
  });

  it('adult 30 with a job: base 3, no unemployment bonus', () => {
    const player = makePlayer({
      age: 30,
      job: { title: 'Dev', careerId: 'tech', level: 0, salary: 50000, performance: 60, yearsAtJob: 2 },
    });
    expect(calculateActionBudget(player)).toBe(3);
  });

  it('senior 65 with a job: base 4', () => {
    const player = makePlayer({
      age: 65,
      job: { title: 'Consultant', careerId: 'tech', level: 0, salary: 50000, performance: 60, yearsAtJob: 2 },
    });
    expect(calculateActionBudget(player)).toBe(4);
  });

  it('senior 65 unemployed: base 4 +1 = 5 (max)', () => {
    expect(calculateActionBudget(makePlayer({ age: 65 }))).toBe(5);
  });
});

describe('calculateActionBudget — modifiers', () => {
  it('low health subtracts one', () => {
    const player = makePlayer({
      age: 30,
      stats: { health: 15, happiness: 50, smarts: 50, looks: 50 },
      job: { title: 'Dev', careerId: 'tech', level: 0, salary: 50000, performance: 60, yearsAtJob: 2 },
    });
    // base 3, low health -1 = 2
    expect(calculateActionBudget(player)).toBe(2);
  });

  it('age 80+ subtracts one', () => {
    const player = makePlayer({ age: 82 });
    // base 4, unemployed +1, very old -1 = 4
    expect(calculateActionBudget(player)).toBe(4);
  });

  it('all penalties stacking, clamped to min 2', () => {
    const player = makePlayer({
      age: 90,
      stats: { health: 5, happiness: 50, smarts: 50, looks: 50 },
      job: { title: 'Janitor', careerId: 'retail', level: 0, salary: 20000, performance: 60, yearsAtJob: 1 },
    });
    // base 4, low health -1, very old -1 = 2 (min)
    expect(calculateActionBudget(player)).toBe(2);
  });

  it('budget never exceeds the max of 5', () => {
    const player = makePlayer({ age: 70 });
    // base 4 +1 unemployed = 5. (No further modifiers push it higher.)
    expect(calculateActionBudget(player)).toBe(5);
  });

  it('budget never falls below 2 even when every modifier hits', () => {
    const player = makePlayer({
      age: 95,
      stats: { health: 2, happiness: 10, smarts: 10, looks: 10 },
      job: null,
    });
    // base 4, +1 unemployed, -1 sick, -1 very old = 3 (above min already)
    expect(calculateActionBudget(player)).toBe(3);
  });
});

describe('useAction / useActions', () => {
  it('useAction decrements by one', () => {
    const player = makePlayer({ actionsRemainingThisYear: 3 });
    const next = useAction(player);
    expect(next).not.toBeNull();
    expect(next?.actionsRemainingThisYear).toBe(2);
  });

  it('useAction returns null when no actions remain', () => {
    const player = makePlayer({ actionsRemainingThisYear: 0 });
    expect(useAction(player)).toBeNull();
  });

  it('useActions(2) decrements by two', () => {
    const player = makePlayer({ actionsRemainingThisYear: 4 });
    const next = useActions(player, 2);
    expect(next?.actionsRemainingThisYear).toBe(2);
  });

  it('useActions returns null when budget is insufficient', () => {
    const player = makePlayer({ actionsRemainingThisYear: 1 });
    expect(useActions(player, 2)).toBeNull();
  });

  it('useActions does not mutate the input state', () => {
    const player = makePlayer({ actionsRemainingThisYear: 3 });
    useActions(player, 1);
    expect(player.actionsRemainingThisYear).toBe(3);
  });
});
