export interface Country {
  id: string;
  name: string;
  currency: string;
  currencySymbol: string;
  /** Multiplier applied to base salary numbers in careers.ts. */
  salaryMultiplier: number;
  /** Pool keys used to draw names from names.ts. */
  namePool: 'english' | 'dutch';
}

export const COUNTRIES: Country[] = [
  {
    id: 'NL',
    name: 'Netherlands',
    currency: 'EUR',
    currencySymbol: '€',
    salaryMultiplier: 0.95,
    namePool: 'dutch',
  },
  {
    id: 'US',
    name: 'United States',
    currency: 'USD',
    currencySymbol: '$',
    salaryMultiplier: 1.15,
    namePool: 'english',
  },
  {
    id: 'UK',
    name: 'United Kingdom',
    currency: 'GBP',
    currencySymbol: '£',
    salaryMultiplier: 1.0,
    namePool: 'english',
  },
];

export function getCountry(id: string): Country {
  return COUNTRIES.find((c) => c.id === id) ?? (COUNTRIES[0] as Country);
}
