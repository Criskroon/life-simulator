/**
 * runAll — drives all four agents back-to-back and writes a summary report
 * pointing at each individual report.
 *
 * Order: smoke → regression → balance → playthrough
 * (smoke first so a broken UI fails fast; playthrough last because it's the
 * slowest browser-driven run.)
 *
 * CLI flags:
 *   --headless         pass --headless to UI agents
 *   --lives=N          balance: lives to simulate (default 1000)
 *   --base=<rev>       regression: base revision (default HEAD~1)
 */
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { relPath, reportPath, writeReport } from './lib/report';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

interface AgentRun {
  name: string;
  pass: boolean;
  durationMs: number;
  reportFile: string | null;
  outputTail: string;
}

function runAgent(label: string, scriptRelPath: string, extraArgs: string[]): AgentRun {
  const t0 = Date.now();
  const result = spawnSync('npx', ['tsx', scriptRelPath, ...extraArgs], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });
  const durationMs = Date.now() - t0;
  const output = (result.stdout ?? '') + (result.stderr ?? '');
  const pass = result.status === 0;

  // The agents print "Report: <relpath>" near the end — extract it.
  const match = output.match(/Report:\s+(.+\.md)/);
  const reportFile = match ? (match[1]?.trim() ?? null) : null;

  const outputTail = output.trim().split('\n').slice(-10).join('\n');

  console.log(`\n[${label}] ${pass ? 'PASS' : 'FAIL'} (${(durationMs / 1000).toFixed(1)}s)`);
  if (reportFile) console.log(`  → ${reportFile}`);

  return { name: label, pass, durationMs, reportFile, outputTail };
}

function parsePassthrough(argv: string[]) {
  const headless = argv.includes('--headless') ? ['--headless'] : [];
  const livesArg = argv.find((a) => a.startsWith('--lives=')) ?? '--lives=1000';
  const baseArg = argv.find((a) => a.startsWith('--base=')) ?? '--base=HEAD~1';
  return { headless, livesArg, baseArg };
}

async function main() {
  const { headless, livesArg, baseArg } = parsePassthrough(process.argv.slice(2));

  const runs: AgentRun[] = [];

  runs.push(runAgent('smoke', 'testing/agents/smokeTest.ts', headless));
  runs.push(runAgent('regression', 'testing/agents/regressionTest.ts', [...headless, baseArg]));
  runs.push(runAgent('balance', 'testing/agents/balanceSimulation.ts', [livesArg]));
  runs.push(runAgent('playthrough', 'testing/agents/fullPlaythrough.ts', headless));

  const passed = runs.filter((r) => r.pass).length;
  const total = runs.length;
  const allPass = passed === total;

  const md: string[] = [];
  md.push(`# Full Test Suite — ${new Date().toISOString()}`);
  md.push('');
  md.push(`**Result:** ${allPass ? 'PASS' : 'FAIL'} (${passed}/${total})`);
  md.push('');
  md.push('## Agents');
  md.push('');
  md.push(`| Agent | Result | Duration | Report |`);
  md.push(`|---|---|---|---|`);
  for (const r of runs) {
    const link = r.reportFile ? `[${r.reportFile}](${r.reportFile})` : '_(no report)_';
    md.push(`| ${r.name} | ${r.pass ? 'PASS' : 'FAIL'} | ${(r.durationMs / 1000).toFixed(1)}s | ${link} |`);
  }
  md.push('');

  for (const r of runs) {
    if (r.pass) continue;
    md.push(`## Failure: ${r.name}`);
    md.push('');
    md.push('```');
    md.push(r.outputTail);
    md.push('```');
    md.push('');
  }

  const reportFile = reportPath('full-suite');
  const written = writeReport(reportFile, md.join('\n'));
  console.log(`\nSummary: ${relPath(written)}`);
  console.log(`Result: ${allPass ? 'PASS' : 'FAIL'} (${passed}/${total})`);
  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
