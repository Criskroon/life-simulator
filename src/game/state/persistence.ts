import { calculateActionBudget } from '../engine/actionBudget';
import type { PlayerState } from '../types/gameState';

/**
 * Storage adapter contract. Async on purpose — localStorage is sync, but
 * Capacitor Preferences (the planned mobile target) is async, so the rest of
 * the app talks to this interface and the swap is one file.
 */
export interface StorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

const localStorageAdapter: StorageAdapter = {
  async get(key) {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage.getItem(key);
  },
  async set(key, value) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(key, value);
  },
  async remove(key) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.removeItem(key);
  },
};

let adapter: StorageAdapter = localStorageAdapter;

export function setStorageAdapter(next: StorageAdapter): void {
  adapter = next;
}

const SAVE_KEY = 'reallifesim:save:v1';

export async function saveGame(state: PlayerState): Promise<void> {
  const payload = JSON.stringify(state);
  await adapter.set(SAVE_KEY, payload);
}

export async function loadGame(): Promise<PlayerState | null> {
  const raw = await adapter.get(SAVE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PlayerState;
    return migrate(parsed);
  } catch {
    // Malformed save — treat as no save rather than crashing the app.
    return null;
  }
}

/**
 * Forward-migrate a loaded save to the current schema. Touches only fields
 * that have been renamed/recoded; the rest passes through. Keep additions
 * here defensive — a corrupted field shouldn't strand a player's life.
 */
function migrate(state: PlayerState): PlayerState {
  let next = state;

  // 2026-04: Country codes were aligned to ISO-3166-1 alpha-2; "UK" became
  // "GB". Older saves still write "UK" to the field, so remap on load.
  if ((next.country as string) === 'UK') {
    next = { ...next, country: 'GB' };
  }

  // Activities-menu: pre-V1 saves don't carry an action budget. Seed one
  // from the player's current phase so they don't load with 0 actions.
  if (typeof next.actionsRemainingThisYear !== 'number') {
    next = { ...next, actionsRemainingThisYear: calculateActionBudget(next) };
  }

  // 2026-04: pre-fix saves wrote duplicate relationship ids when an activity
  // re-fired (e.g. multiple `rel-gym-friend` entries). `removeRelationship`
  // filters by id and would wipe all clones at once; rename duplicates so
  // each row is independently addressable.
  next = { ...next, relationships: dedupeRelationshipIds(next.relationships) };

  return next;
}

function dedupeRelationshipIds(
  relationships: PlayerState['relationships'],
): PlayerState['relationships'] {
  const seen = new Map<string, number>();
  return relationships.map((rel) => {
    const count = seen.get(rel.id) ?? 0;
    seen.set(rel.id, count + 1);
    if (count === 0) return rel;
    return { ...rel, id: `${rel.id}-migrated-${count}` };
  });
}

export async function deleteSave(): Promise<void> {
  await adapter.remove(SAVE_KEY);
}
