import { describe, it, expect } from 'vitest';
import { applyEffect, applyEffects } from '../../src/game/engine/effectsApplier';
import type { PlayerState } from '../../src/game/types/gameState';

const baseState: PlayerState = {
  id: 'test',
  firstName: 'Test',
  lastName: 'User',
  age: 25,
  gender: 'female',
  country: 'NL',
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
