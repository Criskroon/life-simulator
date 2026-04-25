import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const REPORTS_DIR = resolve(__dirname, '..', 'reports');

/**
 * Build a `prefix-YYYY-MM-DD-HHmm` filename in the reports directory.
 * Returns the absolute path; caller writes content with `writeReport()`.
 */
export function reportPath(prefix: string, ext = 'md'): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate(),
  )}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  return join(REPORTS_DIR, `${prefix}-${stamp}.${ext}`);
}

export function writeReport(absPath: string, content: string): string {
  mkdirSync(dirname(absPath), { recursive: true });
  writeFileSync(absPath, content, 'utf8');
  return absPath;
}

/** Path relative to repo root, for log output users can click. */
export function relPath(absPath: string): string {
  const repoRoot = resolve(__dirname, '..', '..');
  return absPath.startsWith(repoRoot)
    ? absPath.slice(repoRoot.length + 1)
    : absPath;
}
