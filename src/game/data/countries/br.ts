import type { Country } from './schema';

/**
 * Brazil — STUB FILE
 * TODO: Fully populate in Sessie 2.3
 */
export const brCountry: Country = {
  id: 'BR',
  name: 'Brazil',
  nameLocal: 'Brasil',
  flag: '🇧🇷',
  continent: 'south_america',
  region: 'South America',

  language: 'Portuguese',
  currency: {
    code: 'BRL',
    symbol: 'R$',
    priceMultiplier: 0.45,
    salaryMultiplier: 0.35,
  },

  demographics: {
    lifeExpectancy: { male: 73, female: 80 },
    partnershipAgeAverage: { male: 26, female: 24 },
    marriageAgeAverage: { male: 30, female: 27 },
    firstChildAgeAverage: { male: 28, female: 26 },
    averageChildrenPerFamily: 1.7,
    drivingAge: 18,
    drinkingAge: 18,
    votingAge: 16,
    retirementAge: 65,
    adultAge: 18,
  },

  education: {
    schoolStartAge: 6,
    compulsoryUntilAge: 17,
    universityDuration: { bachelor: 4, master: 2 },
    tuitionAnnual: { public: 0, private: 25000 },
    gpaScale: 'percentage',
    stages: [],
  },

  career: {
    minimumWageMonthly: 1518,
    averageWorkWeek: 44,
    paidVacationDays: 30,
    careerCulture: 'mixed',
    prominentIndustries: [],
    jobs: [],
  },

  cities: [],

  housing: {
    rentMedianMonthly: 2000,
    ownershipRate: 0.73,
    typicalMortgageYears: 30,
    propertyTypes: ['apartment', 'detached', 'condo'],
    medianPropertyPrice: 350000,
  },

  healthcare: {
    system: 'mixed',
    annualCostBaseline: 4000,
    qualityIndex: 65,
    insuranceMandatory: false,
  },

  legal: {
    softDrugsLegal: false,
    sameSexMarriage: true,
    deathPenalty: false,
    militaryService: 'mandatory_male',
    incomeTaxTopRate: 0.275,
  },

  culture: {
    nameOrder: 'first_last',
    languages: ['Portuguese'],
    automotiveBrands: ['Volkswagen', 'Fiat', 'Chevrolet', 'Toyota', 'Honda'],
    typicalLifePath:
      'Family-centered. Multi-generational households common.',
  },

  names: {
    firstNamesMale: ['Miguel', 'Arthur', 'Heitor', 'Bernardo', 'Davi'],
    firstNamesFemale: ['Helena', 'Alice', 'Laura', 'Maria', 'Sofia'],
    lastNames: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima'],
  },
};
