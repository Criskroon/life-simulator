import { describe, it, expect } from 'vitest';
import {
  adjustHousePrice,
  adjustPrice,
  adjustSalary,
  getAllCountries,
  getCountriesByCluster,
  getCountriesByContinent,
  getCountry,
  getCurrentCountry,
  getNamePool,
  getSchoolingPeriod,
  isLegalAge,
} from '../../src/game/engine/countryEngine';
import { applyEffect } from '../../src/game/engine/effectsApplier';
import { ageUp } from '../../src/game/engine/gameLoop';
import { createRng } from '../../src/game/engine/rng';
import { renderTemplate } from '../../src/game/engine/templates';
import type { CountryCode } from '../../src/game/types/country';
import type { PlayerState } from '../../src/game/types/gameState';

const baseState = (country: CountryCode = 'GB'): PlayerState => ({
  id: 'test',
  firstName: 'Test',
  lastName: 'User',
  age: 25,
  gender: 'female',
  country,
  alive: true,
  birthYear: 2000,
  currentYear: 2025,
  stats: { health: 80, happiness: 70, smarts: 65, looks: 50 },
  money: 0,
  job: null,
  education: [],
  relationships: [],
  assets: [],
  criminalRecord: [],
  history: [],
  triggeredEventIds: [],
  actionsRemainingThisYear: 3,
});

describe('countryEngine — lookups', () => {
  it('looks up by ISO-2 code', () => {
    expect(getCountry('NL').name).toBe('Netherlands');
    expect(getCountry('US').name).toBe('United States');
    expect(getCountry('GB').name).toBe('United Kingdom');
  });

  it('falls back to first country on unknown code', () => {
    // CountryCode is a strict union now; cast for the runtime fallback test.
    expect(getCountry('XX' as CountryCode).code).toBe('NL');
  });

  it('returns all countries', () => {
    const all = getAllCountries();
    expect(all.map((c) => c.code).sort()).toEqual([
      'BR',
      'GB',
      'JP',
      'NL',
      'US',
      'ZA',
    ]);
  });

  it('filters by continent', () => {
    expect(getCountriesByContinent('Europe').map((c) => c.code).sort()).toEqual(['GB', 'NL']);
    expect(getCountriesByContinent('North America').map((c) => c.code)).toEqual(['US']);
  });

  it('filters by cultural cluster', () => {
    expect(getCountriesByCluster('Anglo-Saxon').map((c) => c.code).sort()).toEqual(['GB', 'US']);
    expect(getCountriesByCluster('North-European').map((c) => c.code)).toEqual(['NL']);
  });

  it('resolves the current country from state', () => {
    expect(getCurrentCountry(baseState('US')).code).toBe('US');
  });
});

describe('countryEngine — adjust functions', () => {
  it('adjusts salary using each country\'s averageSalary ratio (GB baseline)', () => {
    // Real data: NL 47500, US 65470, GB 44500. Ratios derive directly.
    expect(adjustSalary(40000, getCountry('GB'))).toBe(40000);
    expect(adjustSalary(40000, getCountry('NL'))).toBe(Math.round(40000 * (47500 / 44500)));
    expect(adjustSalary(40000, getCountry('US'))).toBe(Math.round(40000 * (65470 / 44500)));
  });

  it('orders salary adjustments US > NL > GB at any baseline', () => {
    const us = adjustSalary(50000, getCountry('US'));
    const nl = adjustSalary(50000, getCountry('NL'));
    const gb = adjustSalary(50000, getCountry('GB'));
    expect(us).toBeGreaterThan(nl);
    expect(nl).toBeGreaterThan(gb);
  });

  it('adjusts price by costOfLivingIndex', () => {
    expect(adjustPrice(1000, getCountry('GB'))).toBe(1000);
    expect(adjustPrice(1000, getCountry('NL'))).toBe(970); // 1000 * 0.97
    expect(adjustPrice(1000, getCountry('US'))).toBe(1070); // 1000 * 1.07
  });

  it('adjusts house price by housingPriceIndex', () => {
    expect(adjustHousePrice(200_000, getCountry('GB'))).toBe(200_000);
    expect(adjustHousePrice(200_000, getCountry('NL'))).toBe(220_000); // × 1.10
    expect(adjustHousePrice(200_000, getCountry('US'))).toBe(190_000); // × 0.95
  });
});

describe('countryEngine — rule helpers', () => {
  it('isLegalAge respects per-country drinking age', () => {
    expect(isLegalAge(getCountry('NL'), 'drink', 17)).toBe(false);
    expect(isLegalAge(getCountry('NL'), 'drink', 18)).toBe(true);
    expect(isLegalAge(getCountry('US'), 'drink', 18)).toBe(false);
    expect(isLegalAge(getCountry('US'), 'drink', 21)).toBe(true);
  });

  it('isLegalAge handles drive/marry/smoke', () => {
    expect(isLegalAge(getCountry('US'), 'drive', 16)).toBe(true);
    expect(isLegalAge(getCountry('GB'), 'drive', 16)).toBe(false);
    expect(isLegalAge(getCountry('GB'), 'drive', 17)).toBe(true);
    expect(isLegalAge(getCountry('US'), 'smoke', 20)).toBe(false);
    expect(isLegalAge(getCountry('NL'), 'marry', 18)).toBe(true);
  });

  it('returns the schooling period', () => {
    // NL: schoolStartAge 4 (basisschool), compulsory until 18.
    // US: schoolStartAge 5, compulsory until 16 (federal).
    expect(getSchoolingPeriod(getCountry('NL'))).toEqual({ start: 4, end: 18 });
    expect(getSchoolingPeriod(getCountry('US'))).toEqual({ start: 5, end: 16 });
  });

  it('maps language to name pool', () => {
    expect(getNamePool(getCountry('NL'))).toBe('dutch');
    expect(getNamePool(getCountry('US'))).toBe('english');
    expect(getNamePool(getCountry('GB'))).toBe('english');
  });
});

describe('templates — {country} renders the country name', () => {
  it('renders Netherlands, not NL', () => {
    const out = renderTemplate('Born in {country}', baseState('NL'));
    expect(out).toBe('Born in Netherlands');
  });

  it('renders United States, not US', () => {
    const out = renderTemplate('Living in {country}', baseState('US'));
    expect(out).toBe('Living in United States');
  });
});

describe('country.* paths in conditions / effects', () => {
  it('resolves country.continent via getAtPath', async () => {
    const { getAtPath } = await import('../../src/game/engine/paths');
    expect(getAtPath(baseState('NL'), 'country.continent')).toBe('Europe');
    expect(getAtPath(baseState('US'), 'country.continent')).toBe('North America');
  });

  it('resolves country.code, country.name, country.culturalCluster', async () => {
    const { getAtPath } = await import('../../src/game/engine/paths');
    expect(getAtPath(baseState('GB'), 'country.code')).toBe('GB');
    expect(getAtPath(baseState('GB'), 'country.name')).toBe('United Kingdom');
    expect(getAtPath(baseState('US'), 'country.culturalCluster')).toBe('Anglo-Saxon');
  });

  it('resolves nested country economics + demographics', async () => {
    const { getAtPath } = await import('../../src/game/engine/paths');
    expect(getAtPath(baseState('NL'), 'country.economics.gdpPerCapita')).toBe(65915);
    expect(getAtPath(baseState('NL'), 'country.demographics.lifeExpectancy.female')).toBe(83);
    expect(getAtPath(baseState('NL'), 'country.legal.drinkingAge')).toBe(18);
  });
});

// ---- Wire-up checks (user requirement C) -------------------------------
//
// These verify adjustSalary is *actually applied* at the three places it
// should fire. Without these the country engine is dead code in a new home.

describe('wire-up: setJob applies adjustSalary at apply-time', () => {
  it('NL setJob multiplies salary by NL/GB averageSalary ratio', () => {
    const nlState = baseState('NL');
    const next = applyEffect(nlState, {
      special: 'setJob',
      payload: {
        title: 'Tester',
        careerId: 'qa',
        level: 0,
        salary: 40000,
        performance: 50,
        yearsAtJob: 0,
      },
    });
    expect(next.job?.salary).toBe(Math.round(40000 * (47500 / 44500)));
  });

  it('US setJob pays more than NL setJob for the same baseline', () => {
    const make = (country: CountryCode) =>
      applyEffect(baseState(country), {
        special: 'setJob',
        payload: {
          title: 'Tester',
          careerId: 'qa',
          level: 0,
          salary: 40000,
          performance: 50,
          yearsAtJob: 0,
        },
      }).job?.salary ?? 0;
    expect(make('US')).toBeGreaterThan(make('NL'));
    expect(make('NL')).toBeGreaterThan(make('GB'));
  });
});

describe('wire-up: applyPassiveEffects pays the country-adjusted salary', () => {
  it('NL job income per year is the country-adjusted salary', () => {
    const nlState = applyEffect(baseState('NL'), {
      special: 'setJob',
      payload: {
        title: 'Tester',
        careerId: 'qa',
        level: 0,
        salary: 40000,
        performance: 50,
        yearsAtJob: 0,
      },
    });
    const moneyBefore = nlState.money;
    const result = ageUp(nlState, [], createRng(1));
    const earned = result.state.money - moneyBefore;
    expect(earned).toBe(nlState.job?.salary);
  });

  it('US job income per year exceeds NL income for the same baseline salary', () => {
    const make = (country: CountryCode) => {
      const withJob = applyEffect(baseState(country), {
        special: 'setJob',
        payload: {
          title: 'Tester',
          careerId: 'qa',
          level: 0,
          salary: 40000,
          performance: 50,
          yearsAtJob: 0,
        },
      });
      const after = ageUp(withJob, [], createRng(1));
      return after.state.money - withJob.money;
    };
    expect(make('US')).toBeGreaterThan(make('NL'));
  });
});

describe('wire-up: promotion effects on job.salary are country-adjusted', () => {
  it('a +12000 baseline raise becomes a country-scaled raise', () => {
    const nlWithJob = applyEffect(baseState('NL'), {
      special: 'setJob',
      payload: {
        title: 'Tester',
        careerId: 'qa',
        level: 0,
        salary: 40000,
        performance: 50,
        yearsAtJob: 0,
      },
    });
    const promoted = applyEffect(nlWithJob, {
      path: 'job.salary',
      op: '+',
      value: 12000,
    });
    const expectedRaise = Math.round(12000 * (47500 / 44500));
    expect(promoted.job?.salary).toBe((nlWithJob.job?.salary ?? 0) + expectedRaise);
  });

  it('a multiplicative raise stays country-neutral', () => {
    const nlWithJob = applyEffect(baseState('NL'), {
      special: 'setJob',
      payload: {
        title: 'Tester',
        careerId: 'qa',
        level: 0,
        salary: 40000,
        performance: 50,
        yearsAtJob: 0,
      },
    });
    const doubled = applyEffect(nlWithJob, {
      path: 'job.salary',
      op: '*',
      value: 2,
    });
    expect(doubled.job?.salary).toBe((nlWithJob.job?.salary ?? 0) * 2);
  });
});

// ---- Save migration -----------------------------------------------------

describe('persistence migration', () => {
  it('rewrites legacy "UK" country code to "GB" on load', async () => {
    const {
      loadGame,
      saveGame,
      setStorageAdapter,
    } = await import('../../src/game/state/persistence');
    const store = new Map<string, string>();
    setStorageAdapter({
      async get(k) {
        return store.get(k) ?? null;
      },
      async set(k, v) {
        store.set(k, v);
      },
      async remove(k) {
        store.delete(k);
      },
    });

    // Manually inject a legacy save with country='UK'. The CountryCode
    // union no longer includes 'UK' (we use 'GB' now), so cast around it.
    const legacy = { ...baseState('GB'), country: 'UK' as CountryCode };
    await saveGame(legacy as PlayerState);

    const loaded = await loadGame();
    expect(loaded?.country).toBe('GB');
  });
});
