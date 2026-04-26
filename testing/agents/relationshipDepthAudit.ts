/**
 * Relationship depth audit. Goes beyond "do relationships exist?" and
 * measures whether they get gameplay during their lifetime in state.
 *
 * For each relationship instance (tracked by stable Person.id):
 *   - source (event/activity/birth that added it)
 *   - ageAtAdd / ageAtRemove
 *   - touch ages: years where a targeted event/activity fired on this type
 *   - max silence: longest gap (in years) without a touch during lifetime
 *
 * "Touch" is conservative: an event/activity counts as a touch on an
 * instance only if its conditions explicitly require that instance's
 * relationship type (e.g. `has 'spouse'`) OR if its effects directly
 * reference the instance's baseId (removeRelationship payload, addRelationship
 * with same baseId, resetFriendContact). General relationship-themed events
 * without a type-specific condition (rel_friend_wedding, rel_meet_old_friend,
 * rel_blind_date, rel_first_date) do NOT count as touches on existing
 * relationships — they're either ambient social atmosphere or formation paths.
 *
 * Run with: npx tsx testing/agents/relationshipDepthAudit.ts
 */

import { resolve } from 'node:path';
import { ALL_EVENTS } from '../../src/game/data/events';
import { ALL_ACTIVITIES } from '../../src/game/data/activities';
import { COUNTRIES } from '../../src/game/data/countries';
import {
  executeActivity,
  getAvailableActivities,
} from '../../src/game/engine/activityEngine';
import { canAffordChoice } from '../../src/game/engine/choicePreview';
import {
  ageUp,
  endYear,
  resolveEvent,
} from '../../src/game/engine/gameLoop';
import { createRng, type Rng } from '../../src/game/engine/rng';
import { setStorageAdapter } from '../../src/game/state/persistence';
import { createNewLife } from '../../src/game/state/newLife';
import type { Activity } from '../../src/game/types/activities';
import type { Choice, Effect, GameEvent, Outcome } from '../../src/game/types/events';
import type {
  PlayerState,
  Relationship,
  RelationshipType,
} from '../../src/game/types/gameState';
import { createMemoryStorageAdapter } from '../fixtures/memoryStorage';
import { REPORTS_DIR, relPath, writeReport } from '../lib/report';

setStorageAdapter(createMemoryStorageAdapter());

const LIVES = 1000;
const SEED = 7;
const SILENCE_THRESHOLD_YEARS = 5;

/* -----------------------------------------------------------------------
 * Static analysis: for each event and activity, derive which relationship
 * types it "targets" (gates on via condition).
 * --------------------------------------------------------------------- */

const RELATIONSHIP_TYPES: RelationshipType[] = [
  'partner',
  'fiance',
  'spouse',
  'mother',
  'father',
  'sibling',
  'child',
  'friend',
  'casualEx',
  'significantEx',
];

function targetedTypesForConditions(
  conditions: ReadonlyArray<{ path: string; op: string; value: unknown }> | undefined,
): RelationshipType[] {
  if (!conditions) return [];
  const out: RelationshipType[] = [];
  for (const c of conditions) {
    if (c.path !== 'relationships') continue;
    if (c.op !== 'has') continue;
    const v = c.value as RelationshipType;
    if (RELATIONSHIP_TYPES.includes(v)) out.push(v);
  }
  return out;
}

const EVENT_TARGETS = new Map<string, RelationshipType[]>(
  ALL_EVENTS.map((e) => [e.id, targetedTypesForConditions(e.conditions)]),
);

const ACTIVITY_TARGETS = new Map<string, RelationshipType[]>(
  ALL_ACTIVITIES.map((a) => [a.id, targetedTypesForConditions(a.conditions)]),
);

// `family_time` has no condition but is intrinsically family-targeted.
ACTIVITY_TARGETS.set('family_time', ['mother', 'father', 'sibling', 'child']);

/** Pull every effect (deterministic and across all probabilistic outcomes). */
function gatherAllEffects(choiceOrActivity: Choice | Activity): Effect[] {
  const out: Effect[] = [];
  if ('effects' in choiceOrActivity && choiceOrActivity.effects) {
    out.push(...choiceOrActivity.effects);
  }
  if ('outcomes' in choiceOrActivity && choiceOrActivity.outcomes) {
    for (const o of choiceOrActivity.outcomes as Outcome[]) {
      if (o.effects) out.push(...o.effects);
    }
  }
  return out;
}

/** baseIds an event can add (for source attribution + sweep tracking). */
function addedBaseIdsFromEvent(event: GameEvent): Set<string> {
  const s = new Set<string>();
  for (const choice of event.choices) {
    for (const eff of gatherAllEffects(choice)) {
      if (
        (eff.special === 'addRelationship' ||
          eff.special === 'addPartner' ||
          eff.special === 'addFiance' ||
          eff.special === 'addSpouse' ||
          eff.special === 'addFriend' ||
          eff.special === 'addFamilyMember') &&
        eff.payload &&
        typeof eff.payload.id === 'string'
      ) {
        s.add(eff.payload.id);
      }
    }
  }
  return s;
}

function addedBaseIdsFromActivity(activity: Activity): Set<string> {
  const s = new Set<string>();
  for (const eff of gatherAllEffects(activity)) {
    if (
      (eff.special === 'addRelationship' ||
        eff.special === 'addPartner' ||
        eff.special === 'addFiance' ||
        eff.special === 'addSpouse' ||
        eff.special === 'addFriend' ||
        eff.special === 'addFamilyMember') &&
      eff.payload &&
      typeof eff.payload.id === 'string'
    ) {
      s.add(eff.payload.id);
    }
  }
  return s;
}

/* -----------------------------------------------------------------------
 * Per-life instance tracking
 * --------------------------------------------------------------------- */

interface InstanceRecord {
  instanceId: string;
  baseId: string;
  initialType: RelationshipType;
  currentType: RelationshipType;
  source: { kind: 'event' | 'activity' | 'birth'; id: string };
  ageAtAdd: number;
  ageAtRemove: number | null;
  removeReason:
    | 'event'
    | 'activity'
    | 'fade'
    | 'displaced-to-ex'
    | 'still-present-at-death'
    | 'unknown'
    | null;
  touchAges: number[]; // ages at which this instance was targeted
  eventTouches: number; // touches sourced from events
  activityTouches: number; // touches sourced from activities
  typeHistory: Array<{ age: number; type: RelationshipType }>;
}

interface LifeRecord {
  countryCode: string;
  yearsLived: number;
  causeOfDeath: string;
  instances: InstanceRecord[];
  // Timing of significant transitions
  marriageStartAge: number | null;
  marriageEndAge: number | null;
  spouseInstanceId: string | null;
  marriageEndedBy: 'still-married-at-death' | 'divorce' | 'widowed' | 'never' | null;
}

interface PerEventCounter {
  fires: number; // total fires across all lives
  addsCounted: number; // adds attributed to this event
}

/** Stable Person id is `${baseId}-y${year}-n${seed}`. */
function indexInstancesById(state: PlayerState): Map<string, Relationship> {
  const m = new Map<string, Relationship>();
  for (const r of state.relationships) m.set(r.id, r);
  return m;
}

function defaultEventChooser(
  event: GameEvent,
  state: PlayerState,
  rng: Rng,
): number {
  const indices = event.choices.map((_, i) => i);
  const affordable = indices.filter((i) =>
    canAffordChoice(state, event.choices[i]!),
  );
  if (affordable.length > 0) {
    return affordable[rng.int(0, affordable.length - 1)]!;
  }
  let best = 0;
  let bestCost = Number.NEGATIVE_INFINITY;
  for (const i of indices) {
    const c = event.choices[i]!.cost ?? 0;
    if (c > bestCost) {
      bestCost = c;
      best = i;
    }
  }
  return best;
}

function activityCanBeAfforded(activity: Activity, state: PlayerState): boolean {
  return canAffordChoice(state, { label: activity.name, cost: activity.cost });
}

function scoreActivity(activity: Activity, state: PlayerState): number {
  let score = 1;
  const { health, happiness, smarts } = state.stats;
  const friendCount = state.relationships.filter(
    (r) => r.type === 'friend',
  ).length;
  const hasJob = state.job !== null;

  if (activity.category === 'mind_body') {
    if (health < 60 || happiness < 60 || smarts < 60) score *= 1.6;
    else score *= 1.0;
  }
  if (activity.category === 'career_money') {
    if (hasJob) score *= 1.4;
    else score *= 0.7;
  }
  if (activity.category === 'love_social') {
    if (friendCount < 2) score *= 1.5;
    else score *= 1.0;
  }
  return score;
}

function pickActivityForYear(
  state: PlayerState,
  rng: Rng,
  alreadyDoneThisYear: Map<string, number>,
): Activity | null {
  const available = getAvailableActivities(state).filter((act) => {
    if (state.actionsRemainingThisYear < act.actionCost) return false;
    if (!activityCanBeAfforded(act, state)) return false;
    if ((alreadyDoneThisYear.get(act.id) ?? 0) >= 2) return false;
    return true;
  });
  if (available.length === 0) return null;

  const weighted = available.map((item) => ({
    item,
    weight: scoreActivity(item, state),
  }));
  return rng.weighted(weighted);
}

/* -----------------------------------------------------------------------
 * Main per-life simulator with full instrumentation.
 * --------------------------------------------------------------------- */

interface SimulateOptions {
  seed: number;
  countryCode: string;
}

interface SimulateResult {
  life: LifeRecord;
  // For aggregate per-source counters across lives.
  perEventStats: Map<string, { fires: number; touchesAttributed: number }>;
  perActivityStats: Map<string, { runs: number; touchesAttributed: number }>;
}

function simulateOneLife(opts: SimulateOptions): SimulateResult {
  const rng = createRng(opts.seed);
  const maxAge = 130;
  const engageP = 0.6;
  const maxActsPerYear = 5;

  let state = createNewLife(rng, { countryId: opts.countryCode });

  const instances = new Map<string, InstanceRecord>();
  const knownIds = new Set<string>();

  const perEventStats = new Map<
    string,
    { fires: number; touchesAttributed: number }
  >();
  const perActivityStats = new Map<
    string,
    { runs: number; touchesAttributed: number }
  >();

  let marriageStartAge: number | null = null;
  let marriageEndAge: number | null = null;
  let spouseInstanceId: string | null = null;
  let marriageEndedBy: LifeRecord['marriageEndedBy'] = null;

  // Seed birth-time family records.
  for (const r of state.relationships) {
    instances.set(r.id, {
      instanceId: r.id,
      baseId: r.baseId ?? r.id,
      initialType: r.type,
      currentType: r.type,
      source: { kind: 'birth', id: 'createNewLife' },
      ageAtAdd: 0,
      ageAtRemove: null,
      removeReason: null,
      touchAges: [],
      eventTouches: 0,
      activityTouches: 0,
      typeHistory: [{ age: 0, type: r.type }],
    });
    knownIds.add(r.id);
  }

  while (state.alive && state.age < maxAge) {
    const ageResult = ageUp(state, ALL_EVENTS, rng);
    state = ageResult.state;

    // Detect rels that disappeared during the decay tick (casual ex
    // expiry, friend fade). Anything that was tracked but no longer
    // present is a "fade" removal.
    const postDecayIds = indexInstancesById(state);
    for (const inst of instances.values()) {
      if (
        inst.ageAtRemove === null &&
        knownIds.has(inst.instanceId) &&
        !postDecayIds.has(inst.instanceId)
      ) {
        inst.ageAtRemove = state.age;
        inst.removeReason = 'fade';
      }
    }
    // Update type history for surviving instances.
    for (const [id, rel] of postDecayIds) {
      const inst = instances.get(id);
      if (inst && inst.currentType !== rel.type) {
        inst.currentType = rel.type;
        inst.typeHistory.push({ age: state.age, type: rel.type });
      }
    }

    for (const event of ageResult.pendingEvents) {
      const stats = perEventStats.get(event.id) ?? {
        fires: 0,
        touchesAttributed: 0,
      };
      stats.fires += 1;
      perEventStats.set(event.id, stats);

      const targets = EVENT_TARGETS.get(event.id) ?? [];

      // ---- Pre-event touch attribution (instances of targeted types). ----
      const preIndex = indexInstancesById(state);
      const touchedThisFire = new Set<string>();
      if (targets.length > 0) {
        for (const inst of instances.values()) {
          if (inst.ageAtRemove !== null) continue;
          if (!targets.includes(inst.currentType)) continue;
          inst.touchAges.push(state.age);
          inst.eventTouches += 1;
          touchedThisFire.add(inst.instanceId);
        }
        stats.touchesAttributed += touchedThisFire.size;
      }

      // ---- Apply event ----
      const idx = defaultEventChooser(event, state, rng);
      const safeIdx = Math.min(Math.max(0, idx), event.choices.length - 1);
      const result = resolveEvent(state, event, safeIdx, rng);
      state = result.state;

      // ---- Detect post-event adds/removes for this event. ----
      const postIndex = indexInstancesById(state);
      // Adds
      for (const [id, rel] of postIndex) {
        if (knownIds.has(id)) continue;
        knownIds.add(id);
        instances.set(id, {
          instanceId: id,
          baseId: rel.baseId ?? id,
          initialType: rel.type,
          currentType: rel.type,
          source: { kind: 'event', id: event.id },
          ageAtAdd: state.age,
          ageAtRemove: null,
          removeReason: null,
          touchAges: [],
          eventTouches: 0,
          activityTouches: 0,
          typeHistory: [{ age: state.age, type: rel.type }],
        });
        if (rel.type === 'spouse' && marriageStartAge === null) {
          marriageStartAge = state.age;
          spouseInstanceId = id;
        }
      }
      // Removes
      for (const [id, inst] of instances) {
        if (inst.ageAtRemove !== null) continue;
        if (!postIndex.has(id) && preIndex.has(id)) {
          inst.ageAtRemove = state.age;
          // Heuristic: if the same instance moved into ex bucket this
          // tick, the instance row is still in `relationships` (just with
          // a different type). If it's gone entirely, the event called
          // removeRelationship / divorceSpouse / breakUpPartner / loseFriend.
          inst.removeReason = 'event';

          // Spouse-specific: check whether the spouse was divorced (still
          // present as significantEx in some bucket) or if marriage ended.
          if (id === spouseInstanceId) {
            marriageEndAge = state.age;
            marriageEndedBy = 'divorce';
          }
        }
      }
      // Type transitions on existing instances (slot moves).
      for (const [id, rel] of postIndex) {
        const inst = instances.get(id);
        if (!inst) continue;
        if (inst.currentType !== rel.type) {
          inst.currentType = rel.type;
          inst.typeHistory.push({ age: state.age, type: rel.type });
          // Spouse-to-significantEx is a divorce.
          if (id === spouseInstanceId && rel.type === 'significantEx') {
            marriageEndAge = state.age;
            marriageEndedBy = 'divorce';
          }
        }
      }

      if (!state.alive) break;
    }

    if (!state.alive) break;

    // ---- Activities-AI pass ----
    if (rng.next() < engageP) {
      const doneThisYear = new Map<string, number>();
      let actsThisYear = 0;
      let safety = 0;
      while (
        state.actionsRemainingThisYear > 0 &&
        actsThisYear < maxActsPerYear &&
        safety < 20
      ) {
        safety += 1;
        const pick = pickActivityForYear(state, rng, doneThisYear);
        if (!pick) break;

        const stats = perActivityStats.get(pick.id) ?? {
          runs: 0,
          touchesAttributed: 0,
        };
        stats.runs += 1;
        perActivityStats.set(pick.id, stats);

        const targets = ACTIVITY_TARGETS.get(pick.id) ?? [];

        const preIndex = indexInstancesById(state);
        const touchedThisFire = new Set<string>();
        if (targets.length > 0) {
          for (const inst of instances.values()) {
            if (inst.ageAtRemove !== null) continue;
            if (!targets.includes(inst.currentType)) continue;
            inst.touchAges.push(state.age);
            inst.activityTouches += 1;
            touchedThisFire.add(inst.instanceId);
          }
          stats.touchesAttributed += touchedThisFire.size;
        }

        const result = executeActivity(state, pick.id, rng);
        if (!result.ok) break;
        state = result.state;
        actsThisYear += 1;
        doneThisYear.set(pick.id, (doneThisYear.get(pick.id) ?? 0) + 1);

        // Detect adds from activity.
        const postIndex = indexInstancesById(state);
        for (const [id, rel] of postIndex) {
          if (knownIds.has(id)) continue;
          knownIds.add(id);
          instances.set(id, {
            instanceId: id,
            baseId: rel.baseId ?? id,
            initialType: rel.type,
            currentType: rel.type,
            source: { kind: 'activity', id: pick.id },
            ageAtAdd: state.age,
            ageAtRemove: null,
            removeReason: null,
            touchAges: [],
            eventTouches: 0,
            activityTouches: 0,
            typeHistory: [{ age: state.age, type: rel.type }],
          });
          if (rel.type === 'spouse' && marriageStartAge === null) {
            marriageStartAge = state.age;
            spouseInstanceId = id;
          }
        }
        // Removes/transitions
        for (const [id, inst] of instances) {
          if (inst.ageAtRemove !== null) continue;
          if (!postIndex.has(id) && preIndex.has(id)) {
            inst.ageAtRemove = state.age;
            inst.removeReason = 'activity';
            if (id === spouseInstanceId) {
              marriageEndAge = state.age;
              marriageEndedBy = 'divorce';
            }
          }
        }
        for (const [id, rel] of postIndex) {
          const inst = instances.get(id);
          if (!inst) continue;
          if (inst.currentType !== rel.type) {
            // Special-case: partner→casualEx via activity is a
            // displacement, not a removal. Handle as transition.
            inst.currentType = rel.type;
            inst.typeHistory.push({ age: state.age, type: rel.type });
            if (id === spouseInstanceId && rel.type === 'significantEx') {
              marriageEndAge = state.age;
              marriageEndedBy = 'divorce';
            }
          }
        }
      }
    }

    state = endYear(state, rng);
  }

  // ---- End of life: finalise instances ----
  const finalIndex = indexInstancesById(state);
  for (const inst of instances.values()) {
    if (inst.ageAtRemove === null) {
      // Still alive in some slot/list at death.
      inst.removeReason = 'still-present-at-death';
    }
  }
  // Marriage finalisation.
  if (spouseInstanceId !== null) {
    const spouseInst = instances.get(spouseInstanceId);
    if (spouseInst) {
      const stillIsSpouse = finalIndex.get(spouseInstanceId)?.type === 'spouse';
      if (stillIsSpouse) {
        marriageEndedBy = 'still-married-at-death';
        marriageEndAge = state.age;
      } else if (
        spouseInst.typeHistory.some((h) => h.type === 'significantEx')
      ) {
        // Already labelled divorce above; preserve.
      } else if (spouseInst.removeReason === 'fade') {
        // Spouse dropped from state without going through significantEx
        // — this would be unusual. Mark as widowed-or-erratic.
        marriageEndedBy = 'widowed';
      }
    }
  }

  return {
    life: {
      countryCode: opts.countryCode,
      yearsLived: state.age,
      causeOfDeath: state.causeOfDeath ?? '(alive at maxAge)',
      instances: [...instances.values()],
      marriageStartAge,
      marriageEndAge,
      spouseInstanceId,
      marriageEndedBy: marriageStartAge === null ? 'never' : marriageEndedBy,
    },
    perEventStats,
    perActivityStats,
  };
}

/* -----------------------------------------------------------------------
 * Aggregation utilities
 * --------------------------------------------------------------------- */

function lifetimeYears(inst: InstanceRecord, deathAge: number): number {
  const end = inst.ageAtRemove ?? deathAge;
  return Math.max(0, end - inst.ageAtAdd);
}

function maxSilence(inst: InstanceRecord, deathAge: number): number {
  const end = inst.ageAtRemove ?? deathAge;
  if (inst.touchAges.length === 0) {
    return end - inst.ageAtAdd;
  }
  let prev = inst.ageAtAdd;
  let max = 0;
  for (const t of inst.touchAges) {
    max = Math.max(max, t - prev);
    prev = t;
  }
  max = Math.max(max, end - prev);
  return max;
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const a = [...arr].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 === 0 ? (a[m - 1]! + a[m]!) / 2 : a[m]!;
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, x) => s + x, 0) / arr.length;
}

/* -----------------------------------------------------------------------
 * Main
 * --------------------------------------------------------------------- */

async function main() {
  const t0 = Date.now();
  console.log(`Relationship depth audit — ${LIVES} lives (seed=${SEED})`);

  const lives: LifeRecord[] = [];
  const totalEventStats = new Map<
    string,
    { fires: number; touchesAttributed: number }
  >();
  const totalActivityStats = new Map<
    string,
    { runs: number; touchesAttributed: number }
  >();

  const rotation = COUNTRIES.map((c) => c.code);
  for (let i = 0; i < LIVES; i++) {
    const country = rotation[i % rotation.length] as string;
    const result = simulateOneLife({
      seed: SEED * 1_000_003 + i + 7919,
      countryCode: country,
    });
    lives.push(result.life);

    for (const [id, s] of result.perEventStats) {
      const acc = totalEventStats.get(id) ?? { fires: 0, touchesAttributed: 0 };
      acc.fires += s.fires;
      acc.touchesAttributed += s.touchesAttributed;
      totalEventStats.set(id, acc);
    }
    for (const [id, s] of result.perActivityStats) {
      const acc = totalActivityStats.get(id) ?? {
        runs: 0,
        touchesAttributed: 0,
      };
      acc.runs += s.runs;
      acc.touchesAttributed += s.touchesAttributed;
      totalActivityStats.set(id, acc);
    }
  }

  const wallMs = Date.now() - t0;
  console.log(`Done in ${(wallMs / 1000).toFixed(2)}s`);

  /* -----------------------------------------------------------------------
   * Section A: lifecycle data
   * --------------------------------------------------------------------- */
  const allInstances = lives.flatMap((l) => l.instances);
  const totalInstances = allInstances.length;
  const instancesByType = new Map<RelationshipType, InstanceRecord[]>();
  for (const inst of allInstances) {
    const arr = instancesByType.get(inst.initialType) ?? [];
    arr.push(inst);
    instancesByType.set(inst.initialType, arr);
  }

  const sourceCounts = new Map<string, number>();
  for (const inst of allInstances) {
    const key = `${inst.source.kind}:${inst.source.id}`;
    sourceCounts.set(key, (sourceCounts.get(key) ?? 0) + 1);
  }

  /* -----------------------------------------------------------------------
   * Section B: silence detection
   * --------------------------------------------------------------------- */
  type SilenceRow = {
    type: RelationshipType;
    lifetimes: number[];
    silences: number[];
    touchCounts: number[];
    eventTouchCounts: number[];
    activityTouchCounts: number[];
    silentInstances: number;
    everSilentLives: Set<number>;
  };
  const silenceByType = new Map<RelationshipType, SilenceRow>();
  for (const t of RELATIONSHIP_TYPES) {
    silenceByType.set(t, {
      type: t,
      lifetimes: [],
      silences: [],
      touchCounts: [],
      eventTouchCounts: [],
      activityTouchCounts: [],
      silentInstances: 0,
      everSilentLives: new Set(),
    });
  }

  let livesWithAtLeastOneSilentRel = 0;

  for (let li = 0; li < lives.length; li++) {
    const life = lives[li]!;
    let silentInThisLife = false;
    for (const inst of life.instances) {
      const lt = lifetimeYears(inst, life.yearsLived);
      // Only consider instances that lived long enough for the
      // silence threshold to be meaningful.
      const sil = maxSilence(inst, life.yearsLived);
      const row = silenceByType.get(inst.initialType);
      if (!row) continue;
      row.lifetimes.push(lt);
      row.silences.push(sil);
      row.touchCounts.push(inst.touchAges.length);
      row.eventTouchCounts.push(inst.eventTouches);
      row.activityTouchCounts.push(inst.activityTouches);
      if (lt > SILENCE_THRESHOLD_YEARS && sil > SILENCE_THRESHOLD_YEARS) {
        row.silentInstances += 1;
        row.everSilentLives.add(li);
        silentInThisLife = true;
      }
    }
    if (silentInThisLife) livesWithAtLeastOneSilentRel += 1;
  }

  /* -----------------------------------------------------------------------
   * Section C: spouse engagement
   * --------------------------------------------------------------------- */
  const spouseInstances = allInstances.filter(
    (inst) => inst.initialType === 'spouse',
  );
  const spouseEngagement = lives
    .filter((l) => l.spouseInstanceId !== null)
    .map((l) => {
      const inst = l.instances.find((i) => i.instanceId === l.spouseInstanceId);
      if (!inst) return null;
      const start = l.marriageStartAge ?? inst.ageAtAdd;
      const end = l.marriageEndAge ?? l.yearsLived;
      const marriedYears = Math.max(0, end - start);
      // Touches that happened during the spouse-slot window.
      const touchesDuringMarriage = inst.touchAges.filter(
        (a) => a >= start && a <= end,
      ).length;
      return {
        marriedYears,
        touches: touchesDuringMarriage,
        endedBy: l.marriageEndedBy,
      };
    })
    .filter((x): x is { marriedYears: number; touches: number; endedBy: LifeRecord['marriageEndedBy'] } => x !== null);

  /* -----------------------------------------------------------------------
   * Section D: friend engagement
   * --------------------------------------------------------------------- */
  const friendInstances = allInstances.filter(
    (inst) => inst.initialType === 'friend',
  );
  const friendsPerLife = lives.map(
    (l) => l.instances.filter((i) => i.initialType === 'friend').length,
  );
  const friendTouchPerYear: number[] = [];
  for (const inst of friendInstances) {
    const lt = lifetimeYears(
      inst,
      lives.find((l) => l.instances.some((i) => i.instanceId === inst.instanceId))?.yearsLived ?? inst.ageAtAdd,
    );
    if (lt > 0) {
      friendTouchPerYear.push(inst.touchAges.length / lt);
    } else {
      friendTouchPerYear.push(inst.touchAges.length);
    }
  }

  /* -----------------------------------------------------------------------
   * Section E: ends distribution
   * --------------------------------------------------------------------- */
  const endsByType = new Map<RelationshipType, Map<string, number>>();
  for (const inst of allInstances) {
    const m = endsByType.get(inst.initialType) ?? new Map<string, number>();
    const reason = inst.removeReason ?? 'still-present-at-death';
    m.set(reason, (m.get(reason) ?? 0) + 1);
    endsByType.set(inst.initialType, m);
  }

  /* -----------------------------------------------------------------------
   * Build report
   * --------------------------------------------------------------------- */
  const lines: string[] = [];
  lines.push('# Relationship depth audit — 2026-04-26');
  lines.push('');
  lines.push(
    `Goal: measure how *alive* relationships feel during gameplay, not just whether they exist in state. Hypothesis: many relationships sit in state for years without any event/activity targeting them — which the player would experience as "background data" rather than "characters in my life."`,
  );
  lines.push('');
  lines.push(`Run: **${LIVES} lives**, seed ${SEED}, with activities-AI on. Wall time: ${(wallMs / 1000).toFixed(2)}s.`);
  lines.push('');
  lines.push(`Touch model: an event/activity is a "touch" on an instance only when the event/activity's conditions explicitly require that instance's relationship type (e.g. \`has 'spouse'\`). Untargeted relationship-themed events (e.g. \`rel_first_date\`, \`rel_friend_wedding\`) do not count as touches on existing instances. Threshold for "silent": >${SILENCE_THRESHOLD_YEARS} years without a touch.`);
  lines.push('');

  lines.push('## A. Lifecycle data');
  lines.push('');
  lines.push(`- Total relationship instances tracked across ${LIVES} lives: **${totalInstances}** (avg ${(totalInstances / LIVES).toFixed(2)}/life)`);
  lines.push('');

  lines.push('### A.1 Distribution by initial type');
  lines.push('');
  lines.push('| Initial type | Instances | Per life avg | % of all instances |');
  lines.push('|---|---:|---:|---:|');
  const sortedTypes = [...instancesByType.entries()].sort(
    (a, b) => b[1].length - a[1].length,
  );
  for (const [type, list] of sortedTypes) {
    lines.push(
      `| \`${type}\` | ${list.length} | ${(list.length / LIVES).toFixed(2)} | ${((list.length / totalInstances) * 100).toFixed(1)}% |`,
    );
  }
  lines.push('');

  lines.push('### A.2 Sources of instances');
  lines.push('');
  lines.push('Where did each tracked instance come from? `birth` = seeded by `createNewLife` (mother/father/sibling). Everything else is the event or activity that emitted an `addRelationship` (or sibling special).');
  lines.push('');
  lines.push('| Source | Kind | Instances |');
  lines.push('|---|---|---:|');
  const sortedSources = [...sourceCounts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [key, count] of sortedSources) {
    const [kind, id] = key.split(':', 2);
    lines.push(`| \`${id}\` | ${kind} | ${count} |`);
  }
  lines.push('');

  lines.push('### A.3 Endings by initial type');
  lines.push('');
  lines.push('| Type | event | activity | fade | still at death | total |');
  lines.push('|---|---:|---:|---:|---:|---:|');
  for (const [type, list] of sortedTypes) {
    const m = endsByType.get(type) ?? new Map();
    const ev = m.get('event') ?? 0;
    const ac = m.get('activity') ?? 0;
    const fa = m.get('fade') ?? 0;
    const st = m.get('still-present-at-death') ?? 0;
    lines.push(
      `| \`${type}\` | ${ev} | ${ac} | ${fa} | ${st} | ${list.length} |`,
    );
  }
  lines.push('');

  /* -------- Section B -------- */
  lines.push('## B. Silence analysis');
  lines.push('');
  lines.push(`Relationships are "silent" when they exist in state for more than ${SILENCE_THRESHOLD_YEARS} years AND their **longest gap-without-touch is also > ${SILENCE_THRESHOLD_YEARS} years**. This is the BitLife player's "wait, who is that person in my relationships panel again?" moment.`);
  lines.push('');
  lines.push(
    `**${livesWithAtLeastOneSilentRel} / ${LIVES} lives (${((livesWithAtLeastOneSilentRel / LIVES) * 100).toFixed(1)}%)** end with at least one silent relationship in their history.`,
  );
  lines.push('');
  lines.push('### B.1 Silence rate by type');
  lines.push('');
  lines.push('Touches split into **event-touches** (a `has \'X\'` event fired) and **activity-touches** (`family_time` or `call_friend`). The activity column is wide because `family_time` runs frequently and counts as one touch per family member per run.');
  lines.push('');
  lines.push('| Type | Instances | Silent | % silent | Mean lifetime | Mean max-silence | Mean event-touches | Mean activity-touches | Total event-touches |');
  lines.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|');
  for (const [type, list] of sortedTypes) {
    const row = silenceByType.get(type);
    if (!row) continue;
    const meanLt = mean(row.lifetimes);
    const meanSil = mean(row.silences);
    const meanET = mean(row.eventTouchCounts);
    const meanAT = mean(row.activityTouchCounts);
    const totalET = row.eventTouchCounts.reduce((a, b) => a + b, 0);
    const pct = list.length > 0 ? (row.silentInstances / list.length) * 100 : 0;
    lines.push(
      `| \`${type}\` | ${list.length} | ${row.silentInstances} | ${pct.toFixed(1)}% | ${meanLt.toFixed(1)} | ${meanSil.toFixed(1)} | ${meanET.toFixed(2)} | ${meanAT.toFixed(2)} | ${totalET} |`,
    );
  }
  lines.push('');

  /* -------- Section C: spouse depth -------- */
  lines.push('## C. Spouse depth');
  lines.push('');
  const livesEverMarried = spouseEngagement.length;
  lines.push(`- Lives that ever marry: **${livesEverMarried} / ${LIVES} (${((livesEverMarried / LIVES) * 100).toFixed(1)}%)**`);

  const allMarriedYears = spouseEngagement.map((e) => e.marriedYears);
  const allTouches = spouseEngagement.map((e) => e.touches);
  lines.push(
    `- Marriage length (years): mean ${mean(allMarriedYears).toFixed(1)}, median ${median(allMarriedYears).toFixed(0)}, max ${Math.max(...allMarriedYears, 0)}`,
  );
  lines.push(
    `- Touches during marriage: mean ${mean(allTouches).toFixed(2)}, median ${median(allTouches).toFixed(0)}, max ${Math.max(...allTouches, 0)}`,
  );

  const touchesPerMarriedYear = spouseEngagement
    .filter((e) => e.marriedYears > 0)
    .map((e) => e.touches / e.marriedYears);
  lines.push(
    `- Touches per married year: mean ${mean(touchesPerMarriedYear).toFixed(3)}, median ${median(touchesPerMarriedYear).toFixed(3)}`,
  );

  // Marriages with zero spouse-targeted events
  const deadMarriages = spouseEngagement.filter((e) => e.touches === 0).length;
  lines.push(
    `- Marriages with **zero** spouse-targeted events ever: **${deadMarriages} / ${livesEverMarried} (${livesEverMarried > 0 ? ((deadMarriages / livesEverMarried) * 100).toFixed(1) : '–'}%)**`,
  );

  // Marriage end reasons
  const endReasons = new Map<string, number>();
  for (const e of spouseEngagement) {
    const k = e.endedBy ?? 'never';
    endReasons.set(k, (endReasons.get(k) ?? 0) + 1);
  }
  lines.push('');
  lines.push('### C.1 Marriage end reasons');
  lines.push('');
  lines.push('| Reason | Count | % of married lives |');
  lines.push('|---|---:|---:|');
  for (const [k, c] of [...endReasons.entries()].sort((a, b) => b[1] - a[1])) {
    lines.push(`| ${k} | ${c} | ${((c / Math.max(1, livesEverMarried)) * 100).toFixed(1)}% |`);
  }
  lines.push('');

  // Bucketed distribution
  lines.push('### C.2 Touches-per-married-year buckets');
  lines.push('');
  lines.push('| Touches / married year | Marriages | % |');
  lines.push('|---|---:|---:|');
  const buckets: Array<[string, (n: number) => boolean]> = [
    ['0', (n) => n === 0],
    ['(0, 0.1]', (n) => n > 0 && n <= 0.1],
    ['(0.1, 0.25]', (n) => n > 0.1 && n <= 0.25],
    ['(0.25, 0.5]', (n) => n > 0.25 && n <= 0.5],
    ['(0.5, 1.0]', (n) => n > 0.5 && n <= 1.0],
    ['>1.0', (n) => n > 1.0],
  ];
  for (const [label, pred] of buckets) {
    const c = touchesPerMarriedYear.filter(pred).length;
    lines.push(
      `| ${label} | ${c} | ${touchesPerMarriedYear.length > 0 ? ((c / touchesPerMarriedYear.length) * 100).toFixed(1) : '–'}% |`,
    );
  }
  lines.push('');

  /* -------- Section D: friend depth -------- */
  lines.push('## D. Friend depth');
  lines.push('');
  lines.push(`- Friend instances across ${LIVES} lives: **${friendInstances.length}** (avg ${(friendInstances.length / LIVES).toFixed(2)}/life, median ${median(friendsPerLife).toFixed(0)}, max ${Math.max(...friendsPerLife, 0)})`);
  lines.push(`- Friend instances per life — bucketed:`);
  lines.push('');
  lines.push('| Friends ever in life | Lives | % |');
  lines.push('|---|---:|---:|');
  const friendBuckets = [0, 1, 2, 3, 5, 10];
  for (let i = 0; i < friendBuckets.length; i++) {
    const lo = friendBuckets[i]!;
    const hi = i + 1 < friendBuckets.length ? friendBuckets[i + 1]! : Infinity;
    const c = friendsPerLife.filter((n) => n >= lo && n < hi).length;
    const label = hi === Infinity ? `${lo}+` : `${lo}-${hi - 1}`;
    lines.push(`| ${label} | ${c} | ${((c / LIVES) * 100).toFixed(1)}% |`);
  }
  lines.push('');

  const friendTouches = friendInstances.map((i) => i.touchAges.length);
  const friendLifetimes = friendInstances.map((inst) => {
    const life = lives.find((l) =>
      l.instances.some((i) => i.instanceId === inst.instanceId),
    );
    return lifetimeYears(inst, life?.yearsLived ?? inst.ageAtAdd);
  });
  lines.push(`- Friend lifetime (years): mean ${mean(friendLifetimes).toFixed(2)}, median ${median(friendLifetimes).toFixed(0)}, max ${Math.max(...friendLifetimes, 0)}`);
  lines.push(`- Friend touches over lifetime: mean ${mean(friendTouches).toFixed(2)}, median ${median(friendTouches).toFixed(0)}, max ${Math.max(...friendTouches, 0)}`);
  const zeroTouchFriends = friendInstances.filter(
    (i) => i.touchAges.length === 0,
  ).length;
  lines.push(
    `- Friends with **zero touches** ever: **${zeroTouchFriends} / ${friendInstances.length} (${friendInstances.length > 0 ? ((zeroTouchFriends / friendInstances.length) * 100).toFixed(1) : '–'}%)**`,
  );

  /* -------- Section E: per-event/activity targeting throughput -------- */
  lines.push('');
  lines.push('## E. Per-event and per-activity targeting throughput');
  lines.push('');
  lines.push(
    `Which events/activities actually contribute touches? "Targeting" events have at least one \`has 'X'\` condition; only those can be touches in this model.`,
  );
  lines.push('');
  lines.push('### E.1 Targeting events (sorted by total touches)');
  lines.push('');
  lines.push('| Event | Targets | Fires | Touches attributed |');
  lines.push('|---|---|---:|---:|');
  const targetingEventRows = ALL_EVENTS.filter(
    (e) => (EVENT_TARGETS.get(e.id) ?? []).length > 0,
  )
    .map((e) => {
      const s = totalEventStats.get(e.id) ?? {
        fires: 0,
        touchesAttributed: 0,
      };
      return {
        id: e.id,
        targets: EVENT_TARGETS.get(e.id) ?? [],
        fires: s.fires,
        touches: s.touchesAttributed,
      };
    })
    .sort((a, b) => b.touches - a.touches);
  for (const row of targetingEventRows) {
    lines.push(
      `| \`${row.id}\` | ${row.targets.join(', ')} | ${row.fires} | ${row.touches} |`,
    );
  }
  lines.push('');

  lines.push('### E.2 Targeting activities');
  lines.push('');
  lines.push('| Activity | Targets | Runs | Touches attributed |');
  lines.push('|---|---|---:|---:|');
  const targetingActRows = ALL_ACTIVITIES.filter(
    (a) => (ACTIVITY_TARGETS.get(a.id) ?? []).length > 0,
  )
    .map((a) => {
      const s = totalActivityStats.get(a.id) ?? {
        runs: 0,
        touchesAttributed: 0,
      };
      return {
        id: a.id,
        targets: ACTIVITY_TARGETS.get(a.id) ?? [],
        runs: s.runs,
        touches: s.touchesAttributed,
      };
    })
    .sort((a, b) => b.touches - a.touches);
  for (const row of targetingActRows) {
    lines.push(
      `| \`${row.id}\` | ${row.targets.join(', ')} | ${row.runs} | ${row.touches} |`,
    );
  }
  lines.push('');

  lines.push('### E.3 Untargeted relationship-themed events (formation / ambient)');
  lines.push('');
  lines.push(
    `Events that fire without a \`has '<type>'\` gate. They can *create* relationships but don't deepen existing ones.`,
  );
  lines.push('');
  lines.push('| Event | Fires | Notes |');
  lines.push('|---|---:|---|');
  const ambientRels = ALL_EVENTS.filter(
    (e) =>
      e.category === 'relationships' &&
      (EVENT_TARGETS.get(e.id) ?? []).length === 0,
  );
  for (const e of ambientRels) {
    const s = totalEventStats.get(e.id) ?? { fires: 0, touchesAttributed: 0 };
    const note =
      addedBaseIdsFromEvent(e).size > 0
        ? `forms: ${[...addedBaseIdsFromEvent(e)].join(', ')}`
        : 'ambient/formation';
    lines.push(`| \`${e.id}\` | ${s.fires} | ${note} |`);
  }
  lines.push('');

  /* -------- Section F: diagnosis & recommendations -------- */
  lines.push('## F. Diagnosis');
  lines.push('');

  // Compute a few headline diagnostics for the prose section.
  const spouseRow = silenceByType.get('spouse')!;
  const friendRow = silenceByType.get('friend')!;
  const motherRow = silenceByType.get('mother')!;
  const fatherRow = silenceByType.get('father')!;
  const siblingRow = silenceByType.get('sibling')!;

  const spouseSilentPct = spouseInstances.length > 0
    ? (spouseRow.silentInstances / spouseInstances.length) * 100
    : 0;
  const friendSilentPct = friendInstances.length > 0
    ? (friendRow.silentInstances / friendInstances.length) * 100
    : 0;

  lines.push(`**Headline silence rates** (lifetime > ${SILENCE_THRESHOLD_YEARS} yrs AND max-silence > ${SILENCE_THRESHOLD_YEARS} yrs):`);
  lines.push('');
  lines.push(`- Spouse: ${spouseRow.silentInstances}/${spouseInstances.length} (${spouseSilentPct.toFixed(1)}%)`);
  lines.push(`- Friend: ${friendRow.silentInstances}/${friendInstances.length} (${friendSilentPct.toFixed(1)}%)`);
  lines.push(`- Mother: ${motherRow.silentInstances}/${motherRow.lifetimes.length} (${motherRow.lifetimes.length > 0 ? ((motherRow.silentInstances / motherRow.lifetimes.length) * 100).toFixed(1) : '–'}%)`);
  lines.push(`- Father: ${fatherRow.silentInstances}/${fatherRow.lifetimes.length} (${fatherRow.lifetimes.length > 0 ? ((fatherRow.silentInstances / fatherRow.lifetimes.length) * 100).toFixed(1) : '–'}%)`);
  lines.push(`- Sibling: ${siblingRow.silentInstances}/${siblingRow.lifetimes.length} (${siblingRow.lifetimes.length > 0 ? ((siblingRow.silentInstances / siblingRow.lifetimes.length) * 100).toFixed(1) : '–'}%)`);
  lines.push('');

  // Free-form diagnosis paragraphs (data-driven).
  const meanSpouseTouchesPerYear = mean(touchesPerMarriedYear);
  lines.push(`### F.1 Spouse — does the marriage feel alive?`);
  lines.push('');
  lines.push(
    `On average, a marriage receives **${meanSpouseTouchesPerYear.toFixed(3)} spouse-targeted events per year of marriage**. That is ${meanSpouseTouchesPerYear < 0.2 ? 'less than one event every five years' : meanSpouseTouchesPerYear < 0.5 ? 'less than one event every two years' : 'roughly one event every couple of years'}.`,
  );
  lines.push('');
  if (deadMarriages > 0) {
    lines.push(
      `**${deadMarriages}** of the **${livesEverMarried}** marriages (${((deadMarriages / Math.max(1, livesEverMarried)) * 100).toFixed(1)}%) end without a single spouse-targeted event ever firing — the player gets married, then never has another spouse-specific moment until death or divorce.`,
    );
  } else {
    lines.push('Every married life had at least one spouse-targeted event during the marriage.');
  }
  lines.push('');
  lines.push(`The current spouse-targeted content set is just two events: \`rel_have_a_kid\` and \`rel_anniversary\`. Neither has any deeper variation — once a kid is had, \`rel_have_a_kid\` keeps firing (no \`oncePerLife\` or \`has 'child'\` lacks-gate), and the only annual hook is the anniversary roll.`);
  lines.push('');
  // Divorce visibility — important finding given the marriage end-reason table.
  const divorceCount = endReasons.get('divorce') ?? 0;
  const stillMarriedCount = endReasons.get('still-married-at-death') ?? 0;
  if (livesEverMarried > 0 && divorceCount / livesEverMarried < 0.05) {
    lines.push(`**Divorce is essentially impossible in current content.** ${stillMarriedCount}/${livesEverMarried} marriages (${((stillMarriedCount / livesEverMarried) * 100).toFixed(1)}%) ended via "still-married-at-death". Only ${divorceCount} divorces fired in ${LIVES} lives. \`rel_breakup\` requires \`has 'partner'\`, not \`has 'spouse'\`, so a married player has no exit path. The slot engine fully supports divorce (\`divorceSpouse\` is wired in \`effectsApplier.ts\`), but no event emits it. This explains why the fifth audit's stress-scenario B couldn't generate any \`significantExes\`.`);
    lines.push('');
  }

  const meanFriendTouchesPerYear = mean(friendTouchPerYear);
  lines.push(`### F.2 Friend — does friendship feel valuable?`);
  lines.push('');
  lines.push(
    `Average friend instance receives **${meanFriendTouchesPerYear.toFixed(3)} touches per year of friendship**. Friend lifetime is short (mean ${mean(friendLifetimes).toFixed(1)} years) because of the 8-year fade rule — the AI rarely sustains contact unless \`call_friend\` keeps firing.`,
  );
  lines.push('');
  lines.push(`The only friend-targeted events: \`rel_friendship_drifts\` (no individual targeting — picks one friend abstractly) and the \`call_friend\` activity (resets contact for *all* friends, not a chosen one). \`rel_meet_old_friend\` is untargeted (it's a "ghost from the past" formation event, not a touch on a specific living friend).`);
  lines.push('');

  lines.push(`### F.3 Family — parents and siblings`);
  lines.push('');
  const motherEv = motherRow.eventTouchCounts.reduce((a, b) => a + b, 0);
  const motherAct = motherRow.activityTouchCounts.reduce((a, b) => a + b, 0);
  const fatherEv = fatherRow.eventTouchCounts.reduce((a, b) => a + b, 0);
  const fatherAct = fatherRow.activityTouchCounts.reduce((a, b) => a + b, 0);
  const siblingEv = siblingRow.eventTouchCounts.reduce((a, b) => a + b, 0);
  const siblingAct = siblingRow.activityTouchCounts.reduce((a, b) => a + b, 0);
  lines.push(`Splitting touches by source — events vs activities:`);
  lines.push('');
  lines.push('| | Event-touches | Activity-touches |');
  lines.push('|---|---:|---:|');
  lines.push(`| Mother | ${motherEv} | ${motherAct} |`);
  lines.push(`| Father | ${fatherEv} | ${fatherAct} |`);
  lines.push(`| Sibling | ${siblingEv} | ${siblingAct} |`);
  lines.push('');
  if (fatherEv === 0) {
    lines.push(`**Critical content gap**: \`father\` is in every life from birth to old age, but **no event in the codebase has a \`has 'father'\` condition** — every father touch in this run came from \`family_time\`, an activity that addresses *all* family members at once. The father is event-invisible: present in the relationships panel, never a participant in any narrative beat.`);
    lines.push('');
  }
  lines.push(`Mother fares better: ${motherEv} event-touches across ${motherRow.lifetimes.length} mothers comes from \`rel_parent_dies\` (death) and \`rel_family_argument\` (one mid-life flashpoint). Sibling has only \`child_sibling_fight\` — a childhood event that ages out at 12.`);
  lines.push('');

  /* -------- Section G: gaps and recommendations -------- */
  lines.push('## G. Recommendations');
  lines.push('');
  lines.push('### G.1 Top 3 missing content categories');
  lines.push('');
  lines.push('1. **Spouse-touch events**. Two events for a 30+ year marriage is starvation territory. BitLife runs the spouse through dozens of yearly hooks: argue, compliment, gift, suspicious phone, romantic vacation, joint financial decisions, in-law visits, parenting sub-events. Realistic minimum: ~8 spouse-conditioned events to bring touches/married-year up to ~0.3.');
  lines.push('2. **Father-targeted events**. The father is currently a non-character. Mirror the existing `rel_parent_dies` and `rel_family_argument` shape but `has \'father\'`. Without this, every life has a "ghost dad" — present in the panel, never spoken of.');
  lines.push('3. **Per-friend interaction**. `call_friend` resets *all* friends\' contact, not one. There\'s no event/activity that targets a specific friend by baseId. A "friend hangout" activity that picks one friend and has outcomes deepening or souring that specific relationship would let friendships diverge in tone, not just decay uniformly.');
  lines.push('');
  lines.push('### G.2 Top 3 systems gaps');
  lines.push('');
  lines.push('1. **Engagement window unused**. The `fiance` slot exists, the `addFiance` special exists, the engine rebalances correctly — but no event uses it. Adding a partner→fiance→spouse event chain (engagement events with a 1–3 year window) gives a second narrative arc for marriage.');
  lines.push('2. **No relationship-level decay/growth**. `relationshipLevel` is set on add and never adjusted by gameplay. A spouse with 88 stays at 88 for 50 years regardless of anniversaries observed or fights had. Hook event outcomes into level deltas via a `adjustRelationshipLevel` special.');
  lines.push('3. **No re-targeting on touches**. When `rel_anniversary` fires the spouse instance is implied but no specific record updates. Making touches mutate the targeted instance (e.g. lastTouchedYear field on Person) opens the door for "you haven\'t spent time with X in years" prompts and depth UI.');
  lines.push('');

  lines.push('### G.3 Priority order');
  lines.push('');
  lines.push('1. **First**: Spouse content batch (G.1.1) — biggest player-felt impact, lowest engineering cost, just new events.');
  lines.push('2. **Second**: Father events (G.1.2) — also pure content, fixes a glaring asymmetry.');
  lines.push('3. **Third**: Per-friend targeting and the engagement-window arc (G.1.3 / G.2.1) — these need engine support (a way to address an instance by id from event payload) so they\'re a tier larger than the content-only items.');
  lines.push('4. **Later**: Relationship-level dynamics and lastTouchedYear (G.2.2 / G.2.3) — meaningful but lower urgency than filling the touch gap.');
  lines.push('');

  /* -------- Appendix -------- */
  lines.push('## Appendix — methodology');
  lines.push('');
  lines.push('Source: `testing/agents/relationshipDepthAudit.ts`. Tracks every relationship instance by stable `Person.id` across the full life of the run, including slot transitions (partner → casualEx, spouse → significantEx). A "touch" is recorded only when the firing event/activity has a condition that explicitly requires that instance\'s relationship type, OR when `family_time` runs (intrinsically family-targeted). Untargeted relationship-themed events are excluded from the touch model to avoid attributing "drift" or "first date" events to existing relationships they have nothing to do with.');
  lines.push('');
  lines.push('Reproduce: `npx tsx testing/agents/relationshipDepthAudit.ts`');
  lines.push('');

  const md = lines.join('\n');
  const outPath = resolve(
    REPORTS_DIR,
    `relationship-depth-audit-${new Date().toISOString().slice(0, 10)}.md`,
  );
  const written = writeReport(outPath, md);
  console.log(`\nReport: ${relPath(written)}`);

  // Headline summary on stdout.
  console.log('\n=== Headline ===');
  console.log(`  Total instances tracked: ${totalInstances} (avg ${(totalInstances / LIVES).toFixed(2)}/life)`);
  console.log(`  Spouse silent: ${spouseRow.silentInstances}/${spouseInstances.length} (${spouseSilentPct.toFixed(1)}%)`);
  console.log(`  Friend silent: ${friendRow.silentInstances}/${friendInstances.length} (${friendSilentPct.toFixed(1)}%)`);
  console.log(`  Lives with ≥1 silent rel: ${livesWithAtLeastOneSilentRel}/${LIVES}`);
  console.log(`  Mean spouse touches/married year: ${meanSpouseTouchesPerYear.toFixed(3)}`);
  console.log(`  Marriages with 0 spouse-targeted events: ${deadMarriages}/${livesEverMarried}`);
  console.log(`  Father total touches across all lives: ${fatherRow.touchCounts.reduce((a, b) => a + b, 0)}`);
  console.log(`  Mother total touches across all lives: ${motherRow.touchCounts.reduce((a, b) => a + b, 0)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
