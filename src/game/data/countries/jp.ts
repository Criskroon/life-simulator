import type { Country } from './schema';

/**
 * Japan — STUB FILE
 * TODO: Fully populate in Sessie 2.2
 */
export const jpCountry: Country = {
  id: 'JP',
  name: 'Japan',
  nameLocal: '日本',
  flag: '🇯🇵',
  continent: 'asia',
  region: 'East Asia',

  language: 'Japanese',
  currency: {
    code: 'JPY',
    symbol: '¥',
    priceMultiplier: 1.05,
    salaryMultiplier: 0.85,
  },

  demographics: {
    lifeExpectancy: { male: 81, female: 87 },
    partnershipAgeAverage: { male: 31, female: 30 },
    marriageAgeAverage: { male: 31, female: 30 },
    firstChildAgeAverage: { male: 33, female: 31 },
    averageChildrenPerFamily: 1.3,
    drivingAge: 18,
    drinkingAge: 20,
    votingAge: 18,
    retirementAge: 65,
    adultAge: 18,
  },

  education: {
    schoolStartAge: 6,
    compulsoryUntilAge: 15,
    universityDuration: { bachelor: 4, master: 2 },
    tuitionAnnual: { public: 535800, private: 950000 },
    gpaScale: 'JP_5',
    stages: [],
  },

  career: {
    minimumWageMonthly: 175000,
    averageWorkWeek: 40,
    paidVacationDays: 10,
    careerCulture: 'seniority',
    prominentIndustries: [],
    jobs: [],
  },

  cities: [],

  housing: {
    rentMedianMonthly: 100000,
    ownershipRate: 0.61,
    typicalMortgageYears: 35,
    propertyTypes: ['apartment', 'detached'],
    medianPropertyPrice: 38000000,
  },

  healthcare: {
    system: 'universal',
    annualCostBaseline: 200000,
    qualityIndex: 90,
    insuranceMandatory: true,
  },

  legal: {
    softDrugsLegal: false,
    sameSexMarriage: false,
    deathPenalty: true,
    militaryService: 'voluntary',
    incomeTaxTopRate: 0.45,
  },

  culture: {
    nameOrder: 'last_first',
    languages: ['Japanese'],
    automotiveBrands: ['Toyota', 'Honda', 'Nissan', 'Mazda', 'Subaru'],
    typicalLifePath:
      'Education focus. Long career at one company. Late marriage.',
  },

  names: {
    firstNamesMale: ['Hiroshi', 'Takeshi', 'Kenji', 'Yuki', 'Daisuke'],
    firstNamesFemale: ['Yuki', 'Sakura', 'Hana', 'Aoi', 'Yui'],
    lastNames: ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe'],
  },
};
