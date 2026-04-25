/**
 * Legacy name-pool API. The country-keyed pools in `names/` are the source
 * of truth now; this module wraps them so existing callers (newLife.ts)
 * keep their `randomFirstName(pool, gender, rand)` signature.
 *
 * New code should import from `engine/nameGenerator` (which works directly
 * off Country) instead of going through the NamePool string here.
 */
import type { CountryCode } from '../types/country';
import type { Gender } from '../types/gameState';
import { getCountryPool, type NameSet } from './names/index';

/**
 * Legacy pool string. Kept so newLife's NamePool-based code path still
 * compiles; under the hood we now resolve to the country pool. Older
 * "english" requests fall through to GB which is the closest cultural
 * fit for the historical default.
 */
export type NamePool = 'english' | 'dutch' | CountryCode;

function resolvePool(pool: NamePool): NameSet {
  if (pool === 'english') return getCountryPool('GB');
  if (pool === 'dutch') return getCountryPool('NL');
  return getCountryPool(pool);
}

function pickFrom<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)] as T;
}

export function randomFirstName(
  pool: NamePool,
  gender: Gender,
  rand: () => number = Math.random,
): string {
  const set = resolvePool(pool);
  if (gender === 'male') return pickFrom(set.male, rand);
  if (gender === 'female') return pickFrom(set.female, rand);
  // Nonbinary: draw uniformly from both buckets.
  const combined = [...set.male, ...set.female];
  return pickFrom(combined, rand);
}

export function randomSurname(pool: NamePool, rand: () => number = Math.random): string {
  return pickFrom(resolvePool(pool).surnames, rand);
}
