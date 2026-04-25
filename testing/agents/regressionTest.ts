/**
 * Regression test — focuses on whatever changed in the last commit.
 *
 * Inspects `git diff --name-only HEAD~1 HEAD` and decides what to run:
 *   - changed engine code (`src/game/engine/**`)        → vitest + 100 lives
 *   - changed event data (`src/game/data/events/**`)    → 100 lives that
 *     specifically try to trigger the modified event ids
 *   - changed UI code (`src/ui/**`)                     → headed smoke test
 *
 * Output: testing/reports/regression-YYYY-MM-DD-HHmm.md
 *
 * CLI flags:
 *   --base=<rev>       compare against this revision (default HEAD~1)
 *   --headless         run UI checks headless
 */
import { execSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_EVENTS } from '../../src/game/data/events';
import { simulateLife } from '../lib/simulator';
import { SEEDS } from '../fixtures/seeds';
import { relPath, reportPath, writeReport } from '../lib/report';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');

interface Args {
  base: string;
  headless: boolean;
}

function parseArgs(argv: string[]): Args {
  const baseArg = argv.find((a) => a.startsWith('--base='));
  const base = baseArg ? baseArg.split('=')[1]! : 'HEAD~1';
  const headless = argv.includes('--headless');
  return { base, headless };
}

function changedFiles(base: string): string[] {
  try {
    const out = execSync(`git diff --name-only ${base} HEAD`, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    return out.split('\n').map((l) => l.trim()).filter(Boolean);
  } catch (err) {
    console.warn(`git diff failed (${(err as Error).message}); falling back to staged + unstaged`);
    const out = execSync(`git diff --name-only HEAD`, { cwd: REPO_ROOT, encoding: 'utf8' });
    return out.split('\n').map((l) => l.trim()).filter(Boolean);
  }
}

function classify(files: string[]) {
  const engine = files.filter((f) => f.startsWith('src/game/engine/'));
  const events = files.filter((f) => f.startsWith('src/game/data/events/'));
  const ui = files.filter((f) => f.startsWith('src/ui/'));
  const types = files.filter((f) => f.startsWith('src/game/types/'));
  const other = files.filter(
    (f) =>
      !engine.includes(f) &&
      !events.includes(f) &&
      !ui.includes(f) &&
      !types.includes(f),
  );
  return { engine, events, ui, types, other };
}

function eventIdsInFile(absPath: string): string[] {
  try {
    const src = readFileSync(absPath, 'utf8');
    const ids: string[] = [];
    const re = /id:\s*['"]([a-z0-9_]+)['"]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) ids.push(m[1] as string);
    return ids;
  } catch {
    return [];
  }
}

function runVitest(): { pass: boolean; output: string } {
  const result = spawnSync('npm', ['test', '--silent'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });
  const output = (result.stdout ?? '') + (result.stderr ?? '');
  return { pass: result.status === 0, output };
}

interface Section {
  title: string;
  body: string;
  pass: boolean;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const files = changedFiles(args.base);
  const buckets = classify(files);
  const sections: Section[] = [];
  let overallPass = true;

  // ---- Section: which files changed ----
  sections.push({
    title: 'Changed files',
    body:
      files.length === 0
        ? '_No files changed since base._'
        : files.map((f) => `- \`${f}\``).join('\n'),
    pass: true,
  });

  // ---- Section: engine code ----
  if (buckets.engine.length > 0 || buckets.types.length > 0) {
    const lines: string[] = [];
    lines.push('Engine or types changed — running full vitest suite plus 100 lives.');
    lines.push('');
    const vitest = runVitest();
    overallPass = overallPass && vitest.pass;
    lines.push(`### vitest: ${vitest.pass ? 'PASS' : 'FAIL'}`);
    lines.push('```');
    lines.push(vitest.output.trim().split('\n').slice(-30).join('\n'));
    lines.push('```');
    lines.push('');

    let violations = 0;
    let crashes = 0;
    for (let i = 0; i < 100; i++) {
      try {
        const life = simulateLife({ seed: SEEDS.regression * 1009 + i });
        if (life.statBoundsViolation) violations++;
      } catch {
        crashes++;
      }
    }
    const livesPass = violations === 0 && crashes === 0;
    overallPass = overallPass && livesPass;
    lines.push(`### 100-life smoke: ${livesPass ? 'PASS' : 'FAIL'}`);
    lines.push(`- crashes: ${crashes}`);
    lines.push(`- stat-bounds violations: ${violations}`);

    sections.push({ title: 'Engine regression', body: lines.join('\n'), pass: vitest.pass && livesPass });
  }

  // ---- Section: changed events ----
  if (buckets.events.length > 0) {
    const lines: string[] = [];
    const changedEventIds = new Set<string>();
    for (const f of buckets.events) {
      for (const id of eventIdsInFile(resolve(REPO_ROOT, f))) {
        if (ALL_EVENTS.some((e) => e.id === id)) changedEventIds.add(id);
      }
    }
    lines.push(`Changed event ids found in diff: ${changedEventIds.size}`);
    if (changedEventIds.size > 0) {
      lines.push('');
      lines.push('Running 100 lives, counting how many trigger each changed event.');
      lines.push('');

      const counts = new Map<string, number>();
      for (let i = 0; i < 100; i++) {
        const life = simulateLife({ seed: SEEDS.regression * 31 + i });
        for (const id of changedEventIds) {
          if (life.eventTriggerCounts.has(id)) {
            counts.set(id, (counts.get(id) ?? 0) + 1);
          }
        }
      }
      lines.push(`| Event id | Triggered in (out of 100) |`);
      lines.push(`|---|---|`);
      for (const id of changedEventIds) {
        const n = counts.get(id) ?? 0;
        const flag = n === 0 ? ' ⚠ never triggered' : '';
        lines.push(`| ${id} | ${n}${flag} |`);
      }
    }
    sections.push({ title: 'Event regression', body: lines.join('\n'), pass: true });
  }

  // ---- Section: UI smoke ----
  if (buckets.ui.length > 0) {
    const lines: string[] = [];
    lines.push('UI files changed — running smoke test.');
    lines.push('');
    const smokeArgs = ['testing/agents/smokeTest.ts'];
    if (args.headless) smokeArgs.push('--headless');
    const result = spawnSync('npx', ['tsx', ...smokeArgs], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    const output = (result.stdout ?? '') + (result.stderr ?? '');
    const pass = result.status === 0;
    overallPass = overallPass && pass;
    lines.push(`### smoke: ${pass ? 'PASS' : 'FAIL'}`);
    lines.push('```');
    lines.push(output.trim().split('\n').slice(-15).join('\n'));
    lines.push('```');
    sections.push({ title: 'UI regression (smoke)', body: lines.join('\n'), pass });
  }

  // ---- Section: nothing matched ----
  if (
    buckets.engine.length === 0 &&
    buckets.events.length === 0 &&
    buckets.ui.length === 0 &&
    buckets.types.length === 0 &&
    files.length > 0
  ) {
    sections.push({
      title: 'Nothing actionable',
      body: 'Changed files don\'t touch engine, events, types, or UI — running vitest as a sanity check.',
      pass: true,
    });
    const v = runVitest();
    overallPass = overallPass && v.pass;
    sections.push({
      title: 'vitest',
      body: '```\n' + v.output.trim().split('\n').slice(-20).join('\n') + '\n```',
      pass: v.pass,
    });
  }

  const md = [
    `# Regression — ${new Date().toISOString()}`,
    '',
    `**Base:** ${args.base}`,
    `**Result:** ${overallPass ? 'PASS' : 'FAIL'}`,
    '',
    ...sections.flatMap((s) => [`## ${s.title}`, '', s.body, '']),
  ].join('\n');

  const reportFile = reportPath('regression');
  const written = writeReport(reportFile, md);
  console.log(`\nReport: ${relPath(written)}`);
  console.log(`Result: ${overallPass ? 'PASS' : 'FAIL'}`);
  process.exit(overallPass ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
