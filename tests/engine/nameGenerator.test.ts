import { describe, expect, it } from 'vitest';
import { getCountry } from '../../src/game/data/countries';
import {
  enrichGeneratedRelationships,
  generateNPCName,
} from '../../src/game/engine/nameGenerator';
import { createRng } from '../../src/game/engine/rng';
import type { PlayerState } from '../../src/game/types/gameState';

const baseState: PlayerState = {
  id: 'test',
  firstName: 'Test',
  lastName: 'Userton',
  age: 25,
  gender: 'female',
  country: 'US',
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

describe('generateNPCName', () => {
  it('returns a non-empty firstName and lastName for each country', () => {
    const rng = createRng(1);
    for (const code of ['NL', 'US', 'GB']) {
      const country = getCountry(code);
      const { firstName, lastName } = generateNPCName(country, 'female', rng);
      expect(firstName.length).toBeGreaterThan(0);
      expect(lastName.length).toBeGreaterThan(0);
    }
  });

  it('produces high diversity over 1000 calls per country', () => {
    for (const code of ['NL', 'US', 'GB']) {
      const country = getCountry(code);
      const rng = createRng(42 + code.charCodeAt(0));
      const fullNames = new Set<string>();
      const firsts = new Set<string>();
      const lasts = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        const gender = i % 2 === 0 ? 'male' : 'female';
        const { firstName, lastName } = generateNPCName(country, gender, rng);
        fullNames.add(`${firstName} ${lastName}`);
        firsts.add(firstName);
        lasts.add(lastName);
      }
      // 100+ unique first names, 100+ unique last names. With pools of ~200
      // each, randomness should easily clear this in 1000 draws.
      expect(firsts.size).toBeGreaterThanOrEqual(100);
      expect(lasts.size).toBeGreaterThanOrEqual(100);
      // 1000 draws across two ~200-sized name spaces × ~250-sized surname
      // space gives plenty of unique combinations — expect well over 800.
      expect(fullNames.size).toBeGreaterThanOrEqual(800);
    }
  });

  it('honours the gender argument (male picks from male pool)', () => {
    const country = getCountry('GB');
    const rng = createRng(7);
    // Sample 50 males and confirm none came from the female-only pool. We
    // can't exhaustively check but we can verify a known female-only name
    // (Olivia) never appears.
    const males = new Set<string>();
    for (let i = 0; i < 50; i++) {
      males.add(generateNPCName(country, 'male', rng).firstName);
    }
    expect(males.has('Olivia')).toBe(false);
  });
});

describe('enrichGeneratedRelationships', () => {
  it('fills firstName + lastName when payload has neither', () => {
    const rng = createRng(123);
    const enriched = enrichGeneratedRelationships(
      [
        {
          special: 'addRelationship',
          payload: {
            id: 'rel-friend',
            type: 'friend',
            age: 30,
            alive: true,
            relationshipLevel: 60,
          },
        },
      ],
      baseState,
      rng,
    );
    const payload = enriched[0]?.payload as { firstName?: string; lastName?: string };
    expect(payload.firstName).toBeTruthy();
    expect(payload.lastName).toBeTruthy();
  });

  it('respects an explicit firstName in the payload (backwards compat)', () => {
    const rng = createRng(123);
    const enriched = enrichGeneratedRelationships(
      [
        {
          special: 'addRelationship',
          payload: {
            id: 'rel-aunt',
            type: 'friend',
            firstName: 'Margaret',
            lastName: 'Tatcher',
            age: 70,
            alive: true,
            relationshipLevel: 60,
          },
        },
      ],
      baseState,
      rng,
    );
    const payload = enriched[0]?.payload as { firstName?: string; lastName?: string };
    expect(payload.firstName).toBe('Margaret');
    expect(payload.lastName).toBe('Tatcher');
  });

  it('uses the player\'s lastName for child relationships', () => {
    const rng = createRng(7);
    const enriched = enrichGeneratedRelationships(
      [
        {
          special: 'addRelationship',
          payload: {
            id: 'rel-child-1',
            type: 'child',
            age: 0,
            alive: true,
            relationshipLevel: 90,
          },
        },
      ],
      baseState,
      rng,
    );
    const payload = enriched[0]?.payload as { lastName?: string };
    expect(payload.lastName).toBe(baseState.lastName);
  });

  it('passes non-relationship effects through unchanged', () => {
    const rng = createRng(1);
    const effects = [
      { path: 'stats.happiness', op: '+' as const, value: 5 },
      { path: 'money', op: '-' as const, value: 100 },
    ];
    const enriched = enrichGeneratedRelationships(effects, baseState, rng);
    expect(enriched).toEqual(effects);
  });
});
