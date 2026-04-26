import { describe, expect, it } from 'vitest';
import { ACTIONS_BY_TYPE } from '../../src/game/data/actions';
import {
  addPartner,
  emptyRelationshipState,
  syncLegacyView,
} from '../../src/game/engine/relationshipEngine';
import {
  evaluateActionConditions,
  executeAction,
  getActionsFor,
} from '../../src/game/engine/interactions';
import { createRng } from '../../src/game/engine/rng';
import type { Person, PlayerState } from '../../src/game/types/gameState';

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

/**
 * Seat the partner in the slot via the engine so the resulting state mirrors
 * a real game — Person.id matches what's in the slot, and the legacy view
 * is synced. Tests can then read the seated partner back out and pass it as
 * the action target.
 */
function withSeatedPartner(state: PlayerState, level = 70): PlayerState {
  return addPartner(state, partnerPerson(level), state.currentYear);
}

describe('evaluateActionConditions', () => {
  it('passes when conditions array is empty or undefined', () => {
    const state = makeState();
    const target = partnerPerson();
    expect(evaluateActionConditions(state, target, undefined)).toBe(true);
    expect(evaluateActionConditions(state, target, [])).toBe(true);
  });

  it('resolves target.* paths against the targeted Person', () => {
    const state = makeState();
    const target = partnerPerson(70);
    expect(
      evaluateActionConditions(state, target, [
        { path: 'target.relationshipLevel', op: '>=', value: 60 },
      ]),
    ).toBe(true);
    expect(
      evaluateActionConditions(state, target, [
        { path: 'target.relationshipLevel', op: '>=', value: 90 },
      ]),
    ).toBe(false);
  });

  it('resolves non-target paths against PlayerState', () => {
    const state = makeState({ money: 1000 });
    const target = partnerPerson();
    expect(
      evaluateActionConditions(state, target, [
        { path: 'money', op: '>=', value: 500 },
      ]),
    ).toBe(true);
    expect(
      evaluateActionConditions(state, target, [
        { path: 'money', op: '>=', value: 5000 },
      ]),
    ).toBe(false);
  });

  it('combines target.* and player paths in one evaluation', () => {
    const state = makeState({ money: 5000 });
    const target = partnerPerson(70);
    const conditions = [
      { path: 'target.relationshipLevel', op: '>=' as const, value: 60 },
      { path: 'money', op: '>=' as const, value: 4500 },
    ];
    expect(evaluateActionConditions(state, target, conditions)).toBe(true);

    const poorState = makeState({ money: 1000 });
    expect(evaluateActionConditions(poorState, target, conditions)).toBe(false);
  });
});

describe('getActionsFor', () => {
  it('returns the partner action set for partner type', () => {
    const seated = withSeatedPartner(makeState({ money: 10000 }));
    const partner = seated.relationshipState!.partner!;
    const actions = getActionsFor(partner, 'partner', seated);
    const ids = actions.map((a) => a.action.id);
    expect(ids).toContain('partner.spend_time');
    expect(ids).toContain('partner.propose');
  });

  it('returns an empty list for types with no X2 actions', () => {
    const state = makeState();
    const dummy: Person = {
      id: 'rel-friend',
      firstName: 'Sam',
      lastName: 'Kuipers',
      age: 30,
      alive: true,
      relationshipLevel: 60,
    };
    expect(getActionsFor(dummy, 'friend', state)).toEqual([]);
  });

  it('marks light spend_time as enabled by default', () => {
    const seated = withSeatedPartner(makeState());
    const partner = seated.relationshipState!.partner!;
    const actions = getActionsFor(partner, 'partner', seated);
    const spendTime = actions.find((a) => a.action.id === 'partner.spend_time')!;
    expect(spendTime.enabled).toBe(true);
    expect(spendTime.disabledReason).toBeNull();
  });

  it('disables propose with insufficient_money when player is broke', () => {
    const seated = withSeatedPartner(makeState({ money: 100 }));
    const partner = seated.relationshipState!.partner!;
    const actions = getActionsFor(partner, 'partner', seated);
    const propose = actions.find((a) => a.action.id === 'partner.propose')!;
    expect(propose.enabled).toBe(false);
    expect(propose.disabledReason).toBe('insufficient_money');
  });

  it('disables propose with condition_failed when bond is too low', () => {
    const seated = withSeatedPartner(makeState({ money: 10000 }), 30);
    const partner = seated.relationshipState!.partner!;
    const actions = getActionsFor(partner, 'partner', seated);
    const propose = actions.find((a) => a.action.id === 'partner.propose')!;
    expect(propose.enabled).toBe(false);
    expect(propose.disabledReason).toBe('condition_failed');
  });

  it('disables propose with insufficient_actions when budget is exhausted', () => {
    const seated = withSeatedPartner(
      makeState({ money: 10000, actionsRemainingThisYear: 0 }),
    );
    const partner = seated.relationshipState!.partner!;
    const actions = getActionsFor(partner, 'partner', seated);
    const propose = actions.find((a) => a.action.id === 'partner.propose')!;
    expect(propose.enabled).toBe(false);
    expect(propose.disabledReason).toBe('insufficient_actions');
  });

  it('disables every action when target is deceased', () => {
    const seated = withSeatedPartner(makeState({ money: 10000 }));
    const partner = { ...seated.relationshipState!.partner!, alive: false };
    const actions = getActionsFor(partner, 'partner', seated);
    for (const a of actions) {
      expect(a.enabled).toBe(false);
      expect(a.disabledReason).toBe('deceased');
    }
  });
});

describe('executeAction — partner.spend_time (deterministic)', () => {
  it('applies +happiness and +relationshipLevel to the target', () => {
    const seated = withSeatedPartner(makeState({ money: 10000 }), 60);
    const partner = seated.relationshipState!.partner!;
    const action = ACTIONS_BY_TYPE.partner.find((a) => a.id === 'partner.spend_time')!;
    const rng = createRng(42);

    const result = executeAction(seated, action, partner, 'partner', rng);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.state.stats.happiness).toBe(75); // 70 + 5
    expect(result.state.relationshipState!.partner!.relationshipLevel).toBe(65); // 60 + 5
  });

  it('does not consume action points (light tier)', () => {
    const seated = withSeatedPartner(
      makeState({ money: 10000, actionsRemainingThisYear: 2 }),
      60,
    );
    const partner = seated.relationshipState!.partner!;
    const action = ACTIONS_BY_TYPE.partner.find((a) => a.id === 'partner.spend_time')!;
    const result = executeAction(seated, action, partner, 'partner', createRng(1));
    if (!result.ok) throw new Error('expected ok');
    expect(result.state.actionsRemainingThisYear).toBe(2);
  });

  it('clamps relationshipLevel at 100', () => {
    const seated = withSeatedPartner(makeState({ money: 10000 }), 98);
    const partner = seated.relationshipState!.partner!;
    const action = ACTIONS_BY_TYPE.partner.find((a) => a.id === 'partner.spend_time')!;
    const result = executeAction(seated, action, partner, 'partner', createRng(1));
    if (!result.ok) throw new Error('expected ok');
    expect(result.state.relationshipState!.partner!.relationshipLevel).toBe(100);
  });

  it('returns a deterministic resolution (no narrative for deterministic actions)', () => {
    const seated = withSeatedPartner(makeState({ money: 10000 }), 60);
    const partner = seated.relationshipState!.partner!;
    const action = ACTIONS_BY_TYPE.partner.find((a) => a.id === 'partner.spend_time')!;
    const result = executeAction(seated, action, partner, 'partner', createRng(1));
    if (!result.ok) throw new Error('expected ok');
    expect(result.resolved.narrative).toBeNull();
    expect(result.resolved.deltas.find((d) => d.path === 'stats.happiness')?.after).toBe(75);
  });
});

describe('executeAction — partner.propose (probabilistic)', () => {
  function findOutcomeSeed(targetWeight: 70 | 20 | 10): number {
    // Weights total 100; outcomes evaluate top-to-bottom so:
    //   roll < 70 → success, 70 ≤ roll < 90 → hesitation, 90 ≤ roll → rejection.
    // Find a seed whose first .next() lands in the right bucket.
    for (let seed = 1; seed < 5000; seed++) {
      const rng = createRng(seed);
      const roll = rng.next() * 100;
      if (targetWeight === 70 && roll < 70) return seed;
      if (targetWeight === 20 && roll >= 70 && roll < 90) return seed;
      if (targetWeight === 10 && roll >= 90) return seed;
    }
    throw new Error(`no seed found for weight ${targetWeight}`);
  }

  it('success path promotes partner to fiance', () => {
    const seated = withSeatedPartner(makeState({ money: 10000 }));
    const partner = seated.relationshipState!.partner!;
    const action = ACTIONS_BY_TYPE.partner.find((a) => a.id === 'partner.propose')!;
    const seed = findOutcomeSeed(70);
    const result = executeAction(seated, action, partner, 'partner', createRng(seed));
    if (!result.ok) throw new Error('expected ok');

    expect(result.state.relationshipState!.fiance).not.toBeNull();
    expect(result.state.relationshipState!.partner).toBeNull();
    expect(result.state.relationshipState!.fiance!.firstName).toBe('Sara');
    expect(result.resolved.narrative).toContain('said yes');
  });

  it('hesitation path also promotes partner to fiance with a softer narrative', () => {
    const seated = withSeatedPartner(makeState({ money: 10000 }));
    const partner = seated.relationshipState!.partner!;
    const action = ACTIONS_BY_TYPE.partner.find((a) => a.id === 'partner.propose')!;
    const seed = findOutcomeSeed(20);
    const result = executeAction(seated, action, partner, 'partner', createRng(seed));
    if (!result.ok) throw new Error('expected ok');

    expect(result.state.relationshipState!.fiance).not.toBeNull();
    expect(result.resolved.narrative).toContain('hesitated');
  });

  it('rejection path breaks up — partner goes to casualEx, no fiance', () => {
    const seated = withSeatedPartner(makeState({ money: 10000 }));
    const partner = seated.relationshipState!.partner!;
    const action = ACTIONS_BY_TYPE.partner.find((a) => a.id === 'partner.propose')!;
    const seed = findOutcomeSeed(10);
    const result = executeAction(seated, action, partner, 'partner', createRng(seed));
    if (!result.ok) throw new Error('expected ok');

    expect(result.state.relationshipState!.partner).toBeNull();
    expect(result.state.relationshipState!.fiance).toBeNull();
    expect(result.state.relationshipState!.casualExes.length).toBe(1);
    expect(result.resolved.narrative).toContain('said no');
  });

  it('consumes one action point regardless of outcome', () => {
    const seated = withSeatedPartner(
      makeState({ money: 10000, actionsRemainingThisYear: 3 }),
    );
    const partner = seated.relationshipState!.partner!;
    const action = ACTIONS_BY_TYPE.partner.find((a) => a.id === 'partner.propose')!;
    const result = executeAction(
      seated,
      action,
      partner,
      'partner',
      createRng(findOutcomeSeed(70)),
    );
    if (!result.ok) throw new Error('expected ok');
    expect(result.state.actionsRemainingThisYear).toBe(2);
  });

  it('refuses to execute when relationshipLevel is below 60', () => {
    const seated = withSeatedPartner(makeState({ money: 10000 }), 30);
    const partner = seated.relationshipState!.partner!;
    const action = ACTIONS_BY_TYPE.partner.find((a) => a.id === 'partner.propose')!;
    const result = executeAction(seated, action, partner, 'partner', createRng(1));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.kind).toBe('condition_failed');
  });

  it('refuses to execute when no actions remain', () => {
    const seated = withSeatedPartner(
      makeState({ money: 10000, actionsRemainingThisYear: 0 }),
    );
    const partner = seated.relationshipState!.partner!;
    const action = ACTIONS_BY_TYPE.partner.find((a) => a.id === 'partner.propose')!;
    const result = executeAction(seated, action, partner, 'partner', createRng(1));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.kind).toBe('insufficient_actions');
  });
});

describe('executeAction — guards', () => {
  it('refuses ineligible target type', () => {
    const seated = withSeatedPartner(makeState({ money: 10000 }));
    const partner = seated.relationshipState!.partner!;
    const action = ACTIONS_BY_TYPE.partner.find((a) => a.id === 'partner.spend_time')!;
    // Pass 'friend' as type even though the action only applies to 'partner'.
    const result = executeAction(seated, action, partner, 'friend', createRng(1));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.kind).toBe('ineligible');
  });

  it('refuses to act on a deceased target', () => {
    const seated = withSeatedPartner(makeState({ money: 10000 }));
    const partner = { ...seated.relationshipState!.partner!, alive: false };
    const action = ACTIONS_BY_TYPE.partner.find((a) => a.id === 'partner.spend_time')!;
    const result = executeAction(seated, action, partner, 'partner', createRng(1));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.kind).toBe('deceased');
  });
});
