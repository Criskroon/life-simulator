import type { Condition } from '../types/events';
import type { PlayerState } from '../types/gameState';
import { getAtPath } from './paths';

/**
 * Evaluate a single condition against the player state. Missing paths
 * return false rather than throwing — events with stale or job-dependent
 * conditions should silently disqualify, not crash the whole tick.
 *
 * `has` / `lacks` work against arrays (membership) or strings (substring).
 */
export function evaluateCondition(state: PlayerState, condition: Condition): boolean {
  const actual = getAtPath(state, condition.path);

  switch (condition.op) {
    case '==':
      return actual === condition.value;
    case '!=':
      return actual !== condition.value;
    case '>':
      return typeof actual === 'number' && actual > Number(condition.value);
    case '<':
      return typeof actual === 'number' && actual < Number(condition.value);
    case '>=':
      return typeof actual === 'number' && actual >= Number(condition.value);
    case '<=':
      return typeof actual === 'number' && actual <= Number(condition.value);
    case 'has':
      if (Array.isArray(actual)) {
        return actual.some((entry) => matchesValue(entry, condition.value));
      }
      if (typeof actual === 'string') {
        return actual.includes(String(condition.value));
      }
      return false;
    case 'lacks':
      if (actual === undefined || actual === null) return true;
      if (Array.isArray(actual)) {
        return !actual.some((entry) => matchesValue(entry, condition.value));
      }
      if (typeof actual === 'string') {
        return !actual.includes(String(condition.value));
      }
      return false;
    default:
      return false;
  }
}

function matchesValue(entry: unknown, target: unknown): boolean {
  if (entry === target) return true;
  if (entry && typeof entry === 'object') {
    // Membership for object arrays: match by `id`, `type`, `careerId`, or
    // `level` if any of those equal the target. Keeps event authoring concise:
    //   { path: "relationships", op: "has", value: "spouse" }
    //   { path: "education",     op: "has", value: "high_school" }
    const obj = entry as Record<string, unknown>;
    return (
      obj.id === target ||
      obj.type === target ||
      obj.careerId === target ||
      obj.level === target
    );
  }
  return false;
}

export function evaluateAllConditions(
  state: PlayerState,
  conditions: Condition[] | undefined,
): boolean {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every((c) => evaluateCondition(state, c));
}
