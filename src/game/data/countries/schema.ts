/**
 * Country Engine — Schema
 *
 * All types for country-specific data. Game systems read Country objects via
 * getCountry(code). Country files are pure data; helpers and game systems
 * consume them.
 */

// =============================================================================
// CORE TYPES
// =============================================================================

export type CountryCode = 'NL' | 'US' | 'JP' | 'BR' | 'ZA';

export type Continent =
  | 'europe'
  | 'north_america'
  | 'south_america'
  | 'asia'
  | 'africa'
  | 'oceania';

export type GpaScale =
  | 'NL_10'
  | 'US_4'
  | 'JP_5'
  | 'EU_ECTS'
  | 'UK_class'
  | 'percentage';

export type EducationLevel =
  | 'primary'
  | 'lower_secondary'
  | 'upper_secondary'
  | 'vocational'
  | 'tertiary'
  | 'graduate';

export type JobCategory =
  | 'entry'
  | 'mid'
  | 'senior'
  | 'executive'
  | 'specialist';

export type JobPrevalence = 'common' | 'uncommon' | 'rare';

export type CareerCulture = 'merit' | 'seniority' | 'mixed';

export type HealthcareSystem = 'universal' | 'private' | 'mixed';

export type MilitaryService =
  | 'voluntary'
  | 'mandatory_male'
  | 'mandatory_all'
  | 'optional';

export type HousingType =
  | 'apartment'
  | 'rowhouse'
  | 'detached'
  | 'studio'
  | 'townhouse'
  | 'condo';

export type NameOrder = 'first_last' | 'last_first';

export type HolidaySignificance = 'national' | 'religious' | 'cultural';

// =============================================================================
// EDUCATION
// =============================================================================

export interface EducationStage {
  id: string;
  name: string;
  nameLocal: string;
  abbreviation?: string;
  level: EducationLevel;

  ageStart: number;
  ageEnd: number;
  duration: number;

  isCompulsory: boolean;
  isSelectable: boolean;

  prerequisites: string[];
  nextStages: string[];

  requirements?: {
    minSmarts?: number;
    minAge?: number;
  };

  cost: {
    tuitionAnnual: number;
    isPublic: boolean;
    scholarshipsAvailable: boolean;
  };

  description: string;
}

// =============================================================================
// CAREER
// =============================================================================

export interface Job {
  id: string;
  title: string;
  titleLocal: string;
  industry: string;
  category: JobCategory;

  ageRange: { min: number; max: number };

  salaryRange: {
    min: number;
    max: number;
    median: number;
  };

  workHours: number;
  educationRequired: string[];

  prerequisites?: {
    minSmarts?: number;
    minLooks?: number;
    minAge?: number;
  };

  description: string;
  prevalence: JobPrevalence;
}

// =============================================================================
// CITIES
// =============================================================================

export interface City {
  id: string;
  name: string;
  nameLocal: string;
  region: string;
  isCapital: boolean;
  population: number;
  costMultiplier: number;
  description: string;
  characterTags: string[];
}

// =============================================================================
// HOUSING
// =============================================================================

export interface Housing {
  rentMedianMonthly: number;
  ownershipRate: number;
  typicalMortgageYears: number;
  propertyTypes: HousingType[];
  medianPropertyPrice: number;
}

// =============================================================================
// HEALTHCARE
// =============================================================================

export interface Healthcare {
  system: HealthcareSystem;
  annualCostBaseline: number;
  qualityIndex: number;
  insuranceMandatory: boolean;
}

// =============================================================================
// LEGAL
// =============================================================================

export interface Legal {
  softDrugsLegal: boolean;
  sameSexMarriage: boolean;
  deathPenalty: boolean;
  militaryService: MilitaryService;
  incomeTaxTopRate: number;
}

// =============================================================================
// CULTURE
// =============================================================================

export interface Culture {
  nameOrder: NameOrder;
  languages: string[];
  automotiveBrands: string[];
  typicalLifePath: string;
}

// =============================================================================
// OPTIONAL FLAVOR DATA
// =============================================================================

export interface SportsCulture {
  nationalSports: string[];
  popularSports: string[];
}

export interface Holiday {
  name: string;
  nameLocal: string;
  month: number;
  day: number;
  significance: HolidaySignificance;
  description: string;
}

export interface Climate {
  summerHigh: number;
  winterLow: number;
  description: string;
}

// =============================================================================
// NAMES
// =============================================================================

export interface NameDatabase {
  firstNamesMale: string[];
  firstNamesFemale: string[];
  lastNames: string[];
}

// =============================================================================
// DEMOGRAPHICS
// =============================================================================

export interface Demographics {
  lifeExpectancy: { male: number; female: number };
  partnershipAgeAverage: { male: number; female: number };
  marriageAgeAverage: { male: number; female: number };
  firstChildAgeAverage: { male: number; female: number };
  averageChildrenPerFamily: number;
  drivingAge: number;
  drinkingAge: number;
  votingAge: number;
  retirementAge: number;
  adultAge: number;
}

// =============================================================================
// CURRENCY
// =============================================================================

export interface Currency {
  code: string;
  symbol: string;
  priceMultiplier: number;
  salaryMultiplier: number;
}

// =============================================================================
// EDUCATION SYSTEM (top-level config)
// =============================================================================

export interface EducationSystem {
  schoolStartAge: number;
  compulsoryUntilAge: number;
  universityDuration: {
    bachelor: number;
    master: number;
  };
  tuitionAnnual: {
    public: number;
    private: number;
  };
  gpaScale: GpaScale;
  selectionAt?: number;
  stages: EducationStage[];
}

// =============================================================================
// CAREER SYSTEM (top-level config)
// =============================================================================

export interface CareerSystem {
  minimumWageMonthly: number;
  averageWorkWeek: number;
  paidVacationDays: number;
  careerCulture: CareerCulture;
  prominentIndustries: string[];
  jobs: Job[];
}

// =============================================================================
// COUNTRY (top-level interface)
// =============================================================================

export interface Country {
  id: CountryCode;
  name: string;
  nameLocal: string;
  flag: string;
  continent: Continent;
  region: string;

  language: string;
  currency: Currency;

  demographics: Demographics;

  education: EducationSystem;

  career: CareerSystem;

  cities: City[];

  housing: Housing;

  healthcare: Healthcare;

  legal: Legal;

  culture: Culture;

  names: NameDatabase;

  cuisineHighlights?: string[];
  sportsCulture?: SportsCulture;
  holidays?: Holiday[];
  climate?: Climate;
}
