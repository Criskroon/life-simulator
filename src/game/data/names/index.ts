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

const POOLS: Record<CountryCode, NameSet> = {
  NL: NL_NAMES,
  US: US_NAMES,
  GB: GB_NAMES,
};

export function getCountryPool(code: CountryCode): NameSet {
  return POOLS[code] ?? GB_NAMES;
}
