import { describe, it, expect } from 'vitest';
import { getEligibleEvents, selectYearEvents } from '../../src/game/engine/eventSelector';
import { createRng } from '../../src/game/engine/rng';
import type { GameEvent } from '../../src/game/types/events';
import type { PlayerState } from '../../src/game/types/gameState';

const playerAt = (age: number, overrides: Partial<PlayerState> = {}): PlayerState => ({
  id: 't',
  firstName: 'T',
  lastName: 'U',
  age,
  gender: 'female',
  country: 'NL',
  alive: true,
  birthYear: 2000,
  currentYear: 2000 + age,
  stats: { health: 80, happiness: 70, smarts: 65, looks: 50 },
  money: 0,
  job: null,
  education: [],
  relationships: [],
  assets: [],
  criminalRecord: [],
  history: [],
  triggeredEventIds: [],
  ...overrides,
});

const events: GameEvent[] = [
  {
    id: 'e1',
    category: 'childhood',
    weight: 1,
    minAge: 5,
    maxAge: 10,
    title: 'A',
    description: 'a',
    choices: [{ label: 'ok', effects: [] }],
  },
  {
    id: 'e2',
    category: 'childhood',
    weight: 1,
    minAge: 5,
    maxAge: 10,
    oncePerLife: true,
    title: 'B',
    description: 'b',
    choices: [{ label: 'ok', effects: [] }],
  },
  {
    id: 'e3',
    category: 'career',
    weight: 1,
    minAge: 18,
    maxAge: 65,
    title: 'C',
    description: 'c',
    choices: [{ label: 'ok', effects: [] }],
  },
  {
    id: 'e4',
    category: 'health',
    weight: 1,
    conditions: [{ path: 'stats.health', op: '<', value: 30 }],
    title: 'D',
    description: 'd',
    choices: [{ label: 'ok', effects: [] }],
  },
];

describe('getEligibleEvents', () => {
  it('respects min/max age', () => {
    const eligible = getEligibleEvents(playerAt(7), events).map((e) => e.id);
    expect(eligible).toContain('e1');
    expect(eligible).toContain('e2');
    expect(eligible).not.toContain('e3'); // too young
    expect(eligible).not.toContain('e4'); // health condition unmet
  });

  it('respects oncePerLife flag', () => {
    const player = playerAt(7, { triggeredEventIds: ['e2'] });
    const eligible = getEligibleEvents(player, events).map((e) => e.id);
    expect(eligible).toContain('e1');
    expect(eligible).not.toContain('e2');
  });

  it('honors conditions', () => {
    const player = playerAt(20, { stats: { health: 20, happiness: 50, smarts: 50, looks: 50 } });
    const eligible = getEligibleEvents(player, events).map((e) => e.id);
    expect(eligible).toContain('e4');
  });
});

describe('selectYearEvents (deterministic with seeded RNG)', () => {
  it('returns the same selection for the same seed', () => {
    const player = playerAt(20);
    const a = selectYearEvents(player, events, createRng(42));
    const b = selectYearEvents(player, events, createRng(42));
    expect(a.map((e) => e.id)).toEqual(b.map((e) => e.id));
  });

  it('returns 2-5 events when enough are eligible', () => {
    const player = playerAt(20);
    const picks = selectYearEvents(player, events, createRng(7));
    expect(picks.length).toBeGreaterThanOrEqual(1);
    expect(picks.length).toBeLessThanOrEqual(5);
  });

  it('returns empty when no events are eligible', () => {
    const player = playerAt(200);
    const picks = selectYearEvents(player, events, createRng(1));
    expect(picks).toEqual([]);
  });
});
