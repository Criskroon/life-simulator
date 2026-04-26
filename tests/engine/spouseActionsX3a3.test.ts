import { describe, expect, it } from 'vitest';
import { ACTIONS_BY_TYPE } from '../../src/game/data/actions';
import {
  addSpouse,
  emptyRelationshipState,
  syncLegacyView,
} from '../../src/game/engine/relationshipEngine';
import {
  executeAction,
  getActionsFor,
} from '../../src/game/engine/interactions';
import { createRng } from '../../src/game/engine/rng';
import type {
  Person,
  PlayerState,
  Spouse,
} from '../../src/game/types/gameState';
import type { RelationshipAction } from '../../src/game/types/interactions';

/**
 * X3a part 3: spouse actions — divorce, renew_vows, suggest_vacation,
 * have_kid, gift, compliment, deep_conversation, argue.
 */

function makeState(overrides: Partial<PlayerState> = {}): PlayerState {
  const rs = emptyRelationshipState();
  return {
    id: 'p',
    firstName: 'Avery',
    lastName: 'Stone',
    age: 35,
    gender: 'female',
    country: 'GB',
    alive: true,
    birthYear: 1991,
    currentYear: 2026,
    stats: { health: 80, happiness: 70, smarts: 65, looks: 50 },
    money: 30000,
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

function spousePerson(level = 70): Person {
  return {
    id: 'rel-spouse-y2026-n0',
    baseId: 'rel-spouse',
    firstName: 'Sara',
    lastName: 'Vermeer',
    age: 34,
    alive: true,
    relationshipLevel: level,
  };
}

function withSeatedSpouse(state: PlayerState, level = 70): PlayerState {
  return addSpouse(state, spousePerson(level), state.currentYear);
}

function setYearsTogether(state: PlayerState, years: number): PlayerState {
  const current = state.relationshipState!.spouse!;
  const spouse: Spouse = { ...current, yearsTogether: years };
  return {
    ...state,
    relationshipState: { ...state.relationshipState!, spouse },
  };
}

function getAction(id: string): RelationshipAction {
  const action = ACTIONS_BY_TYPE.spouse.find((a) => a.id === id);
  if (!action) throw new Error(`missing spouse action: ${id}`);
  return action;
}

describe('spouse.divorce', () => {
  function findDivorceSeed(targetWeight: 70 | 30): number {
    for (let seed = 1; seed < 5000; seed++) {
      const rng = createRng(seed);
      const roll = rng.next() * 100;
      if (targetWeight === 70 && roll < 70) return seed;
      if (targetWeight === 30 && roll >= 70) return seed;
    }
    throw new Error(`no seed found for divorce weight ${targetWeight}`);
  }

  it('is a spouse-only big action that costs two action points', () => {
    const action = getAction('spouse.divorce');
    expect(action.applicableTo).toEqual(['spouse']);
    expect(action.tier).toBe('big');
    expect(action.actionCost).toBe(2);
    expect(action.cost).toBe(-10000);
  });

  it('70% clean: spouse → significantEx, 10k legal fees, -15 happiness', () => {
    const seated = withSeatedSpouse(makeState({ money: 30000 }));
    const spouse = seated.relationshipState!.spouse!;
    const result = executeAction(
      seated,
      getAction('spouse.divorce'),
      spouse,
      'spouse',
      createRng(findDivorceSeed(70)),
    );
    if (!result.ok) throw new Error('expected ok');
    expect(result.state.relationshipState!.spouse).toBeNull();
    expect(result.state.relationshipState!.significantExes.length).toBe(1);
    expect(result.state.relationshipState!.significantExes[0].formerSlot).toBe('spouse');
    expect(result.state.money).toBe(20000); // 30000 - 10000
    expect(result.state.stats.happiness).toBe(55); // 70 - 15
    expect(result.resolved.narrative).toContain('Civil');
  });

  it('30% messy: extra 5k cost, -25 happiness, still divorced', () => {
    const seated = withSeatedSpouse(makeState({ money: 30000 }));
    const spouse = seated.relationshipState!.spouse!;
    const result = executeAction(
      seated,
      getAction('spouse.divorce'),
      spouse,
      'spouse',
      createRng(findDivorceSeed(30)),
    );
    if (!result.ok) throw new Error('expected ok');
    expect(result.state.relationshipState!.spouse).toBeNull();
    expect(result.state.money).toBe(15000); // 30000 - 15000
    expect(result.state.stats.happiness).toBe(45); // 70 - 25
    expect(result.resolved.narrative).toContain('Lawyers');
  });

  it('consumes two action points', () => {
    const seated = withSeatedSpouse(
      makeState({ money: 30000, actionsRemainingThisYear: 3 }),
    );
    const spouse = seated.relationshipState!.spouse!;
    const result = executeAction(
      seated,
      getAction('spouse.divorce'),
      spouse,
      'spouse',
      createRng(findDivorceSeed(70)),
    );
    if (!result.ok) throw new Error('expected ok');
    expect(result.state.actionsRemainingThisYear).toBe(1);
  });

  it('refuses when only one action point remains', () => {
    const seated = withSeatedSpouse(
      makeState({ money: 30000, actionsRemainingThisYear: 1 }),
    );
    const spouse = seated.relationshipState!.spouse!;
    const result = executeAction(
      seated,
      getAction('spouse.divorce'),
      spouse,
      'spouse',
      createRng(1),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.kind).toBe('insufficient_actions');
  });
});

describe('spouse.renew_vows', () => {
  it('is a spouse-only big action gated by yearsTogether >= 10', () => {
    const action = getAction('spouse.renew_vows');
    expect(action.applicableTo).toEqual(['spouse']);
    expect(action.tier).toBe('big');
    expect(action.cost).toBe(-3000);
  });

  it('refuses below 10 years married', () => {
    const seated = setYearsTogether(withSeatedSpouse(makeState({ money: 5000 })), 5);
    const spouse = seated.relationshipState!.spouse!;
    const result = executeAction(
      seated,
      getAction('spouse.renew_vows'),
      spouse,
      'spouse',
      createRng(1),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.kind).toBe('condition_failed');
  });

  it('applies +bond 15 and +happiness 12 when 10 years in', () => {
    const seated = setYearsTogether(withSeatedSpouse(makeState({ money: 5000 }), 60), 12);
    const spouse = seated.relationshipState!.spouse!;
    const result = executeAction(
      seated,
      getAction('spouse.renew_vows'),
      spouse,
      'spouse',
      createRng(1),
    );
    if (!result.ok) throw new Error('expected ok');
    expect(result.state.money).toBe(2000); // 5000 - 3000
    expect(result.state.stats.happiness).toBe(82); // 70 + 12
    expect(result.state.relationshipState!.spouse!.relationshipLevel).toBe(75); // 60 + 15
  });
});

describe('spouse.suggest_vacation', () => {
  function findVacationSeed(targetWeight: 70 | 25 | 5): number {
    for (let seed = 1; seed < 5000; seed++) {
      const rng = createRng(seed);
      const roll = rng.next() * 100;
      if (targetWeight === 70 && roll < 70) return seed;
      if (targetWeight === 25 && roll >= 70 && roll < 95) return seed;
      if (targetWeight === 5 && roll >= 95) return seed;
    }
    throw new Error(`no seed found for vacation weight ${targetWeight}`);
  }

  it('is a spouse-only big action', () => {
    const action = getAction('spouse.suggest_vacation');
    expect(action.applicableTo).toEqual(['spouse']);
    expect(action.tier).toBe('big');
    expect(action.cost).toBe(-2500);
  });

  it('70% success: +happiness 8, +bond 12, money spent', () => {
    const seated = withSeatedSpouse(makeState({ money: 30000 }), 60);
    const spouse = seated.relationshipState!.spouse!;
    const result = executeAction(
      seated,
      getAction('spouse.suggest_vacation'),
      spouse,
      'spouse',
      createRng(findVacationSeed(70)),
    );
    if (!result.ok) throw new Error('expected ok');
    expect(result.state.money).toBe(27500);
    expect(result.state.stats.happiness).toBe(78);
    expect(result.state.relationshipState!.spouse!.relationshipLevel).toBe(72);
  });

  it('25% mediocre: smaller bumps, money still spent', () => {
    const seated = withSeatedSpouse(makeState({ money: 30000 }), 60);
    const spouse = seated.relationshipState!.spouse!;
    const result = executeAction(
      seated,
      getAction('spouse.suggest_vacation'),
      spouse,
      'spouse',
      createRng(findVacationSeed(25)),
    );
    if (!result.ok) throw new Error('expected ok');
    expect(result.state.stats.happiness).toBe(73); // 70 + 3
    expect(result.state.relationshipState!.spouse!.relationshipLevel).toBe(64); // 60 + 4
  });

  it('5% disaster: -happiness, -bond, money still spent', () => {
    const seated = withSeatedSpouse(makeState({ money: 30000 }), 60);
    const spouse = seated.relationshipState!.spouse!;
    const result = executeAction(
      seated,
      getAction('spouse.suggest_vacation'),
      spouse,
      'spouse',
      createRng(findVacationSeed(5)),
    );
    if (!result.ok) throw new Error('expected ok');
    expect(result.state.money).toBe(27500);
    expect(result.state.stats.happiness).toBe(64); // 70 - 6
    expect(result.state.relationshipState!.spouse!.relationshipLevel).toBe(52); // 60 - 8
  });
});

describe('spouse.have_kid', () => {
  function findHaveKidSeed(targetWeight: 80 | 15 | 5): number {
    for (let seed = 1; seed < 5000; seed++) {
      const rng = createRng(seed);
      const roll = rng.next() * 100;
      if (targetWeight === 80 && roll < 80) return seed;
      if (targetWeight === 15 && roll >= 80 && roll < 95) return seed;
      if (targetWeight === 5 && roll >= 95) return seed;
    }
    throw new Error(`no seed found for have_kid weight ${targetWeight}`);
  }

  it('is a spouse-only big action gated by relationshipLevel >= 50', () => {
    const action = getAction('spouse.have_kid');
    expect(action.applicableTo).toEqual(['spouse']);
    expect(action.tier).toBe('big');
  });

  it('refuses when bond < 50', () => {
    const seated = withSeatedSpouse(makeState(), 40);
    const spouse = seated.relationshipState!.spouse!;
    const result = executeAction(
      seated,
      getAction('spouse.have_kid'),
      spouse,
      'spouse',
      createRng(1),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.kind).toBe('condition_failed');
  });

  it('80% success: a child is added to family, +happiness 8', () => {
    const seated = withSeatedSpouse(makeState(), 60);
    const spouse = seated.relationshipState!.spouse!;
    const result = executeAction(
      seated,
      getAction('spouse.have_kid'),
      spouse,
      'spouse',
      createRng(findHaveKidSeed(80)),
    );
    if (!result.ok) throw new Error('expected ok');
    const kids = result.state.relationshipState!.family.filter((m) => m.type === 'child');
    expect(kids.length).toBe(1);
    expect(kids[0].age).toBe(0);
    // The enricher inherits the player's surname for children.
    expect(kids[0].lastName).toBe('Stone');
    expect(kids[0].firstName.length).toBeGreaterThan(0);
    expect(result.state.stats.happiness).toBe(78);
    expect(result.resolved.narrative).toContain('positive');
  });

  it('15% trying-fails: no child, -happiness 4', () => {
    const seated = withSeatedSpouse(makeState(), 60);
    const spouse = seated.relationshipState!.spouse!;
    const result = executeAction(
      seated,
      getAction('spouse.have_kid'),
      spouse,
      'spouse',
      createRng(findHaveKidSeed(15)),
    );
    if (!result.ok) throw new Error('expected ok');
    expect(result.state.relationshipState!.family.filter((m) => m.type === 'child')).toEqual([]);
    expect(result.state.stats.happiness).toBe(66);
  });

  it('5% conflict: -bond 8, -happiness 6, no child', () => {
    const seated = withSeatedSpouse(makeState(), 60);
    const spouse = seated.relationshipState!.spouse!;
    const result = executeAction(
      seated,
      getAction('spouse.have_kid'),
      spouse,
      'spouse',
      createRng(findHaveKidSeed(5)),
    );
    if (!result.ok) throw new Error('expected ok');
    expect(result.state.relationshipState!.family.filter((m) => m.type === 'child')).toEqual([]);
    expect(result.state.stats.happiness).toBe(64);
    expect(result.state.relationshipState!.spouse!.relationshipLevel).toBe(52); // 60 - 8
  });
});

describe('spouse.gift', () => {
  it('is a spouse-only light action with money cost', () => {
    const action = getAction('spouse.gift');
    expect(action.applicableTo).toEqual(['spouse']);
    expect(action.tier).toBe('light');
    expect(action.cost).toBe(-200);
  });

  it('charges 200, +happiness 5, +bond 8', () => {
    const seated = withSeatedSpouse(makeState({ money: 1000 }), 50);
    const spouse = seated.relationshipState!.spouse!;
    const result = executeAction(
      seated,
      getAction('spouse.gift'),
      spouse,
      'spouse',
      createRng(1),
    );
    if (!result.ok) throw new Error('expected ok');
    expect(result.state.money).toBe(800);
    expect(result.state.stats.happiness).toBe(75);
    expect(result.state.relationshipState!.spouse!.relationshipLevel).toBe(58);
  });
});

describe('spouse.compliment', () => {
  it('is a spouse-only light action', () => {
    const action = getAction('spouse.compliment');
    expect(action.applicableTo).toEqual(['spouse']);
    expect(action.tier).toBe('light');
  });

  it('applies +happiness 2 and +bond 4', () => {
    const seated = withSeatedSpouse(makeState(), 50);
    const spouse = seated.relationshipState!.spouse!;
    const result = executeAction(
      seated,
      getAction('spouse.compliment'),
      spouse,
      'spouse',
      createRng(1),
    );
    if (!result.ok) throw new Error('expected ok');
    expect(result.state.stats.happiness).toBe(72);
    expect(result.state.relationshipState!.spouse!.relationshipLevel).toBe(54);
  });

  it('cannot fire twice in the same year (cooldown)', () => {
    const seated = withSeatedSpouse(makeState(), 50);
    const spouse = seated.relationshipState!.spouse!;
    const action = getAction('spouse.compliment');

    const first = executeAction(seated, action, spouse, 'spouse', createRng(1));
    if (!first.ok) throw new Error('expected ok');

    const second = executeAction(first.state, action, spouse, 'spouse', createRng(2));
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.kind).toBe('on_cooldown');
  });
});

describe('spouse.deep_conversation', () => {
  it('is a spouse-only light action gated by relationshipLevel >= 40', () => {
    const action = getAction('spouse.deep_conversation');
    expect(action.applicableTo).toEqual(['spouse']);
    expect(action.tier).toBe('light');
  });

  it('refuses below bond 40', () => {
    const seated = withSeatedSpouse(makeState(), 30);
    const spouse = seated.relationshipState!.spouse!;
    const result = executeAction(
      seated,
      getAction('spouse.deep_conversation'),
      spouse,
      'spouse',
      createRng(1),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.kind).toBe('condition_failed');
  });

  it('applies +happiness 3, +smarts 1, +bond 6 when bond is high enough', () => {
    const seated = withSeatedSpouse(makeState(), 50);
    const spouse = seated.relationshipState!.spouse!;
    const result = executeAction(
      seated,
      getAction('spouse.deep_conversation'),
      spouse,
      'spouse',
      createRng(1),
    );
    if (!result.ok) throw new Error('expected ok');
    expect(result.state.stats.happiness).toBe(73);
    expect(result.state.stats.smarts).toBe(66);
    expect(result.state.relationshipState!.spouse!.relationshipLevel).toBe(56);
  });
});

describe('spouse.argue', () => {
  it('is a spouse-only light action', () => {
    const action = getAction('spouse.argue');
    expect(action.applicableTo).toEqual(['spouse']);
    expect(action.tier).toBe('light');
  });

  it('drops happiness 5 and bond 8', () => {
    const seated = withSeatedSpouse(makeState(), 50);
    const spouse = seated.relationshipState!.spouse!;
    const result = executeAction(
      seated,
      getAction('spouse.argue'),
      spouse,
      'spouse',
      createRng(1),
    );
    if (!result.ok) throw new Error('expected ok');
    expect(result.state.stats.happiness).toBe(65);
    expect(result.state.relationshipState!.spouse!.relationshipLevel).toBe(42);
  });
});

describe('spouse action list — surfacing through getActionsFor', () => {
  it('exposes all 8 spouse actions in stable order', () => {
    const seated = setYearsTogether(withSeatedSpouse(makeState({ money: 30000 })), 12);
    const spouse = seated.relationshipState!.spouse!;
    const ids = getActionsFor(spouse, 'spouse', seated).map((a) => a.action.id);
    expect(ids).toEqual([
      'spouse.divorce',
      'spouse.renew_vows',
      'spouse.suggest_vacation',
      'spouse.have_kid',
      'spouse.gift',
      'spouse.compliment',
      'spouse.deep_conversation',
      'spouse.argue',
    ]);
  });

  it('does not expose fiance-only actions on a spouse', () => {
    const seated = withSeatedSpouse(makeState({ money: 30000 }));
    const spouse = seated.relationshipState!.spouse!;
    const ids = getActionsFor(spouse, 'spouse', seated).map((a) => a.action.id);
    expect(ids).not.toContain('fiance.marry');
    expect(ids).not.toContain('fiance.cancel_engagement');
  });
});
