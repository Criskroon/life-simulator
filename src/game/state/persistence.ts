import { calculateActionBudget } from '../engine/actionBudget';
import {
  migrateLegacyRelationships,
  syncLegacyView,
} from '../engine/relationshipEngine';
import type { PlayerState } from '../types/gameState';
import { migrateToV3, needsV3Migration } from './migrations/v3-education-state';

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
  next = { ...next, relationships: dedupeRelationshipIds(next.relationships ?? []) };

  // 2026-04: removeRelationship now matches on baseId so events can target
  // every record of the same base. Saves written before this change have
  // unique ids like `rel-date-partner-y2050-n3` but no baseId, so the new
  // remove-by-base logic would no-op on them. Derive baseId by stripping
  // the unique-id suffix the addRelationship handler appends.
  next = { ...next, relationships: backfillBaseIds(next.relationships) };

  // 2026-04 (tier system): if the save predates the slot model, build the
  // structured `relationshipState` from the flat array and keep the array
  // as the synced legacy view. The migration policy:
  //   - first spouse seats the spouse slot; additional spouses (E1
  //     bug residue) drop into significantExes
  //   - first partner seats the partner slot; additional partners
  //     (E2 zombie partners) drop into casualExes
  //   - first fiance seats the fiance slot; rest into significantExes
  //   - family/friends/casualEx/significantEx flow into their lists
  if (!next.relationshipState) {
    const rs = migrateLegacyRelationships(next.relationships);
    next = {
      ...next,
      relationshipState: rs,
      relationships: syncLegacyView(rs),
    };
  }

  // v3 (Sessie 2.2): synthesise `educationState` from the legacy
  // `education` array if the save predates the progression engine.
  if (needsV3Migration(next)) {
    next = migrateToV3(next);
  }

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

const UNIQUE_ID_SUFFIX = /(?:-migrated-\d+)?(?:-y\d+-n\d+)?$/;

function backfillBaseIds(
  relationships: PlayerState['relationships'],
): PlayerState['relationships'] {
  return relationships.map((rel) => {
    if (rel.baseId) return rel;
    const stripped = rel.id.replace(UNIQUE_ID_SUFFIX, '');
    const baseId = stripped || rel.id;
    return { ...rel, baseId };
  });
}

export async function deleteSave(): Promise<void> {
  await adapter.remove(SAVE_KEY);
}
