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
    return JSON.parse(raw) as PlayerState;
  } catch {
    // Malformed save — treat as no save rather than crashing the app.
    return null;
  }
}

export async function deleteSave(): Promise<void> {
  await adapter.remove(SAVE_KEY);
}
