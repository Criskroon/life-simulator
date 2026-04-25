import { beforeEach, describe, expect, it } from 'vitest';
import { ALL_EVENTS } from '../../src/game/data/events';
import { ageUp, endYear, resolveEvent } from '../../src/game/engine/gameLoop';
import { createRng } from '../../src/game/engine/rng';
import { setStorageAdapter } from '../../src/game/state/persistence';
import { createNewLife } from '../../src/game/state/newLife';
import { createMemoryStorageAdapter } from '../../testing/fixtures/memoryStorage';
import type { PlayerState } from '../../src/game/types/gameState';

/**
 * Among players who enroll in high school / university, what fraction
 * actually see their graduation event? With the wide age window plus
 * dominant weight on the graduation events, conversion should sit at
 * ≥80% — anything lower means the event-selector quiet-year + diversity
 * penalty is again starving the event out.
 */

function buildSmartLife(seed: number, smarts: number): PlayerState {
  const rng = createRng(seed);
  const player = createNewLife(rng, { countryId: 'GB' });
  return {
    ...player,
    stats: { ...player.stats, smarts },
    money: 100_000, // university costs ~8k; never block on funds
  };
}

interface SimResult {
  hsStarted: boolean;
  hsCompleted: boolean;
  uniStarted: boolean;
  uniCompleted: boolean;
}

function simulateOne(seed: number): SimResult {
  let state = buildSmartLife(seed, 80);
  const rng = createRng(seed * 7 + 1);
  const result: SimResult = {
    hsStarted: false,
    hsCompleted: false,
    uniStarted: false,
    uniCompleted: false,
  };

  while (state.alive && state.age < 30) {
    const ageResult = ageUp(state, ALL_EVENTS, rng);
    state = ageResult.state;
    for (const event of ageResult.pendingEvents) {
      // Always pick choice 0 — the "go forward" branch for both
      // start/graduate events. Skips ambiguous events like dropout.
      const idx = event.id === 'edu_dropout' ? 1 : 0;
      const r = resolveEvent(state, event, idx, rng);
      state = r.state;
      if (event.id === 'edu_high_school_start') result.hsStarted = true;
      if (event.id === 'edu_graduate_high_school') result.hsCompleted = true;
      if (event.id === 'edu_university_apply') result.uniStarted = true;
      if (event.id === 'edu_uni_graduate') result.uniCompleted = true;
      if (!state.alive) break;
    }
    if (!state.alive) break;
    state = endYear(state, rng);
  }

  return result;
}

describe('graduation completion rates', () => {
  beforeEach(() => {
    setStorageAdapter(createMemoryStorageAdapter());
  });

  it('graduates ≥80% of high-school enrollees and ≥80% of university enrollees', () => {
    const RUNS = 200;
    let hsStarted = 0;
    let hsCompleted = 0;
    let uniStarted = 0;
    let uniCompleted = 0;

    for (let i = 0; i < RUNS; i++) {
      const r = simulateOne(1234 + i);
      if (r.hsStarted) hsStarted++;
      if (r.hsCompleted) hsCompleted++;
      if (r.uniStarted) uniStarted++;
      if (r.uniCompleted) uniCompleted++;
    }

    const hsRatio = hsStarted === 0 ? 0 : hsCompleted / hsStarted;
    const uniRatio = uniStarted === 0 ? 0 : uniCompleted / uniStarted;

    expect(hsStarted).toBeGreaterThan(20);
    expect(uniStarted).toBeGreaterThan(20);
    expect(hsRatio).toBeGreaterThanOrEqual(0.8);
    expect(uniRatio).toBeGreaterThanOrEqual(0.8);
  });
});
