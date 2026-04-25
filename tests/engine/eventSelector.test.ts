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

  it('returns 0-3 events under the default count distribution', () => {
    const player = playerAt(20);
    const picks = selectYearEvents(player, events, createRng(7));
    expect(picks.length).toBeGreaterThanOrEqual(0);
    expect(picks.length).toBeLessThanOrEqual(3);
  });

  it('honors an explicit min/max override (uniform pick)', () => {
    const player = playerAt(7); // age 7: e1 + e2 are both eligible
    for (let seed = 0; seed < 20; seed++) {
      const picks = selectYearEvents(player, events, createRng(seed), {
        minPerYear: 2,
        maxPerYear: 2,
      });
      expect(picks.length).toBe(2);
    }
  });

  it('returns empty when no events are eligible', () => {
    const player = playerAt(200);
    const picks = selectYearEvents(player, events, createRng(1));
    expect(picks).toEqual([]);
  });

  it('roughly matches the default count distribution over many trials', () => {
    // Synthetic event pool large enough that "3 wanted" is always satisfiable —
    // otherwise the count histogram skews left from forced truncation.
    const wideEvents: GameEvent[] = Array.from({ length: 12 }, (_, i) => ({
      id: `wide_${i}`,
      category: 'random' as const,
      weight: 1,
      title: `W${i}`,
      description: 'w',
      choices: [{ label: 'ok', effects: [] }],
    }));
    const player = playerAt(20);
    const counts = { 0: 0, 1: 0, 2: 0, 3: 0 } as Record<number, number>;
    const trials = 2000;
    for (let i = 0; i < trials; i++) {
      const picks = selectYearEvents(player, wideEvents, createRng(i));
      counts[picks.length] = (counts[picks.length] ?? 0) + 1;
    }
    // Expected ratios: 30/40/25/5. Loose tolerances so RNG variance doesn't flap.
    expect(counts[0] / trials).toBeGreaterThan(0.22);
    expect(counts[0] / trials).toBeLessThan(0.38);
    expect(counts[1] / trials).toBeGreaterThan(0.32);
    expect(counts[1] / trials).toBeLessThan(0.48);
    expect(counts[2] / trials).toBeGreaterThan(0.18);
    expect(counts[2] / trials).toBeLessThan(0.32);
    expect(counts[3] / trials).toBeGreaterThan(0.01);
    expect(counts[3] / trials).toBeLessThan(0.10);
  });
});
