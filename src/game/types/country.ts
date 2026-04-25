/**
 * Country shape. The player carries only the ISO-2 code on PlayerState; the
 * full Country record is resolved on demand via getCountry(). Stats are
 * sourced from real-world data (World Bank, OECD, World Happiness Report,
 * UN HDI) — see countries.ts for citations per country.
 */

export type Continent =
  | 'Europe'
  | 'Asia'
  | 'Africa'
  | 'North America'
  | 'South America'
  | 'Oceania';

export type Region =
  | 'Northern Europe'
  | 'Western Europe'
  | 'Southern Europe'
  | 'Eastern Europe'
  | 'Northern Africa'
  | 'Western Africa'
  | 'Eastern Africa'
  | 'Central Africa'
  | 'Southern Africa'
  | 'Western Asia'
  | 'Central Asia'
  | 'Southern Asia'
  | 'South-Eastern Asia'
  | 'Eastern Asia'
  | 'Northern America'
  | 'Caribbean'
  | 'Central America'
  | 'South America'
  | 'Australia and New Zealand'
  | 'Melanesia'
  | 'Micronesia'
  | 'Polynesia';

export type CulturalCluster =
  | 'Anglo-Saxon'
  | 'North-European'
  | 'Latin-European'
  | 'Eastern-European'
  | 'Latin-American'
  | 'East-Asian'
  | 'Southeast-Asian'
  | 'South-Asian'
  | 'Middle-Eastern'
  | 'Sub-Saharan-African'
  | 'Generic';

/** ISO-2 country code, e.g. "NL". Used as PlayerState.country. */
export type CountryCode = string;

export interface CountryStats {
  /** USD per capita, World Bank. */
  gdpPerCapita: number;
  /** USD per year, OECD/national stats. */
  averageSalary: number;
  /** USD per year, OECD median. */
  medianSalary: number;
  /** USD per year. 0 if no national minimum. */
  minimumWage: number;
  /** Annual %, IMF/national. */
  inflationRate: number;
  /** %, ILO. */
  unemploymentRate: number;
  /** 1.0 = world average (Numbeo-style index, USD-normalised). */
  costOfLivingIndex: number;
  /** 1.0 = world average for housing. */
  housingPriceIndex: number;
  /** Years, World Bank. */
  lifeExpectancy: number;
  /** 0..1, UN HDI education component. */
  educationIndex: number;
  /** 0..100, Numbeo crime index. Higher = more crime. */
  crimeIndex: number;
  /** 0..10, World Happiness Report ladder score. */
  happinessIndex: number;
  /** 0..1, World Bank Gini. */
  giniCoefficient: number;
}

export interface CountryRules {
  drinkingAge: number;
  smokingAge: number;
  marriageAge: number;
  drivingAge: number;
  schoolStartAge: number;
  schoolEndAge: number;
  weedLegal: boolean;
  sameSexMarriageLegal: boolean;
  /**
   * Loose "is gambling broadly available?" boolean — covers lottery, casinos,
   * sports betting. A future revision could split this into per-vertical
   * flags with age limits, but for the V1 lottery activity a simple bool
   * is enough.
   */
  gambling: boolean;
  /** Top marginal income tax rate, %. */
  incomeTaxTopRate: number;
}

export interface CountryCurrency {
  /** ISO-4217 code, e.g. "EUR". */
  code: string;
  /** Display symbol, e.g. "€". */
  symbol: string;
}

export interface Country {
  code: CountryCode;
  name: string;
  nameLocal: string;
  continent: Continent;
  region: Region;
  culturalCluster: CulturalCluster;
  /** ISO 639-1 language codes, e.g. ["nl"], ["en"]. First = primary. */
  languages: string[];
  currency: CountryCurrency;
  stats: CountryStats;
  rules: CountryRules;
}
