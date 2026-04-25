import type { StorageAdapter } from '../../src/game/state/persistence';

/**
 * In-memory adapter so tests never touch the user's real localStorage.
 * Pass to `setStorageAdapter()` before driving the engine.
 */
export function createMemoryStorageAdapter(): StorageAdapter {
  const store = new Map<string, string>();
  return {
    async get(key) {
      return store.has(key) ? (store.get(key) as string) : null;
    },
    async set(key, value) {
      store.set(key, value);
    },
    async remove(key) {
      store.delete(key);
    },
  };
}
