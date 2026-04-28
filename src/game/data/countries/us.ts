import type { Country } from './schema';

/**
 * United States — STUB FILE
 * TODO: Fully populate in Sessie 2.1
 */
export const usCountry: Country = {
  id: 'US',
  name: 'United States',
  nameLocal: 'United States',
  flag: '🇺🇸',
  continent: 'north_america',
  region: 'North America',

  language: 'English',
  currency: {
    code: 'USD',
    symbol: '$',
    priceMultiplier: 1.1,
    salaryMultiplier: 1.4,
  },

  demographics: {
    lifeExpectancy: { male: 75, female: 80 },
    partnershipAgeAverage: { male: 28, female: 27 },
    marriageAgeAverage: { male: 30, female: 28 },
    firstChildAgeAverage: { male: 31, female: 28 },
    averageChildrenPerFamily: 1.6,
    drivingAge: 16,
    drinkingAge: 21,
    votingAge: 18,
    retirementAge: 65,
    adultAge: 18,
  },

  education: {
    schoolStartAge: 5,
    compulsoryUntilAge: 16,
    universityDuration: { bachelor: 4, master: 2 },
    tuitionAnnual: { public: 10000, private: 40000 },
    gpaScale: 'US_4',
    stages: [],
  },

  career: {
    minimumWageMonthly: 1257,
    averageWorkWeek: 40,
    paidVacationDays: 10,
    careerCulture: 'merit',
    prominentIndustries: [],
    jobs: [],
  },

  cities: [],

  housing: {
    rentMedianMonthly: 1500,
    ownershipRate: 0.65,
    typicalMortgageYears: 30,
    propertyTypes: ['apartment', 'detached', 'townhouse', 'condo'],
    medianPropertyPrice: 420000,
  },

  healthcare: {
    system: 'private',
    annualCostBaseline: 5000,
    qualityIndex: 70,
    insuranceMandatory: false,
  },

  legal: {
    softDrugsLegal: false,
    sameSexMarriage: true,
    deathPenalty: true,
    militaryService: 'voluntary',
    incomeTaxTopRate: 0.37,
  },

  culture: {
    nameOrder: 'first_last',
    languages: ['English', 'Spanish'],
    automotiveBrands: ['Ford', 'Chevrolet', 'Toyota', 'Honda', 'Tesla'],
    typicalLifePath: 'School to college to career. Marriage in late twenties.',
  },

  names: {
    firstNamesMale: ['Liam', 'Noah', 'James', 'Oliver', 'Elijah'],
    firstNamesFemale: ['Olivia', 'Emma', 'Charlotte', 'Amelia', 'Sophia'],
    lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'],
  },
};
