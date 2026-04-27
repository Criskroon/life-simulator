/**
 * X3a part 4: rel_propose + rel_received_proposal nerf.
 *
 * Pre-nerf, both events auto-promoted partner -> spouse via
 * `addRelationship` with type 'spouse', and the decline outcomes also
 * fanned out the partner-base `removeRelationship` sweeps that effectively
 * broke up the partner. That made engagement a slot-machine roll the
 * player couldn't avoid once the event fired.
 *
 * Post-nerf, both events stay as emotional pressure events: relationship-
 * level + happiness shifts, no slot changes. Promotion has to come from
 * the X3a-2 `partner.propose` action — a profile-driven, deliberate move.
 */

import { describe, expect, it } from 'vitest';
import { ALL_EVENTS } from '../../src/game/data/events';
import { ACTIONS_BY_TYPE } from '../../src/game/data/actions';
import { applyEffects } from '../../src/game/engine/effectsApplier';
import {
  addPartner,
  emptyRelationshipState,
  syncLegacyView,
} from '../../src/game/engine/relationshipEngine';
import { resolveChoice } from '../../src/game/engine/outcomeResolver';
import { executeAction } from '../../src/game/engine/interactions';
import { createRng } from '../../src/game/engine/rng';
import type { Effect, GameEvent } from '../../src/game/types/events';
import type { Person, PlayerState } from '../../src/game/types/gameState';

const PROMOTION_SPECIALS = new Set([
  'addFiance',
  'addSpouse',
]);

function findEvent(id: string): GameEvent {
  const event = ALL_EVENTS.find((e) => e.id === id);
  if (!event) throw new Error(`Event ${id} not in ALL_EVENTS`);
  return event;
}

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

function flattenAllPossibleEffects(event: GameEvent): Effect[] {
  const out: Effect[] = [];
  for (const choice of event.choices) {
    if (choice.effects) out.push(...choice.effects);
    if (choice.outcomes) {
      for (const o of choice.outcomes) out.push(...o.effects);
    }
  }
  return out;
}

describe('X3a-4 — rel_propose nerf', () => {
  const event = findEvent('rel_propose');

  it('emits no slot-promotion specials in any choice or outcome', () => {
    const effects = flattenAllPossibleEffects(event);
    const promotions = effects.filter(
      (e) => 'special' in e && PROMOTION_SPECIALS.has(e.special as string),
    );
    expect(promotions).toEqual([]);
  });

  it('emits no addRelationship specials with type spouse/fiance', () => {
    const effects = flattenAllPossibleEffects(event);
    const slotAdds = effects.filter((e) => {
      if (!('special' in e) || e.special !== 'addRelationship') return false;
      const type = (e.payload as { type?: string }).type;
      return type === 'spouse' || type === 'fiance';
    });
    expect(slotAdds).toEqual([]);
  });

  it('preserves the partner slot when ANY choice resolves (1000-iter sim)', () => {
    let preserved = 0;
    for (let seed = 1; seed <= 1000; seed++) {
      const rng = createRng(seed);
      const baseState = withSeatedPartner(makeState());
      // Pick a choice via the rng so all three branches get exercised.
      const choiceIdx = Math.floor(rng.next() * event.choices.length);
      const choice = event.choices[choiceIdx]!;
      const resolved = resolveChoice(choice, rng);
      const next = applyEffects(baseState, resolved.effects);
      if (next.relationshipState!.partner) preserved++;
      // Hard guard: spouse slot stays empty.
      expect(next.relationshipState!.spouse).toBeNull();
      expect(next.relationshipState!.fiance).toBeNull();
    }
    expect(preserved).toBe(1000);
  });

  it('shifts the partner relationshipLevel and happiness on each choice', () => {
    for (const choice of event.choices) {
      const baseState = withSeatedPartner(makeState(), 60);
      const resolved = resolveChoice(choice, createRng(1));
      const next = applyEffects(baseState, resolved.effects);
      // Stats moved.
      expect(next.stats.happiness).not.toBe(baseState.stats.happiness);
      // Partner relationshipLevel moved.
      expect(next.relationshipState!.partner?.relationshipLevel).not.toBe(60);
    }
  });
});

describe('X3a-4 — rel_received_proposal nerf', () => {
  const event = findEvent('rel_received_proposal');

  it('emits no slot-promotion specials in any choice or outcome', () => {
    const effects = flattenAllPossibleEffects(event);
    const promotions = effects.filter(
      (e) => 'special' in e && PROMOTION_SPECIALS.has(e.special as string),
    );
    expect(promotions).toEqual([]);
  });

  it('emits no addRelationship specials with type spouse/fiance', () => {
    const effects = flattenAllPossibleEffects(event);
    const slotAdds = effects.filter((e) => {
      if (!('special' in e) || e.special !== 'addRelationship') return false;
      const type = (e.payload as { type?: string }).type;
      return type === 'spouse' || type === 'fiance';
    });
    expect(slotAdds).toEqual([]);
  });

  it('preserves the partner slot when ANY choice resolves (1000-iter sim)', () => {
    let preserved = 0;
    for (let seed = 1; seed <= 1000; seed++) {
      const rng = createRng(seed);
      const baseState = withSeatedPartner(makeState());
      const choiceIdx = Math.floor(rng.next() * event.choices.length);
      const choice = event.choices[choiceIdx]!;
      const resolved = resolveChoice(choice, rng);
      const next = applyEffects(baseState, resolved.effects);
      if (next.relationshipState!.partner) preserved++;
      expect(next.relationshipState!.spouse).toBeNull();
      expect(next.relationshipState!.fiance).toBeNull();
    }
    expect(preserved).toBe(1000);
  });

  it('shifts the partner relationshipLevel and happiness on each choice', () => {
    for (const choice of event.choices) {
      const baseState = withSeatedPartner(makeState(), 60);
      const resolved = resolveChoice(choice, createRng(1));
      const next = applyEffects(baseState, resolved.effects);
      expect(next.stats.happiness).not.toBe(baseState.stats.happiness);
      expect(next.relationshipState!.partner?.relationshipLevel).not.toBe(60);
    }
  });
});

describe('X3a-4 — partner.propose still promotes (regression check)', () => {
  it('still moves the partner into the fiance slot via the deliberate action', () => {
    const action = ACTIONS_BY_TYPE.partner.find((a) => a.id === 'partner.propose');
    if (!action) throw new Error('missing partner.propose action');

    let preserved = 0;
    for (let seed = 1; seed <= 100; seed++) {
      const baseState = withSeatedPartner(makeState({ money: 50000 }), 80);
      const partner = baseState.relationshipState!.partner!;
      const result = executeAction(
        baseState,
        action,
        partner,
        'partner',
        createRng(seed),
      );
      if (!result.ok) {
        throw new Error(`partner.propose returned error: ${result.kind}`);
      }
      // 90% accept rate -> >= 70 promotions out of 100 with high confidence.
      if (result.state.relationshipState!.fiance) preserved++;
    }
    expect(preserved).toBeGreaterThanOrEqual(70);
  });
});
