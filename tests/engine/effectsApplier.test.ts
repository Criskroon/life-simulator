import { describe, it, expect } from 'vitest';
import {
  applyEffect,
  applyEffects,
  applyEffectsWithFeedback,
} from '../../src/game/engine/effectsApplier';
import type { PlayerState } from '../../src/game/types/gameState';

const baseState: PlayerState = {
  id: 'test',
  firstName: 'Test',
  lastName: 'User',
  age: 25,
  gender: 'female',
  country: 'GB',
  alive: true,
  birthYear: 2000,
  currentYear: 2025,
  stats: { health: 80, happiness: 70, smarts: 65, looks: 50 },
  money: 5000,
  job: null,
  education: [],
  relationships: [],
  assets: [],
  criminalRecord: [],
  history: [],
  triggeredEventIds: [],
  actionsRemainingThisYear: 3,
};

describe('applyEffect', () => {
  it('adds to a numeric path', () => {
    const next = applyEffect(baseState, { path: 'stats.happiness', op: '+', value: 10 });
    expect(next.stats.happiness).toBe(80);
  });

  it('does not mutate the original state', () => {
    applyEffect(baseState, { path: 'stats.happiness', op: '+', value: 10 });
    expect(baseState.stats.happiness).toBe(70);
  });

  it('clamps stats between 0 and 100', () => {
    const high = applyEffect(baseState, { path: 'stats.happiness', op: '+', value: 50 });
    expect(high.stats.happiness).toBe(100);
    const low = applyEffect(baseState, { path: 'stats.health', op: '-', value: 200 });
    expect(low.stats.health).toBe(0);
  });

  it('handles assignment with =', () => {
    const next = applyEffect(baseState, { path: 'stats.smarts', op: '=', value: 99 });
    expect(next.stats.smarts).toBe(99);
  });

  it('handles money arithmetic without clamping to 0..100', () => {
    const richer = applyEffect(baseState, { path: 'money', op: '+', value: 100000 });
    expect(richer.money).toBe(105000);
    const poorer = applyEffect(baseState, { path: 'money', op: '-', value: 7000 });
    expect(poorer.money).toBe(-2000);
  });

  it('treats missing numeric path as 0 for arithmetic', () => {
    const next = applyEffect(baseState, { path: 'job.salary', op: '+', value: 100 });
    // Path goes through null job — should be a no-op and not crash.
    expect(next).toBe(baseState);
  });

  it('runs the special `addRelationship` handler', () => {
    const next = applyEffect(baseState, {
      special: 'addRelationship',
      payload: {
        id: 'r-friend',
        type: 'friend',
        firstName: 'Sam',
        lastName: 'Hill',
        age: 25,
        alive: true,
        relationshipLevel: 60,
      },
    });
    expect(next.relationships).toHaveLength(1);
    expect(next.relationships[0]?.firstName).toBe('Sam');
  });

  it('runs the special `die` handler', () => {
    const next = applyEffect(baseState, {
      special: 'die',
      payload: { cause: 'a bee sting' },
    });
    expect(next.alive).toBe(false);
    expect(next.causeOfDeath).toBe('a bee sting');
  });

  it('chains multiple effects in order', () => {
    const next = applyEffects(baseState, [
      { path: 'stats.happiness', op: '+', value: 5 },
      { path: 'stats.happiness', op: '*', value: 2 },
      { path: 'money', op: '-', value: 1000 },
    ]);
    expect(next.stats.happiness).toBe(100); // (70 + 5) * 2 = 150 → clamped
    expect(next.money).toBe(4000);
  });

  it('ignores unknown special handlers without crashing', () => {
    const next = applyEffect(baseState, {
      special: 'totallyMadeUp' as never,
      payload: {},
    });
    expect(next).toBe(baseState);
  });
});

describe('applyEffectsWithFeedback', () => {
  it('records deltas for stat paths', () => {
    const result = applyEffectsWithFeedback(baseState, [
      { path: 'stats.happiness', op: '+', value: 5 },
      { path: 'stats.health', op: '-', value: 10 },
    ]);
    const happy = result.deltas.find((d) => d.path === 'stats.happiness');
    const health = result.deltas.find((d) => d.path === 'stats.health');
    expect(happy).toEqual({ path: 'stats.happiness', before: 70, after: 75 });
    expect(health).toEqual({ path: 'stats.health', before: 80, after: 70 });
  });

  it('records a money delta', () => {
    const result = applyEffectsWithFeedback(baseState, [
      { path: 'money', op: '+', value: 1000 },
    ]);
    expect(result.deltas).toEqual([{ path: 'money', before: 5000, after: 6000 }]);
  });

  it('coalesces multiple effects on the same path into one delta (before-first, after-last)', () => {
    const result = applyEffectsWithFeedback(baseState, [
      { path: 'stats.happiness', op: '+', value: 5 },
      { path: 'stats.happiness', op: '+', value: 5 },
    ]);
    expect(result.deltas).toEqual([
      { path: 'stats.happiness', before: 70, after: 80 },
    ]);
  });

  it('omits no-change effects from the deltas list', () => {
    const result = applyEffectsWithFeedback(baseState, [
      { path: 'stats.happiness', op: '+', value: 0 },
    ]);
    expect(result.deltas).toEqual([]);
  });

  it('summarizes setJob with a UI-ready label', () => {
    const result = applyEffectsWithFeedback(baseState, [
      {
        special: 'setJob',
        payload: {
          title: 'Cashier',
          careerId: 'retail',
          level: 0,
          salary: 22000,
          performance: 60,
          yearsAtJob: 0,
        },
      },
    ]);
    expect(result.specials).toEqual([
      { special: 'setJob', label: 'New job: Cashier' },
    ]);
  });

  it('summarizes addRelationship using the relationship type', () => {
    const result = applyEffectsWithFeedback(baseState, [
      {
        special: 'addRelationship',
        payload: {
          id: 'rel-spouse',
          type: 'spouse',
          firstName: 'Sara',
          lastName: 'Lopez',
          age: 28,
          alive: true,
          relationshipLevel: 90,
        },
      },
    ]);
    expect(result.specials[0]?.label).toBe('Married Sara Lopez');
  });

  it('does not mutate the original state', () => {
    applyEffectsWithFeedback(baseState, [
      { path: 'stats.happiness', op: '+', value: 5 },
    ]);
    expect(baseState.stats.happiness).toBe(70);
  });
});
