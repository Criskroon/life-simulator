import { describe, expect, it } from 'vitest';
import { ACTIONS_BY_TYPE } from '../../src/game/data/actions';
import {
  cooldownKey,
  isActionOnCooldown,
  recordActionUsage,
  resetActionUsage,
} from '../../src/game/engine/actionCooldowns';
import {
  addPartner,
  emptyRelationshipState,
  syncLegacyView,
} from '../../src/game/engine/relationshipEngine';
import { executeAction, getActionsFor } from '../../src/game/engine/interactions';
import { createRng } from '../../src/game/engine/rng';
import type { Person, PlayerState } from '../../src/game/types/gameState';
import type { RelationshipAction } from '../../src/game/types/interactions';

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

function partnerPerson(): Person {
  return {
    id: 'rel-partner-y2026-n0',
    baseId: 'rel-partner',
    firstName: 'Sara',
    lastName: 'Vermeer',
    age: 29,
    alive: true,
    relationshipLevel: 70,
  };
}

const lightAction = ACTIONS_BY_TYPE.partner.find(
  (a) => a.id === 'partner.spend_time',
) as RelationshipAction;
const bigAction = ACTIONS_BY_TYPE.partner.find(
  (a) => a.id === 'partner.propose',
) as RelationshipAction;

describe('actionCooldowns helpers', () => {
  it('records a light-tier action and reports it as on cooldown', () => {
    const state = makeState();
    expect(isActionOnCooldown(state, 'rel-partner-y2026-n0', lightAction)).toBe(false);

    const after = recordActionUsage(state, 'rel-partner-y2026-n0', lightAction);
    expect(after.actionUsageThisYear).toContain(
      cooldownKey('rel-partner-y2026-n0', lightAction.id),
    );
    expect(isActionOnCooldown(after, 'rel-partner-y2026-n0', lightAction)).toBe(true);
  });

  it('does not track big-tier actions (gated by action points instead)', () => {
    const state = makeState();
    const after = recordActionUsage(state, 'rel-partner-y2026-n0', bigAction);
    expect(after.actionUsageThisYear).toEqual([]);
    expect(isActionOnCooldown(after, 'rel-partner-y2026-n0', bigAction)).toBe(false);
  });

  it('resetActionUsage clears the ledger so the action is fireable again next year', () => {
    const used = recordActionUsage(
      makeState(),
      'rel-partner-y2026-n0',
      lightAction,
    );
    const reset = resetActionUsage(used);
    expect(reset.actionUsageThisYear).toEqual([]);
    expect(isActionOnCooldown(reset, 'rel-partner-y2026-n0', lightAction)).toBe(false);
  });
});

describe('cooldown integration with executeAction / getActionsFor', () => {
  it('marks the action as on_cooldown after a successful execute, and refuses a re-fire', () => {
    let state = makeState();
    state = addPartner(state, partnerPerson(), state.currentYear);
    const seated = state.relationshipState!.partner!;

    const first = executeAction(state, lightAction, seated, 'partner', createRng(1));
    expect(first.ok).toBe(true);

    const afterFirst = first.ok ? first.state : state;

    const list = getActionsFor(seated, 'partner', afterFirst);
    const entry = list.find((a) => a.action.id === lightAction.id);
    expect(entry?.enabled).toBe(false);
    expect(entry?.disabledReason).toBe('on_cooldown');

    const second = executeAction(
      afterFirst,
      lightAction,
      seated,
      'partner',
      createRng(2),
    );
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.kind).toBe('on_cooldown');
    }
  });
});
