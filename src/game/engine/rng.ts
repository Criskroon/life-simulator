/**
 * Seedable RNG using Mulberry32. Tiny, fast, and deterministic — important
 * because every test that touches event selection or effects needs to be
 * reproducible from a known seed.
 */
export interface Rng {
  next(): number;
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  weighted<T>(items: readonly { item: T; weight: number }[]): T;
  /** Snapshot/restore the internal seed so callers can save the RNG with state. */
  getState(): number;
  setState(state: number): void;
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0;

  function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function int(min: number, max: number): number {
    return Math.floor(next() * (max - min + 1)) + min;
  }

  function pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error('createRng.pick: cannot pick from empty array');
    }
    return items[int(0, items.length - 1)] as T;
  }

  function weighted<T>(items: readonly { item: T; weight: number }[]): T {
    if (items.length === 0) {
      throw new Error('createRng.weighted: cannot pick from empty array');
    }
    const total = items.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0);
    if (total <= 0) {
      // Falling back to uniform is safer than throwing — callers should not
      // have to gate selection on "did anything end up with positive weight".
      return pick(items.map((entry) => entry.item));
    }
    let roll = next() * total;
    for (const entry of items) {
      const w = Math.max(0, entry.weight);
      if (roll < w) return entry.item;
      roll -= w;
    }
    return items[items.length - 1]!.item;
  }

  return {
    next,
    int,
    pick,
    weighted,
    getState: () => state,
    setState: (s: number) => {
      state = s >>> 0;
    },
  };
}

/** Hash a string into a 32-bit seed (e.g. to seed RNG from a player ID). */
export function hashSeed(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
