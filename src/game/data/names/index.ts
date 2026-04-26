/**
 * Country-keyed name pools. Add a new country by writing a new pool file
 * (~200 first names per gender, 200+ surnames) and registering it here.
 *
 * `getCountryPool` returns the full NameSet so the engine can do a single
 * weighted draw across the whole pool. Falls back to GB if the country code
 * is unknown — keeps the engine never-throws contract intact.
 */
import type { CountryCode } from '../../types/country';
import { GB_NAMES } from './gb';
import { NL_NAMES } from './nl';
import type { NameSet } from './types';
import { US_NAMES } from './us';

export type { NameSet } from './types';

/**
 * Strip duplicate entries from each list (preserve first occurrence). The
 * raw pool files are author-curated and decade-bucketed, so the same name
 * occasionally lands in two buckets — `Lev` showed up 3× in NL male,
 * tripling its draw odds. Dedupe keeps the cultural mix intact while
 * giving every distinct name an equal slot in the uniform draw.
 */
function dedupePool(set: NameSet): NameSet {
  return {
    male: [...new Set(set.male)],
    female: [...new Set(set.female)],
    surnames: [...new Set(set.surnames)],
  };
}

const POOLS: Record<CountryCode, NameSet> = {
  NL: dedupePool(NL_NAMES),
  US: dedupePool(US_NAMES),
  GB: dedupePool(GB_NAMES),
};

export function getCountryPool(code: CountryCode): NameSet {
  return POOLS[code] ?? POOLS.GB;
}
