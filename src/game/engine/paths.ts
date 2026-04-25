/**
 * Helpers for resolving and updating values at dotted paths inside a state
 * object. Used by the condition evaluator and effects applier.
 *
 * Why custom: lodash is overkill, and we need predictable behavior for the
 * specific case of "missing intermediate property" (return undefined, never
 * throw — events should never crash the game).
 */

export function getAtPath(root: unknown, path: string): unknown {
  if (!path) return undefined;
  const parts = path.split('.');
  let current: unknown = root;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/**
 * Return a new root with `path` set to `value`. Intermediate objects are
 * shallow-cloned along the way so the original tree is untouched.
 *
 * If an intermediate node is missing or non-object, this is a no-op
 * (returns the original root) — events that target paths on a null `job`
 * or a missing relationship should be silently ignored, not crash.
 */
export function setAtPath<T>(root: T, path: string, value: unknown): T {
  if (!path) return root;
  const parts = path.split('.');
  if (root === null || typeof root !== 'object') return root;

  const result: Record<string, unknown> = { ...(root as Record<string, unknown>) };
  let cursor: Record<string, unknown> = result;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i] as string;
    const child = cursor[key];
    if (child === null || typeof child !== 'object') {
      return root;
    }
    const cloned = { ...(child as Record<string, unknown>) };
    cursor[key] = cloned;
    cursor = cloned;
  }

  cursor[parts[parts.length - 1] as string] = value;
  return result as T;
}
