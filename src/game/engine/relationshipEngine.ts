/**
 * Tier-system relationship engine. Owns slot semantics (partner/fiance/spouse
 * are mutually exclusive single slots), decay rules, and the legacy view
 * sync. Pure functions only — never mutates input state.
 *
 * The engine maintains two parallel views on PlayerState:
 *   - `relationshipState`: authoritative slot model (partner, fiance, spouse,
 *     family[], friends[], significantExes[], casualExes[]).
 *   - `relationships`: flat array view kept in sync so the existing condition
 *     evaluator (`has 'spouse'`, `lacks 'partner'`) and the 56 legacy call
 *     sites continue to work unchanged.
 *
 * Public API:
 *   - emptyRelationshipState() — fresh container, useful for fixtures.
 *   - addPartner / addFiance / addSpouse — slotted promotions.
 *   - addCasualEx / addSignificantEx — directly into the lists.
 *   - addFamilyMember / addFriend — list adds.
 *   - breakUpPartner / endEngagement / divorceSpouse — slot tear-downs that
 *     route the displaced person into the appropriate ex bucket.
 *   - loseFriend — drop from the friends list.
 *   - syncLegacy — regenerate the flat `relationships` array.
 *   - decayRelationships — yearly tick: filter casual exes past decay year,
 *     bump friends' yearsSinceContact, cap significantExes at 10.
 *   - migrateLegacyRelationships — rebuild a relationshipState from a flat
 *     array, used both by persistence migration and by ensureRelationshipState
 *     for any fresh state coming in without one.
 *   - ensureRelationshipState — defensive accessor used by the effects
 *     applier so legacy fixtures that don't populate relationshipState still
 *     route through the slot logic.
 */

import type {
  CasualEx,
  FamilyMember,
  Fiance,
  Friend,
  Partner,
  Person,
  PlayerState,
  Relationship,
  RelationshipState,
  RelationshipType,
  SignificantEx,
  Spouse,
} from '../types/gameState';

const CASUAL_EX_DECAY_YEARS = 5;
const FRIEND_FADE_YEARS = 8;
const SIGNIFICANT_EX_CAP = 10;

/**
 * State with a guaranteed-populated `relationshipState`. Internal use only —
 * the public APIs all run through `ensureRelationshipState` which returns
 * this shape, letting the slot logic dereference `relationshipState` without
 * littering the file with non-null assertions.
 */
type ResolvedState = PlayerState & { relationshipState: RelationshipState };

export function emptyRelationshipState(): RelationshipState {
  return {
    partner: null,
    fiance: null,
    spouse: null,
    family: [],
    friends: [],
    significantExes: [],
    casualExes: [],
  };
}

/**
 * Defensive accessor: legacy callers (older saves, test fixtures, the
 * pre-tier `addRelationship` shim) may hand us a state without
 * `relationshipState` populated. Build one on the fly from the flat
 * `relationships` array so subsequent slot operations have something to
 * work with.
 */
export function ensureRelationshipState(state: PlayerState): ResolvedState {
  if (state.relationshipState) return state as ResolvedState;
  const rs = migrateLegacyRelationships(state.relationships ?? []);
  return { ...state, relationshipState: rs };
}

/**
 * Flatten the slot model into the legacy array view. Order matters for the
 * UI: active slots first, then family, then friends, then exes.
 */
export function syncLegacyView(rs: RelationshipState): Relationship[] {
  const flat: Relationship[] = [];
  if (rs.partner) flat.push(personToLegacy(rs.partner, 'partner'));
  if (rs.fiance) flat.push(personToLegacy(rs.fiance, 'fiance'));
  if (rs.spouse) flat.push(personToLegacy(rs.spouse, 'spouse'));
  for (const m of rs.family) flat.push(personToLegacy(m, m.type));
  for (const f of rs.friends) flat.push(personToLegacy(f, 'friend'));
  for (const e of rs.significantExes) flat.push(personToLegacy(e, 'significantEx'));
  for (const e of rs.casualExes) flat.push(personToLegacy(e, 'casualEx'));
  return flat;
}

function personToLegacy(p: Person, type: RelationshipType): Relationship {
  return {
    id: p.id,
    baseId: p.baseId,
    type,
    firstName: p.firstName,
    lastName: p.lastName,
    age: p.age,
    alive: p.alive,
    relationshipLevel: p.relationshipLevel,
  };
}

/** Apply a relationshipState change and refresh the flat legacy view. */
export function withRelationshipState(
  state: PlayerState,
  rs: RelationshipState,
): PlayerState {
  return {
    ...state,
    relationshipState: rs,
    relationships: syncLegacyView(rs),
  };
}

/* -----------------------------------------------------------------------
 * Slot operations
 * --------------------------------------------------------------------- */

/**
 * Place someone in the partner slot. If the slot is occupied, the
 * incumbent is demoted to a casual ex — this is the E2 mitigation:
 * find_date now displaces the prior partner instead of stacking, so
 * activity partners can't pile up alongside a spouse.
 *
 * If a spouse is already seated, the would-be partner becomes a casualEx
 * directly (a fling, not a slotted relationship). Without this guard,
 * find_date events on married lives would fill both the partner and
 * spouse slots and the legacy `has 'partner' && has 'spouse'` view
 * would re-emerge — that was the third-of-married-lives zombie case.
 */
export function addPartner(state: PlayerState, p: Person, currentYear: number): PlayerState {
  const guarded = ensureRelationshipState(state);
  const rs = guarded.relationshipState;

  if (rs.spouse) {
    return addCasualEx(guarded, p, currentYear, 'partner');
  }

  const partner: Partner = { ...p, type: 'partner', metYear: p.metYear ?? currentYear };
  const displaced: CasualEx[] = rs.partner
    ? [...rs.casualExes, partnerToCasualEx(rs.partner, currentYear)]
    : rs.casualExes;

  return withRelationshipState(guarded, {
    ...rs,
    partner,
    casualExes: displaced,
  });
}

/**
 * Promote (or seat) a fiance. Pulls from the partner slot when one is
 * present so the proposal narrative reads correctly. If a payload-person
 * differs from the current partner, the partner is demoted to casualEx
 * and the payload-person occupies the slot.
 */
export function addFiance(state: PlayerState, p: Person, currentYear: number): PlayerState {
  const guarded = ensureRelationshipState(state);
  const rs = guarded.relationshipState;

  const samePerson = rs.partner && p.baseId && rs.partner.baseId === p.baseId;
  const promoted: Fiance = samePerson
    ? { ...rs.partner!, type: 'fiance', metYear: rs.partner!.metYear ?? currentYear }
    : { ...p, type: 'fiance', metYear: p.metYear ?? currentYear };

  // If we're seating a different person than the current partner,
  // demote them to casualEx.
  let casualExes = rs.casualExes;
  if (!samePerson && rs.partner) {
    casualExes = [...casualExes, partnerToCasualEx(rs.partner, currentYear)];
  }

  // An existing fiance is replaced — they become a significantEx because
  // a broken engagement is significant.
  let significantExes = rs.significantExes;
  if (rs.fiance && (!p.baseId || rs.fiance.baseId !== p.baseId)) {
    significantExes = capSignificantExes([
      ...significantExes,
      fianceToSignificantEx(rs.fiance, currentYear),
    ]);
  }

  return withRelationshipState(guarded, {
    ...rs,
    partner: null,
    fiance: promoted,
    significantExes,
    casualExes,
  });
}

/**
 * Set the spouse slot. CRITICAL E1 fix: if a spouse already exists, the
 * incumbent is force-divorced (moved to significantExes) before the new
 * spouse is seated. By construction, the spouse slot can never hold two.
 *
 * Sources the slot from the current fiance when their baseId matches; this
 * lets a future engagement-window event chain partner → fiance → spouse
 * cleanly.
 */
export function addSpouse(state: PlayerState, p: Person, currentYear: number): PlayerState {
  const guarded = ensureRelationshipState(state);
  const rs = guarded.relationshipState;

  let significantExes = rs.significantExes;
  if (rs.spouse && (!p.baseId || rs.spouse.baseId !== p.baseId)) {
    significantExes = capSignificantExes([
      ...significantExes,
      spouseToSignificantEx(rs.spouse, currentYear),
    ]);
  }

  // Drop a previous fiance into significantExes if they're not the one
  // being seated as spouse.
  if (rs.fiance && (!p.baseId || rs.fiance.baseId !== p.baseId)) {
    significantExes = capSignificantExes([
      ...significantExes,
      fianceToSignificantEx(rs.fiance, currentYear),
    ]);
  }

  // Demote any lingering partner — they're not the new spouse so they
  // become a casualEx (find_date residue).
  let casualExes = rs.casualExes;
  if (rs.partner && (!p.baseId || rs.partner.baseId !== p.baseId)) {
    casualExes = [...casualExes, partnerToCasualEx(rs.partner, currentYear)];
  }

  const spouse: Spouse = {
    ...p,
    type: 'spouse',
    metYear: p.metYear ?? currentYear,
  };

  return withRelationshipState(guarded, {
    ...rs,
    partner: null,
    fiance: null,
    spouse,
    significantExes,
    casualExes,
  });
}

/** Tear down the partner slot — partner → casualEx. */
export function breakUpPartner(state: PlayerState, currentYear: number): PlayerState {
  const guarded = ensureRelationshipState(state);
  const rs = guarded.relationshipState;
  if (!rs.partner) return guarded;

  return withRelationshipState(guarded, {
    ...rs,
    partner: null,
    casualExes: [...rs.casualExes, partnerToCasualEx(rs.partner, currentYear)],
  });
}

/** Tear down the fiance slot — fiance → significantEx. */
export function endEngagement(state: PlayerState, currentYear: number): PlayerState {
  const guarded = ensureRelationshipState(state);
  const rs = guarded.relationshipState;
  if (!rs.fiance) return guarded;

  return withRelationshipState(guarded, {
    ...rs,
    fiance: null,
    significantExes: capSignificantExes([
      ...rs.significantExes,
      fianceToSignificantEx(rs.fiance, currentYear),
    ]),
  });
}

/** Tear down the spouse slot — spouse → significantEx. */
export function divorceSpouse(state: PlayerState, currentYear: number): PlayerState {
  const guarded = ensureRelationshipState(state);
  const rs = guarded.relationshipState;
  if (!rs.spouse) return guarded;

  return withRelationshipState(guarded, {
    ...rs,
    spouse: null,
    significantExes: capSignificantExes([
      ...rs.significantExes,
      spouseToSignificantEx(rs.spouse, currentYear),
    ]),
  });
}

/* -----------------------------------------------------------------------
 * List operations
 * --------------------------------------------------------------------- */

export function addFamilyMember(
  state: PlayerState,
  member: FamilyMember,
): PlayerState {
  const guarded = ensureRelationshipState(state);
  const rs = guarded.relationshipState;
  return withRelationshipState(guarded, {
    ...rs,
    family: [...rs.family, member],
  });
}

export function addFriend(
  state: PlayerState,
  friend: Friend,
  currentYear: number,
): PlayerState {
  const guarded = ensureRelationshipState(state);
  const rs = guarded.relationshipState;
  const next: Friend = {
    ...friend,
    yearsSinceContact: friend.yearsSinceContact ?? 0,
    metYear: friend.metYear ?? currentYear,
  };
  return withRelationshipState(guarded, {
    ...rs,
    friends: [...rs.friends, next],
  });
}

export function loseFriend(state: PlayerState, baseOrId: string): PlayerState {
  const guarded = ensureRelationshipState(state);
  const rs = guarded.relationshipState;
  return withRelationshipState(guarded, {
    ...rs,
    friends: rs.friends.filter(
      (f) => f.id !== baseOrId && f.baseId !== baseOrId,
    ),
  });
}

/**
 * Reset the friend-fade counter so the friend doesn't drop out of the
 * fade window. Called by activities like `call_friend` and `family_time`.
 * If `baseOrId` is provided, only that friend is reset; otherwise all
 * friends are. (A generic "call a friend" activity doesn't target one
 * specific friend in current content — the player is keeping in touch
 * in general — so resetting all is the sensible default.)
 */
export function resetFriendContact(
  state: PlayerState,
  baseOrId?: string,
): PlayerState {
  const guarded = ensureRelationshipState(state);
  const rs = guarded.relationshipState;
  if (rs.friends.length === 0) return guarded;
  const matches = (f: Friend) =>
    !baseOrId || f.id === baseOrId || f.baseId === baseOrId;
  return withRelationshipState(guarded, {
    ...rs,
    friends: rs.friends.map((f) =>
      matches(f) ? { ...f, yearsSinceContact: 0 } : f,
    ),
  });
}

export function addCasualEx(
  state: PlayerState,
  person: Person,
  currentYear: number,
  formerSlot: 'partner' | 'fiance' = 'partner',
): PlayerState {
  const guarded = ensureRelationshipState(state);
  const rs = guarded.relationshipState;
  const ex: CasualEx = {
    ...person,
    type: 'casualEx',
    decayYear: currentYear + CASUAL_EX_DECAY_YEARS,
    formerSlot,
  };
  return withRelationshipState(guarded, {
    ...rs,
    casualExes: [...rs.casualExes, ex],
  });
}

export function addSignificantEx(
  state: PlayerState,
  person: Person,
  currentYear: number,
  formerSlot: 'fiance' | 'spouse' = 'spouse',
): PlayerState {
  const guarded = ensureRelationshipState(state);
  const rs = guarded.relationshipState;
  const ex: SignificantEx = {
    ...person,
    type: 'significantEx',
    endYear: currentYear,
    formerSlot,
  };
  return withRelationshipState(guarded, {
    ...rs,
    significantExes: capSignificantExes([...rs.significantExes, ex]),
  });
}

/* -----------------------------------------------------------------------
 * Removal — used by the legacy removeRelationship shim and by special
 * cleanup paths (parent dies). Operates by id or baseId.
 * --------------------------------------------------------------------- */

export function removePersonByBase(
  state: PlayerState,
  baseOrId: string,
): PlayerState {
  const guarded = ensureRelationshipState(state);
  const rs = guarded.relationshipState;
  const matches = (p: Person) => p.id === baseOrId || p.baseId === baseOrId;

  const next: RelationshipState = {
    partner: rs.partner && matches(rs.partner) ? null : rs.partner,
    fiance: rs.fiance && matches(rs.fiance) ? null : rs.fiance,
    spouse: rs.spouse && matches(rs.spouse) ? null : rs.spouse,
    family: rs.family.filter((f) => !matches(f)),
    friends: rs.friends.filter((f) => !matches(f)),
    significantExes: rs.significantExes.filter((e) => !matches(e)),
    casualExes: rs.casualExes.filter((e) => !matches(e)),
  };
  return withRelationshipState(guarded, next);
}

/* -----------------------------------------------------------------------
 * Decay
 * --------------------------------------------------------------------- */

/**
 * Yearly relationship tick. Pure: returns a new state.
 *   - casual exes whose decayYear has passed are filtered out
 *   - friends' yearsSinceContact bumps; those past FRIEND_FADE_YEARS are dropped
 *   - significantExes are capped at SIGNIFICANT_EX_CAP (oldest dropped)
 *   - everyone alive ages by 1 (relationship age was previously handled
 *     externally; consolidating here so the slot logic stays cohesive)
 */
export function decayRelationships(state: PlayerState): PlayerState {
  const guarded = ensureRelationshipState(state);
  const rs = guarded.relationshipState;
  const year = state.currentYear;

  const ageOne = <T extends Person>(p: T): T =>
    p.alive ? { ...p, age: p.age + 1 } : p;

  const partner = rs.partner ? ageOne(rs.partner) : null;
  const fiance = rs.fiance ? ageOne(rs.fiance) : null;
  const spouse = rs.spouse ? ageOne(rs.spouse) : null;
  const family = rs.family.map(ageOne);

  const friends = rs.friends
    .map((f) => ({
      ...ageOne(f),
      yearsSinceContact: f.yearsSinceContact + 1,
      relationshipLevel: Math.max(0, f.relationshipLevel - 1),
    }))
    .filter((f) => f.yearsSinceContact <= FRIEND_FADE_YEARS);

  const significantExes = capSignificantExes(rs.significantExes.map(ageOne));
  const casualExes = rs.casualExes
    .map(ageOne)
    .filter((e) => e.decayYear >= year);

  return withRelationshipState(guarded, {
    partner,
    fiance,
    spouse,
    family,
    friends,
    significantExes,
    casualExes,
  });
}

/* -----------------------------------------------------------------------
 * Migration
 * --------------------------------------------------------------------- */

/**
 * Build a fresh RelationshipState from a flat legacy array. Used by the
 * persistence migration step and as a safety net for any state that
 * shows up without `relationshipState` populated.
 *
 * Strategy:
 *   - first spouse → spouse slot, additional spouses → significantExes
 *   - first partner → partner slot, additional partners → casualExes
 *   - first fiance → fiance slot, additional fiances → significantExes
 *   - family/friends/casualEx/significantEx flow into their lists
 */
export function migrateLegacyRelationships(
  legacy: Relationship[],
): RelationshipState {
  const rs = emptyRelationshipState();
  let mutable = rs;

  const toPerson = (r: Relationship): Person => ({
    id: r.id,
    baseId: r.baseId,
    firstName: r.firstName,
    lastName: r.lastName,
    age: r.age,
    alive: r.alive,
    relationshipLevel: r.relationshipLevel,
  });

  for (const r of legacy) {
    switch (r.type) {
      case 'spouse':
        if (!mutable.spouse) {
          mutable = { ...mutable, spouse: { ...toPerson(r), type: 'spouse' } };
        } else {
          mutable = {
            ...mutable,
            significantExes: capSignificantExes([
              ...mutable.significantExes,
              {
                ...toPerson(r),
                type: 'significantEx',
                formerSlot: 'spouse',
                endYear: 0,
              },
            ]),
          };
        }
        break;
      case 'fiance':
        if (!mutable.fiance) {
          mutable = { ...mutable, fiance: { ...toPerson(r), type: 'fiance' } };
        } else {
          mutable = {
            ...mutable,
            significantExes: capSignificantExes([
              ...mutable.significantExes,
              {
                ...toPerson(r),
                type: 'significantEx',
                formerSlot: 'fiance',
                endYear: 0,
              },
            ]),
          };
        }
        break;
      case 'partner':
        if (!mutable.partner) {
          mutable = { ...mutable, partner: { ...toPerson(r), type: 'partner' } };
        } else {
          mutable = {
            ...mutable,
            casualExes: [
              ...mutable.casualExes,
              {
                ...toPerson(r),
                type: 'casualEx',
                formerSlot: 'partner',
                decayYear: 0,
              },
            ],
          };
        }
        break;
      case 'father':
      case 'mother':
      case 'sibling':
      case 'child':
        mutable = {
          ...mutable,
          family: [
            ...mutable.family,
            { ...toPerson(r), type: r.type } as FamilyMember,
          ],
        };
        break;
      case 'friend':
        mutable = {
          ...mutable,
          friends: [
            ...mutable.friends,
            { ...toPerson(r), type: 'friend', yearsSinceContact: 0 },
          ],
        };
        break;
      case 'casualEx':
        mutable = {
          ...mutable,
          casualExes: [
            ...mutable.casualExes,
            {
              ...toPerson(r),
              type: 'casualEx',
              formerSlot: 'partner',
              decayYear: 0,
            },
          ],
        };
        break;
      case 'significantEx':
        mutable = {
          ...mutable,
          significantExes: capSignificantExes([
            ...mutable.significantExes,
            {
              ...toPerson(r),
              type: 'significantEx',
              formerSlot: 'spouse',
              endYear: 0,
            },
          ]),
        };
        break;
    }
  }
  return mutable;
}

/* -----------------------------------------------------------------------
 * Internal helpers
 * --------------------------------------------------------------------- */

function partnerToCasualEx(p: Partner, currentYear: number): CasualEx {
  return {
    ...p,
    type: 'casualEx',
    formerSlot: 'partner',
    decayYear: currentYear + CASUAL_EX_DECAY_YEARS,
  };
}

function fianceToSignificantEx(p: Fiance, currentYear: number): SignificantEx {
  return {
    ...p,
    type: 'significantEx',
    formerSlot: 'fiance',
    endYear: currentYear,
  };
}

function spouseToSignificantEx(p: Spouse, currentYear: number): SignificantEx {
  return {
    ...p,
    type: 'significantEx',
    formerSlot: 'spouse',
    endYear: currentYear,
  };
}

function capSignificantExes(list: SignificantEx[]): SignificantEx[] {
  if (list.length <= SIGNIFICANT_EX_CAP) return list;
  // Drop the oldest by endYear (then by age as tiebreaker — older entries
  // tend to have higher age, but this is just a deterministic fallback).
  const sorted = [...list].sort((a, b) => b.endYear - a.endYear || b.age - a.age);
  return sorted.slice(0, SIGNIFICANT_EX_CAP);
}
