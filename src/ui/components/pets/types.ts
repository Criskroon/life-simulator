// UI-only pet types. The engine has no Pet model yet — this lives in the
// UI layer until `src/game/types/gameState.ts` grows a `Pet` interface and
// `PlayerState.pets`. When that lands, delete this file and import from the
// engine instead.
//
// TODO(engine): replace with import from '../../../../game/types/gameState'
//               once Pet is defined upstream.

export type PetSpecies = 'dog' | 'cat';

export type PetCondition = 'healthy' | 'sick' | 'old' | 'young';

export type PetColor =
  | 'golden'
  | 'chocolate'
  | 'blackcat'
  | 'gingercat';

/** Minimal UI shape — only what the People + Pets surfaces need. */
export interface Pet {
  id: string;
  name: string;
  /** 'dog' | 'cat' — drives PetAvatar illustration. */
  kind: PetSpecies;
  color: PetColor;
  /** Free-text breed for display (e.g. "Golden Retriever"). */
  breed: string;
  age: number;
  /** Calendar year this pet was adopted. */
  adoptedYear: number;
  /** 0..100 — same scale as Person.relationshipLevel. */
  bond: number;
  condition: PetCondition;
  /** Estimated years remaining (display only — pure UI guess for now). */
  estLifeLeft: number;
  /** Display value of last vet visit, e.g. "'95" or "—". */
  lastVet: string;
  /** Vigor stat 0..100, mirror of Person stats but pet-flavored. */
  vigor: number;
  /** Optional flavor quote shown on the profile bond hero. */
  vignette?: string;
  /** Years together · milestone count for the bottom story strip. */
  milestonesRecorded?: number;
}

/** Subset for the in-memoriam row — pets that have passed. */
export interface DeceasedPet {
  id: string;
  name: string;
  kind: PetSpecies;
  color: PetColor;
  breed: string;
  bornYear: number;
  diedYear: number;
  yearsTogether: number;
}
