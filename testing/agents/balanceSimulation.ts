/**
 * Balance simulation — N full lives via the engine, no browser needed.
 *
 * Looks for:
 *   - lifespan distribution (mean, median, p10, p90)
 *   - top 10 causes of death
 *   - event trigger frequency (% of lives that saw each event)
 *   - average happiness per age (rough trajectory)
 *   - end-of-life money distribution
 *   - peak job-level reached per career (and how many lives reach the top)
 *
 * Outliers (events triggering in <1% or >50% of lives) are flagged at the
 * top of the report so balance regressions stand out.
 *
 * Output: testing/reports/balance-YYYY-MM-DD-HHmm.md
 *
 * CLI flags:
 *   --lives=N          number of lives to simulate (default 1000)
 *   --seed=N           seed for the master RNG (default 7)
 *   --country=NL       force every life into one country (default: rotate
 *                      evenly across all available countries)
 */
import { ALL_EVENTS } from '../../src/game/data/events';
import { CAREERS } from '../../src/game/data/careers';
import { COUNTRIES } from '../../src/game/data/countries';
import { simulateLife, type SimulatedLife } from '../lib/simulator';
import { SEEDS } from '../fixtures/seeds';
import { relPath, reportPath, writeReport } from '../lib/report';

interface Args {
  lives: number;
  seed: number;
  /** If set, all lives use this country code; otherwise rotate evenly. */
  country: string | null;
}

function parseArgs(argv: string[]): Args {
  const livesArg = argv.find((a) => a.startsWith('--lives='));
  const lives = livesArg ? Number(livesArg.split('=')[1]) : 1000;
  const seedArg = argv.find((a) => a.startsWith('--seed='));
  const seed = seedArg ? Number(seedArg.split('=')[1]) : SEEDS.balance;
  const countryArg = argv.find((a) => a.startsWith('--country='));
  const country = countryArg ? (countryArg.split('=')[1] ?? null) : null;
  return { lives, seed, country };
}

function quantile(sortedAsc: number[], q: number): number {
  if (sortedAsc.length === 0) return 0;
  const pos = (sortedAsc.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const next = sortedAsc[Math.min(base + 1, sortedAsc.length - 1)] as number;
  const cur = sortedAsc[base] as number;
  return cur + (next - cur) * rest;
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function topN<K>(counter: Map<K, number>, n: number): Array<[K, number]> {
  return [...counter.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const countryRotation = args.country
    ? [args.country]
    : COUNTRIES.map((c) => c.code);
  console.log(
    `Simulating ${args.lives} lives (seed=${args.seed}, countries=${countryRotation.join('/')})...`,
  );

  const t0 = Date.now();
  const lives: SimulatedLife[] = [];
  const livesByCountry = new Map<string, SimulatedLife[]>();
  for (let i = 0; i < args.lives; i++) {
    // Derive per-life seed from the master seed so the run is reproducible
    // but each life uses a distinct stream.
    const countryId = countryRotation[i % countryRotation.length] as string;
    const life = simulateLife({
      seed: args.seed * 1_000_003 + i,
      newLife: { countryId },
    });
    lives.push(life);
    if (!livesByCountry.has(countryId)) livesByCountry.set(countryId, []);
    livesByCountry.get(countryId)!.push(life);
    if ((i + 1) % 200 === 0) {
      console.log(`  ${i + 1}/${args.lives}`);
    }
  }
  const elapsedMs = Date.now() - t0;

  // ---- Lifespan ----
  const lifespans = lives.map((l) => l.yearsLived).sort((a, b) => a - b);
  const lifeStats = {
    mean: Math.round(mean(lifespans) * 10) / 10,
    median: Math.round(quantile(lifespans, 0.5) * 10) / 10,
    p10: Math.round(quantile(lifespans, 0.1)),
    p90: Math.round(quantile(lifespans, 0.9)),
    min: lifespans[0] ?? 0,
    max: lifespans[lifespans.length - 1] ?? 0,
  };

  // ---- Causes of death ----
  const causes = new Map<string, number>();
  for (const l of lives) {
    causes.set(l.causeOfDeath, (causes.get(l.causeOfDeath) ?? 0) + 1);
  }

  // ---- Event trigger frequency (lives that saw the event at least once) ----
  const eventLivesSeen = new Map<string, number>();
  for (const l of lives) {
    for (const id of l.eventTriggerCounts.keys()) {
      eventLivesSeen.set(id, (eventLivesSeen.get(id) ?? 0) + 1);
    }
  }
  const allEventIds = ALL_EVENTS.map((e) => e.id);
  const eventFrequency = allEventIds.map((id) => ({
    id,
    pctOfLives: ((eventLivesSeen.get(id) ?? 0) / args.lives) * 100,
  }));

  const overTriggered = eventFrequency.filter((e) => e.pctOfLives > 50);
  const underTriggered = eventFrequency.filter((e) => e.pctOfLives < 1);
  const neverTriggered = eventFrequency.filter((e) => e.pctOfLives === 0);

  // ---- Stat trajectory: average happiness per age bucket ----
  const happinessByAge = new Map<number, number[]>();
  for (const l of lives) {
    for (const snap of l.statTimeline) {
      if (!happinessByAge.has(snap.age)) happinessByAge.set(snap.age, []);
      happinessByAge.get(snap.age)!.push(snap.happiness);
    }
  }
  const agesSorted = [...happinessByAge.keys()].sort((a, b) => a - b);
  const happinessTrajectory = agesSorted
    .filter((age) => age % 10 === 0 && age <= 100)
    .map((age) => ({
      age,
      avgHappiness: Math.round(mean(happinessByAge.get(age)!) * 10) / 10,
      sampleSize: happinessByAge.get(age)!.length,
    }));

  // ---- Money distribution at end of life ----
  const moneys = lives.map((l) => l.finalState.money).sort((a, b) => a - b);
  const moneyStats = {
    mean: Math.round(mean(moneys)),
    median: Math.round(quantile(moneys, 0.5)),
    p10: Math.round(quantile(moneys, 0.1)),
    p90: Math.round(quantile(moneys, 0.9)),
  };

  // ---- Career outcomes ----
  const careerPeak = new Map<string, Map<number, number>>();
  let livesWithJob = 0;
  let livesAtTopLevel = 0;
  for (const l of lives) {
    const job = l.finalState.job;
    if (!job) continue;
    livesWithJob++;
    if (!careerPeak.has(job.careerId)) careerPeak.set(job.careerId, new Map());
    const counts = careerPeak.get(job.careerId)!;
    counts.set(job.level, (counts.get(job.level) ?? 0) + 1);
    const career = CAREERS.find((c) => c.id === job.careerId);
    if (career && job.level >= career.levels.length - 1) livesAtTopLevel++;
  }

  // ---- Stat-bounds violations (would indicate an effects-applier bug) ----
  const violations = lives.filter((l) => l.statBoundsViolation).length;

  // ---- Per-country breakdown (only meaningful when rotating) ----
  const perCountry: PerCountrySummary[] = [];
  if (livesByCountry.size > 1) {
    for (const [code, group] of livesByCountry.entries()) {
      const lifeYears = group.map((l) => l.yearsLived).sort((a, b) => a - b);
      const moneyEnd = group.map((l) => l.finalState.money);
      const causeCounts = new Map<string, number>();
      for (const l of group) {
        causeCounts.set(l.causeOfDeath, (causeCounts.get(l.causeOfDeath) ?? 0) + 1);
      }
      const finalSalaries = group
        .map((l) => l.finalState.job?.salary ?? 0)
        .filter((s) => s > 0);
      perCountry.push({
        code,
        lives: group.length,
        meanLifespan: Math.round(mean(lifeYears) * 10) / 10,
        medianLifespan: Math.round(quantile(lifeYears, 0.5) * 10) / 10,
        meanMoneyAtDeath: Math.round(mean(moneyEnd)),
        meanFinalSalary:
          finalSalaries.length > 0 ? Math.round(mean(finalSalaries)) : 0,
        topCause: topN(causeCounts, 1)[0]?.[0] ?? '—',
      });
    }
    perCountry.sort((a, b) => a.code.localeCompare(b.code));
  }

  const md = renderReport({
    args,
    elapsedMs,
    lifeStats,
    causes,
    eventFrequency,
    overTriggered,
    underTriggered,
    neverTriggered,
    happinessTrajectory,
    moneyStats,
    careerPeak,
    livesWithJob,
    livesAtTopLevel,
    violations,
    perCountry,
  });

  const reportFile = reportPath('balance');
  const written = writeReport(reportFile, md);
  console.log(`\nReport: ${relPath(written)}`);
  console.log(`Mean lifespan: ${lifeStats.mean}, top cause: ${topN(causes, 1)[0]?.[0]}`);
}

interface PerCountrySummary {
  code: string;
  lives: number;
  meanLifespan: number;
  medianLifespan: number;
  meanMoneyAtDeath: number;
  meanFinalSalary: number;
  topCause: string;
}

interface RenderInput {
  args: Args;
  elapsedMs: number;
  lifeStats: { mean: number; median: number; p10: number; p90: number; min: number; max: number };
  causes: Map<string, number>;
  eventFrequency: Array<{ id: string; pctOfLives: number }>;
  overTriggered: Array<{ id: string; pctOfLives: number }>;
  underTriggered: Array<{ id: string; pctOfLives: number }>;
  neverTriggered: Array<{ id: string; pctOfLives: number }>;
  happinessTrajectory: Array<{ age: number; avgHappiness: number; sampleSize: number }>;
  moneyStats: { mean: number; median: number; p10: number; p90: number };
  careerPeak: Map<string, Map<number, number>>;
  livesWithJob: number;
  livesAtTopLevel: number;
  violations: number;
  perCountry: PerCountrySummary[];
}

function renderReport(d: RenderInput): string {
  const lines: string[] = [];
  lines.push(`# Balance Simulation`);
  lines.push('');
  lines.push(`- **Lives simulated:** ${d.args.lives}`);
  lines.push(`- **Master seed:** ${d.args.seed}`);
  lines.push(`- **Elapsed:** ${(d.elapsedMs / 1000).toFixed(2)}s (${(d.elapsedMs / d.args.lives).toFixed(1)} ms/life)`);
  lines.push('');

  if (d.violations > 0) {
    lines.push(`> ⚠ **${d.violations} lives had stats outside the 0..100 range — bug in effects applier.**`);
    lines.push('');
  }

  lines.push('## Outlier warnings');
  lines.push('');
  lines.push(`- Events triggering in **>50%** of lives (likely overweight): ${d.overTriggered.length}`);
  lines.push(`- Events triggering in **<1%** of lives (rare or unreachable): ${d.underTriggered.length}`);
  lines.push(`- Events that **never** triggered: ${d.neverTriggered.length}`);
  lines.push('');
  if (d.overTriggered.length > 0) {
    lines.push('### Over-triggered (>50%)');
    lines.push('');
    lines.push(`| Event ID | % of lives |`);
    lines.push(`|---|---|`);
    for (const e of d.overTriggered.sort((a, b) => b.pctOfLives - a.pctOfLives)) {
      lines.push(`| ${e.id} | ${e.pctOfLives.toFixed(1)}% |`);
    }
    lines.push('');
  }
  if (d.neverTriggered.length > 0) {
    lines.push('### Never triggered');
    lines.push('');
    for (const e of d.neverTriggered) lines.push(`- ${e.id}`);
    lines.push('');
  }
  if (d.underTriggered.length > 0 && d.underTriggered.length !== d.neverTriggered.length) {
    lines.push('### Under-triggered (<1%, but seen at least once)');
    lines.push('');
    for (const e of d.underTriggered.filter((x) => x.pctOfLives > 0)) {
      lines.push(`- ${e.id} — ${e.pctOfLives.toFixed(2)}%`);
    }
    lines.push('');
  }

  if (d.perCountry.length > 0) {
    lines.push('## Per-country breakdown');
    lines.push('');
    lines.push(`| Country | Lives | Mean lifespan | Median | Mean money @ death | Mean final salary | Top cause |`);
    lines.push(`|---|---:|---:|---:|---:|---:|---|`);
    for (const c of d.perCountry) {
      lines.push(
        `| ${c.code} | ${c.lives} | ${c.meanLifespan} | ${c.medianLifespan} | ` +
          `${c.meanMoneyAtDeath.toLocaleString()} | ${c.meanFinalSalary.toLocaleString()} | ${c.topCause} |`,
      );
    }
    lines.push('');
  }

  lines.push('## Lifespan');
  lines.push('');
  lines.push(`| Stat | Years |`);
  lines.push(`|---|---|`);
  lines.push(`| Mean | ${d.lifeStats.mean} |`);
  lines.push(`| Median | ${d.lifeStats.median} |`);
  lines.push(`| p10 | ${d.lifeStats.p10} |`);
  lines.push(`| p90 | ${d.lifeStats.p90} |`);
  lines.push(`| Min | ${d.lifeStats.min} |`);
  lines.push(`| Max | ${d.lifeStats.max} |`);
  lines.push('');

  lines.push('## Top causes of death');
  lines.push('');
  lines.push(`| Cause | Count | % |`);
  lines.push(`|---|---|---|`);
  for (const [cause, n] of topN(d.causes, 10)) {
    lines.push(`| ${cause} | ${n} | ${((n / d.args.lives) * 100).toFixed(1)}% |`);
  }
  lines.push('');

  lines.push('## Average happiness over time');
  lines.push('');
  lines.push(`| Age | Avg happiness | Sample size |`);
  lines.push(`|---|---|---|`);
  for (const row of d.happinessTrajectory) {
    lines.push(`| ${row.age} | ${row.avgHappiness} | ${row.sampleSize} |`);
  }
  lines.push('');

  lines.push('## End-of-life money');
  lines.push('');
  lines.push(`| Stat | Value |`);
  lines.push(`|---|---|`);
  lines.push(`| Mean | ${d.moneyStats.mean.toLocaleString()} |`);
  lines.push(`| Median | ${d.moneyStats.median.toLocaleString()} |`);
  lines.push(`| p10 | ${d.moneyStats.p10.toLocaleString()} |`);
  lines.push(`| p90 | ${d.moneyStats.p90.toLocaleString()} |`);
  lines.push('');

  lines.push('## Careers');
  lines.push('');
  lines.push(`- **Lives with a job at death:** ${d.livesWithJob} (${((d.livesWithJob / d.args.lives) * 100).toFixed(1)}%)`);
  lines.push(`- **Lives at the top level of their career:** ${d.livesAtTopLevel}`);
  lines.push('');
  if (d.careerPeak.size > 0) {
    lines.push(`| Career | Level distribution (level → count) |`);
    lines.push(`|---|---|`);
    for (const [career, counts] of d.careerPeak.entries()) {
      const dist = [...counts.entries()].sort((a, b) => a[0] - b[0]).map(([lvl, n]) => `L${lvl}: ${n}`).join(', ');
      lines.push(`| ${career} | ${dist} |`);
    }
    lines.push('');
  }

  lines.push('## All events — trigger rate');
  lines.push('');
  lines.push(`| Event ID | % of lives that saw it |`);
  lines.push(`|---|---|`);
  for (const e of [...d.eventFrequency].sort((a, b) => b.pctOfLives - a.pctOfLives)) {
    lines.push(`| ${e.id} | ${e.pctOfLives.toFixed(1)}% |`);
  }
  lines.push('');

  return lines.join('\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
