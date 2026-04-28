import type { Effect, SpecialSummary, StatDelta } from '../types/events';
import type {
  Asset,
  CrimeRecord,
  FamilyMember,
  Friend,
  Job,
  Person,
  PlayerState,
  Relationship,
} from '../types/gameState';
import { adjustPrice, adjustSalary, getCurrentCountry } from './countryEngine';
import { getAtPath, setAtPath } from './paths';
import {
  addCasualEx,
  addFamilyMember,
  addFiance,
  addFriend,
  addPartner,
  addSignificantEx,
  addSpouse,
  adjustPersonRelationshipLevel,
  breakUpPartner,
  divorceSpouse,
  endEngagement,
  ensureRelationshipState,
  loseFriend,
  removePersonByBase,
  resetFriendContact,
  withRelationshipState,
} from './relationshipEngine';

const STAT_PATHS = new Set([
  'stats.health',
  'stats.happiness',
  'stats.smarts',
  'stats.looks',
  'job.performance',
  'job.relationshipLevel',
]);

/** Stats and other 0..100 fields are clamped after every effect. */
function clampIfBounded(path: string, value: number): number {
  if (STAT_PATHS.has(path)) {
    return Math.max(0, Math.min(100, value));
  }
  if (path === 'money') {
    // Money can go negative (debt), but cap obvious overflow.
    return Math.max(-1_000_000_000, Math.min(1_000_000_000, value));
  }
  return value;
}

type SpecialHandler = (state: PlayerState, payload: Record<string, unknown>) => PlayerState;

/**
 * Mint a stable per-instance id from the author-supplied baseId. Activities
 * re-fire over a life so authored ids like `rel-gym-friend` collide if used
 * verbatim; the year + family-list size acts as a cheap monotonic seed.
 */
function mintPersonId(state: PlayerState, baseId: string): string {
  const rs = state.relationshipState;
  const total = rs
    ? rs.family.length +
      rs.friends.length +
      rs.significantExes.length +
      rs.casualExes.length +
      (rs.partner ? 1 : 0) +
      (rs.fiance ? 1 : 0) +
      (rs.spouse ? 1 : 0)
    : (state.relationships?.length ?? 0);
  return `${baseId}-y${state.currentYear}-n${total}`;
}

function payloadToPerson(state: PlayerState, payload: Record<string, unknown>): Person {
  const baseId = (payload.id as string | undefined) ?? (payload.baseId as string | undefined) ?? 'rel';
  return {
    id: mintPersonId(state, baseId),
    baseId,
    firstName: (payload.firstName as string | undefined) ?? '',
    lastName: (payload.lastName as string | undefined) ?? '',
    age: (payload.age as number | undefined) ?? 0,
    alive: (payload.alive as boolean | undefined) ?? true,
    relationshipLevel: (payload.relationshipLevel as number | undefined) ?? 50,
    metYear: state.currentYear,
  };
}

/**
 * Registry pattern so new special effects can be added without touching the
 * applier itself. Add an entry, ship a new event — that's it.
 */
const SPECIAL_HANDLERS: Record<string, SpecialHandler> = {
  // -------------------------------------------------------------------
  // Tier-system slot operations (preferred for new content).
  // -------------------------------------------------------------------
  addPartner: (state, payload) => {
    const guarded = ensureRelationshipState(state);
    const person = payloadToPerson(guarded, payload);
    return addPartner(guarded, person, guarded.currentYear);
  },

  addFiance: (state, payload) => {
    const guarded = ensureRelationshipState(state);
    // Slot-promotion shortcut: when the payload sets `promoteSlot: 'partner'`,
    // promote the current partner directly. This bypasses the
    // baseId/empty-name dance that the legacy proposal events relied on —
    // direct-action interactions enrich payloads with random names before
    // this handler runs (see enrichGeneratedRelationships), which would
    // otherwise defeat the addFiance engine's "promote-whoever-is-in-slot"
    // detection.
    if (payload.promoteSlot === 'partner' && guarded.relationshipState.partner) {
      return addFiance(guarded, guarded.relationshipState.partner, guarded.currentYear);
    }
    const person = payloadToPerson(guarded, payload);
    return addFiance(guarded, person, guarded.currentYear);
  },

  addSpouse: (state, payload) => {
    const guarded = ensureRelationshipState(state);
    // Slot-promotion shortcut: same convention as addFiance. `fiance.marry`
    // sets `promoteSlot: 'fiance'` so the engine pulls the actual incumbent
    // off relationshipState rather than fighting with the random name the
    // enrichment step would otherwise stamp onto an empty payload.
    if (payload.promoteSlot === 'fiance' && guarded.relationshipState.fiance) {
      return addSpouse(guarded, guarded.relationshipState.fiance, guarded.currentYear);
    }
    if (payload.promoteSlot === 'partner' && guarded.relationshipState.partner) {
      return addSpouse(guarded, guarded.relationshipState.partner, guarded.currentYear);
    }
    const person = payloadToPerson(guarded, payload);
    return addSpouse(guarded, person, guarded.currentYear);
  },

  addCasualEx: (state, payload) => {
    const guarded = ensureRelationshipState(state);
    const person = payloadToPerson(guarded, payload);
    const formerSlot = (payload.formerSlot as 'partner' | 'fiance' | undefined) ?? 'partner';
    return addCasualEx(guarded, person, guarded.currentYear, formerSlot);
  },

  addSignificantEx: (state, payload) => {
    const guarded = ensureRelationshipState(state);
    const person = payloadToPerson(guarded, payload);
    const formerSlot = (payload.formerSlot as 'fiance' | 'spouse' | undefined) ?? 'spouse';
    return addSignificantEx(guarded, person, guarded.currentYear, formerSlot);
  },

  addFriend: (state, payload) => {
    const guarded = ensureRelationshipState(state);
    const person = payloadToPerson(guarded, payload);
    const friend: Friend = {
      ...person,
      type: 'friend',
      yearsSinceContact: 0,
      isBestFriend: Boolean(payload.isBestFriend),
    };
    return addFriend(guarded, friend, guarded.currentYear);
  },

  addFamilyMember: (state, payload) => {
    const guarded = ensureRelationshipState(state);
    const person = payloadToPerson(guarded, payload);
    const memberType =
      (payload.memberType as FamilyMember['type'] | undefined) ??
      (payload.type as FamilyMember['type'] | undefined) ??
      'sibling';
    const member: FamilyMember = { ...person, type: memberType };
    return addFamilyMember(guarded, member);
  },

  breakUpPartner: (state) => breakUpPartner(state, state.currentYear),
  endEngagement: (state) => endEngagement(state, state.currentYear),
  divorceSpouse: (state) => divorceSpouse(state, state.currentYear),

  loseFriend: (state, payload) => {
    const id = (payload.id as string | undefined) ?? (payload.baseId as string | undefined);
    if (!id) return state;
    return loseFriend(state, id);
  },

  resetFriendContact: (state, payload) => {
    const id = (payload.id as string | undefined) ?? (payload.baseId as string | undefined);
    return resetFriendContact(state, id);
  },

  adjustRelationshipLevel: (state, payload) => {
    const delta = typeof payload.delta === 'number' ? payload.delta : 0;
    if (delta === 0) return state;
    // `slot` lets event authors target the current partner/fiance/spouse
    // without knowing the minted id — events don't get target context the
    // way action interactions do (interactions.ts injects targetId from the
    // clicked Person; events just emit raw effects).
    const slot = payload.slot as 'partner' | 'fiance' | 'spouse' | undefined;
    if (slot) {
      const rs = ensureRelationshipState(state).relationshipState;
      const person = rs[slot];
      if (!person) return state;
      return adjustPersonRelationshipLevel(state, person.id, delta);
    }
    const targetId =
      (payload.targetId as string | undefined) ?? (payload.id as string | undefined);
    if (!targetId) return state;
    return adjustPersonRelationshipLevel(state, targetId, delta);
  },

  // -------------------------------------------------------------------
  // Legacy shim — `addRelationship` routes through slot logic by type.
  // Kept so the 56 existing call-sites and any new content authored
  // against the old API continue to work. The slot enforcement is what
  // makes E1 (multi-spouse) impossible by construction even when an
  // event still uses the legacy shape.
  // -------------------------------------------------------------------
  addRelationship: (state, payload) => {
    const rel = payload as unknown as Relationship;
    const guarded = ensureRelationshipState(state);
    const person = payloadToPerson(guarded, payload);

    switch (rel.type) {
      case 'partner':
        return addPartner(guarded, person, guarded.currentYear);
      case 'fiance':
        return addFiance(guarded, person, guarded.currentYear);
      case 'spouse':
        return addSpouse(guarded, person, guarded.currentYear);
      case 'friend': {
        const friend: Friend = { ...person, type: 'friend', yearsSinceContact: 0 };
        return addFriend(guarded, friend, guarded.currentYear);
      }
      case 'father':
      case 'mother':
      case 'sibling':
      case 'child': {
        const member: FamilyMember = { ...person, type: rel.type };
        return addFamilyMember(guarded, member);
      }
      case 'casualEx':
        return addCasualEx(guarded, person, guarded.currentYear, 'partner');
      case 'significantEx':
        return addSignificantEx(guarded, person, guarded.currentYear, 'spouse');
      default: {
        // Unknown type — fall back to a friend so the player isn't silently
        // dropped on the floor.
        const friend: Friend = { ...person, type: 'friend', yearsSinceContact: 0 };
        return addFriend(guarded, friend, guarded.currentYear);
      }
    }
  },

  removeRelationship: (state, payload) => {
    const id = payload.id as string | undefined;
    if (!id) return state;
    return removePersonByBase(state, id);
  },

  // -------------------------------------------------------------------
  // Non-relationship specials (unchanged).
  // -------------------------------------------------------------------
  addAsset: (state, payload) => {
    const asset = payload as unknown as Asset;
    const cost = typeof asset.purchasePrice === 'number' ? asset.purchasePrice : 0;
    return {
      ...state,
      money: state.money - cost,
      assets: [...state.assets, asset],
    };
  },

  addCrime: (state, payload) => {
    const crime = payload as unknown as CrimeRecord;
    return { ...state, criminalRecord: [...state.criminalRecord, crime] };
  },

  setJob: (state, payload) => {
    const job = payload as unknown as Job;
    // Author-supplied salary is in baseline (GB) units; scale to the
    // player's country so a NL coffee-shop job and a US coffee-shop job
    // pay differently from the moment they're set.
    const country = getCurrentCountry(state);
    const adjusted: Job = { ...job, salary: adjustSalary(job.salary, country) };
    return { ...state, job: adjusted };
  },

  leaveJob: (state) => ({ ...state, job: null }),

  die: (state, payload) => ({
    ...state,
    alive: false,
    causeOfDeath: (payload.cause as string | undefined) ?? 'unknown causes',
  }),
};

// Re-export so the relationship engine's withRelationshipState helper
// stays callable from places that already import via this module.
export { withRelationshipState };

/**
 * Country-adjust an event's raw value. Money paths use the cost-of-living
 * index; salary paths use the salary index. Multiplicative ops (* /) are
 * already country-neutral (they scale whatever's in place), so we only
 * adjust additive/assignment ops.
 */
function countryAdjustValue(
  state: PlayerState,
  path: string,
  op: string,
  rawValue: number,
): number {
  if (op === '*' || op === '/') return rawValue;
  const country = getCurrentCountry(state);
  if (path === 'money') return adjustPrice(rawValue, country);
  if (path === 'job.salary') return adjustSalary(rawValue, country);
  return rawValue;
}

function applyArithmetic(state: PlayerState, effect: Effect): PlayerState {
  if (!effect.path || !effect.op || effect.value === undefined) return state;

  const current = getAtPath(state, effect.path);
  const adjustedValue = countryAdjustValue(
    state,
    effect.path,
    effect.op,
    effect.value,
  );
  if (effect.op === '=') {
    return setAtPath(state, effect.path, clampIfBounded(effect.path, adjustedValue));
  }

  // For arithmetic ops, treat missing/non-numeric current as 0 so authors
  // don't have to seed every numeric field before mutating it.
  const base = typeof current === 'number' ? current : 0;
  let next = base;
  switch (effect.op) {
    case '+':
      next = base + adjustedValue;
      break;
    case '-':
      next = base - adjustedValue;
      break;
    case '*':
      next = base * adjustedValue;
      break;
    case '/':
      next = adjustedValue === 0 ? base : base / adjustedValue;
      break;
  }
  return setAtPath(state, effect.path, clampIfBounded(effect.path, Math.round(next)));
}

export function applyEffect(state: PlayerState, effect: Effect): PlayerState {
  if (effect.special) {
    const handler = SPECIAL_HANDLERS[effect.special];
    if (!handler) return state;
    return handler(state, effect.payload ?? {});
  }
  return applyArithmetic(state, effect);
}

export function applyEffects(state: PlayerState, effects: Effect[]): PlayerState {
  return effects.reduce((acc, effect) => applyEffect(acc, effect), state);
}

/** Exposed so future packages or tests can register additional effect types. */
export function registerSpecialEffect(name: string, handler: SpecialHandler): void {
  SPECIAL_HANDLERS[name] = handler;
}

/**
 * Numeric paths the StatFeedback overlay shows as ± deltas. Anything else
 * (job.* internals, country.* lookups) stays out of the UI noise and is
 * surfaced through `specials` instead.
 */
const FEEDBACK_PATHS = new Set([
  'stats.health',
  'stats.happiness',
  'stats.smarts',
  'stats.looks',
  'money',
]);

function summarizeSpecial(effect: Effect, state: PlayerState): SpecialSummary | null {
  if (!effect.special) return null;
  const payload = effect.payload ?? {};
  switch (effect.special) {
    case 'addRelationship': {
      const rel = payload as Partial<Relationship>;
      const name = [rel.firstName, rel.lastName].filter(Boolean).join(' ').trim();
      const labelByType: Record<string, string> = {
        spouse: name ? `Married ${name}` : 'Got married',
        fiance: name ? `Engaged to ${name}` : 'Got engaged',
        partner: name ? `Started dating ${name}` : 'New partner',
        friend: name ? `Befriended ${name}` : 'New friend',
        child: name ? `Welcomed ${name}` : 'Had a child',
      };
      return {
        special: 'addRelationship',
        label:
          labelByType[rel.type ?? 'friend'] ??
          `New relationship: ${name || rel.type}`,
      };
    }
    case 'addPartner': {
      const p = payload as Partial<Person>;
      const name = [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
      return { special: 'addPartner', label: name ? `Started dating ${name}` : 'New partner' };
    }
    case 'addFiance': {
      // promoteSlot bypasses the payload identity — read the actual incumbent
      // off relationshipState so the modal shows "Engaged to Sara" not the
      // enrichment-generated random name in the payload.
      if (payload.promoteSlot === 'partner' && state.relationshipState?.partner) {
        const p = state.relationshipState.partner;
        const name = `${p.firstName} ${p.lastName}`.trim();
        return { special: 'addFiance', label: name ? `Engaged to ${name}` : 'Got engaged' };
      }
      const p = payload as Partial<Person>;
      const name = [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
      return { special: 'addFiance', label: name ? `Engaged to ${name}` : 'Got engaged' };
    }
    case 'addSpouse': {
      // promoteSlot bypasses the payload identity (mirrors addFiance) — read
      // the actual incumbent off relationshipState so the modal shows the
      // real fiance/partner's name instead of an enrichment-generated one.
      if (payload.promoteSlot === 'fiance' && state.relationshipState?.fiance) {
        const p = state.relationshipState.fiance;
        const name = `${p.firstName} ${p.lastName}`.trim();
        return { special: 'addSpouse', label: name ? `Married ${name}` : 'Got married' };
      }
      if (payload.promoteSlot === 'partner' && state.relationshipState?.partner) {
        const p = state.relationshipState.partner;
        const name = `${p.firstName} ${p.lastName}`.trim();
        return { special: 'addSpouse', label: name ? `Married ${name}` : 'Got married' };
      }
      const p = payload as Partial<Person>;
      const name = [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
      return { special: 'addSpouse', label: name ? `Married ${name}` : 'Got married' };
    }
    case 'addFriend': {
      const p = payload as Partial<Person>;
      const name = [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
      return { special: 'addFriend', label: name ? `Befriended ${name}` : 'New friend' };
    }
    case 'breakUpPartner':
      return { special: 'breakUpPartner', label: 'Broke up' };
    case 'endEngagement':
      return { special: 'endEngagement', label: 'Engagement called off' };
    case 'divorceSpouse':
      return { special: 'divorceSpouse', label: 'Divorced' };
    case 'loseFriend':
      return { special: 'loseFriend', label: 'Drifted apart from a friend' };
    case 'resetFriendContact':
      return null;
    case 'adjustRelationshipLevel': {
      const delta = typeof payload.delta === 'number' ? payload.delta : 0;
      if (delta === 0) return null;
      const slot = payload.slot as 'partner' | 'fiance' | 'spouse' | undefined;
      const rs = state.relationshipState;
      let found: Person | undefined;
      if (slot && rs) {
        found = rs[slot] ?? undefined;
        if (!found) return null;
      } else {
        const targetId =
          (payload.targetId as string | undefined) ??
          (payload.id as string | undefined);
        if (!targetId) return null;
        const matches = (p: Person) => p.id === targetId || p.baseId === targetId;
        const candidates: Person[] = [];
        if (rs) {
          if (rs.partner) candidates.push(rs.partner);
          if (rs.fiance) candidates.push(rs.fiance);
          if (rs.spouse) candidates.push(rs.spouse);
          candidates.push(...rs.family, ...rs.friends, ...rs.significantExes, ...rs.casualExes);
        }
        found = candidates.find(matches);
      }
      const name = found
        ? `${found.firstName} ${found.lastName}`.trim() || 'them'
        : 'them';
      const sign = delta > 0 ? '+' : '−';
      const verb = delta > 0 ? 'Closer to' : 'Further from';
      return {
        special: 'adjustRelationshipLevel',
        label: `${verb} ${name}: ${sign}${Math.abs(delta)}`,
      };
    }
    case 'removeRelationship': {
      const id = payload.id as string | undefined;
      // Suppress the summary when no person actually matches. rel_breakup
      // and rel_propose fan out 5 partner-base sweeps; for a clean state
      // 4 of those are no-ops and would otherwise emit "Lost touch with
      // someone" for each miss. Surface a summary only when a real
      // relationship row will be removed.
      const rel = id ? state.relationships.find((r) => r.id === id || r.baseId === id) : null;
      if (!rel) return null;
      const fullName = `${rel.firstName ?? ''} ${rel.lastName ?? ''}`.trim();
      // Defensive fallback: a record exists but somehow has no firstName.
      // Diagnostic shows this is 0 for fresh lives; protects against legacy
      // saves and any future code path that bypasses name enrichment.
      const display = fullName || 'an old acquaintance';
      return { special: 'removeRelationship', label: `Lost touch with ${display}` };
    }
    case 'addAsset': {
      const asset = payload as Partial<Asset>;
      return { special: 'addAsset', label: asset.name ? `Bought: ${asset.name}` : 'New asset' };
    }
    case 'addCrime': {
      const crime = payload as Partial<CrimeRecord>;
      const verb = crime.caught ? 'Caught for' : 'Got away with';
      return { special: 'addCrime', label: crime.crime ? `${verb} ${crime.crime}` : 'Committed a crime' };
    }
    case 'setJob': {
      const job = payload as Partial<Job>;
      return { special: 'setJob', label: job.title ? `New job: ${job.title}` : 'Started a new job' };
    }
    case 'leaveJob':
      return { special: 'leaveJob', label: 'Left the job' };
    case 'die': {
      const cause = payload.cause as string | undefined;
      return { special: 'die', label: cause ? `Died: ${cause}` : 'Died' };
    }
    default:
      return null;
  }
}

export interface ApplyEffectsResult {
  state: PlayerState;
  deltas: StatDelta[];
  specials: SpecialSummary[];
}

/**
 * Variant of `applyEffects` that records what changed for the StatFeedback UI.
 * Deltas only cover paths in FEEDBACK_PATHS; everything else (e.g. job.salary
 * tweaks, criminal record entries) is surfaced through `specials` if it was
 * a special effect, and silently otherwise.
 *
 * Pure: returns a new state, never mutates.
 */
export function applyEffectsWithFeedback(state: PlayerState, effects: Effect[]): ApplyEffectsResult {
  const accumulated = new Map<string, { before: number; after: number }>();
  const specials: SpecialSummary[] = [];

  let next = state;
  for (const effect of effects) {
    if (effect.special) {
      const summary = summarizeSpecial(effect, next);
      next = applyEffect(next, effect);
      if (summary) specials.push(summary);
      continue;
    }

    if (effect.path && FEEDBACK_PATHS.has(effect.path)) {
      const beforeRaw = getAtPath(next, effect.path);
      const before = typeof beforeRaw === 'number' ? beforeRaw : 0;
      next = applyEffect(next, effect);
      const afterRaw = getAtPath(next, effect.path);
      const after = typeof afterRaw === 'number' ? afterRaw : 0;
      const existing = accumulated.get(effect.path);
      if (existing) {
        existing.after = after;
      } else {
        accumulated.set(effect.path, { before, after });
      }
    } else {
      next = applyEffect(next, effect);
    }
  }

  const deltas: StatDelta[] = [];
  for (const [path, { before, after }] of accumulated.entries()) {
    if (before !== after) deltas.push({ path, before, after });
  }

  return { state: next, deltas, specials };
}
