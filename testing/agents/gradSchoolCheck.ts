/**
 * Focused diagnostic: among players who START grad school, what fraction
 * actually complete it? Bypasses simulateLife so we can pre-bake smart
 * players that pass the eligibility gate; default random sampling triggers
 * grad school in only ~0.1% of lives — too small for a ratio.
 *
 * Choice strategy:
 *   - edu_grad_school          → always pick "Apply" (index 0)
 *   - edu_grad_school_complete → take the only choice (index 0)
 *   - everything else          → pick choice 0 (deterministic)
 *
 * Target: >= 70% completion of those who started.
 */
import { ALL_EVENTS } from '../../src/game/data/events';
import { ageUp, endYear, resolveEvent } from '../../src/game/engine/gameLoop';
import { createRng } from '../../src/game/engine/rng';
import { setStorageAdapter } from '../../src/game/state/persistence';
import { createNewLife } from '../../src/game/state/newLife';
import { createMemoryStorageAdapter } from '../fixtures/memoryStorage';
import type { PlayerState } from '../../src/game/types/gameState';

setStorageAdapter(createMemoryStorageAdapter());

const RUNS = 500;

function buildSmartLife(seed: number): PlayerState {
  const rng = createRng(seed);
  const player = createNewLife(rng, { countryId: 'GB' });
  // Force the smarts gate: 90 smarts gives plenty of headroom to stay
  // above the 75 threshold even after random hits.
  return {
    ...player,
    stats: { ...player.stats, smarts: 90 },
    money: 100_000, // grad school costs 15k; never block on funds
  };
}

function simulateOne(seed: number): {
  started: boolean;
  completed: boolean;
} {
  let state = buildSmartLife(seed);
  const rng = createRng(seed * 7 + 1);
  let started = false;
  let completed = false;

  while (state.alive && state.age < 40) {
    const ageResult = ageUp(state, ALL_EVENTS, rng);
    state = ageResult.state;
    for (const event of ageResult.pendingEvents) {
      const idx = 0; // always pick first option (Apply, when present)
      const result = resolveEvent(state, event, idx, rng);
      state = result.state;
      if (event.id === 'edu_grad_school') started = true;
      if (event.id === 'edu_grad_school_complete') completed = true;
      if (!state.alive) break;
    }
    if (!state.alive) break;
    state = endYear(state, rng);
  }

  return { started, completed };
}

function main(): void {
  let started = 0;
  let completed = 0;
  for (let i = 0; i < RUNS; i++) {
    const r = simulateOne(1234 + i);
    if (r.started) started++;
    if (r.completed) completed++;
  }
  const ratio = started === 0 ? 0 : (completed / started) * 100;
  console.log(`Runs: ${RUNS}`);
  console.log(`Started grad school: ${started}`);
  console.log(`Completed grad school: ${completed}`);
  console.log(`Completion ratio: ${ratio.toFixed(1)}%`);
}

main();
