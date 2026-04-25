import { describe, it, expect } from 'vitest';
import { resolveChoice } from '../../src/game/engine/outcomeResolver';
import { createRng } from '../../src/game/engine/rng';
import type { Choice } from '../../src/game/types/events';

describe('resolveChoice', () => {
  it('returns deterministic choice effects with null narrative', () => {
    const choice: Choice = {
      label: 'Take it',
      effects: [{ path: 'stats.happiness', op: '+', value: 5 }],
    };
    const result = resolveChoice(choice, createRng(1));
    expect(result.narrative).toBeNull();
    expect(result.effects).toEqual([{ path: 'stats.happiness', op: '+', value: 5 }]);
  });

  it('returns empty effects for a malformed choice (no effects, no outcomes)', () => {
    const choice = { label: 'Stand around' } as Choice;
    const result = resolveChoice(choice, createRng(1));
    expect(result.narrative).toBeNull();
    expect(result.effects).toEqual([]);
  });

  it('picks an outcome via weighted RNG', () => {
    const choice: Choice = {
      label: 'Roll the dice',
      outcomes: [
        { weight: 1, narrative: 'A', effects: [{ path: 'stats.happiness', op: '+', value: 1 }] },
        { weight: 1, narrative: 'B', effects: [{ path: 'stats.happiness', op: '+', value: 2 }] },
      ],
    };
    const result = resolveChoice(choice, createRng(42));
    // The exact outcome is RNG-dependent, but both narratives are valid.
    expect(['A', 'B']).toContain(result.narrative);
    expect(result.effects.length).toBe(1);
  });

  it('is reproducible with the same seed', () => {
    const choice: Choice = {
      label: 'Roll the dice',
      outcomes: [
        { weight: 50, narrative: 'A', effects: [] },
        { weight: 30, narrative: 'B', effects: [] },
        { weight: 20, narrative: 'C', effects: [] },
      ],
    };
    const a = resolveChoice(choice, createRng(12345));
    const b = resolveChoice(choice, createRng(12345));
    expect(a.narrative).toBe(b.narrative);
  });

  it('respects weight bias over many runs', () => {
    const choice: Choice = {
      label: 'Roll',
      outcomes: [
        { weight: 90, narrative: 'common', effects: [] },
        { weight: 10, narrative: 'rare', effects: [] },
      ],
    };
    let common = 0;
    for (let i = 0; i < 1000; i++) {
      const result = resolveChoice(choice, createRng(i));
      if (result.narrative === 'common') common++;
    }
    // Tolerance of ±50 over 1000 — RNG is deterministic so this is stable.
    expect(common).toBeGreaterThan(850);
    expect(common).toBeLessThan(950);
  });

  it('handles a single-entry outcomes list (validator-rejected at content time, but runtime-safe)', () => {
    const choice: Choice = {
      label: 'Only one path',
      outcomes: [{ weight: 1, narrative: 'inevitable', effects: [] }],
    };
    const result = resolveChoice(choice, createRng(7));
    expect(result.narrative).toBe('inevitable');
  });

  it('falls back to uniform pick when all weights are zero', () => {
    const choice: Choice = {
      label: 'Broken',
      outcomes: [
        { weight: 0, narrative: 'A', effects: [] },
        { weight: 0, narrative: 'B', effects: [] },
      ],
    };
    const result = resolveChoice(choice, createRng(3));
    expect(['A', 'B']).toContain(result.narrative);
  });

  it('inherits choice followUpEventId when the picked outcome does not set its own', () => {
    const choice: Choice = {
      label: 'Chain',
      followUpEventId: 'chained_event',
      outcomes: [
        { weight: 1, narrative: 'A', effects: [] },
        { weight: 1, narrative: 'B', effects: [] },
      ],
    };
    const result = resolveChoice(choice, createRng(1));
    expect(result.followUpEventId).toBe('chained_event');
  });

  it('outcome followUpEventId overrides choice-level followUpEventId', () => {
    const choice: Choice = {
      label: 'Chain',
      followUpEventId: 'choice_chain',
      outcomes: [
        { weight: 1, narrative: 'wins', effects: [], followUpEventId: 'outcome_chain' },
        { weight: 0, narrative: 'never', effects: [] },
      ],
    };
    const result = resolveChoice(choice, createRng(1));
    expect(result.followUpEventId).toBe('outcome_chain');
  });
});
