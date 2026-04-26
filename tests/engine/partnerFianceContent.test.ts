/**
 * Coverage for the Session A1 partner/fiance event batch and the
 * `yearsTogether` engine extension that they depend on.
 *
 * The batch is the first content to use `relationshipState.partner.yearsTogether`
 * / `relationshipState.fiance.yearsTogether` as condition gates and is the
 * first content to call `addFiance` / `endEngagement` from event choices, so
 * the fiance slot is no longer dead code.
 */

import { describe, it, expect } from 'vitest';
import { ALL_EVENTS } from '../../src/game/data/events';
import { applyEffects } from '../../src/game/engine/effectsApplier';
import {
  addFiance,
  addPartner,
  addSpouse,
  decayRelationships,
  emptyRelationshipState,
  syncLegacyView,
} from '../../src/game/engine/relationshipEngine';
import { getEligibleEvents } from '../../src/game/engine/eventSelector';
import type { GameEvent } from '../../src/game/types/events';
import type { Person, PlayerState } from '../../src/game/types/gameState';

const A1_PARTNER_EVENTS = [
  'rel_partner_move_in_together',
  'rel_partner_first_vacation',
  'rel_partner_meet_family',
  'rel_partner_argument_money',
  'rel_partner_proposal_pressure',
  'rel_partner_long_term_commitment',
];

const A1_FIANCE_EVENTS = [
  'rel_fiance_planning_wedding',
  'rel_fiance_cold_feet',
  'rel_fiance_family_drama',
];

const A1_BREAKUP_EVENTS = [
  'rel_partner_breakup_crisis',
  'rel_fiance_called_off',
  'rel_partner_caught_cheating',
];

const ALL_A1 = [...A1_PARTNER_EVENTS, ...A1_FIANCE_EVENTS, ...A1_BREAKUP_EVENTS];

function findEvent(id: string): GameEvent {
  const event = ALL_EVENTS.find((e) => e.id === id);
  if (!event) throw new Error(`Event ${id} not in ALL_EVENTS`);
  return event;
}

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
    money: 50000,
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

function person(id: string, firstName = 'Sara'): Person {
  return {
    id,
    baseId: id,
    firstName,
    lastName: 'B',
    age: 28,
    alive: true,
    relationshipLevel: 70,
  };
}

/**
 * Move the clock forward N years using only the slot decay tick. Avoids the
 * whole gameLoop machinery so we can test condition gates in isolation.
 */
function tickYears(state: PlayerState, n: number): PlayerState {
  let s = state;
  for (let i = 0; i < n; i++) {
    s = decayRelationships({ ...s, currentYear: s.currentYear + 1, age: s.age + 1 });
  }
  return s;
}

describe('A1 — yearsTogether engine support', () => {
  it('addPartner seats yearsTogether=0 on a fresh partner', () => {
    const state = addPartner(makeState(), person('p1'), 2026);
    expect(state.relationshipState!.partner?.yearsTogether).toBe(0);
    expect(state.relationshipState!.partner?.metYear).toBe(2026);
  });

  it('decayRelationships refreshes yearsTogether each tick', () => {
    let state = addPartner(makeState(), person('p1'), 2026);
    state = tickYears(state, 3);
    expect(state.relationshipState!.partner?.yearsTogether).toBe(3);
  });

  it('addFiance resets metYear to currentYear so fiance.yearsTogether starts from the proposal', () => {
    let state = addPartner(makeState({ currentYear: 2020 }), person('p1'), 2020);
    state = tickYears(state, 5); // partner.yearsTogether === 5
    expect(state.relationshipState!.partner?.yearsTogether).toBe(5);

    state = addFiance(state, { ...state.relationshipState!.partner! }, state.currentYear);
    // After promotion, fiance just started — counter resets.
    expect(state.relationshipState!.fiance?.yearsTogether).toBe(0);
    expect(state.relationshipState!.fiance?.metYear).toBe(state.currentYear);
    expect(state.relationshipState!.partner).toBeNull();

    state = tickYears(state, 2);
    expect(state.relationshipState!.fiance?.yearsTogether).toBe(2);
  });
});

describe('A1 — partner-event eligibility', () => {
  it.each(A1_PARTNER_EVENTS)('%s requires a partner and is blocked by spouse', (id) => {
    const event = findEvent(id);

    // No partner: ineligible.
    expect(getEligibleEvents(makeState({ age: 35 }), [event])).not.toContain(event);

    // Married: every partner-event must be blocked by `lacks 'spouse'`.
    let married = addSpouse(makeState({ age: 35 }), person('s1', 'Alex'), 2026);
    expect(getEligibleEvents(married, [event])).not.toContain(event);
  });

  it('rel_partner_move_in_together gates on yearsTogether >= 1 and lacks fiance', () => {
    const event = findEvent('rel_partner_move_in_together');
    let state = addPartner(makeState({ age: 30 }), person('p1'), 2026);
    // First year together: ineligible.
    expect(getEligibleEvents(state, [event])).not.toContain(event);
    // Two years in: eligible.
    state = tickYears(state, 2);
    expect(getEligibleEvents(state, [event])).toContain(event);
  });

  it('rel_partner_proposal_pressure gates on yearsTogether >= 3', () => {
    const event = findEvent('rel_partner_proposal_pressure');
    let state = addPartner(makeState({ age: 28 }), person('p1'), 2026);
    state = tickYears(state, 2);
    expect(getEligibleEvents(state, [event])).not.toContain(event);
    state = tickYears(state, 1);
    expect(getEligibleEvents(state, [event])).toContain(event);
  });

  it('rel_partner_long_term_commitment gates on yearsTogether >= 7', () => {
    const event = findEvent('rel_partner_long_term_commitment');
    let state = addPartner(makeState({ age: 30 }), person('p1'), 2026);
    state = tickYears(state, 6);
    expect(getEligibleEvents(state, [event])).not.toContain(event);
    state = tickYears(state, 1);
    expect(getEligibleEvents(state, [event])).toContain(event);
  });
});

describe('A1 — fiance-event eligibility', () => {
  it.each(A1_FIANCE_EVENTS)('%s requires a fiance, not just a partner', (id) => {
    const event = findEvent(id);
    // Just a partner: ineligible for any fiance-gated event.
    let state = addPartner(makeState({ age: 28 }), person('p1'), 2026);
    state = tickYears(state, 5);
    expect(getEligibleEvents(state, [event])).not.toContain(event);
  });

  it('fiance-events do not fire while spouse slot is occupied', () => {
    const married = addSpouse(makeState({ age: 35 }), person('s1', 'Alex'), 2026);
    for (const id of A1_FIANCE_EVENTS) {
      const event = findEvent(id);
      // No fiance even though we're married — should not fire.
      expect(getEligibleEvents(married, [event])).not.toContain(event);
    }
  });

  it('rel_fiance_planning_wedding gates on fiance.yearsTogether >= 1', () => {
    const event = findEvent('rel_fiance_planning_wedding');
    let state = addPartner(makeState({ age: 28 }), person('p1'), 2026);
    state = tickYears(state, 3);
    state = addFiance(state, { ...state.relationshipState!.partner! }, state.currentYear);
    // Fresh engagement: ineligible.
    expect(getEligibleEvents(state, [event])).not.toContain(event);
    state = tickYears(state, 1);
    expect(getEligibleEvents(state, [event])).toContain(event);
  });
});

describe('A1 — breakup-event eligibility & effects', () => {
  it('rel_partner_breakup_crisis requires partner & no spouse', () => {
    const event = findEvent('rel_partner_breakup_crisis');
    expect(getEligibleEvents(makeState(), [event])).not.toContain(event);

    const partnered = addPartner(makeState(), person('p1'), 2026);
    expect(getEligibleEvents(partnered, [event])).toContain(event);

    const married = addSpouse(makeState(), person('s1'), 2026);
    expect(getEligibleEvents(married, [event])).not.toContain(event);
  });

  it('rel_fiance_called_off requires a fiance', () => {
    const event = findEvent('rel_fiance_called_off');
    expect(getEligibleEvents(makeState(), [event])).not.toContain(event);

    let state = addPartner(makeState(), person('p1'), 2026);
    expect(getEligibleEvents(state, [event])).not.toContain(event);

    state = addFiance(state, { ...state.relationshipState!.partner! }, 2026);
    expect(getEligibleEvents(state, [event])).toContain(event);
  });

  it('breaking up a partner sends them to casualEx (not significantEx)', () => {
    let state = addPartner(makeState(), person('p1', 'Sara'), 2026);
    state = applyEffects(state, [{ special: 'breakUpPartner' }]);
    expect(state.relationshipState!.partner).toBeNull();
    expect(state.relationshipState!.casualExes).toHaveLength(1);
    expect(state.relationshipState!.casualExes[0]?.firstName).toBe('Sara');
    expect(state.relationshipState!.significantExes).toHaveLength(0);
  });

  it('breaking off an engagement sends the fiance to significantEx', () => {
    let state = addPartner(makeState(), person('p1', 'Sara'), 2026);
    state = addFiance(state, { ...state.relationshipState!.partner! }, 2026);
    state = applyEffects(state, [{ special: 'endEngagement' }]);
    expect(state.relationshipState!.fiance).toBeNull();
    expect(state.relationshipState!.significantExes).toHaveLength(1);
    expect(state.relationshipState!.significantExes[0]?.formerSlot).toBe('fiance');
  });

  it('rel_partner_caught_cheating gates on a low relationshipLevel', () => {
    const event = findEvent('rel_partner_caught_cheating');
    // High-level relationship: ineligible.
    let happy = addPartner(makeState(), person('p1'), 2026);
    expect(happy.relationshipState!.partner!.relationshipLevel).toBe(70);
    expect(getEligibleEvents(happy, [event])).not.toContain(event);

    // Low-level: eligible.
    let strained = addPartner(makeState(), { ...person('p1'), relationshipLevel: 40 }, 2026);
    expect(getEligibleEvents(strained, [event])).toContain(event);
  });
});

describe('A1 — proposal pathway from event content', () => {
  it('rel_partner_proposal_pressure "Pop the question" promotes partner to fiance', () => {
    const event = findEvent('rel_partner_proposal_pressure');
    let state = addPartner(makeState({ age: 28 }), person('p1', 'Sara'), 2026);
    state = tickYears(state, 3);

    // Apply only the "addFiance" path of the first choice's first outcome,
    // skipping money/happiness for clarity.
    const choice = event.choices[0]!;
    const fianceEffects = choice.outcomes![0]!.effects.filter(
      (e) => e.special === 'addFiance',
    );
    state = applyEffects(state, fianceEffects);

    expect(state.relationshipState!.partner).toBeNull();
    expect(state.relationshipState!.fiance).not.toBeNull();
    // metYear must reset on promotion so engagement counters start at 0.
    expect(state.relationshipState!.fiance!.yearsTogether).toBe(0);
  });

  it('rel_fiance_planning_wedding "Big traditional wedding" promotes fiance to spouse', () => {
    const event = findEvent('rel_fiance_planning_wedding');
    let state = addPartner(makeState({ age: 28 }), person('p1', 'Sara'), 2026);
    state = addFiance(state, { ...state.relationshipState!.partner! }, 2026);
    state = tickYears(state, 1);

    const choice = event.choices[0]!;
    const spouseEffects = choice.outcomes![0]!.effects.filter(
      (e) => e.special === 'addSpouse',
    );
    state = applyEffects(state, spouseEffects);

    expect(state.relationshipState!.fiance).toBeNull();
    expect(state.relationshipState!.spouse).not.toBeNull();
    expect(state.relationshipState!.spouse!.firstName).toBe('Sara');
  });
});

describe('A1 — content sanity check', () => {
  it('all 12 A1 events are present in ALL_EVENTS', () => {
    for (const id of ALL_A1) {
      expect(ALL_EVENTS.find((e) => e.id === id), `missing event ${id}`).toBeDefined();
    }
    expect(ALL_A1).toHaveLength(12);
  });
});
