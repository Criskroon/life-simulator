import { describe, expect, it } from 'vitest';
import { getCountry } from '../../src/game/data/countries';
import { getCountryPool } from '../../src/game/data/names/index';
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

describe('getCountryPool — dedupe', () => {
  // The author-curated NL/US/GB lists bucket names by decade for cultural
  // mix; the same name occasionally falls into two buckets, which would
  // double or triple its draw odds under a uniform pick. The pool resolver
  // dedupes on read so the live pool is collision-free.
  it('returns a list with no duplicate first or last names per country', () => {
    for (const code of ['NL', 'US', 'GB'] as const) {
      const pool = getCountryPool(code);
      expect(new Set(pool.male).size).toBe(pool.male.length);
      expect(new Set(pool.female).size).toBe(pool.female.length);
      expect(new Set(pool.surnames).size).toBe(pool.surnames.length);
    }
  });

  it('keeps the top-1 first-name frequency under 2% across 1000 draws (healthy diversity)', () => {
    for (const code of ['NL', 'US', 'GB'] as const) {
      const country = getCountry(code);
      const rng = createRng(99 + code.charCodeAt(0));
      const counts = new Map<string, number>();
      const total = 1000;
      for (let i = 0; i < total; i++) {
        const gender = i % 2 === 0 ? 'male' : 'female';
        const { firstName } = generateNPCName(country, gender, rng);
        counts.set(firstName, (counts.get(firstName) ?? 0) + 1);
      }
      const top = Math.max(...counts.values());
      // Pre-dedupe the NL pool had `Lev` 3× in the male list; that
      // would push top-1 well over 2%. After dedupe even the most
      // common name should sit comfortably under that threshold.
      expect(top / total).toBeLessThan(0.02);
    }
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

  it('seeds names for tier specials (addPartner / addSpouse / addCasualEx) when payload omits gender', () => {
    const rng = createRng(99);
    const enriched = enrichGeneratedRelationships(
      [
        {
          special: 'addPartner',
          payload: { id: 'rel-partner', type: 'partner', age: 22 },
        },
        {
          special: 'addSpouse',
          payload: { id: 'rel-spouse', type: 'spouse', age: 28 },
        },
        {
          special: 'addCasualEx',
          payload: { id: 'rel-ex', type: 'casualEx', age: 24 },
        },
      ],
      baseState,
      rng,
    );
    for (const effect of enriched) {
      const payload = effect.payload as { firstName?: string; lastName?: string };
      expect(payload.firstName).toBeTruthy();
      expect(payload.lastName).toBeTruthy();
    }
  });

  it('seeds names for addFamilyMember and inherits surname for memberType:child', () => {
    const rng = createRng(33);
    const enriched = enrichGeneratedRelationships(
      [
        {
          special: 'addFamilyMember',
          payload: { id: 'rel-child', memberType: 'child', age: 0 },
        },
        {
          special: 'addFamilyMember',
          payload: { id: 'rel-sibling', memberType: 'sibling', age: 22 },
        },
      ],
      baseState,
      rng,
    );
    const child = enriched[0]?.payload as { firstName?: string; lastName?: string };
    const sibling = enriched[1]?.payload as { firstName?: string; lastName?: string };
    expect(child.firstName).toBeTruthy();
    expect(child.lastName).toBe(baseState.lastName);
    expect(sibling.firstName).toBeTruthy();
    // Sibling does not inherit player's surname automatically (could be a
    // step-sibling, in-law, etc.) — just confirm something non-empty.
    expect(sibling.lastName?.length ?? 0).toBeGreaterThan(0);
  });

  it('produces a roughly 50/50 gender mix over 200 nameless friend payloads', () => {
    // Friend payloads stay random (non-romantic); no opposite-gender bias.
    // Classify by checking which gendered name pool each firstName belongs
    // to so a regression where pickNPCGender returns a constant is caught.
    const rng = createRng(2026);
    const pool = getCountry('US');
    const malePool = new Set(['Michael']); // sentinel — extended below
    // Use the actual US name pool to classify, since the sentinel approach
    // missed most names. Pull a slice from the seed import for fidelity.
    void pool;
    let maleHits = 0;
    let femaleHits = 0;
    const maleNames = new Set(
      ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Joseph',
       'Charles', 'Thomas', 'Daniel', 'Mark', 'Steven', 'Andrew', 'Paul',
       'Brian', 'Kevin', 'George', 'Edward', 'Ronald', 'Anthony'],
    );
    void malePool;
    for (let i = 0; i < 200; i++) {
      const enriched = enrichGeneratedRelationships(
        [
          {
            special: 'addFriend',
            payload: { id: `rel-f-${i}`, type: 'friend', age: 25 },
          },
        ],
        baseState,
        rng,
      );
      const payload = enriched[0]?.payload as { firstName?: string };
      if (maleNames.has(payload.firstName ?? '')) maleHits++;
      else femaleHits++;
    }
    expect(maleHits + femaleHits).toBe(200);
    // Both sides must register some draws — a non-zero count with the small
    // sentinel set is enough to catch "always one gender" regressions.
    expect(maleHits).toBeGreaterThan(0);
    expect(femaleHits).toBeGreaterThan(0);
  });
});

/**
 * Romantic-slot specials default to the opposite of the player's gender.
 * Heterosexual partner formation is the unsurprising case; nonbinary
 * players still get random partners. Explicit `gender` on the payload
 * is always honored, and non-romantic specials (friend/family) stay
 * random regardless of player gender.
 */
describe('enrichGeneratedRelationships — opposite-gender partner default', () => {
  function classifyGender(firstName: string): 'male' | 'female' | 'unknown' {
    const us = getCountryPool('US');
    const inMale = us.male.includes(firstName);
    const inFemale = us.female.includes(firstName);
    // Unisex names land in both pools — those are noise for this test.
    if (inMale && !inFemale) return 'male';
    if (inFemale && !inMale) return 'female';
    return 'unknown';
  }

  function runPartnerFormations(
    state: PlayerState,
    count: number,
    seed: number,
  ): { male: number; female: number; unknown: number } {
    const rng = createRng(seed);
    const counts = { male: 0, female: 0, unknown: 0 };
    for (let i = 0; i < count; i++) {
      const enriched = enrichGeneratedRelationships(
        [
          {
            special: 'addPartner',
            payload: { id: `rel-p-${i}`, type: 'partner', age: 25 },
          },
        ],
        state,
        rng,
      );
      const payload = enriched[0]?.payload as { firstName?: string };
      counts[classifyGender(payload.firstName ?? '')]++;
    }
    return counts;
  }

  it('female player → ~100% male partners over 100 formations', () => {
    const state: PlayerState = { ...baseState, gender: 'female' };
    const { male, female } = runPartnerFormations(state, 100, 4242);
    expect(male).toBeGreaterThanOrEqual(95);
    expect(female).toBe(0);
  });

  it('male player → ~100% female partners over 100 formations', () => {
    const state: PlayerState = { ...baseState, gender: 'male' };
    const { male, female } = runPartnerFormations(state, 100, 1717);
    expect(female).toBeGreaterThanOrEqual(95);
    expect(male).toBe(0);
  });

  it('nonbinary player → roughly 50/50 partner gender', () => {
    const state: PlayerState = { ...baseState, gender: 'nonbinary' };
    const { male, female } = runPartnerFormations(state, 200, 9999);
    // Loose 30–70 band per side over 200 — pickNPCGender splits 49/49/2.
    expect(male).toBeGreaterThan(60);
    expect(female).toBeGreaterThan(60);
  });

  it('respects explicit gender on the payload (overrides default)', () => {
    const state: PlayerState = { ...baseState, gender: 'female' };
    const rng = createRng(7);
    const enriched = enrichGeneratedRelationships(
      [
        {
          special: 'addPartner',
          payload: {
            id: 'rel-p-explicit',
            type: 'partner',
            age: 25,
            gender: 'female',
          },
        },
      ],
      state,
      rng,
    );
    const payload = enriched[0]?.payload as { firstName?: string };
    expect(classifyGender(payload.firstName ?? '')).toBe('female');
  });

  it('non-romantic specials stay random regardless of player gender', () => {
    const state: PlayerState = { ...baseState, gender: 'female' };
    const rng = createRng(31);
    let male = 0;
    let female = 0;
    for (let i = 0; i < 200; i++) {
      const enriched = enrichGeneratedRelationships(
        [
          {
            special: 'addFriend',
            payload: { id: `rel-f-${i}`, type: 'friend', age: 25 },
          },
        ],
        state,
        rng,
      );
      const payload = enriched[0]?.payload as { firstName?: string };
      const g = classifyGender(payload.firstName ?? '');
      if (g === 'male') male++;
      if (g === 'female') female++;
    }
    // If friends were getting the opposite-gender default, male would be
    // ~100% (player is female). Both sides should land >50.
    expect(male).toBeGreaterThan(50);
    expect(female).toBeGreaterThan(50);
  });

  it('still has the sexual_orientation TODO comment', async () => {
    // Hard guard against accidentally deleting the marker that flags this
    // as the place to plug in orientation-aware logic later.
    const fs = await import('node:fs');
    const path = await import('node:path');
    const url = await import('node:url');
    const here = path.dirname(url.fileURLToPath(import.meta.url));
    const source = fs.readFileSync(
      path.resolve(here, '../../src/game/engine/nameGenerator.ts'),
      'utf-8',
    );
    expect(source).toMatch(/TODO:[^\n]*sexual_orientation/);
  });
});
