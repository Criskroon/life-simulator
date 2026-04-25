import { describe, it, expect } from 'vitest';
import { ALL_EVENTS } from '../../src/game/data/events';
import { ageUp, endYear, resolveEvent } from '../../src/game/engine/gameLoop';
import { createRng } from '../../src/game/engine/rng';
import { createNewLife } from '../../src/game/state/newLife';
import type { PlayerState } from '../../src/game/types/gameState';

/**
 * Run a full life with a fixed seed and assert the engine never produces
 * impossible state (out-of-range stats, age going backwards, history mismatch,
 * negative ages on relationships, etc.). The exact path doesn't matter — what
 * matters is that whatever path the engine takes, it stays internally
 * consistent for the entire run.
 */
describe('integration: full life with fixed seed', () => {
  it('runs from birth to death without producing inconsistent state', () => {
    const setupRng = createRng(12345);
    let player: PlayerState = createNewLife(setupRng, {
      firstName: 'Test',
      lastName: 'Subject',
      gender: 'female',
      countryId: 'NL',
    });
    const tickRng = createRng(67890);

    let safetyTicks = 0;
    while (player.alive && safetyTicks < 200) {
      safetyTicks++;
      const previousAge = player.age;

      const { state: aged, pendingEvents } = ageUp(player, ALL_EVENTS, tickRng);
      player = aged;
      expect(player.age).toBe(previousAge + 1);

      // Resolve every pending event by always picking the first choice.
      for (const event of pendingEvents) {
        const before = player.history.length;
        const result = resolveEvent(player, event, 0, tickRng);
        player = result.state;
        expect(player.history.length).toBe(before + 1);
      }

      player = endYear(player, tickRng);

      // Stats must always be in [0,100]
      expect(player.stats.health).toBeGreaterThanOrEqual(0);
      expect(player.stats.health).toBeLessThanOrEqual(100);
      expect(player.stats.happiness).toBeGreaterThanOrEqual(0);
      expect(player.stats.happiness).toBeLessThanOrEqual(100);
      expect(player.stats.smarts).toBeGreaterThanOrEqual(0);
      expect(player.stats.smarts).toBeLessThanOrEqual(100);
      expect(player.stats.looks).toBeGreaterThanOrEqual(0);
      expect(player.stats.looks).toBeLessThanOrEqual(100);

      // Relationships must have non-negative age
      for (const rel of player.relationships) {
        expect(rel.age).toBeGreaterThanOrEqual(0);
      }

      // History entries must reference valid years and be non-decreasing
      for (let i = 1; i < player.history.length; i++) {
        expect(player.history[i]!.year).toBeGreaterThanOrEqual(
          player.history[i - 1]!.year,
        );
      }
    }

    expect(player.alive).toBe(false);
    expect(player.causeOfDeath).toBeTruthy();
    expect(player.history.length).toBeGreaterThan(0);
  });
});
