/**
 * Quick verification: synthetic 5×duplicate-ID save → loadGame → all 5 unique.
 * Stand-alone so the audit can attest the migration works; the existing
 * persistence.test.ts covers the same path with 3 duplicates.
 */
import {
  loadGame,
  setStorageAdapter,
} from '../../src/game/state/persistence';
import { createMemoryStorageAdapter } from '../fixtures/memoryStorage';
import type { PlayerState } from '../../src/game/types/gameState';

const SAVE_KEY = 'reallifesim:save:v1';

const state: PlayerState = {
  id: 'old-save-1',
  firstName: 'Old',
  lastName: 'Save',
  age: 40,
  gender: 'male',
  country: 'GB',
  alive: true,
  birthYear: 1986,
  currentYear: 2026,
  stats: { health: 70, happiness: 70, smarts: 70, looks: 70 },
  money: 0,
  job: null,
  education: [],
  relationships: Array.from({ length: 5 }, (_, i) => ({
    id: 'rel-gym-friend',
    type: 'friend' as const,
    firstName: 'Sam',
    lastName: 'Park',
    age: 26 + i,
    alive: true,
    relationshipLevel: 55,
  })),
  assets: [],
  criminalRecord: [],
  history: [],
  triggeredEventIds: [],
  actionsRemainingThisYear: 3,
};

async function main() {
  const adapter = createMemoryStorageAdapter();
  setStorageAdapter(adapter);
  await adapter.set(SAVE_KEY, JSON.stringify(state));
  const loaded = await loadGame();
  if (!loaded) {
    console.error('loadGame returned null');
    process.exit(1);
  }
  const ids = loaded.relationships.map((r) => r.id);
  const uniq = new Set(ids).size;

  console.log('Pre-migration ids: ', state.relationships.map((r) => r.id));
  console.log('Post-migration ids:', ids);
  console.log(`Distinct ids: ${uniq} / ${ids.length}`);

  // Names — confirm migration does NOT rewrite names; that's the point.
  const fullNames = loaded.relationships.map((r) => `${r.firstName} ${r.lastName}`);
  console.log('Names after migration:', fullNames);

  console.log('\nDetectability check: is there a way to tell whether a save was migrated?');
  // The migration leaves no marker; ids keep `-migrated-N` suffixes only when
  // duplicates were actually present. So a clean post-fbedbed save and a
  // fully-migrated old save are indistinguishable by structure.
  const hasMigratedSuffix = loaded.relationships.some((r) =>
    /-migrated-\d+$/.test(r.id),
  );
  console.log(`Any rel.id has '-migrated-N' suffix: ${hasMigratedSuffix}`);
  console.log('-> A user playing an old save that was already migrated will have unique ids,');
  console.log('   but the original "Sam Park" / "Sam Park"/ "Sam Park" names remain unchanged.');
  console.log('   Detection is structural only (presence of `-migrated-` suffix).');

  if (uniq !== 5) {
    console.error('FAIL: migration did not produce 5 unique ids');
    process.exit(2);
  }
  console.log('\nOK: 5 unique ids produced.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
