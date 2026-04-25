import type { Country, CountryCode } from '../types/country';

/**
 * The world (so far). Three countries, real data — figures are pulled from
 * 2022/2023 sources and noted per-country. Keep this file the single source
 * of truth: the engine resolves these via getCountry(state.country).
 *
 * Adding a new country: append a record below, ensure ISO-2 `code`, fill
 * stats from authoritative sources (World Bank, OECD, World Happiness
 * Report, UN HDI, Numbeo for indices), then add a name pool to names.ts
 * if `languages[0]` doesn't already map to one.
 *
 * The cost-of-living and housing indices are normalised so 1.0 = the
 * implicit "world average" used as the engine's adjustment baseline. We
 * anchor that baseline at GB so the existing baseline numbers in
 * careers.ts and event payloads keep their original meaning.
 */
export const COUNTRIES: Country[] = [
  // -------------------------------------------------------------------
  // Netherlands
  //   GDP per capita: World Bank 2023 ($65,915)
  //   Avg salary: CBS 2023 (€44,000 → ~$47,500 USD)
  //   Median salary: CBS 2022 (~$40,000)
  //   Min wage: Rijksoverheid 2023 (€1,995/mo, 36h × 52w)
  //   Inflation: CBS 2023 (3.8%)
  //   Unemployment: CBS 2023 (3.6%)
  //   Cost of living vs GB: Numbeo 2023 (NL ~3% lower than UK)
  //   Housing index: Numbeo 2023 (NL ~10% above UK)
  //   Life expectancy: World Bank 2022 (81.7)
  //   Education index: UN HDI 2022 (0.926)
  //   Crime index: Numbeo 2024 (~27, low)
  //   Happiness: World Happiness Report 2024 (6.92)
  //   Gini: World Bank 2021 (0.262)
  //   Drinking age: 18; weed: gedoogd / decriminalised (technically illegal,
  //   tolerated for personal use — modeling as legal)
  // -------------------------------------------------------------------
  {
    code: 'NL',
    name: 'Netherlands',
    nameLocal: 'Nederland',
    continent: 'Europe',
    region: 'Western Europe',
    culturalCluster: 'North-European',
    languages: ['nl'],
    currency: { code: 'EUR', symbol: '€' },
    stats: {
      gdpPerCapita: 65915,
      averageSalary: 47500,
      medianSalary: 40000,
      minimumWage: 24800,
      inflationRate: 3.8,
      unemploymentRate: 3.6,
      costOfLivingIndex: 0.97,
      housingPriceIndex: 1.10,
      lifeExpectancy: 81.7,
      educationIndex: 0.926,
      crimeIndex: 27.0,
      happinessIndex: 6.92,
      giniCoefficient: 0.262,
    },
    rules: {
      drinkingAge: 18,
      smokingAge: 18,
      marriageAge: 18,
      drivingAge: 18,
      schoolStartAge: 5,
      schoolEndAge: 18,
      weedLegal: true,
      sameSexMarriageLegal: true,
      incomeTaxTopRate: 49.5,
    },
  },

  // -------------------------------------------------------------------
  // United States
  //   GDP per capita: World Bank 2023 ($82,769)
  //   Avg salary: BLS 2023 ($65,470 mean wage)
  //   Median salary: BLS 2023 ($48,060 median wage)
  //   Min wage: federal $7.25/hr × 2080 = $15,080 (no state ceiling)
  //   Inflation: BLS 2023 (4.1%)
  //   Unemployment: BLS 2023 (3.7%)
  //   Cost of living vs GB: Numbeo 2023 (US ~7% above UK)
  //   Housing: Numbeo 2023 (US ~5% below UK national average; varies wildly)
  //   Life expectancy: CDC 2022 (77.5)
  //   Education index: UN HDI 2022 (0.900)
  //   Crime index: Numbeo 2024 (~49, moderate)
  //   Happiness: World Happiness Report 2024 (6.73)
  //   Gini: World Bank 2021 (0.398)
  //   Drinking/smoking age: 21 federal
  //   Driving age: 16 (varies by state, 16 is most common)
  //   Same-sex marriage: legal nationwide since Obergefell 2015
  //   Weed: federally illegal, legal in many states — model as illegal at federal level
  // -------------------------------------------------------------------
  {
    code: 'US',
    name: 'United States',
    nameLocal: 'United States',
    continent: 'North America',
    region: 'Northern America',
    culturalCluster: 'Anglo-Saxon',
    languages: ['en'],
    currency: { code: 'USD', symbol: '$' },
    stats: {
      gdpPerCapita: 82769,
      averageSalary: 65470,
      medianSalary: 48060,
      minimumWage: 15080,
      inflationRate: 4.1,
      unemploymentRate: 3.7,
      costOfLivingIndex: 1.07,
      housingPriceIndex: 0.95,
      lifeExpectancy: 77.5,
      educationIndex: 0.900,
      crimeIndex: 49.0,
      happinessIndex: 6.73,
      giniCoefficient: 0.398,
    },
    rules: {
      drinkingAge: 21,
      smokingAge: 21,
      marriageAge: 18,
      drivingAge: 16,
      schoolStartAge: 6,
      schoolEndAge: 18,
      weedLegal: false,
      sameSexMarriageLegal: true,
      incomeTaxTopRate: 37.0,
    },
  },

  // -------------------------------------------------------------------
  // United Kingdom — used as the engine's adjustment baseline (indices = 1.0).
  //   GDP per capita: World Bank 2023 ($49,464)
  //   Avg salary: ONS ASHE 2023 (£35,464 → ~$44,500 USD)
  //   Median salary: ONS 2023 (£28,000 → ~$35,000 USD)
  //   Min wage: National Living Wage 2023 (£10.42/hr × 2080 = £21,673 → ~$27,200)
  //   Inflation: ONS 2023 (7.3% annual avg)
  //   Unemployment: ONS 2023 (4.0%)
  //   Cost of living: baseline (1.0)
  //   Housing: baseline (1.0)
  //   Life expectancy: ONS 2020-2022 (80.7)
  //   Education index: UN HDI 2022 (0.928)
  //   Crime index: Numbeo 2024 (~46, moderate)
  //   Happiness: World Happiness Report 2024 (6.75)
  //   Gini: World Bank 2021 (0.355)
  //   Drinking age: 18 (privately 5+, but 18 to buy)
  //   Driving age: 17 (16 for moped)
  //   Same-sex marriage: legal since 2014 (E&W), 2014 (Scotland), 2020 (NI)
  // -------------------------------------------------------------------
  {
    code: 'GB',
    name: 'United Kingdom',
    nameLocal: 'United Kingdom',
    continent: 'Europe',
    region: 'Northern Europe',
    culturalCluster: 'Anglo-Saxon',
    languages: ['en'],
    currency: { code: 'GBP', symbol: '£' },
    stats: {
      gdpPerCapita: 49464,
      averageSalary: 44500,
      medianSalary: 35000,
      minimumWage: 27200,
      inflationRate: 7.3,
      unemploymentRate: 4.0,
      costOfLivingIndex: 1.00,
      housingPriceIndex: 1.00,
      lifeExpectancy: 80.7,
      educationIndex: 0.928,
      crimeIndex: 46.0,
      happinessIndex: 6.75,
      giniCoefficient: 0.355,
    },
    rules: {
      drinkingAge: 18,
      smokingAge: 18,
      marriageAge: 18,
      drivingAge: 17,
      schoolStartAge: 5,
      schoolEndAge: 18,
      weedLegal: false,
      sameSexMarriageLegal: true,
      incomeTaxTopRate: 45.0,
    },
  },
];

/**
 * Lookup a country by ISO-2 code. Falls back to the first entry rather than
 * throwing — the UI is built on the assumption that getCountry never fails,
 * and a stale save with an unknown code should still load.
 *
 * For new code, prefer the engine helpers in countryEngine.ts.
 */
export function getCountry(code: CountryCode): Country {
  return COUNTRIES.find((c) => c.code === code) ?? (COUNTRIES[0] as Country);
}
