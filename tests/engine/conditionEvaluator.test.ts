import { describe, it, expect } from 'vitest';
import { evaluateCondition, evaluateAllConditions } from '../../src/game/engine/conditionEvaluator';
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
  job: {
    title: 'Junior Developer',
    careerId: 'software',
    level: 0,
    salary: 38000,
    performance: 75,
    yearsAtJob: 2,
  },
  education: [],
  relationships: [
    { id: 'r1', type: 'father', firstName: 'Dad', lastName: 'User', age: 55, alive: true, relationshipLevel: 70 },
    { id: 'r2', type: 'mother', firstName: 'Mom', lastName: 'User', age: 53, alive: true, relationshipLevel: 75 },
  ],
  assets: [],
  criminalRecord: [],
  history: [],
  triggeredEventIds: [],
  actionsRemainingThisYear: 3,
};

describe('evaluateCondition', () => {
  it('handles == on numbers', () => {
    expect(evaluateCondition(baseState, { path: 'age', op: '==', value: 25 })).toBe(true);
    expect(evaluateCondition(baseState, { path: 'age', op: '==', value: 26 })).toBe(false);
  });

  it('handles >, <, >=, <= on stats', () => {
    expect(evaluateCondition(baseState, { path: 'stats.health', op: '>', value: 50 })).toBe(true);
    expect(evaluateCondition(baseState, { path: 'stats.health', op: '<', value: 50 })).toBe(false);
    expect(evaluateCondition(baseState, { path: 'stats.smarts', op: '>=', value: 65 })).toBe(true);
    expect(evaluateCondition(baseState, { path: 'stats.smarts', op: '<=', value: 65 })).toBe(true);
  });

  it('returns false for missing paths instead of crashing', () => {
    expect(evaluateCondition(baseState, { path: 'job.bonus', op: '>', value: 0 })).toBe(false);
    expect(
      evaluateCondition(baseState, { path: 'nope.deep.path', op: '==', value: 1 }),
    ).toBe(false);
  });

  it('handles `has` membership against object arrays by id, type, or careerId', () => {
    expect(
      evaluateCondition(baseState, { path: 'relationships', op: 'has', value: 'father' }),
    ).toBe(true);
    expect(
      evaluateCondition(baseState, { path: 'relationships', op: 'has', value: 'r1' }),
    ).toBe(true);
    expect(
      evaluateCondition(baseState, { path: 'relationships', op: 'has', value: 'spouse' }),
    ).toBe(false);
  });

  it('`lacks` is the inverse of has and treats missing as true', () => {
    expect(
      evaluateCondition(baseState, { path: 'relationships', op: 'lacks', value: 'spouse' }),
    ).toBe(true);
    expect(
      evaluateCondition(baseState, { path: 'relationships', op: 'lacks', value: 'father' }),
    ).toBe(false);
    expect(
      evaluateCondition(baseState, { path: 'nope', op: 'lacks', value: 'anything' }),
    ).toBe(true);
  });

  it('returns true for empty/undefined condition lists', () => {
    expect(evaluateAllConditions(baseState, undefined)).toBe(true);
    expect(evaluateAllConditions(baseState, [])).toBe(true);
  });

  it('AND-combines multiple conditions', () => {
    expect(
      evaluateAllConditions(baseState, [
        { path: 'stats.health', op: '>', value: 50 },
        { path: 'age', op: '<', value: 30 },
      ]),
    ).toBe(true);
    expect(
      evaluateAllConditions(baseState, [
        { path: 'stats.health', op: '>', value: 50 },
        { path: 'age', op: '<', value: 20 },
      ]),
    ).toBe(false);
  });
});
