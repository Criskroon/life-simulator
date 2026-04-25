import type { CountryCode } from './country';

export type Gender = 'male' | 'female' | 'nonbinary';

export type RelationshipType =
  | 'father'
  | 'mother'
  | 'sibling'
  | 'child'
  | 'friend'
  | 'partner'
  | 'spouse';

export interface Stats {
  health: number;
  happiness: number;
  smarts: number;
  looks: number;
}

export interface Job {
  title: string;
  careerId: string;
  level: number;
  salary: number;
  performance: number;
  yearsAtJob: number;
}

export interface Relationship {
  id: string;
  type: RelationshipType;
  firstName: string;
  lastName: string;
  age: number;
  alive: boolean;
  relationshipLevel: number;
}

export type EducationLevel =
  | 'primary'
  | 'middle'
  | 'high_school'
  | 'community_college'
  | 'university'
  | 'graduate';

export interface EducationRecord {
  level: EducationLevel;
  institutionName: string;
  startYear: number;
  endYear: number | null;
  graduated: boolean;
  gpa: number;
}

export type AssetType = 'car' | 'house' | 'jewelry' | 'electronics' | 'misc';

export interface Asset {
  id: string;
  type: AssetType;
  name: string;
  purchaseYear: number;
  purchasePrice: number;
  currentValue: number;
}

export interface CrimeRecord {
  id: string;
  year: number;
  age: number;
  crime: string;
  caught: boolean;
  jailYears: number;
}

export interface HistoryEntry {
  year: number;
  age: number;
  eventId: string;
  description: string;
  choiceLabel?: string;
  /** Set when the resolved choice came from a probabilistic outcome. */
  outcomeNarrative?: string;
}

export interface PlayerState {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: Gender;
  country: CountryCode;
  alive: boolean;
  birthYear: number;
  currentYear: number;

  stats: Stats;

  money: number;
  job: Job | null;
  education: EducationRecord[];
  relationships: Relationship[];
  assets: Asset[];
  criminalRecord: CrimeRecord[];
  history: HistoryEntry[];

  /** Event IDs that have already triggered for this life (for oncePerLife). */
  triggeredEventIds: string[];

  /**
   * Activity-system action budget for the current year. Reset by ageUp() to
   * the value of calculateActionBudget(state). Decrements as the player
   * spends actions on Activities-menu items; unused actions expire at year
   * end (not banked).
   */
  actionsRemainingThisYear: number;

  /** Cause of death, set when alive becomes false. */
  causeOfDeath?: string;
}
