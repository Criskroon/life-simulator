import { describe, it, expect } from 'vitest';
import { applyEffect } from '../../src/game/engine/effectsApplier';
import {
  addCasualEx,
  addFamilyMember,
  addFiance,
  addFriend,
  addPartner,
  addSpouse,
  breakUpPartner,
  decayRelationships,
  divorceSpouse,
  emptyRelationshipState,
  endEngagement,
  ensureRelationshipState,
  loseFriend,
  migrateLegacyRelationships,
  removePersonByBase,
  syncLegacyView,
  withRelationshipState,
} from '../../src/game/engine/relationshipEngine';
import type {
  FamilyMember,
  Friend,
  Person,
  PlayerState,
  Relationship,
} from '../../src/game/types/gameState';

function makeState(overrides: Partial<PlayerState> = {}): PlayerState {
  const rs = emptyRelationshipState();
  return {
    id: 'p',
    firstName: 'Test',
    lastName: 'User',
    age: 30,
    gender: 'female',
    country: 'GB',
    alive: true,
    birthYear: 1996,
    currentYear: 2026,
    stats: { health: 80, happiness: 70, smarts: 65, looks: 50 },
    money: 5000,
    job: null,
    education: [],
    relationships: syncLegacyView(rs),
    relationshipState: rs,
    assets: [],
    criminalRecord: [],
    history: [],
    triggeredEventIds: [],
    actionsRemainingThisYear: 3,
    ...overrides,
  };
}

function person(id: string, firstName = 'A', lastName = 'B'): Person {
  return {
    id,
    baseId: id,
    firstName,
    lastName,
    age: 28,
    alive: true,
    relationshipLevel: 60,
  };
}

describe('relationshipEngine — slot logic', () => {
  it('seats a partner in the empty slot', () => {
    const state = makeState();
    const next = addPartner(state, person('p1', 'Sara'), 2026);
    expect(next.relationshipState!.partner?.firstName).toBe('Sara');
    expect(next.relationshipState!.casualExes).toHaveLength(0);
  });

  it('displaces an existing partner to casualEx when a new one arrives', () => {
    let state = makeState();
    state = addPartner(state, person('p1', 'Sara'), 2026);
    state = addPartner(state, person('p2', 'Lev'), 2027);
    expect(state.relationshipState!.partner?.firstName).toBe('Lev');
    expect(state.relationshipState!.casualExes).toHaveLength(1);
    expect(state.relationshipState!.casualExes[0]?.firstName).toBe('Sara');
    expect(state.relationshipState!.casualExes[0]?.formerSlot).toBe('partner');
  });

  it('promotes the current partner to fiance when addFiance has a matching baseId', () => {
    let state = makeState();
    state = addPartner(state, person('rel-x', 'Sara'), 2026);
    state = addFiance(state, person('rel-x', 'Sara'), 2027);
    expect(state.relationshipState!.partner).toBeNull();
    expect(state.relationshipState!.fiance?.firstName).toBe('Sara');
  });

  it('promotes partner → spouse, clearing both partner and fiance slots', () => {
    let state = makeState();
    state = addPartner(state, person('rel-x', 'Sara'), 2026);
    state = addSpouse(state, person('rel-x', 'Sara'), 2030);
    expect(state.relationshipState!.partner).toBeNull();
    expect(state.relationshipState!.fiance).toBeNull();
    expect(state.relationshipState!.spouse?.firstName).toBe('Sara');
  });

  it('E1 fix: addSpouse with an existing spouse force-divorces — never two spouses', () => {
    let state = makeState();
    state = addSpouse(state, person('s1', 'Esmee'), 2030);
    state = addSpouse(state, person('s2', 'Kaj'), 2040);
    expect(state.relationshipState!.spouse?.firstName).toBe('Kaj');
    expect(state.relationshipState!.significantExes).toHaveLength(1);
    expect(state.relationshipState!.significantExes[0]?.firstName).toBe('Esmee');
    expect(state.relationshipState!.significantExes[0]?.formerSlot).toBe('spouse');
    // Slot guarantee: legacy view never reports more than one spouse.
    const spouses = state.relationships.filter((r) => r.type === 'spouse');
    expect(spouses).toHaveLength(1);
  });

  it('legacy addRelationship with type=spouse routes through addSpouse — multi-spouse impossible', () => {
    let state = makeState();
    const payload = (id: string, firstName: string) => ({
      id,
      type: 'spouse' as const,
      firstName,
      lastName: 'X',
      age: 28,
      alive: true,
      relationshipLevel: 80,
    });
    state = applyEffect(state, { special: 'addRelationship', payload: payload('s1', 'Esmee') });
    state = applyEffect(state, { special: 'addRelationship', payload: payload('s2', 'Kaj') });
    const spouses = state.relationships.filter((r) => r.type === 'spouse');
    expect(spouses).toHaveLength(1);
  });

  it('E2 fix: addPartner on a married player routes to casualEx — no zombie partner alongside spouse', () => {
    let state = makeState();
    state = addSpouse(state, person('s', 'Esmee'), 2030);
    state = addPartner(state, person('fling', 'Lev'), 2031);
    expect(state.relationshipState!.partner).toBeNull();
    expect(state.relationshipState!.spouse?.firstName).toBe('Esmee');
    expect(state.relationshipState!.casualExes).toHaveLength(1);
    expect(state.relationshipState!.casualExes[0]?.firstName).toBe('Lev');
    // Legacy view: has 'spouse' true, has 'partner' false (no zombie).
    const types = state.relationships.map((r) => r.type);
    expect(types).toContain('spouse');
    expect(types).not.toContain('partner');
  });

  it('breakUpPartner moves the partner into casualExes', () => {
    let state = makeState();
    state = addPartner(state, person('p1', 'Sara'), 2026);
    state = breakUpPartner(state, 2027);
    expect(state.relationshipState!.partner).toBeNull();
    expect(state.relationshipState!.casualExes).toHaveLength(1);
  });

  it('endEngagement moves the fiance into significantExes', () => {
    let state = makeState();
    state = addFiance(state, person('p1', 'Sara'), 2026);
    state = endEngagement(state, 2027);
    expect(state.relationshipState!.fiance).toBeNull();
    expect(state.relationshipState!.significantExes).toHaveLength(1);
    expect(state.relationshipState!.significantExes[0]?.formerSlot).toBe('fiance');
  });

  it('divorceSpouse moves the spouse into significantExes', () => {
    let state = makeState();
    state = addSpouse(state, person('s', 'Sara'), 2030);
    state = divorceSpouse(state, 2040);
    expect(state.relationshipState!.spouse).toBeNull();
    expect(state.relationshipState!.significantExes).toHaveLength(1);
    expect(state.relationshipState!.significantExes[0]?.formerSlot).toBe('spouse');
  });

  it('re-marriage works after divorce: old spouse → ex, new partner → spouse', () => {
    let state = makeState();
    // First marriage
    state = addSpouse(state, person('s1', 'Esmee'), 2030);
    expect(state.relationshipState!.spouse?.firstName).toBe('Esmee');
    // Divorce
    state = divorceSpouse(state, 2040);
    expect(state.relationshipState!.spouse).toBeNull();
    // Find a new partner, then re-marry
    state = addPartner(state, person('rel-new-partner', 'Lev'), 2042);
    expect(state.relationshipState!.partner?.firstName).toBe('Lev');
    state = addSpouse(state, person('rel-new-partner', 'Lev'), 2045);
    // New marriage holds; partner slot cleared by promotion
    expect(state.relationshipState!.spouse?.firstName).toBe('Lev');
    expect(state.relationshipState!.partner).toBeNull();
    // Ex from first marriage is still in the significantExes list
    expect(state.relationshipState!.significantExes).toHaveLength(1);
    expect(state.relationshipState!.significantExes[0]?.firstName).toBe('Esmee');
    // Legacy view never reports more than one spouse
    const spouses = state.relationships.filter((r) => r.type === 'spouse');
    expect(spouses).toHaveLength(1);
    expect(spouses[0]?.firstName).toBe('Lev');
  });
});

describe('relationshipEngine — list ops', () => {
  it('adds family members to the family list', () => {
    const state = makeState();
    const member: FamilyMember = {
      ...person('rel-aunt', 'Aunt'),
      type: 'sibling',
    };
    const next = addFamilyMember(state, member);
    expect(next.relationshipState!.family).toHaveLength(1);
  });

  it('adds friends with default yearsSinceContact = 0', () => {
    const state = makeState();
    const f: Friend = {
      ...person('rel-friend', 'Sam'),
      type: 'friend',
      yearsSinceContact: 0,
    };
    const next = addFriend(state, f, 2026);
    expect(next.relationshipState!.friends).toHaveLength(1);
    expect(next.relationshipState!.friends[0]?.yearsSinceContact).toBe(0);
  });

  it('loseFriend drops a friend by baseId', () => {
    let state = makeState();
    state = addFriend(state, { ...person('rel-friend'), type: 'friend', yearsSinceContact: 0 }, 2026);
    expect(state.relationshipState!.friends).toHaveLength(1);
    state = loseFriend(state, 'rel-friend');
    expect(state.relationshipState!.friends).toHaveLength(0);
  });

  it('removePersonByBase removes from any slot or list', () => {
    let state = makeState();
    state = addPartner(state, person('rel-p'), 2026);
    state = addFriend(state, { ...person('rel-f'), type: 'friend', yearsSinceContact: 0 }, 2026);
    state = removePersonByBase(state, 'rel-p');
    expect(state.relationshipState!.partner).toBeNull();
    state = removePersonByBase(state, 'rel-f');
    expect(state.relationshipState!.friends).toHaveLength(0);
  });
});

describe('relationshipEngine — auto-decay', () => {
  it('drops casualExes whose decayYear has passed', () => {
    let state = makeState({ currentYear: 2030 });
    state = addCasualEx(state, person('ex1'), 2024); // decayYear 2029
    state = addCasualEx(state, person('ex2'), 2028); // decayYear 2033
    state = decayRelationships(state);
    const remaining = state.relationshipState!.casualExes;
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.baseId).toBe('ex2');
  });

  it('bumps friends.yearsSinceContact and drops them past the fade window', () => {
    let state = makeState();
    state = addFriend(
      state,
      { ...person('f1'), type: 'friend', yearsSinceContact: 0 },
      2026,
    );
    // 9 ticks past the friend-fade window (8) drops them.
    for (let i = 0; i < 9; i++) state = decayRelationships(state);
    expect(state.relationshipState!.friends).toHaveLength(0);
  });

  it('resetFriendContact keeps a friend alive across 6 years of yearly decay+call ticks', () => {
    let state = makeState({ currentYear: 2026 });
    state = addFriend(
      state,
      { ...person('rel-friend'), type: 'friend', yearsSinceContact: 0 },
      2026,
    );
    // Simulate 6 years where the player calls the friend every year. Each
    // tick: decay bumps yearsSinceContact +1, then the call activity resets
    // it to 0. With the 8-year fade window, the friend must still be present.
    for (let i = 0; i < 6; i++) {
      state = decayRelationships(state);
      state = applyEffect(state, { special: 'resetFriendContact' });
      state = { ...state, currentYear: state.currentYear + 1 };
    }
    expect(state.relationshipState!.friends).toHaveLength(1);
    expect(state.relationshipState!.friends[0]?.yearsSinceContact).toBeLessThan(8);
    expect(state.relationshipState!.friends[0]?.yearsSinceContact).toBe(0);
  });

  it('without resetFriendContact, a friend fades out within the 8-year window', () => {
    // Counter-test: confirms the audit's claim that diligent decay alone
    // drops the friend, and that the reset is what saves them.
    let state = makeState();
    state = addFriend(
      state,
      { ...person('rel-friend'), type: 'friend', yearsSinceContact: 0 },
      2026,
    );
    for (let i = 0; i < 9; i++) state = decayRelationships(state);
    expect(state.relationshipState!.friends).toHaveLength(0);
  });

  it('caps significantExes at 10 — older entries fall off', () => {
    let rs = emptyRelationshipState();
    for (let i = 0; i < 12; i++) {
      rs = {
        ...rs,
        significantExes: [
          ...rs.significantExes,
          {
            ...person(`ex${i}`),
            type: 'significantEx',
            formerSlot: 'spouse',
            endYear: 2000 + i,
          },
        ],
      };
    }
    const state = withRelationshipState(makeState(), rs);
    const after = decayRelationships(state);
    expect(after.relationshipState!.significantExes.length).toBeLessThanOrEqual(10);
  });

  it('ages every alive relationship by 1 each tick', () => {
    let state = makeState();
    state = addPartner(state, person('p'), 2026);
    state = addFamilyMember(state, { ...person('m'), type: 'mother' });
    const before = state.relationshipState!;
    state = decayRelationships(state);
    expect(state.relationshipState!.partner!.age).toBe(before.partner!.age + 1);
    expect(state.relationshipState!.family[0]!.age).toBe(before.family[0]!.age + 1);
  });
});

describe('relationshipEngine — migration from legacy', () => {
  it('seats the first spouse and pushes additional spouses to significantExes', () => {
    const legacy: Relationship[] = [
      { id: 's1', type: 'spouse', firstName: 'A', lastName: 'X', age: 28, alive: true, relationshipLevel: 80 },
      { id: 's2', type: 'spouse', firstName: 'B', lastName: 'X', age: 30, alive: true, relationshipLevel: 70 },
    ];
    const rs = migrateLegacyRelationships(legacy);
    expect(rs.spouse?.firstName).toBe('A');
    expect(rs.significantExes).toHaveLength(1);
    expect(rs.significantExes[0]?.firstName).toBe('B');
  });

  it('seats the first partner and pushes additional partners to casualExes', () => {
    const legacy: Relationship[] = [
      { id: 'p1', type: 'partner', firstName: 'A', lastName: 'X', age: 28, alive: true, relationshipLevel: 60 },
      { id: 'p2', type: 'partner', firstName: 'B', lastName: 'X', age: 30, alive: true, relationshipLevel: 70 },
      { id: 'p3', type: 'partner', firstName: 'C', lastName: 'X', age: 32, alive: true, relationshipLevel: 50 },
    ];
    const rs = migrateLegacyRelationships(legacy);
    expect(rs.partner?.firstName).toBe('A');
    expect(rs.casualExes).toHaveLength(2);
  });

  it('routes family/friends/casualEx/significantEx to their lists', () => {
    const legacy: Relationship[] = [
      { id: 'mom', type: 'mother', firstName: 'M', lastName: 'X', age: 55, alive: true, relationshipLevel: 80 },
      { id: 'dad', type: 'father', firstName: 'D', lastName: 'X', age: 58, alive: true, relationshipLevel: 75 },
      { id: 'sib', type: 'sibling', firstName: 'S', lastName: 'X', age: 22, alive: true, relationshipLevel: 65 },
      { id: 'ki', type: 'child', firstName: 'K', lastName: 'X', age: 2, alive: true, relationshipLevel: 90 },
      { id: 'fr', type: 'friend', firstName: 'F', lastName: 'X', age: 30, alive: true, relationshipLevel: 60 },
    ];
    const rs = migrateLegacyRelationships(legacy);
    expect(rs.family).toHaveLength(4);
    expect(rs.friends).toHaveLength(1);
  });

  it('ensureRelationshipState back-fills from a legacy-only state', () => {
    const state = makeState({
      relationshipState: undefined,
      relationships: [
        { id: 's', type: 'spouse', firstName: 'A', lastName: 'X', age: 28, alive: true, relationshipLevel: 80 },
      ],
    });
    const ensured = ensureRelationshipState(state);
    expect(ensured.relationshipState).toBeDefined();
    expect(ensured.relationshipState!.spouse?.firstName).toBe('A');
  });
});

describe('relationshipEngine — backwards compat for legacy conditions', () => {
  it('legacy "has spouse" condition resolves true when the spouse slot is set', () => {
    let state = makeState();
    state = addSpouse(state, person('s', 'Esmee'), 2030);
    const hasSpouse = state.relationships.some((r) => r.type === 'spouse');
    expect(hasSpouse).toBe(true);
  });

  it('legacy "lacks partner" resolves true after a breakup', () => {
    let state = makeState();
    state = addPartner(state, person('p', 'Lev'), 2026);
    state = breakUpPartner(state, 2027);
    const hasPartner = state.relationships.some((r) => r.type === 'partner');
    expect(hasPartner).toBe(false);
  });

  it('legacy "has mother" resolves true off the family list', () => {
    let state = makeState();
    state = addFamilyMember(state, { ...person('mom'), type: 'mother' });
    const hasMother = state.relationships.some((r) => r.type === 'mother');
    expect(hasMother).toBe(true);
  });
});
