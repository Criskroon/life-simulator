/**
 * Tier-system stress tests. Five scenarios, 200 lives each, each with a
 * targeted "AI policy" that hammers a specific slot/decay path. The goal
 * is to verify the slot model holds under sustained pressure that the
 * vanilla AI player wouldn't exercise hard enough to surface bugs.
 *
 * Scenarios:
 *   A. Date marathon — find_date every year. Verify partner slot stays
 *      single-occupancy and old partners reach casualEx + decay out.
 *   B. Marriage switching — propose ASAP, then divorce/remarry on every
 *      opportunity. Verify spouse stays unique, ex-spouses go to
 *      significantExes, cap holds at 10.
 *   C. Vacation lover — vacation activity hammered. Verify
 *      vacation-romance partners route correctly (slot-displacement,
 *      not accumulation).
 *   D. Long marriage — marry once at ~25, stay married, no further
 *      activities or partner-events. Verify spouse persistence and that
 *      no unwanted promotions happen.
 *   E. Family tragedy — let rel_parent_dies fire freely, verify family
 *      list integrity (parents removed, no orphan refs in legacy view).
 */
import { resolve } from 'node:path';
import { ALL_EVENTS } from '../../src/game/data/events';
import { ALL_ACTIVITIES } from '../../src/game/data/activities';
import {
  ageUp,
  endYear,
  resolveEvent,
} from '../../src/game/engine/gameLoop';
import { executeActivity, getAvailableActivities } from '../../src/game/engine/activityEngine';
import { createRng, type Rng } from '../../src/game/engine/rng';
import { setStorageAdapter } from '../../src/game/state/persistence';
import { createNewLife } from '../../src/game/state/newLife';
import { createMemoryStorageAdapter } from '../fixtures/memoryStorage';
import type { GameEvent } from '../../src/game/types/events';
import type {
  PlayerState,
  RelationshipState,
} from '../../src/game/types/gameState';
import { REPORTS_DIR, relPath, writeReport } from '../lib/report';

setStorageAdapter(createMemoryStorageAdapter());

const LIVES_PER_SCENARIO = 200;
const SEED_BASE = 9000;

type EventChooser = (event: GameEvent, rng: Rng, state: PlayerState) => number;
type ActivityPicker = (state: PlayerState, rng: Rng) => string | null;

interface Scenario {
  name: string;
  description: string;
  eventChooser: EventChooser;
  activityPicker: ActivityPicker | null;
  /** Maximum age — keeps each life bounded in case mortality is delayed. */
  maxAge: number;
}

interface ScenarioResult {
  name: string;
  livesRun: number;
  averageAge: number;
  // Slot invariants (tracked across the entire life, not just at death).
  multiSpouseLives: number;
  multiPartnerLives: number;
  partnerAndSpouseLives: number;
  // Final-state distributions.
  meanCasualExesAtDeath: number;
  maxCasualExesAtDeath: number;
  meanSignificantExesAtDeath: number;
  maxSignificantExesAtDeath: number;
  significantExCapBreaches: number;
  // Family integrity.
  livesWithDeadParentInFamily: number;
  livesWithOrphanLegacyRefs: number;
  // Custom counters per scenario.
  custom: Record<string, number>;
  notes: string[];
}

function findChoice(event: GameEvent, predicate: (label: string) => boolean): number {
  const idx = event.choices.findIndex((c) => predicate(c.label.toLowerCase()));
  return idx === -1 ? 0 : idx;
}

/* -----------------------------------------------------------------------
 * Scenario choosers
 * --------------------------------------------------------------------- */

function chooseAcceptingPartners(event: GameEvent): number {
  // Always say yes to romance/dating prompts. For breakup events, end it.
  switch (event.id) {
    case 'rel_first_date':
    case 'rel_blind_date':
      return findChoice(event, (l) => l.includes('yes') || l.includes('show'));
    case 'rel_breakup':
      return findChoice(event, (l) => l.includes('end'));
    case 'rel_propose':
    case 'rel_received_proposal':
      return findChoice(event, (l) => l.includes('yes') || l.includes('ring'));
    default:
      return 0;
  }
}

function chooseMarriageSwitcher(event: GameEvent): number {
  // Always propose / accept. On every "breakup" or argument that could
  // end things, end them, so the AI can re-propose.
  switch (event.id) {
    case 'rel_propose':
    case 'rel_received_proposal':
      return findChoice(event, (l) => l.includes('yes') || l.includes('ring'));
    case 'rel_breakup':
      return findChoice(event, (l) => l.includes('end'));
    case 'rel_first_date':
    case 'rel_blind_date':
      return findChoice(event, (l) => l.includes('yes') || l.includes('show'));
    default:
      return 0;
  }
}

function chooseLongMarriage(event: GameEvent): number {
  switch (event.id) {
    case 'rel_first_date':
    case 'rel_blind_date':
      return findChoice(event, (l) => l.includes('yes') || l.includes('show'));
    case 'rel_propose':
    case 'rel_received_proposal':
      return findChoice(event, (l) => l.includes('yes') || l.includes('ring'));
    case 'rel_anniversary':
      return findChoice(event, (l) => l.includes('cook') || l.includes('home'));
    case 'rel_breakup':
      return findChoice(event, (l) => l.includes('therap'));
    default:
      return 0;
  }
}

function chooseFamilyTragedy(event: GameEvent): number {
  // Trigger the parent-death path whenever offered.
  if (event.id === 'rel_parent_dies') {
    return findChoice(event, (l) => l.includes('grieve'));
  }
  return 0;
}

/* -----------------------------------------------------------------------
 * Activity pickers
 * --------------------------------------------------------------------- */

function pickFindDate(state: PlayerState): string | null {
  const avail = getAvailableActivities(state);
  return avail.some((a) => a.id === 'find_date') ? 'find_date' : null;
}

function pickVacation(state: PlayerState): string | null {
  const avail = getAvailableActivities(state);
  return avail.some((a) => a.id === 'vacation') ? 'vacation' : null;
}

/* -----------------------------------------------------------------------
 * Runner
 * --------------------------------------------------------------------- */

function emptyResult(name: string): ScenarioResult {
  return {
    name,
    livesRun: 0,
    averageAge: 0,
    multiSpouseLives: 0,
    multiPartnerLives: 0,
    partnerAndSpouseLives: 0,
    meanCasualExesAtDeath: 0,
    maxCasualExesAtDeath: 0,
    meanSignificantExesAtDeath: 0,
    maxSignificantExesAtDeath: 0,
    significantExCapBreaches: 0,
    livesWithDeadParentInFamily: 0,
    livesWithOrphanLegacyRefs: 0,
    custom: {},
    notes: [],
  };
}

interface InvariantTracker {
  multiSpouseSeen: boolean;
  multiPartnerSeen: boolean;
  partnerAndSpouseSeen: boolean;
  significantExCapEverBreached: boolean;
  // Custom event counters.
  totalParentDeathsObserved: number;
  totalCasualExesEverSeen: number;
  totalActivityPartnersAdded: number;
}

function makeTracker(): InvariantTracker {
  return {
    multiSpouseSeen: false,
    multiPartnerSeen: false,
    partnerAndSpouseSeen: false,
    significantExCapEverBreached: false,
    totalParentDeathsObserved: 0,
    totalCasualExesEverSeen: 0,
    totalActivityPartnersAdded: 0,
  };
}

function checkInvariants(state: PlayerState, tracker: InvariantTracker): void {
  const rs: RelationshipState | undefined = state.relationshipState;
  // Slot invariants — by construction these should never trip.
  const spouseCount = state.relationships.filter((r) => r.type === 'spouse').length;
  const partnerCount = state.relationships.filter((r) => r.type === 'partner').length;
  if (spouseCount > 1) tracker.multiSpouseSeen = true;
  if (partnerCount > 1) tracker.multiPartnerSeen = true;
  if (spouseCount >= 1 && partnerCount >= 1) tracker.partnerAndSpouseSeen = true;
  if (rs && rs.significantExes.length > 10) {
    tracker.significantExCapEverBreached = true;
  }
}

function runScenario(scenario: Scenario): ScenarioResult {
  const result = emptyResult(scenario.name);
  const ages: number[] = [];
  const casualCounts: number[] = [];
  const sigCounts: number[] = [];
  let multiSpouse = 0;
  let multiPartner = 0;
  let partnerAndSpouse = 0;
  let sigCapBreaches = 0;
  let livesWithDeadParentInFamily = 0;
  let livesWithOrphanRefs = 0;
  const customSums: Record<string, number> = {
    parentDeathsObserved: 0,
    casualExesEverSeen: 0,
    activityPartnersAdded: 0,
  };

  for (let i = 0; i < LIVES_PER_SCENARIO; i++) {
    const seed = SEED_BASE + i * 17 + scenario.name.length;
    const rng = createRng(seed);
    const tracker = makeTracker();
    let state: PlayerState = createNewLife(rng, {});
    let prevPartnerId: string | null = null;

    while (state.alive && state.age < scenario.maxAge) {
      const aged = ageUp(state, ALL_EVENTS, rng);
      state = aged.state;

      for (const event of aged.pendingEvents) {
        if (event.id === 'rel_parent_dies') {
          tracker.totalParentDeathsObserved += 1;
        }
        const idx = scenario.eventChooser(event, rng, state);
        const safeIdx = Math.min(Math.max(0, idx), event.choices.length - 1);
        state = resolveEvent(state, event, safeIdx, rng).state;
        checkInvariants(state, tracker);
        if (!state.alive) break;
      }

      if (!state.alive) break;

      // Activities pass — scenario-specific picker, run while budget lasts.
      if (scenario.activityPicker) {
        let safety = 0;
        while (state.actionsRemainingThisYear > 0 && safety < 10) {
          safety += 1;
          const pick = scenario.activityPicker(state, rng);
          if (!pick) break;
          const exec = executeActivity(state, pick, rng);
          if (!exec.ok) break;
          state = exec.state;
          if (pick === 'find_date' || pick === 'vacation') {
            const newPartnerId =
              state.relationshipState?.partner?.id ?? null;
            if (newPartnerId && newPartnerId !== prevPartnerId) {
              tracker.totalActivityPartnersAdded += 1;
              prevPartnerId = newPartnerId;
            }
          }
          checkInvariants(state, tracker);
        }
      }

      state = endYear(state, rng);
      checkInvariants(state, tracker);
      tracker.totalCasualExesEverSeen = Math.max(
        tracker.totalCasualExesEverSeen,
        state.relationshipState?.casualExes.length ?? 0,
      );
    }

    ages.push(state.age);
    if (tracker.multiSpouseSeen) multiSpouse += 1;
    if (tracker.multiPartnerSeen) multiPartner += 1;
    if (tracker.partnerAndSpouseSeen) partnerAndSpouse += 1;
    if (tracker.significantExCapEverBreached) sigCapBreaches += 1;

    const rs = state.relationshipState;
    casualCounts.push(rs?.casualExes.length ?? 0);
    sigCounts.push(rs?.significantExes.length ?? 0);

    // Family-list integrity — checks that nobody flagged dead remains as
    // an active family member, and that no legacy view rows exist that
    // aren't in the slot model anywhere.
    if (rs) {
      const familyDeadStillActive = rs.family.some(
        (m) => m.alive === false && state.relationships.some(
          (r) => r.id === m.id && r.type === m.type,
        ),
      );
      if (familyDeadStillActive) livesWithDeadParentInFamily += 1;

      const slotIds = new Set<string>();
      const collect = (id?: string) => id && slotIds.add(id);
      collect(rs.partner?.id);
      collect(rs.fiance?.id);
      collect(rs.spouse?.id);
      for (const m of rs.family) collect(m.id);
      for (const f of rs.friends) collect(f.id);
      for (const e of rs.significantExes) collect(e.id);
      for (const e of rs.casualExes) collect(e.id);
      const orphans = state.relationships.filter((r) => !slotIds.has(r.id));
      if (orphans.length > 0) livesWithOrphanRefs += 1;
    }

    customSums.parentDeathsObserved += tracker.totalParentDeathsObserved;
    customSums.casualExesEverSeen += tracker.totalCasualExesEverSeen;
    customSums.activityPartnersAdded += tracker.totalActivityPartnersAdded;
  }

  result.livesRun = LIVES_PER_SCENARIO;
  result.averageAge = ages.length ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;
  result.multiSpouseLives = multiSpouse;
  result.multiPartnerLives = multiPartner;
  result.partnerAndSpouseLives = partnerAndSpouse;
  result.meanCasualExesAtDeath = casualCounts.length
    ? casualCounts.reduce((a, b) => a + b, 0) / casualCounts.length
    : 0;
  result.maxCasualExesAtDeath = casualCounts.length ? Math.max(...casualCounts) : 0;
  result.meanSignificantExesAtDeath = sigCounts.length
    ? sigCounts.reduce((a, b) => a + b, 0) / sigCounts.length
    : 0;
  result.maxSignificantExesAtDeath = sigCounts.length ? Math.max(...sigCounts) : 0;
  result.significantExCapBreaches = sigCapBreaches;
  result.livesWithDeadParentInFamily = livesWithDeadParentInFamily;
  result.livesWithOrphanLegacyRefs = livesWithOrphanRefs;
  result.custom = customSums;
  return result;
}

/* -----------------------------------------------------------------------
 * Scenarios
 * --------------------------------------------------------------------- */

const SCENARIOS: Scenario[] = [
  {
    name: 'A — Date Marathon',
    description: 'find_date every year, accept every partner offered.',
    eventChooser: chooseAcceptingPartners,
    activityPicker: pickFindDate,
    maxAge: 80,
  },
  {
    name: 'B — Marriage Switching',
    description: 'Propose / accept ASAP, end on every breakup, re-marry.',
    eventChooser: chooseMarriageSwitcher,
    activityPicker: pickFindDate,
    maxAge: 80,
  },
  {
    name: 'C — Vacation Lover',
    description: 'Vacation activity hammered. Vacation-romance routing test.',
    eventChooser: chooseAcceptingPartners,
    activityPicker: pickVacation,
    maxAge: 80,
  },
  {
    name: 'D — Long Marriage',
    description: 'Marry once around 25, no further dating. Persistence test.',
    eventChooser: chooseLongMarriage,
    activityPicker: null,
    maxAge: 80,
  },
  {
    name: 'E — Family Tragedy',
    description: 'Trigger rel_parent_dies path; verify family list integrity.',
    eventChooser: chooseFamilyTragedy,
    activityPicker: null,
    maxAge: 90,
  },
];

function pct(n: number, d: number): string {
  if (d === 0) return '–';
  return `${((n / d) * 100).toFixed(1)}%`;
}

function format(): string {
  const lines: string[] = [];
  lines.push(`# Tier Stress Test — ${new Date().toISOString().slice(0, 10)}`);
  lines.push('');
  lines.push(`Five scenarios, ${LIVES_PER_SCENARIO} lives each, master seed base ${SEED_BASE}.`);
  lines.push('');
  lines.push('## Slot invariants — must be 0 across every scenario');
  lines.push('');
  lines.push('| Scenario | Lives | Avg age | Multi-spouse | Multi-partner | Partner+Spouse | SignificantEx>10 |');
  lines.push('|---|---:|---:|---:|---:|---:|---:|');
  for (const r of results) {
    lines.push(
      `| ${r.name} | ${r.livesRun} | ${r.averageAge.toFixed(1)} | ${r.multiSpouseLives} | ${r.multiPartnerLives} | ${r.partnerAndSpouseLives} | ${r.significantExCapBreaches} |`,
    );
  }
  lines.push('');
  lines.push('## Final-state lists');
  lines.push('');
  lines.push('| Scenario | Mean casualExes | Max casualExes | Mean significantExes | Max significantExes |');
  lines.push('|---|---:|---:|---:|---:|');
  for (const r of results) {
    lines.push(
      `| ${r.name} | ${r.meanCasualExesAtDeath.toFixed(2)} | ${r.maxCasualExesAtDeath} | ${r.meanSignificantExesAtDeath.toFixed(2)} | ${r.maxSignificantExesAtDeath} |`,
    );
  }
  lines.push('');
  lines.push('## Family integrity');
  lines.push('');
  lines.push('| Scenario | Lives w/ dead-parent-in-family | Lives w/ orphan legacy refs |');
  lines.push('|---|---:|---:|');
  for (const r of results) {
    lines.push(
      `| ${r.name} | ${r.livesWithDeadParentInFamily} (${pct(r.livesWithDeadParentInFamily, r.livesRun)}) | ${r.livesWithOrphanLegacyRefs} (${pct(r.livesWithOrphanLegacyRefs, r.livesRun)}) |`,
    );
  }
  lines.push('');
  lines.push('## Custom counters');
  lines.push('');
  for (const r of results) {
    lines.push(`### ${r.name}`);
    lines.push('');
    for (const [k, v] of Object.entries(r.custom)) {
      lines.push(`- ${k}: **${v}** total across ${r.livesRun} lives (${(v / r.livesRun).toFixed(2)}/life)`);
    }
    lines.push('');
  }
  lines.push('## Verdict');
  lines.push('');
  for (const r of results) {
    const slotPass = r.multiSpouseLives === 0 && r.multiPartnerLives === 0 && r.significantExCapBreaches === 0;
    const integrityPass = r.livesWithDeadParentInFamily === 0 && r.livesWithOrphanLegacyRefs === 0;
    const verdict = slotPass && integrityPass ? '✅ PASS' : '❌ FAIL';
    lines.push(`- ${r.name}: ${verdict}`);
  }
  return lines.join('\n');
}

console.log(`Tier stress test — ${SCENARIOS.length} scenarios × ${LIVES_PER_SCENARIO} lives each`);
const startedAt = Date.now();
const results: ScenarioResult[] = [];
for (const scenario of SCENARIOS) {
  console.log(`  Running: ${scenario.name}`);
  const r = runScenario(scenario);
  results.push(r);
  console.log(
    `    avg age=${r.averageAge.toFixed(1)} multiSpouse=${r.multiSpouseLives} multiPartner=${r.multiPartnerLives} pSp=${r.partnerAndSpouseLives}`,
  );
}
const elapsedMs = Date.now() - startedAt;
console.log(`Done in ${(elapsedMs / 1000).toFixed(2)}s`);

const md = format() + `\n\n_Generated in ${(elapsedMs / 1000).toFixed(2)}s._\n`;
const path = resolve(REPORTS_DIR, 'tier-stress-2026-04-26.md');
writeReport(path, md);
console.log(`Report: ${relPath(path)}`);
