import type { CountryCode } from './country';

export type Gender = 'male' | 'female' | 'nonbinary';

/**
 * Tier-system relationship types. The classic family/friend/partner/spouse
 * trio is preserved for legacy saves and existing event/activity content;
 * `fiance`, `casualEx`, and `significantEx` are added for the slot model.
 */
export type RelationshipType =
  | 'father'
  | 'mother'
  | 'sibling'
  | 'child'
  | 'friend'
  | 'partner'
  | 'fiance'
  | 'spouse'
  | 'casualEx'
  | 'significantEx';

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

/**
 * Flat relationship row — the legacy representation. Kept in sync with
 * `relationshipState` so existing condition checks (`has 'spouse'`,
 * `lacks 'partner'`) and the 56 add/removeRelationship call-sites keep
 * working unchanged. `relationshipState` is the authoritative model going
 * forward; this list is the projection.
 */
export interface Relationship {
  id: string;
  /**
   * The author-supplied id from the source event/activity payload, before
   * addRelationship mints a unique per-instance id. removeRelationship
   * matches on baseId so events can target every record of the same base
   * (e.g. wipe all `rel-date-partner` entries on a breakup).
   */
  baseId?: string;
  type: RelationshipType;
  firstName: string;
  lastName: string;
  age: number;
  alive: boolean;
  relationshipLevel: number;
}

/**
 * Tier-system entities. A `Person` is the shared core; the slot-specific
 * shapes layer extra fields that drive decay or UI presentation.
 */
export interface Person {
  id: string;
  baseId?: string;
  firstName: string;
  lastName: string;
  age: number;
  alive: boolean;
  /** 0..100 — UI shows as Closeness for non-romantic, Bond for romantic. */
  relationshipLevel: number;
  /** Year this person entered their current slot — drives decay math. */
  metYear?: number;
}

export interface FamilyMember extends Person {
  type: 'father' | 'mother' | 'sibling' | 'child';
}

export interface Friend extends Person {
  type: 'friend';
  /** Yearly increment unless an interaction resets it; gates decay. */
  yearsSinceContact: number;
  isBestFriend?: boolean;
}

export interface Partner extends Person {
  type: 'partner';
}

export interface Fiance extends Person {
  type: 'fiance';
}

export interface Spouse extends Person {
  type: 'spouse';
}

export interface CasualEx extends Person {
  type: 'casualEx';
  /** Year at which this row is filtered out of state. */
  decayYear: number;
  formerSlot: 'partner' | 'fiance';
}

export interface SignificantEx extends Person {
  type: 'significantEx';
  /** When the relationship ended — used for UI ordering, never for decay. */
  endYear: number;
  formerSlot: 'fiance' | 'spouse';
}

/**
 * Slotted relationship container. `partner`, `fiance`, and `spouse` are
 * mutually exclusive single slots; the rest are lists. The slot model is
 * what enforces "no two spouses" by construction (E1 fix).
 *
 * `relationshipState` is the authoritative source; `relationships` is a
 * derived flat view kept in sync for legacy content.
 */
export interface RelationshipState {
  partner: Partner | null;
  fiance: Fiance | null;
  spouse: Spouse | null;
  family: FamilyMember[];
  friends: Friend[];
  significantExes: SignificantEx[];
  casualExes: CasualEx[];
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
  /**
   * Legacy flat view of relationships. Kept in sync with `relationshipState`
   * by the relationship engine so existing conditions (`has 'spouse'`) and
   * the 56 add/removeRelationship call-sites continue to work unchanged.
   */
  relationships: Relationship[];
  /**
   * Tier-system slot model — the authoritative source. The flat
   * `relationships` array is regenerated from this on every mutation.
   *
   * Optional in the type so test fixtures and pre-tier saves don't have
   * to fill it in; the engine's `ensureRelationshipState` helper
   * back-fills it from `relationships` whenever a slot operation runs.
   */
  relationshipState?: RelationshipState;
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
