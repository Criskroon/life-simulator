/**
 * Country shape — single source of truth.
 *
 * Combines economic indicators (used by adjustSalary, adjustPrice for event
 * payloads) with gameplay content (education stages, jobs, cities). The
 * player carries only the ISO-2 code on PlayerState; the full Country
 * record is resolved on demand via getCountry().
 *
 * Stats are sourced from real-world data (World Bank, OECD, World Happiness
 * Report, UN HDI, CBS for NL specifically) — see countries.ts for citations.
 */

// =============================================================================
// CORE TYPES
// =============================================================================

/** ISO-2 country codes — single source of truth for the union and runtime checks. */
export const COUNTRY_CODES = ['NL', 'US', 'GB', 'JP', 'BR', 'ZA'] as const;
export type CountryCode = (typeof COUNTRY_CODES)[number];

/**
 * Type guard for narrowing untyped strings (persisted state, URL params,
 * JSON input) to CountryCode without an unchecked cast.
 */
export function isCountryCode(value: string): value is CountryCode {
  return (COUNTRY_CODES as readonly string[]).includes(value);
}

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

/**
 * ISCED 2011 levels — international comparable ladder (UNESCO). 1 = primary,
 * 8 = doctorate. Stored on each stage so a foreign diploma can be compared
 * against a country-local job requirement without re-mapping label strings.
 */
export type ISCEDLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** Sub-track within an ISCED level. Drives diploma-vs-job matching nuance. */
export type ISCEDSubTrack = 'general' | 'vocational' | 'academic';

/**
 * Diploma specialisation — granular subject area used by the future job pool
 * to bias which industries a candidate qualifies for. `general` means the
 * stage carried no specialisation choice (or the player picked the default).
 */
export type SpecializationField =
  | 'general'
  | 'computer_science'
  | 'engineering'
  | 'science'
  | 'social_sciences'
  | 'humanities'
  | 'health'
  | 'medicine'
  | 'economics'
  | 'business'
  | 'law'
  | 'agriculture'
  | 'creative'
  | 'education';

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

  /** International level (ISCED 2011). Set on every stage in v2.2+. */
  iscedLevel: ISCEDLevel;
  /** Sub-track within the ISCED level. Optional for primary; required upper. */
  iscedSubTrack?: ISCEDSubTrack;
  /** True if the player picks a specialisation when entering this stage. */
  hasSpecialization: boolean;
  /** Specialisations on offer when `hasSpecialization` is true. */
  availableSpecializations?: SpecializationField[];
}

/**
 * Job-side education gate. Used by the future career engine to decide
 * whether a candidate's diploma history clears a posting.
 */
export interface EducationRequirement {
  minLevel: ISCEDLevel;
  requiredSubTrack?: ISCEDSubTrack;
  requiredSpecializations?: SpecializationField[];
  minGpa?: number;
  requireLocalDiploma?: boolean;
}

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

export interface CareerSystem {
  minimumWageMonthly: number;
  averageWorkWeek: number;
  paidVacationDays: number;
  careerCulture: CareerCulture;
  prominentIndustries: string[];
  jobs: Job[];
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
  drinkingAge: number;
  smokingAge: number;
  legalMarriageAge: number;
  drivingAge: number;
  votingAge: number;
  softDrugsLegal: boolean;
  sameSexMarriage: boolean;
  deathPenalty: boolean;
  gamblingLegal: boolean;
  militaryService: MilitaryService;
  /** Top marginal income tax rate, fraction (0.495 = 49.5%). */
  incomeTaxTopRate: number;
}

// =============================================================================
// CULTURE
// =============================================================================

export interface Culture {
  nameOrder: NameOrder;
  automotiveBrands: string[];
  typicalLifePath: string;
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
  retirementAge: number;
  adultAge: number;

  // Optional indicators (kept on Demographics for convenience; the
  // economics block carries the headline stats used by adjustSalary etc.)
  educationIndex?: number;
  crimeIndex?: number;
  happinessIndex?: number;
  giniCoefficient?: number;
}

// =============================================================================
// ECONOMICS — drives adjustSalary / adjustPrice / adjustHousePrice
// =============================================================================

export interface Economics {
  gdpPerCapita: number;
  averageSalary: number;
  medianSalary: number;
  inflationRate: number;
  unemploymentRate: number;
  /** 1.0 = world (GB) baseline. NL ~0.97, US ~1.07. */
  costOfLivingIndex: number;
  /** 1.0 = world (GB) baseline. NL ~1.10, US ~0.95. */
  housingPriceIndex: number;
}

// =============================================================================
// CURRENCY
// =============================================================================

export interface Currency {
  /** ISO-4217 code, e.g. "EUR". */
  code: string;
  /** Display symbol, e.g. "€". */
  symbol: string;
  /** Optional convenience multipliers (price / salary localisation). */
  priceMultiplier?: number;
  salaryMultiplier?: number;
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
// OPTIONAL FLAVOR
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
// COUNTRY (top-level interface)
// =============================================================================

export interface Country {
  // Identity
  code: CountryCode;
  name: string;
  nameLocal: string;
  flag: string;
  continent: Continent;
  region: Region;
  culturalCluster: CulturalCluster;

  // Language & currency
  /** Primary language, English display. */
  language: string;
  /** ISO 639-1 codes. First entry drives the name pool. */
  languages: string[];
  currency: Currency;

  // Data systems
  demographics: Demographics;
  economics: Economics;
  education: EducationSystem;
  career: CareerSystem;
  cities: City[];
  housing: Housing;
  healthcare: Healthcare;
  legal: Legal;
  culture: Culture;
  names: NameDatabase;

  // Optional flavor
  cuisineHighlights?: string[];
  sportsCulture?: SportsCulture;
  holidays?: Holiday[];
  climate?: Climate;
}
