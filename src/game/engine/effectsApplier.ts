import type { Effect } from '../types/events';
import type {
  Asset,
  CrimeRecord,
  EducationRecord,
  Job,
  PlayerState,
  Relationship,
} from '../types/gameState';
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
    return { ...state, relationships: [...state.relationships, rel] };
  },

  removeRelationship: (state, payload) => {
    const id = payload.id as string | undefined;
    if (!id) return state;
    return {
      ...state,
      relationships: state.relationships.filter((r) => r.id !== id),
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
    return { ...state, job };
  },

  leaveJob: (state) => ({ ...state, job: null }),

  die: (state, payload) => ({
    ...state,
    alive: false,
    causeOfDeath: (payload.cause as string | undefined) ?? 'unknown causes',
  }),
};

function applyArithmetic(state: PlayerState, effect: Effect): PlayerState {
  if (!effect.path || !effect.op || effect.value === undefined) return state;

  const current = getAtPath(state, effect.path);
  if (effect.op === '=') {
    return setAtPath(state, effect.path, clampIfBounded(effect.path, effect.value));
  }

  // For arithmetic ops, treat missing/non-numeric current as 0 so authors
  // don't have to seed every numeric field before mutating it.
  const base = typeof current === 'number' ? current : 0;
  let next = base;
  switch (effect.op) {
    case '+':
      next = base + effect.value;
      break;
    case '-':
      next = base - effect.value;
      break;
    case '*':
      next = base * effect.value;
      break;
    case '/':
      next = effect.value === 0 ? base : base / effect.value;
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
