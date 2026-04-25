import { describe, it, expect } from 'vitest';
import { ALL_EVENTS } from '../../src/game/data/events';
import {
  validateChoice,
  validateEvent,
  validateEvents,
} from '../../src/game/engine/eventValidator';
import type { Choice, GameEvent } from '../../src/game/types/events';

function makeEvent(choices: Choice[]): GameEvent {
  return {
    id: 'test_event',
    category: 'random',
    weight: 1,
    title: 'Test',
    description: '...',
    choices,
  };
}

describe('validateChoice', () => {
  it('accepts a deterministic choice with effects', () => {
    const issues = validateChoice(
      { label: 'X', effects: [{ path: 'stats.happiness', op: '+', value: 1 }] },
      'evt',
      0,
    );
    expect(issues).toEqual([]);
  });

  it('accepts a probabilistic choice with ≥2 outcomes', () => {
    const issues = validateChoice(
      {
        label: 'X',
        outcomes: [
          { weight: 1, narrative: 'A', effects: [] },
          { weight: 1, narrative: 'B', effects: [] },
        ],
      },
      'evt',
      0,
    );
    expect(issues).toEqual([]);
  });

  it('flags a choice with both effects and outcomes', () => {
    const issues = validateChoice(
      {
        label: 'X',
        effects: [],
        outcomes: [
          { weight: 1, narrative: 'A', effects: [] },
          { weight: 1, narrative: 'B', effects: [] },
        ],
      },
      'evt',
      0,
    );
    expect(issues.some((i) => i.message.includes('both'))).toBe(true);
  });

  it('flags a choice with neither effects nor outcomes', () => {
    const issues = validateChoice({ label: 'X' } as Choice, 'evt', 0);
    expect(issues.some((i) => i.message.includes('neither'))).toBe(true);
  });

  it('flags a single-outcome list', () => {
    const issues = validateChoice(
      {
        label: 'X',
        outcomes: [{ weight: 1, narrative: 'only', effects: [] }],
      },
      'evt',
      0,
    );
    expect(issues.some((i) => i.message.includes('at least 2'))).toBe(true);
  });

  it('flags zero-sum outcome weights', () => {
    const issues = validateChoice(
      {
        label: 'X',
        outcomes: [
          { weight: 0, narrative: 'A', effects: [] },
          { weight: 0, narrative: 'B', effects: [] },
        ],
      },
      'evt',
      0,
    );
    expect(issues.some((i) => i.message.includes('positive'))).toBe(true);
  });

  it('flags an empty outcome narrative', () => {
    const issues = validateChoice(
      {
        label: 'X',
        outcomes: [
          { weight: 1, narrative: '   ', effects: [] },
          { weight: 1, narrative: 'B', effects: [] },
        ],
      },
      'evt',
      0,
    );
    expect(issues.some((i) => i.message.includes('narrative is empty'))).toBe(true);
  });
});

describe('validateEvent', () => {
  it('aggregates issues across choices', () => {
    const event = makeEvent([
      { label: 'good', effects: [] },
      { label: 'bad' } as Choice,
    ]);
    const issues = validateEvent(event);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]?.eventId).toBe('test_event');
  });
});

describe('validateEvents (entire content library)', () => {
  it('all shipped events pass validation', () => {
    const issues = validateEvents(ALL_EVENTS);
    if (issues.length > 0) {
      // Surface a readable failure when content drifts out of spec.
      const formatted = issues
        .map((i) => `  ${i.eventId}#${i.choiceIndex}${i.outcomeIndex !== undefined ? `[${i.outcomeIndex}]` : ''}: ${i.message}`)
        .join('\n');
      throw new Error(`Validation issues found:\n${formatted}`);
    }
    expect(issues).toEqual([]);
  });
});
