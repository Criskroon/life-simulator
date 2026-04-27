/**
 * Mock asset rows used by the Assets screen until engine wiring lands.
 * `player.assets` exists in the engine, but normal play seldom populates
 * it — and the engine has no concept of mortgages, vehicle condition,
 * stock holdings, or sentimental provenance, all of which the Assets
 * mockup leans on. Each section reads from the matching constant below
 * and falls away to a quiet empty state when the array is exhausted.
 *
 * When the asset engine catches up these constants go away and the
 * screen reads from `player.assets` (filtered by type) instead.
 */

export interface PropertyEntry {
  id: string;
  /** Display name — "Apartment", "Townhouse", etc. */
  kind: string;
  /** Neighbourhood or city tag rendered after the name. */
  locale: string;
  currentValue: number;
  yearsOwned: number;
  mortgageRemaining: number;
  /** Original loan principal — used to compute progress. */
  mortgageOriginal: number;
}

export interface VehicleEntry {
  id: string;
  make: string;
  /** Two-digit model year, e.g. "'94". */
  yearTag: string;
  currentValue: number;
  /** 0..100 — drives both copy and the green progress bar. */
  condition: number;
  mileageKm: number;
}

export interface InvestmentEntry {
  id: string;
  kind: 'financial' | 'sentimental';
  title: string;
  /** Sub-line under the title — e.g. "220 shares" or "Grandmother". */
  detail: string;
  /** Provenance line — e.g. "Bought '93 · €18 avg". */
  provenance: string;
  currentValue: number;
}

/**
 * Mock primary checking account by country. Keyed by ISO-2 country code.
 * Falls back to a generic name when the player's country isn't covered,
 * so the row never reads as broken.
 */
export const BANK_BY_COUNTRY: Record<string, { account: string; bank: string }> = {
  NL: { account: 'Checking', bank: 'ING' },
  US: { account: 'Checking', bank: 'Bank of America' },
  GB: { account: 'Current account', bank: 'Lloyds' },
};

/**
 * Mock property neighbourhood by country. Used to flavour the property
 * sub-line — never a real address. Mirrors `CITY_BY_COUNTRY` over in
 * `careerData.ts` but picks a residential pocket rather than a city
 * centre, since the line reads "Apartment · Jordaan", not "· Amsterdam".
 */
export const NEIGHBOURHOOD_BY_COUNTRY: Record<string, string> = {
  NL: 'Jordaan',
  US: 'Brooklyn',
  GB: 'Hackney',
};

export const MOCK_PROPERTIES: ReadonlyArray<PropertyEntry> = [
  {
    id: 'mock-property-apartment',
    kind: 'Apartment',
    locale: 'Jordaan',
    currentValue: 235000,
    yearsOwned: 3,
    mortgageRemaining: 18000,
    mortgageOriginal: 210000,
  },
];

export const MOCK_VEHICLES: ReadonlyArray<VehicleEntry> = [
  {
    id: 'mock-vehicle-golf',
    make: 'Volkswagen Golf',
    yearTag: "'94",
    currentValue: 9000,
    condition: 68,
    mileageKm: 64000,
  },
];

export const MOCK_INVESTMENTS: ReadonlyArray<InvestmentEntry> = [
  {
    id: 'mock-invest-asml',
    kind: 'financial',
    title: 'ASML',
    detail: '220 shares',
    provenance: "Bought '93 · €18 avg",
    currentValue: 42000,
  },
  {
    id: 'mock-invest-ring',
    kind: 'sentimental',
    title: 'Heirloom ring',
    detail: 'Grandmother',
    provenance: "Gifted '90",
    currentValue: 14000,
  },
];

/**
 * Synthesise a 9-year rising series ending at `currentTotal`. The engine
 * doesn't track historical net worth, so the chart needs *some* shape;
 * we want it to read as growth, not stagnation, so each prior year is a
 * smooth fraction of the current total. Returns oldest-first so the
 * caller can render left-to-right without reversing.
 */
export function synthesiseNetWorthHistory(currentTotal: number): number[] {
  const factors = [0.42, 0.48, 0.55, 0.62, 0.7, 0.78, 0.86, 0.93, 1.0];
  return factors.map((f) => Math.round(currentTotal * f));
}
