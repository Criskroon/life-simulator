import { describe, expect, it } from 'vitest';
import { ACTIONS_BY_TYPE } from '../../src/game/data/actions';
import {
  addFiance,
  emptyRelationshipState,
  syncLegacyView,
} from '../../src/game/engine/relationshipEngine';
import {
  executeAction,
  getActionsFor,
} from '../../src/game/engine/interactions';
import { createRng } from '../../src/game/engine/rng';
import type {
  Fiance,
  Person,
  PlayerState,
} from '../../src/game/types/gameState';
import type { RelationshipAction } from '../../src/game/types/interactions';

/**
 * X3a part 3: fiance actions — marry, cancel_engagement, plan_wedding,
 * compliment, deep_conversation. Also covers the addSpouse promote-shortcut
 * (the engine half of fiance.marry's success path).
 */

function makeState(overrides: Partial<PlayerState> = {}): PlayerState {
  const rs = emptyRelationshipState();
  return {
    id: 'p',
    firstName: 'Avery',
    lastName: 'Stone',
    age: 30,
    gender: 'female',
    country: 'GB',
    alive: true,
    birthYear: 1996,
    currentYear: 2026,
    stats: { health: 80, happiness: 70, smarts: 65, looks: 50 },
    money: 20000,
    job: null,
    education: [],
    relationships: syncLegacyView(rs),
    relationshipState: rs,
    assets: [],
    criminalRecord: [],
    history: [],
    triggeredEventIds: [],
    actionsRemainingThisYear: 3,
    actionUsageThisYear: [],
    ...overrides,
  };
}

function fiancePerson(level = 70): Person {
  return {
    id: 'rel-fiance-y2026-n0',
    baseId: 'rel-fiance',
    firstName: 'Sara',
    lastName: 'Vermeer',
    age: 29,
    alive: true,
    relationshipLevel: level,
  };
}

function withSeatedFiance(state: PlayerState, level = 70): PlayerState {
  return addFiance(state, fiancePerson(level), state.currentYear);
}

function setYearsTogether(state: PlayerState, years: number): PlayerState {
  const current = state.relationshipState!.fiance!;
  const fiance: Fiance = { ...current, yearsTogether: years };
  return {
    ...state,
    relationshipState: { ...state.relationshipState!, fiance },
  };
}

function getAction(id: string): RelationshipAction {
  const action = ACTIONS_BY_TYPE.fiance.find((a) => a.id === id);
  if (!action) throw new Error(`missing fiance action: ${id}`);
  return action;
}

describe('fiance.marry', () => {
  it('is a fiance-only big action with money cost', () => {
    const action = getAction('fiance.marry');
    expect(action.applicableTo).toEqual(['fiance']);
    expect(action.tier).toBe('big');
    expect(action.cost).toBe(-8000);
  });

  it('does not appear on a partner action list', () => {
    expect(ACTIONS_BY_TYPE.partner.find((a) => a.id === 'fiance.marry')).toBeUndefined();
  });

  it('refuses when yearsTogether < 1 (fresh engagement)', () => {
    const seated = withSeatedFiance(makeState());
    const fiance = seated.relationshipState!.fiance!;
    // addFiance resets metYear so yearsTogether stays 0 right after seating.
    const result = executeAction(
      seated,
      getAction('fiance.marry'),
      fiance,
      'fiance',
      createRng(1),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.kind).toBe('condition_failed');
  });

  function findMarrySeed(targetWeight: 90 | 10): number {
    for (let seed = 1; seed < 5000; seed++) {
      const rng = createRng(seed);
      const roll = rng.next() * 100;
      if (targetWeight === 90 && roll < 90) return seed;
      if (targetWeight === 10 && roll >= 90) return seed;
    }
    throw new Error(`no seed found for marry weight ${targetWeight}`);
  }

  it('90% success: fiance → spouse via promote-shortcut, fiance slot empties', () => {
    const seated = setYearsTogether(withSeatedFiance(makeState({ money: 20000 })), 2);
    const fiance = seated.relationshipState!.fiance!;
    const result = executeAction(
      seated,
      getAction('fiance.marry'),
      fiance,
      'fiance',
      createRng(findMarrySeed(90)),
    );
    if (!result.ok) throw new Error('expected ok');
    expect(result.state.relationshipState!.fiance).toBeNull();
    expect(result.state.relationshipState!.spouse).not.toBeNull();
    expect(result.state.relationshipState!.spouse!.firstName).toBe('Sara');
    expect(result.state.relationshipState!.spouse!.lastName).toBe('Vermeer');
    expect(result.state.relationshipState!.spouse!.yearsTogether).toBe(0);
    expect(result.state.relationshipState!.spouse!.metYear).toBe(2026);
    expect(result.state.money).toBe(12000); // 20000 - 8000
    expect(result.state.stats.happiness).toBe(85); // 70 + 15
    expect(result.resolved.narrative).toContain('vows');
  });

  it('addSpouse summary uses the real fiance name (not a payload-stamped one)', () => {
    const seated = setYearsTogether(withSeatedFiance(makeState({ money: 20000 })), 2);
    const fiance = seated.relationshipState!.fiance!;
    const result = executeAction(
      seated,
      getAction('fiance.marry'),
      fiance,
      'fiance',
      createRng(findMarrySeed(90)),
    );
    if (!result.ok) throw new Error('expected ok');
    const spouseSummary = result.resolved.specials.find((s) => s.special === 'addSpouse');
    expect(spouseSummary?.label).toBe('Married Sara Vermeer');
  });

  it('10% cold feet: fiance stays seated, happiness drops, bond drops', () => {
    const seated = setYearsTogether(withSeatedFiance(makeState({ money: 20000 }), 80), 2);
    const fiance = seated.relationshipState!.fiance!;
    const result = executeAction(
      seated,
      getAction('fiance.marry'),
      fiance,
      'fiance',
      createRng(findMarrySeed(10)),
    );
    if (!result.ok) throw new Error('expected ok');
    expect(result.state.relationshipState!.fiance).not.toBeNull();
    expect(result.state.relationshipState!.spouse).toBeNull();
    expect(result.state.stats.happiness).toBe(66); // 70 - 4
    expect(result.state.relationshipState!.fiance!.relationshipLevel).toBe(77); // 80 - 3
    expect(result.state.money).toBe(12000); // money still spent
    expect(result.resolved.narrative).toContain('Cold feet');
  });

  it('consumes one action point regardless of outcome', () => {
    const seated = setYearsTogether(
      withSeatedFiance(makeState({ money: 20000, actionsRemainingThisYear: 3 })),
      2,
    );
    const fiance = seated.relationshipState!.fiance!;
    const result = executeAction(
      seated,
      getAction('fiance.marry'),
      fiance,
      'fiance',
      createRng(findMarrySeed(90)),
    );
    if (!result.ok) throw new Error('expected ok');
    expect(result.state.actionsRemainingThisYear).toBe(2);
  });
});

describe('fiance.cancel_engagement', () => {
  it('is a fiance-only big action', () => {
    const action = getAction('fiance.cancel_engagement');
    expect(action.applicableTo).toEqual(['fiance']);
    expect(action.tier).toBe('big');
  });

  it('moves the fiance to significantExes and drops happiness', () => {
    const seated = withSeatedFiance(makeState(), 60);
    const fiance = seated.relationshipState!.fiance!;
    const result = executeAction(
      seated,
      getAction('fiance.cancel_engagement'),
      fiance,
      'fiance',
      createRng(1),
    );
    if (!result.ok) throw new Error('expected ok');
    expect(result.state.relationshipState!.fiance).toBeNull();
    expect(result.state.relationshipState!.significantExes.length).toBe(1);
    expect(result.state.relationshipState!.significantExes[0].formerSlot).toBe('fiance');
    expect(result.state.stats.happiness).toBe(60); // 70 - 10
  });
});

describe('fiance.plan_wedding', () => {
  it('is a fiance-only light action with no money cost', () => {
    const action = getAction('fiance.plan_wedding');
    expect(action.applicableTo).toEqual(['fiance']);
    expect(action.tier).toBe('light');
    expect(action.cost).toBeUndefined();
  });

  it('applies +happiness 2 and +bond 4 on the fiance', () => {
    const seated = withSeatedFiance(makeState(), 50);
    const fiance = seated.relationshipState!.fiance!;
    const result = executeAction(
      seated,
      getAction('fiance.plan_wedding'),
      fiance,
      'fiance',
      createRng(1),
    );
    if (!result.ok) throw new Error('expected ok');
    expect(result.state.stats.happiness).toBe(72);
    expect(result.state.relationshipState!.fiance!.relationshipLevel).toBe(54);
  });

  it('is on cooldown after firing — second call this year refuses', () => {
    const seated = withSeatedFiance(makeState(), 50);
    const fiance = seated.relationshipState!.fiance!;
    const action = getAction('fiance.plan_wedding');

    const first = executeAction(seated, action, fiance, 'fiance', createRng(1));
    if (!first.ok) throw new Error('expected ok');

    const second = executeAction(first.state, action, fiance, 'fiance', createRng(2));
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.kind).toBe('on_cooldown');
  });
});

describe('fiance.compliment', () => {
  it('is a fiance-only light action', () => {
    const action = getAction('fiance.compliment');
    expect(action.applicableTo).toEqual(['fiance']);
    expect(action.tier).toBe('light');
  });

  it('applies +happiness 2 and +bond 4', () => {
    const seated = withSeatedFiance(makeState(), 50);
    const fiance = seated.relationshipState!.fiance!;
    const result = executeAction(
      seated,
      getAction('fiance.compliment'),
      fiance,
      'fiance',
      createRng(1),
    );
    if (!result.ok) throw new Error('expected ok');
    expect(result.state.stats.happiness).toBe(72);
    expect(result.state.relationshipState!.fiance!.relationshipLevel).toBe(54);
  });
});

describe('fiance.deep_conversation', () => {
  it('is a fiance-only light action gated by relationshipLevel >= 40', () => {
    const action = getAction('fiance.deep_conversation');
    expect(action.applicableTo).toEqual(['fiance']);
    expect(action.tier).toBe('light');
  });

  it('refuses when bond is below 40', () => {
    const seated = withSeatedFiance(makeState(), 30);
    const fiance = seated.relationshipState!.fiance!;
    const result = executeAction(
      seated,
      getAction('fiance.deep_conversation'),
      fiance,
      'fiance',
      createRng(1),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.kind).toBe('condition_failed');
  });

  it('applies +happiness 3, +smarts 1, +bond 6 when bond is high enough', () => {
    const seated = withSeatedFiance(makeState(), 50);
    const fiance = seated.relationshipState!.fiance!;
    const result = executeAction(
      seated,
      getAction('fiance.deep_conversation'),
      fiance,
      'fiance',
      createRng(1),
    );
    if (!result.ok) throw new Error('expected ok');
    expect(result.state.stats.happiness).toBe(73);
    expect(result.state.stats.smarts).toBe(66);
    expect(result.state.relationshipState!.fiance!.relationshipLevel).toBe(56);
  });
});

describe('fiance action list — surfacing through getActionsFor', () => {
  it('exposes all 5 fiance actions on the fiance type', () => {
    const seated = setYearsTogether(withSeatedFiance(makeState({ money: 20000 })), 2);
    const fiance = seated.relationshipState!.fiance!;
    const ids = getActionsFor(fiance, 'fiance', seated).map((a) => a.action.id);
    expect(ids).toEqual([
      'fiance.marry',
      'fiance.cancel_engagement',
      'fiance.plan_wedding',
      'fiance.compliment',
      'fiance.deep_conversation',
    ]);
  });
});
