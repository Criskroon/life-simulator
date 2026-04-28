import type { NamePool } from '../data/names';
import { COUNTRIES, getCountry as getCountryFromData } from '../data/countries';
import type {
  City,
  Continent,
  Country,
  CountryCode,
  CulturalCluster,
} from '../types/country';
import type { PlayerState } from '../types/gameState';

/**
 * Country engine — pure helpers for resolving and adjusting against a
 * player's country. No DOM, no async, no global state. The single source of
 * truth for adjustments is the COUNTRIES table; everything here is derived.
 *
 * Indexing convention: GB is the implicit baseline. Its costOfLivingIndex,
 * housingPriceIndex, and averageSalary are anchored such that the existing
 * baseline numbers in careers.ts and event payloads keep their original
 * meaning when applied to a GB player.
 */

const GB_AVERAGE_SALARY = 44500; // From COUNTRIES.GB.economics.averageSalary

// ---------- Lookups -------------------------------------------------------

export function getCountry(code: CountryCode): Country {
  return getCountryFromData(code);
}

export function getAllCountries(): readonly Country[] {
  return COUNTRIES;
}

export function getCountriesByContinent(continent: Continent): Country[] {
  return COUNTRIES.filter((c) => c.continent === continent);
}

export function getCountriesByCluster(cluster: CulturalCluster): Country[] {
  return COUNTRIES.filter((c) => c.culturalCluster === cluster);
}

/** Resolve the Country for the player's current code. */
export function getCurrentCountry(state: PlayerState): Country {
  return getCountry(state.country);
}

// ---------- Adjustment functions -----------------------------------------

/**
 * Convert a baseline-currency salary number into a country-adjusted figure.
 *
 * The baseline is GB's averageSalary; a country with a higher averageSalary
 * pays more for the same role. So a $40k baseline salary becomes:
 *   - GB: $40k × (44500/44500) = $40k
 *   - NL: $40k × (47500/44500) ≈ $42.7k
 *   - US: $40k × (65470/44500) ≈ $58.8k
 *
 * Used at apply-time by setJob and by '+'/'-'/'=' effects on job.salary.
 */
export function adjustSalary(baseSalaryUSD: number, country: Country): number {
  return Math.round(
    baseSalaryUSD * (country.economics.averageSalary / GB_AVERAGE_SALARY),
  );
}

/**
 * Convert a baseline-currency price into a country-adjusted figure using
 * the cost-of-living index (1.0 = GB baseline). A $100 baseline coffee
 * subscription costs $97 in NL, $107 in US, $100 in GB.
 *
 * Used at apply-time by money-affecting effects in events.
 */
export function adjustPrice(basePriceUSD: number, country: Country): number {
  return Math.round(basePriceUSD * country.economics.costOfLivingIndex);
}

/**
 * Convert a baseline house price into a country-adjusted figure using the
 * housing price index. Separate from cost-of-living because housing varies
 * far more dramatically between countries than groceries.
 */
export function adjustHousePrice(
  basePriceUSD: number,
  country: Country,
): number {
  return Math.round(basePriceUSD * country.economics.housingPriceIndex);
}

// ---------- Rule helpers --------------------------------------------------

export type LegalAction = 'drink' | 'smoke' | 'marry' | 'drive';

/** Whether the player is at or above the legal age for an action. */
export function isLegalAge(
  country: Country,
  action: LegalAction,
  age: number,
): boolean {
  const minAge =
    action === 'drink'
      ? country.legal.drinkingAge
      : action === 'smoke'
        ? country.legal.smokingAge
        : action === 'marry'
          ? country.legal.legalMarriageAge
          : country.legal.drivingAge;
  return age >= minAge;
}

export interface SchoolingPeriod {
  start: number;
  end: number;
}

export function getSchoolingPeriod(country: Country): SchoolingPeriod {
  return {
    start: country.education.schoolStartAge,
    end: country.education.compulsoryUntilAge,
  };
}

// ---------- Name pool helper ---------------------------------------------

/**
 * Map a country to a name pool. Today we have two pools (english, dutch);
 * countries whose primary language doesn't map to a pool fall back to
 * english so newLife can always pick a name.
 */
export function getNamePool(country: Country): NamePool {
  if (country.languages[0] === 'nl') return 'dutch';
  return 'english';
}

// ---------- City helpers --------------------------------------------------

export function getCapital(country: Country): City | undefined {
  return country.cities.find((c) => c.isCapital);
}

export function getCity(country: Country, cityId: string): City | undefined {
  return country.cities.find((c) => c.id === cityId);
}

// ---------- Random-name helpers (used by tests + future content) ---------

export function getRandomFirstName(
  country: Country,
  gender: 'male' | 'female',
): string {
  const names =
    gender === 'male'
      ? country.names.firstNamesMale
      : country.names.firstNamesFemale;
  if (names.length === 0) return 'Unknown';
  return names[Math.floor(Math.random() * names.length)] as string;
}

export function getRandomLastName(country: Country): string {
  const names = country.names.lastNames;
  if (names.length === 0) return 'Unknown';
  return names[Math.floor(Math.random() * names.length)] as string;
}

export function getRandomFullName(
  country: Country,
  gender: 'male' | 'female',
): string {
  const first = getRandomFirstName(country, gender);
  const last = getRandomLastName(country);
  if (country.culture.nameOrder === 'last_first') {
    return `${last} ${first}`;
  }
  return `${first} ${last}`;
}

/**
 * Pick an age-appropriate first name. Splits the names list into 5 buckets
 * by birth-decade. Assumes the source list is sorted modern → classic
 * (as in NL's names entry). Falls back to random for short lists.
 */
export function getNameByAge(
  country: Country,
  age: number,
  gender: 'male' | 'female',
): string {
  const names =
    gender === 'male'
      ? country.names.firstNamesMale
      : country.names.firstNamesFemale;

  const total = names.length;
  if (total === 0) return 'Unknown';
  if (total < 5) return names[Math.floor(Math.random() * total)] as string;

  const bucketSize = Math.floor(total / 5);
  let startIdx: number;
  let endIdx: number;

  if (age <= 18) {
    startIdx = 0;
    endIdx = bucketSize;
  } else if (age <= 40) {
    startIdx = bucketSize;
    endIdx = bucketSize * 2;
  } else if (age <= 60) {
    startIdx = bucketSize * 2;
    endIdx = bucketSize * 3;
  } else if (age <= 75) {
    startIdx = bucketSize * 3;
    endIdx = bucketSize * 4;
  } else {
    startIdx = bucketSize * 4;
    endIdx = total;
  }

  const slice = names.slice(startIdx, endIdx);
  if (slice.length === 0) {
    return names[Math.floor(Math.random() * total)] as string;
  }
  return slice[Math.floor(Math.random() * slice.length)] as string;
}

/** Format a money amount with the country's currency symbol. */
export function formatMoney(country: Country, amount: number): string {
  const { symbol } = country.currency;
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${symbol}${formatted}`;
}
