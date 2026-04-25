/**
 * Verify the interaction between addRelationship (now mints unique ids like
 * `rel-spouse-y2055-n4`) and removeRelationship (still filters by exact id).
 *
 * Concern: events like rel_breakup do
 *   { special: 'removeRelationship', payload: { id: 'rel-date-partner' } }
 * but the relationship in state has id 'rel-date-partner-y2050-n3'. Does the
 * remove ever match? Or does the partner get stuck in the relationships list
 * forever?
 */
import { applyEffect } from '../../src/game/engine/effectsApplier';
import type { PlayerState } from '../../src/game/types/gameState';

const baseState: PlayerState = {
  id: 'test',
  firstName: 'Test',
  lastName: 'User',
  age: 25,
  gender: 'female',
  country: 'GB',
  alive: true,
  birthYear: 2001,
  currentYear: 2026,
  stats: { health: 70, happiness: 70, smarts: 70, looks: 70 },
  money: 0,
  job: null,
  education: [],
  relationships: [],
  assets: [],
  criminalRecord: [],
  history: [],
  triggeredEventIds: [],
  actionsRemainingThisYear: 3,
};

console.log('=== Add a "rel-date-partner" via the activities pipeline (post-fix) ===');
let state = applyEffect(baseState, {
  special: 'addRelationship',
  payload: {
    id: 'rel-date-partner',
    type: 'partner',
    firstName: 'Alex',
    lastName: 'Rivera',
    age: 27,
    alive: true,
    relationshipLevel: 60,
  },
});
console.log('After add — relationships:', state.relationships.map((r) => `${r.id} (${r.firstName} ${r.lastName})`));

console.log('\n=== Try to remove with the *base* id (what rel_breakup does) ===');
state = applyEffect(state, {
  special: 'removeRelationship',
  payload: { id: 'rel-date-partner' },
});
console.log('After remove — relationships:', state.relationships.map((r) => `${r.id} (${r.firstName} ${r.lastName})`));

if (state.relationships.length === 0) {
  console.log('\n✅ Remove worked.');
} else {
  console.log('\n⚠ Remove DID NOT WORK. The partner is stuck in state.');
  console.log('   This means events like rel_breakup, rel_received_proposal, etc., that');
  console.log('   try to remove `rel-date-partner` / `rel-coworker-partner` / `rel-spouse`');
  console.log('   silently fail to actually remove the relationship after the fbedbed fix.');
}

console.log('\n=== Same test, but with rel-spouse ===');
let s2 = applyEffect(baseState, {
  special: 'addRelationship',
  payload: {
    id: 'rel-spouse',
    type: 'spouse',
    firstName: 'Jordan',
    lastName: 'Reyes',
    age: 28,
    alive: true,
    relationshipLevel: 88,
  },
});
console.log('After add — relationships:', s2.relationships.map((r) => `${r.id}`));
s2 = applyEffect(s2, {
  special: 'removeRelationship',
  payload: { id: 'rel-spouse' },
});
console.log('After remove(rel-spouse) — relationships:', s2.relationships.map((r) => `${r.id}`));
if (s2.relationships.length === 0) console.log('✅ Spouse removed.');
else console.log('⚠ Spouse still present — the breakup/divorce path silently no-ops.');
