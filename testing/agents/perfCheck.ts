/**
 * Lightweight performance probe for the tier-system rollout.
 *   - Measures wall-time for 1000 with-AI lives.
 *   - Reports state size for a representative life (JSON byte length).
 *   - Times a single ageUp() over the median state to gauge per-tick cost.
 */
import { setStorageAdapter } from '../../src/game/state/persistence';
import { createMemoryStorageAdapter } from '../fixtures/memoryStorage';
import { simulateLifeWithActivities } from '../lib/simulatorWithActivities';
import { ageUp } from '../../src/game/engine/gameLoop';
import { ALL_EVENTS } from '../../src/game/data/events';
import { createRng } from '../../src/game/engine/rng';
import type { PlayerState } from '../../src/game/types/gameState';

setStorageAdapter(createMemoryStorageAdapter());

const LIVES = 1000;

function bytes(s: string): number {
  return new TextEncoder().encode(s).length;
}

function summarizeRel(state: PlayerState): string {
  const rs = state.relationshipState;
  if (!rs) return 'no relationshipState';
  const parts = [
    rs.partner ? 'partner' : '',
    rs.fiance ? 'fiance' : '',
    rs.spouse ? 'spouse' : '',
    `family=${rs.family.length}`,
    `friends=${rs.friends.length}`,
    `casualEx=${rs.casualExes.length}`,
    `sigEx=${rs.significantExes.length}`,
  ].filter(Boolean);
  return parts.join(', ');
}

const startedAt = Date.now();
const lives: PlayerState[] = [];
for (let i = 0; i < LIVES; i++) {
  const r = simulateLifeWithActivities({ seed: 9000 + i, enableActivities: true });
  lives.push(r.finalState);
}
const elapsedMs = Date.now() - startedAt;

const sizes = lives.map((s) => bytes(JSON.stringify(s)));
sizes.sort((a, b) => a - b);
const median = sizes[Math.floor(sizes.length / 2)] as number;
const max = sizes[sizes.length - 1] as number;
const min = sizes[0] as number;
const mean = sizes.reduce((a, b) => a + b, 0) / sizes.length;

// Pick the median life for the per-tick benchmark.
const medianIdx = Math.floor(sizes.length / 2);
const medianStateSize = sizes[medianIdx] as number;
const medianState = lives.find(
  (s) => bytes(JSON.stringify(s)) === medianStateSize,
)!;
const tickRng = createRng(424242);
const tickRuns = 1000;
const tickStart = Date.now();
for (let i = 0; i < tickRuns; i++) {
  ageUp(medianState, ALL_EVENTS, tickRng);
}
const tickElapsedMs = Date.now() - tickStart;

console.log(`Lives: ${LIVES} with-AI`);
console.log(`Total wall time: ${(elapsedMs / 1000).toFixed(3)}s (${(elapsedMs / LIVES).toFixed(2)}ms/life)`);
console.log(`State size (JSON bytes): min=${min}, median=${median}, mean=${mean.toFixed(0)}, max=${max}`);
console.log(`Per-tick (ageUp on median state) over ${tickRuns} runs: ${tickElapsedMs}ms (${(tickElapsedMs / tickRuns).toFixed(3)}ms each)`);
console.log(`Median life summary: ${summarizeRel(medianState)}, age ${medianState.age}`);
