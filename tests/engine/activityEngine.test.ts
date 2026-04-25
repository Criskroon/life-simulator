import { describe, expect, it } from 'vitest';
import {
  executeActivity,
  getAvailableActivities,
} from '../../src/game/engine/activityEngine';
import { createRng } from '../../src/game/engine/rng';
import type { PlayerState } from '../../src/game/types/gameState';

function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'p',
    firstName: 'Test',
    lastName: 'User',
    age: 25,
    gender: 'female',
    country: 'GB',
    alive: true,
    birthYear: 2000,
    currentYear: 2025,
    stats: { health: 80, happiness: 70, smarts: 65, looks: 50 },
    money: 5000,
    job: null,
    education: [],
    relationships: [],
    assets: [],
    criminalRecord: [],
    history: [],
    triggeredEventIds: [],
    actionsRemainingThisYear: 3,
    ...overrides,
  };
}

describe('getAvailableActivities — eligibility filter', () => {
  it('includes age-appropriate activities for an adult', () => {
    const list = getAvailableActivities(makePlayer({ age: 25 }));
    const ids = list.map((a) => a.id);
    expect(ids).toContain('gym');
    expect(ids).toContain('library');
    expect(ids).toContain('vacation');
    expect(ids).toContain('lottery_ticket');
  });

  it('hides adult-only activities from a child', () => {
    const list = getAvailableActivities(makePlayer({ age: 8 }));
    const ids = list.map((a) => a.id);
    expect(ids).not.toContain('vacation');
    expect(ids).not.toContain('lottery_ticket');
    expect(ids).not.toContain('ask_raise');
  });

  it('hides call_friend when no friend relationship exists', () => {
    const list = getAvailableActivities(makePlayer({ relationships: [] }));
    expect(list.some((a) => a.id === 'call_friend')).toBe(false);
  });

  it('includes call_friend once a friend relationship exists', () => {
    const player = makePlayer({
      relationships: [
        {
          id: 'rel-friend',
          type: 'friend',
          firstName: 'Pat',
          lastName: 'Doe',
          age: 25,
          alive: true,
          relationshipLevel: 50,
        },
      ],
    });
    expect(getAvailableActivities(player).some((a) => a.id === 'call_friend')).toBe(true);
  });

  it('hides job-gated activities when the player has no job', () => {
    const list = getAvailableActivities(makePlayer({ job: null }));
    const ids = list.map((a) => a.id);
    expect(ids).not.toContain('work_harder');
    expect(ids).not.toContain('ask_raise');
  });

  it('shows work_harder when the player has a job', () => {
    const player = makePlayer({
      job: { title: 'Dev', careerId: 'tech', level: 0, salary: 50000, performance: 60, yearsAtJob: 2 },
    });
    expect(getAvailableActivities(player).some((a) => a.id === 'work_harder')).toBe(true);
  });
});

describe('executeActivity', () => {
  it('returns ineligible for an out-of-range activity', () => {
    const result = executeActivity(makePlayer({ age: 5 }), 'vacation', createRng(1));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.kind).toBe('ineligible');
  });

  it('returns insufficient_actions when budget is too low', () => {
    const player = makePlayer({ actionsRemainingThisYear: 1 });
    const result = executeActivity(player, 'vacation', createRng(1));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe('insufficient_actions');
      if (result.kind === 'insufficient_actions') {
        expect(result.required).toBe(2);
        expect(result.remaining).toBe(1);
      }
    }
  });

  it('returns unknown for a non-existent activity id', () => {
    const result = executeActivity(makePlayer(), 'nonsense_activity', createRng(1));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.kind).toBe('unknown');
  });

  it('decrements the action budget on success', () => {
    const player = makePlayer({ actionsRemainingThisYear: 3 });
    const result = executeActivity(player, 'meditate', createRng(7));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.actionsRemainingThisYear).toBe(2);
  });

  it('decrements by 2 for vacation', () => {
    const player = makePlayer({ actionsRemainingThisYear: 4, money: 50000 });
    const result = executeActivity(player, 'vacation', createRng(7));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.actionsRemainingThisYear).toBe(2);
  });

  it('returns a ResolvedChoice with deltas the UI can render', () => {
    const player = makePlayer({ actionsRemainingThisYear: 3 });
    const result = executeActivity(player, 'meditate', createRng(7));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.resolved.deltas.length).toBeGreaterThan(0);
      expect(result.resolved.appliedEffects.length).toBeGreaterThan(0);
      // meditate is probabilistic — narrative should be present
      expect(result.resolved.narrative).not.toBeNull();
    }
  });

  it('is reproducible: same seed yields the same outcome', () => {
    const player = makePlayer({ actionsRemainingThisYear: 3 });
    const r1 = executeActivity(player, 'meditate', createRng(42));
    const r2 = executeActivity(player, 'meditate', createRng(42));
    expect(r1.ok && r2.ok).toBe(true);
    if (r1.ok && r2.ok) {
      expect(r1.resolved.narrative).toBe(r2.resolved.narrative);
    }
  });
});

describe('country gating — lottery', () => {
  it('lottery_ticket is shown when gambling is allowed (default for NL/US/GB)', () => {
    const list = getAvailableActivities(makePlayer({ age: 25, country: 'NL' }));
    expect(list.some((a) => a.id === 'lottery_ticket')).toBe(true);
  });
});
