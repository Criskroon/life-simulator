import { describe, expect, it } from 'vitest';
import { ACTIONS_BY_TYPE } from '../../src/game/data/actions';
import {
  addPartner,
  emptyRelationshipState,
  syncLegacyView,
} from '../../src/game/engine/relationshipEngine';
import {
  executeAction,
  getActionsFor,
} from '../../src/game/engine/interactions';
import { createRng } from '../../src/game/engine/rng';
import type {
  Partner,
  Person,
  PlayerState,
} from '../../src/game/types/gameState';
import type { RelationshipAction } from '../../src/game/types/interactions';

/**
 * X3a part 2: 5 new partner actions — gift, compliment, deep_conversation,
 * suggest_vacation, argue. Tests cover applicability, condition gates,
 * effect application, probabilistic outcomes, and cooldown integration.
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
    money: 10000,
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

function partnerPerson(level = 70): Person {
  return {
    id: 'rel-partner-y2026-n0',
    baseId: 'rel-partner',
    firstName: 'Sara',
    lastName: 'Vermeer',
    age: 29,
    alive: true,
    relationshipLevel: level,
  };
}

function withSeatedPartner(state: PlayerState, level = 70): PlayerState {
  return addPartner(state, partnerPerson(level), state.currentYear);
}

function getAction(id: string): RelationshipAction {
  const action = ACTIONS_BY_TYPE.partner.find((a) => a.id === id);
  if (!action) throw new Error(`missing partner action: ${id}`);
  return action;
}

function setYearsTogether(
  state: PlayerState,
  years: number,
): { state: PlayerState; partner: Partner } {
  const current = state.relationshipState!.partner!;
  const partner: Partner = { ...current, yearsTogether: years };
  const next: PlayerState = {
    ...state,
    relationshipState: {
      ...state.relationshipState!,
      partner,
    },
  };
  return { state: next, partner };
}

describe('partner.gift', () => {
  it('is exposed as a partner-only action', () => {
    const action = getAction('partner.gift');
    expect(action.applicableTo).toEqual(['partner']);
    expect(action.tier).toBe('light');
  });

  it('does not appear in the friend action list', () => {
    const state = makeState();
    const friend: Person = {
      id: 'rel-friend',
      firstName: 'Sam',
      lastName: 'Kuipers',
      age: 30,
      alive: true,
      relationshipLevel: 60,
    };
    const list = getActionsFor(friend, 'friend', state);
    expect(list.map((a) => a.action.id)).not.toContain('partner.gift');
  });

  it('charges money, raises happiness, and bumps the partner bond', () => {
    const seated = withSeatedPartner(makeState({ money: 1000 }), 50);
    const partner = seated.relationshipState!.partner!;
    const result = executeAction(
      seated,
      getAction('partner.gift'),
      partner,
      'partner',
      createRng(1),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.money).toBe(800); // 1000 - 200 (GB baseline, no scaling)
    expect(result.state.stats.happiness).toBe(75); // 70 + 5
    expect(result.state.relationshipState!.partner!.relationshipLevel).toBe(58); // 50 + 8
    expect(result.state.actionsRemainingThisYear).toBe(3); // light, no spend
  });
});

describe('partner.compliment', () => {
  it('is exposed as a partner-only light action', () => {
    const action = getAction('partner.compliment');
    expect(action.applicableTo).toEqual(['partner']);
    expect(action.tier).toBe('light');
  });

  it('does not appear in the friend action list', () => {
    const state = makeState();
    const friend: Person = {
      id: 'rel-friend',
      firstName: 'Sam',
      lastName: 'Kuipers',
      age: 30,
      alive: true,
      relationshipLevel: 60,
    };
    expect(getActionsFor(friend, 'friend', state)).toEqual([]);
  });

  it('applies +happiness 2 and +relLevel 4 with no money cost', () => {
    const seated = withSeatedPartner(makeState({ money: 1000 }), 50);
    const partner = seated.relationshipState!.partner!;
    const result = executeAction(
      seated,
      getAction('partner.compliment'),
      partner,
      'partner',
      createRng(1),
    );
    if (!result.ok) throw new Error('expected ok');
    expect(result.state.money).toBe(1000);
    expect(result.state.stats.happiness).toBe(72);
    expect(result.state.relationshipState!.partner!.relationshipLevel).toBe(54);
  });
});

describe('partner.deep_conversation', () => {
  it('is exposed as a partner-only light action', () => {
    const action = getAction('partner.deep_conversation');
    expect(action.applicableTo).toEqual(['partner']);
    expect(action.tier).toBe('light');
  });

  it('is gated by target.relationshipLevel >= 40 — refuses below', () => {
    const seated = withSeatedPartner(makeState(), 30);
    const partner = seated.relationshipState!.partner!;
    const result = executeAction(
      seated,
      getAction('partner.deep_conversation'),
      partner,
      'partner',
      createRng(1),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.kind).toBe('condition_failed');
  });

  it('applies +happiness 3, +smarts 1, +relLevel 6 when bond is high enough', () => {
    const seated = withSeatedPartner(makeState(), 50);
    const partner = seated.relationshipState!.partner!;
    const result = executeAction(
      seated,
      getAction('partner.deep_conversation'),
      partner,
      'partner',
      createRng(1),
    );
    if (!result.ok) throw new Error('expected ok');
    expect(result.state.stats.happiness).toBe(73);
    expect(result.state.stats.smarts).toBe(66);
    expect(result.state.relationshipState!.partner!.relationshipLevel).toBe(56);
  });
});

describe('partner.suggest_vacation', () => {
  function findVacationSeed(targetWeight: 70 | 25 | 5): number {
    // weights total 100; outcomes evaluated top-to-bottom:
    //   roll < 70  → success
    //   70 ≤ roll < 95 → mediocre
    //   95 ≤ roll  → disaster
    for (let seed = 1; seed < 5000; seed++) {
      const rng = createRng(seed);
      const roll = rng.next() * 100;
      if (targetWeight === 70 && roll < 70) return seed;
      if (targetWeight === 25 && roll >= 70 && roll < 95) return seed;
      if (targetWeight === 5 && roll >= 95) return seed;
    }
    throw new Error(`no seed found for vacation weight ${targetWeight}`);
  }

  it('is a big partner-only action', () => {
    const action = getAction('partner.suggest_vacation');
    expect(action.applicableTo).toEqual(['partner']);
    expect(action.tier).toBe('big');
  });

  it('refuses when yearsTogether is 0 (still under a year together)', () => {
    const seated = withSeatedPartner(makeState({ money: 10000 }));
    const partner = seated.relationshipState!.partner!;
    // Fresh addPartner sets yearsTogether to 0.
    const result = executeAction(
      seated,
      getAction('partner.suggest_vacation'),
      partner,
      'partner',
      createRng(1),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.kind).toBe('condition_failed');
  });

  it('70% success: closer than ever, +relLevel and +happiness', () => {
    const { state, partner } = setYearsTogether(
      withSeatedPartner(makeState({ money: 10000 }), 50),
      2,
    );
    const result = executeAction(
      state,
      getAction('partner.suggest_vacation'),
      partner,
      'partner',
      createRng(findVacationSeed(70)),
    );
    if (!result.ok) throw new Error('expected ok');
    expect(result.resolved.narrative).toContain('closer');
    expect(result.state.stats.happiness).toBe(86); // 70 + 16
    expect(result.state.relationshipState!.partner!.relationshipLevel).toBe(62); // 50 + 12
    expect(result.state.money).toBe(7500); // 10000 - 2500 (GB baseline)
  });

  it('25% mediocre: smaller bumps, dry narrative', () => {
    const { state, partner } = setYearsTogether(
      withSeatedPartner(makeState({ money: 10000 }), 50),
      2,
    );
    const result = executeAction(
      state,
      getAction('partner.suggest_vacation'),
      partner,
      'partner',
      createRng(findVacationSeed(25)),
    );
    if (!result.ok) throw new Error('expected ok');
    expect(result.resolved.narrative).toContain('overpriced');
    expect(result.state.stats.happiness).toBe(76); // 70 + 6
    expect(result.state.relationshipState!.partner!.relationshipLevel).toBe(54); // 50 + 4
  });

  it('5% disaster: -happiness, -relLevel, money still spent', () => {
    const { state, partner } = setYearsTogether(
      withSeatedPartner(makeState({ money: 10000 }), 50),
      2,
    );
    const result = executeAction(
      state,
      getAction('partner.suggest_vacation'),
      partner,
      'partner',
      createRng(findVacationSeed(5)),
    );
    if (!result.ok) throw new Error('expected ok');
    expect(result.resolved.narrative).toContain('snapped');
    expect(result.state.stats.happiness).toBe(58); // 70 - 12
    expect(result.state.relationshipState!.partner!.relationshipLevel).toBe(42); // 50 - 8
    expect(result.state.money).toBe(7500); // money still spent on the trip
  });

  it('consumes one action point and is NOT recorded on the cooldown ledger', () => {
    const { state, partner } = setYearsTogether(
      withSeatedPartner(makeState({ money: 10000, actionsRemainingThisYear: 2 }), 50),
      2,
    );
    const result = executeAction(
      state,
      getAction('partner.suggest_vacation'),
      partner,
      'partner',
      createRng(findVacationSeed(70)),
    );
    if (!result.ok) throw new Error('expected ok');
    expect(result.state.actionsRemainingThisYear).toBe(1);
    // big tier → not on the cooldown ledger
    expect(result.state.actionUsageThisYear).toEqual([]);
  });
});

describe('partner.argue', () => {
  it('is a partner-only light action', () => {
    const action = getAction('partner.argue');
    expect(action.applicableTo).toEqual(['partner']);
    expect(action.tier).toBe('light');
  });

  it('drops happiness and partner bond', () => {
    const seated = withSeatedPartner(makeState(), 50);
    const partner = seated.relationshipState!.partner!;
    const result = executeAction(
      seated,
      getAction('partner.argue'),
      partner,
      'partner',
      createRng(1),
    );
    if (!result.ok) throw new Error('expected ok');
    expect(result.state.stats.happiness).toBe(60); // 70 - 10
    expect(result.state.relationshipState!.partner!.relationshipLevel).toBe(42); // 50 - 8
  });
});

describe('cooldown integration — light partner actions', () => {
  it('partner.compliment fires once per year per person, second call is on_cooldown', () => {
    const seated = withSeatedPartner(makeState(), 50);
    const partner = seated.relationshipState!.partner!;
    const action = getAction('partner.compliment');

    const first = executeAction(seated, action, partner, 'partner', createRng(1));
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const list = getActionsFor(partner, 'partner', first.state);
    const entry = list.find((a) => a.action.id === 'partner.compliment')!;
    expect(entry.enabled).toBe(false);
    expect(entry.disabledReason).toBe('on_cooldown');

    const second = executeAction(
      first.state,
      action,
      partner,
      'partner',
      createRng(2),
    );
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.kind).toBe('on_cooldown');
  });
});
