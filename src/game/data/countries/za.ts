import type { Country } from './schema';

/**
 * South Africa — STUB FILE
 * TODO: Fully populate in Sessie 2.4
 */
export const zaCountry: Country = {
  id: 'ZA',
  name: 'South Africa',
  nameLocal: 'South Africa',
  flag: '🇿🇦',
  continent: 'africa',
  region: 'Southern Africa',

  language: 'English',
  currency: {
    code: 'ZAR',
    symbol: 'R',
    priceMultiplier: 0.4,
    salaryMultiplier: 0.3,
  },

  demographics: {
    lifeExpectancy: { male: 62, female: 68 },
    partnershipAgeAverage: { male: 28, female: 26 },
    marriageAgeAverage: { male: 32, female: 29 },
    firstChildAgeAverage: { male: 28, female: 25 },
    averageChildrenPerFamily: 2.3,
    drivingAge: 18,
    drinkingAge: 18,
    votingAge: 18,
    retirementAge: 60,
    adultAge: 18,
  },

  education: {
    schoolStartAge: 6,
    compulsoryUntilAge: 15,
    universityDuration: { bachelor: 3, master: 2 },
    tuitionAnnual: { public: 60000, private: 120000 },
    gpaScale: 'percentage',
    stages: [],
  },

  career: {
    minimumWageMonthly: 4400,
    averageWorkWeek: 45,
    paidVacationDays: 21,
    careerCulture: 'merit',
    prominentIndustries: [],
    jobs: [],
  },

  cities: [],

  housing: {
    rentMedianMonthly: 9000,
    ownershipRate: 0.6,
    typicalMortgageYears: 20,
    propertyTypes: ['apartment', 'detached', 'townhouse'],
    medianPropertyPrice: 1300000,
  },

  healthcare: {
    system: 'mixed',
    annualCostBaseline: 18000,
    qualityIndex: 60,
    insuranceMandatory: false,
  },

  legal: {
    softDrugsLegal: true,
    sameSexMarriage: true,
    deathPenalty: false,
    militaryService: 'voluntary',
    incomeTaxTopRate: 0.45,
  },

  culture: {
    nameOrder: 'first_last',
    languages: ['English', 'Afrikaans', 'Zulu', 'Xhosa'],
    automotiveBrands: ['Toyota', 'Volkswagen', 'Ford', 'BMW', 'Mercedes-Benz'],
    typicalLifePath:
      'Diverse paths. Strong family ties. Higher education increasingly valued.',
  },

  names: {
    firstNamesMale: ['Junior', 'Liam', 'Lethabo', 'Bandile', 'Karabo'],
    firstNamesFemale: ['Amahle', 'Lerato', 'Naledi', 'Zahra', 'Aaliyah'],
    lastNames: ['Nkosi', 'Dlamini', 'Khumalo', 'Mokoena', 'Botha'],
  },
};
