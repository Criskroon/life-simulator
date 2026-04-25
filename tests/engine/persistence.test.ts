import { beforeEach, describe, expect, it } from 'vitest';
import {
  loadGame,
  saveGame,
  setStorageAdapter,
} from '../../src/game/state/persistence';
import { createMemoryStorageAdapter } from '../../testing/fixtures/memoryStorage';
import type { PlayerState } from '../../src/game/types/gameState';

const SAVE_KEY = 'reallifesim:save:v1';

function makeState(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'test',
    firstName: 'Test',
    lastName: 'User',
    age: 30,
    gender: 'female',
    country: 'GB',
    alive: true,
    birthYear: 1996,
    currentYear: 2026,
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
    ...overrides,
  };
}

describe('persistence migrate()', () => {
  beforeEach(() => {
    setStorageAdapter(createMemoryStorageAdapter());
  });

  it('renames duplicate relationship ids on load so removeRelationship targets one row at a time', async () => {
    const adapter = createMemoryStorageAdapter();
    setStorageAdapter(adapter);
    const state = makeState({
      relationships: [
        {
          id: 'rel-gym-friend',
          type: 'friend',
          firstName: 'Sam',
          lastName: 'Park',
          age: 26,
          alive: true,
          relationshipLevel: 55,
        },
        {
          id: 'rel-gym-friend',
          type: 'friend',
          firstName: 'Sam',
          lastName: 'Park',
          age: 27,
          alive: true,
          relationshipLevel: 55,
        },
        {
          id: 'rel-gym-friend',
          type: 'friend',
          firstName: 'Sam',
          lastName: 'Park',
          age: 28,
          alive: true,
          relationshipLevel: 55,
        },
      ],
    });
    await adapter.set(SAVE_KEY, JSON.stringify(state));

    const loaded = await loadGame();

    expect(loaded).not.toBeNull();
    const ids = loaded!.relationships.map((r) => r.id);
    expect(loaded!.relationships).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
    expect(ids[0]).toBe('rel-gym-friend');
  });

  it('backfills baseId on legacy saves so removeRelationship-by-base still works', async () => {
    const adapter = createMemoryStorageAdapter();
    setStorageAdapter(adapter);
    const state = makeState({
      relationships: [
        // Pre-baseId saves: id has the unique-suffix shape, no baseId field.
        {
          id: 'rel-date-partner-y2050-n3',
          type: 'partner',
          firstName: 'Jordan',
          lastName: 'Reyes',
          age: 28,
          alive: true,
          relationshipLevel: 60,
        },
        // Old fixed-id (parent) — baseId should fall through to the same id.
        {
          id: 'rel-mother',
          type: 'mother',
          firstName: 'Mary',
          lastName: 'X',
          age: 55,
          alive: true,
          relationshipLevel: 80,
        },
        // Post-dedupe shape: id has -migrated-N suffix, no baseId.
        {
          id: 'rel-gym-friend-migrated-1',
          type: 'friend',
          firstName: 'Sam',
          lastName: 'Park',
          age: 26,
          alive: true,
          relationshipLevel: 55,
        },
      ],
    });
    await adapter.set(SAVE_KEY, JSON.stringify(state));

    const loaded = await loadGame();
    expect(loaded).not.toBeNull();
    const baseIds = loaded!.relationships.map((r) => r.baseId);
    expect(baseIds).toEqual(['rel-date-partner', 'rel-mother', 'rel-gym-friend']);
  });

  it('builds a tier-system relationshipState from a flat legacy save', async () => {
    const adapter = createMemoryStorageAdapter();
    setStorageAdapter(adapter);
    const state = makeState({
      // E1 residue: two `rel-spouse` rows on the same save (the bug we fixed).
      // E2 residue: lingering activity partners alongside the spouse.
      relationships: [
        { id: 'rel-spouse', type: 'spouse', firstName: 'Esmee', lastName: 'X', age: 30, alive: true, relationshipLevel: 80 },
        { id: 'rel-spouse-2', type: 'spouse', firstName: 'Kaj', lastName: 'X', age: 31, alive: true, relationshipLevel: 70 },
        { id: 'rel-activity-partner-y2050-n3', type: 'partner', firstName: 'Lev', lastName: 'Y', age: 28, alive: true, relationshipLevel: 60 },
        { id: 'rel-activity-partner-y2051-n4', type: 'partner', firstName: 'Sam', lastName: 'Y', age: 29, alive: true, relationshipLevel: 55 },
        { id: 'rel-mother', type: 'mother', firstName: 'M', lastName: 'X', age: 55, alive: true, relationshipLevel: 80 },
      ],
    });
    await adapter.set(SAVE_KEY, JSON.stringify(state));

    const loaded = await loadGame();
    expect(loaded).not.toBeNull();
    expect(loaded!.relationshipState).toBeDefined();
    const rs = loaded!.relationshipState!;

    // E1: only one spouse seated, the rest into significantExes.
    expect(rs.spouse?.firstName).toBe('Esmee');
    expect(rs.significantExes).toHaveLength(1);
    expect(rs.significantExes[0]?.firstName).toBe('Kaj');

    // E2: only one partner seated, the rest into casualExes.
    expect(rs.partner?.firstName).toBe('Lev');
    expect(rs.casualExes).toHaveLength(1);

    expect(rs.family.map((m) => m.firstName)).toContain('M');
  });

  it('round-trips a clean save without rewriting unique ids', async () => {
    const state = makeState({
      relationships: [
        {
          id: 'rel-mom',
          type: 'mother',
          firstName: 'Mary',
          lastName: 'User',
          age: 55,
          alive: true,
          relationshipLevel: 80,
        },
        {
          id: 'rel-dad',
          type: 'father',
          firstName: 'John',
          lastName: 'User',
          age: 58,
          alive: true,
          relationshipLevel: 75,
        },
      ],
    });
    await saveGame(state);
    const loaded = await loadGame();
    expect(loaded!.relationships.map((r) => r.id)).toEqual(['rel-mom', 'rel-dad']);
  });
});
