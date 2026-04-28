import type { Country, CountryCode } from './schema';
import { nlCountry } from './nl';
import { usCountry } from './us';
import { jpCountry } from './jp';
import { brCountry } from './br';
import { zaCountry } from './za';

/**
 * NOTE: this directory is the new Country Engine introduced in Sessie 2.0a.
 * The legacy `src/game/data/countries.ts` (file) still exists and resolves
 * for `import '../data/countries'` because TypeScript's bundler resolution
 * prefers the `.ts` file over the directory. New code that wants the rich
 * Country schema should import from `'../data/countries/index'` (or a
 * specific submodule like `./countries/helpers`).
 */

export const COUNTRIES: Record<CountryCode, Country> = {
  NL: nlCountry,
  US: usCountry,
  JP: jpCountry,
  BR: brCountry,
  ZA: zaCountry,
};

export function getCountry(code: CountryCode): Country {
  const country = COUNTRIES[code];
  if (!country) {
    throw new Error(`Unknown country code: ${code}`);
  }
  return country;
}

export function getAllCountries(): Country[] {
  return Object.values(COUNTRIES);
}

export function getCountriesByContinent(
  continent: Country['continent'],
): Country[] {
  return getAllCountries().filter((c) => c.continent === continent);
}

export * from './schema';
export * from './helpers';
