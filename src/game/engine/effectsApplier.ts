import type { Effect, SpecialSummary, StatDelta } from '../types/events';
import type {
  Asset,
  CrimeRecord,
  EducationRecord,
  Job,
  PlayerState,
  Relationship,
} from '../types/gameState';
import { adjustPrice, adjustSalary, getCurrentCountry } from './countryEngine';
import { getAtPath, setAtPath } from './paths';

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
 * Registry pattern so new special effects can be added without touching the
 * applier itself. Add an entry, ship a new event — that's it.
 */
const SPECIAL_HANDLERS: Record<string, SpecialHandler> = {
  addRelationship: (state, payload) => {
    const rel = payload as unknown as Relationship;
    // Activities re-fire over a life, so authored ids like `rel-gym-friend`
    // would collide. Mint a deterministic, unique id from year + relationship
    // index so each addRelationship produces a distinct record. The author-
    // supplied id is preserved as `baseId` so removeRelationship can target
    // every record sharing that base (events sweep "all date-partners" etc.).
    const baseId = rel.baseId ?? rel.id ?? 'rel';
    const uniqueId = `${baseId}-y${state.currentYear}-n${state.relationships.length}`;
    return {
      ...state,
      relationships: [...state.relationships, { ...rel, id: uniqueId, baseId }],
    };
  },

  removeRelationship: (state, payload) => {
    const id = payload.id as string | undefined;
    if (!id) return state;
    return {
      ...state,
      relationships: state.relationships.filter(
        (r) => r.baseId !== id && r.id !== id,
      ),
    };
  },

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

  addEducation: (state, payload) => {
    const edu = payload as unknown as EducationRecord;
    return { ...state, education: [...state.education, edu] };
  },

  completeEducation: (state, payload) => {
    const level = payload.level as string | undefined;
    if (!level) return state;
    return {
      ...state,
      education: state.education.map((edu) =>
        edu.level === level && edu.endYear === null
          ? { ...edu, endYear: state.currentYear, graduated: true }
          : edu,
      ),
    };
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
        partner: name ? `Started dating ${name}` : 'New partner',
        friend: name ? `Befriended ${name}` : 'New friend',
        child: name ? `Welcomed ${name}` : 'Had a child',
      };
      return { special: 'addRelationship', label: labelByType[rel.type ?? 'friend'] ?? `New relationship: ${name || rel.type}` };
    }
    case 'removeRelationship': {
      const id = payload.id as string | undefined;
      const rel = id ? state.relationships.find((r) => r.id === id) : null;
      const name = rel ? `${rel.firstName} ${rel.lastName}`.trim() : 'someone';
      return { special: 'removeRelationship', label: `Lost touch with ${name}` };
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
    case 'addEducation': {
      const edu = payload as Partial<EducationRecord>;
      return { special: 'addEducation', label: edu.institutionName ? `Enrolled: ${edu.institutionName}` : 'Started a new education' };
    }
    case 'completeEducation': {
      const level = payload.level as string | undefined;
      const pretty = level ? level.replace(/_/g, ' ') : 'school';
      return { special: 'completeEducation', label: `Graduated: ${pretty}` };
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
