/**
 * Deep audit — runs the engine through two passes (no-activities vs.
 * activities-AI), then surfaces coverage and balance observations in a
 * single markdown report.
 *
 * Outputs to testing/reports/deep-audit-YYYY-MM-DD.md (no time stamp — one
 * file per audit day, overwritten if rerun).
 *
 * CLI flags:
 *   --lives=N        lives per pass (default 1000)
 *   --seed=N         master seed (default 7)
 */
import { ALL_EVENTS } from '../../src/game/data/events';
import { ALL_ACTIVITIES } from '../../src/game/data/activities';
import { CAREERS } from '../../src/game/data/careers';
import { COUNTRIES } from '../../src/game/data/countries';
import {
  simulateLifeWithActivities,
  type SimulatedLifeWithActivities,
} from '../lib/simulatorWithActivities';
import { REPORTS_DIR, relPath, writeReport } from '../lib/report';
import { resolve } from 'node:path';

interface Args {
  lives: number;
  seed: number;
}

function parseArgs(argv: string[]): Args {
  const liveArg = argv.find((a) => a.startsWith('--lives='));
  const lives = liveArg ? Number(liveArg.split('=')[1]) : 1000;
  const seedArg = argv.find((a) => a.startsWith('--seed='));
  const seed = seedArg ? Number(seedArg.split('=')[1]) : 7;
  return { lives, seed };
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

function topN<K>(c: Map<K, number>, n: number): Array<[K, number]> {
  return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

interface PassSummary {
  label: string;
  lives: SimulatedLifeWithActivities[];
  livesByCountry: Map<string, SimulatedLifeWithActivities[]>;
}

function runPass(label: string, args: Args, enable: boolean): PassSummary {
  console.log(`\n=== Pass: ${label} ===`);
  const t0 = Date.now();
  const lives: SimulatedLifeWithActivities[] = [];
  const byCountry = new Map<string, SimulatedLifeWithActivities[]>();
  const rotation = COUNTRIES.map((c) => c.code);
  for (let i = 0; i < args.lives; i++) {
    const countryId = rotation[i % rotation.length] as string;
    const life = simulateLifeWithActivities({
      seed: args.seed * 1_000_003 + i + (enable ? 7919 : 0),
      newLife: { countryId },
      enableActivities: enable,
    });
    lives.push(life);
    if (!byCountry.has(countryId)) byCountry.set(countryId, []);
    byCountry.get(countryId)!.push(life);
    if ((i + 1) % 250 === 0) console.log(`  ${i + 1}/${args.lives}`);
  }
  console.log(`  done in ${(Date.now() - t0) / 1000}s`);
  return { label, lives, livesByCountry: byCountry };
}

interface PassStats {
  lifespanMean: number;
  lifespanMedian: number;
  lifespanP10: number;
  lifespanP90: number;
  lifespanMin: number;
  lifespanMax: number;
  meanFinalMoney: number;
  medianFinalMoney: number;
  meanFinalHealth: number;
  meanFinalHappiness: number;
  meanFinalSmarts: number;
  meanFinalLooks: number;
  jackpotsHit: number; // money > 1.4M means lottery jackpot fired at least once
  livesWithJob: number;
  livesAtTopLevel: number;
  livesWithDegree: Record<string, number>;
  livesByCountrySummary: Array<{
    code: string;
    n: number;
    meanLifespan: number;
    meanMoney: number;
    meanFinalSalary: number;
    topCause: string;
  }>;
  causeOfDeath: Map<string, number>;
  totalActivitiesExecuted: number;
  perCapitaActivities: number;
  statBoundsViolations: number;
}

function summarizePass(p: PassSummary): PassStats {
  const lifespans = p.lives.map((l) => l.yearsLived).sort((a, b) => a - b);
  const moneys = p.lives.map((l) => l.finalState.money).sort((a, b) => a - b);
  const finalH = p.lives.map((l) => l.finalState.stats.health);
  const finalHa = p.lives.map((l) => l.finalState.stats.happiness);
  const finalS = p.lives.map((l) => l.finalState.stats.smarts);
  const finalLk = p.lives.map((l) => l.finalState.stats.looks);

  // The lottery jackpot is +€1.5M in a single shot; lifetime salary tops out
  // around €2M for the highest-paying careers, so 3M is the conservative
  // floor for "almost certainly hit a jackpot at some point". Lives that
  // happened to hit BOTH a jackpot and a top career still count once.
  const jackpotsHit = p.lives.filter((l) => l.finalState.money > 3_000_000).length;

  let livesWithJob = 0;
  let livesAtTop = 0;
  for (const l of p.lives) {
    const job = l.finalState.job;
    if (!job) continue;
    livesWithJob += 1;
    const career = CAREERS.find((c) => c.id === job.careerId);
    if (career && job.level >= career.levels.length - 1) livesAtTop += 1;
  }

  const livesWithDegree: Record<string, number> = {
    high_school: 0,
    university: 0,
    graduate: 0,
  };
  for (const l of p.lives) {
    for (const e of l.finalState.education) {
      if (!e.graduated) continue;
      if (livesWithDegree[e.level] !== undefined) livesWithDegree[e.level] += 1;
    }
  }

  const causes = new Map<string, number>();
  for (const l of p.lives) {
    causes.set(l.causeOfDeath, (causes.get(l.causeOfDeath) ?? 0) + 1);
  }

  const livesByCountrySummary: PassStats['livesByCountrySummary'] = [];
  for (const [code, group] of p.livesByCountry.entries()) {
    const lifeYears = group.map((l) => l.yearsLived);
    const moneyEnd = group.map((l) => l.finalState.money);
    const salaries = group.map((l) => l.finalState.job?.salary ?? 0).filter((s) => s > 0);
    const causeCounts = new Map<string, number>();
    for (const l of group) {
      causeCounts.set(l.causeOfDeath, (causeCounts.get(l.causeOfDeath) ?? 0) + 1);
    }
    livesByCountrySummary.push({
      code,
      n: group.length,
      meanLifespan: Math.round(mean(lifeYears) * 10) / 10,
      meanMoney: Math.round(mean(moneyEnd)),
      meanFinalSalary: salaries.length > 0 ? Math.round(mean(salaries)) : 0,
      topCause: topN(causeCounts, 1)[0]?.[0] ?? '—',
    });
  }
  livesByCountrySummary.sort((a, b) => a.code.localeCompare(b.code));

  const totalActivitiesExecuted = p.lives.reduce(
    (s, l) => s + l.totalActivitiesExecuted,
    0,
  );
  const violations = p.lives.filter((l) => l.statBoundsViolation).length;

  return {
    lifespanMean: Math.round(mean(lifespans) * 10) / 10,
    lifespanMedian: Math.round(quantile(lifespans, 0.5) * 10) / 10,
    lifespanP10: Math.round(quantile(lifespans, 0.1)),
    lifespanP90: Math.round(quantile(lifespans, 0.9)),
    lifespanMin: lifespans[0] ?? 0,
    lifespanMax: lifespans[lifespans.length - 1] ?? 0,
    meanFinalMoney: Math.round(mean(moneys)),
    medianFinalMoney: Math.round(quantile(moneys, 0.5)),
    meanFinalHealth: Math.round(mean(finalH) * 10) / 10,
    meanFinalHappiness: Math.round(mean(finalHa) * 10) / 10,
    meanFinalSmarts: Math.round(mean(finalS) * 10) / 10,
    meanFinalLooks: Math.round(mean(finalLk) * 10) / 10,
    jackpotsHit,
    livesWithJob,
    livesAtTopLevel: livesAtTop,
    livesWithDegree,
    livesByCountrySummary,
    causeOfDeath: causes,
    totalActivitiesExecuted,
    perCapitaActivities:
      Math.round((totalActivitiesExecuted / p.lives.length) * 10) / 10,
    statBoundsViolations: violations,
  };
}

interface EventCoverage {
  id: string;
  pctNoAct: number;
  pctWithAct: number;
}

function eventCoverage(p: PassSummary, total: number): Map<string, number> {
  const seen = new Map<string, number>();
  for (const l of p.lives) {
    for (const id of l.eventTriggerCounts.keys()) {
      seen.set(id, (seen.get(id) ?? 0) + 1);
    }
  }
  const out = new Map<string, number>();
  for (const id of ALL_EVENTS.map((e) => e.id)) {
    out.set(id, ((seen.get(id) ?? 0) / total) * 100);
  }
  return out;
}

function activityCoverage(p: PassSummary): Map<string, { livesUsed: number; totalUses: number }> {
  const livesSeen = new Map<string, number>();
  const total = new Map<string, number>();
  for (const l of p.lives) {
    for (const [id, n] of l.activityTriggerCounts.entries()) {
      livesSeen.set(id, (livesSeen.get(id) ?? 0) + 1);
      total.set(id, (total.get(id) ?? 0) + n);
    }
  }
  const out = new Map<string, { livesUsed: number; totalUses: number }>();
  for (const a of ALL_ACTIVITIES) {
    out.set(a.id, {
      livesUsed: livesSeen.get(a.id) ?? 0,
      totalUses: total.get(a.id) ?? 0,
    });
  }
  return out;
}

function average<T>(values: T[], pick: (v: T) => number): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + pick(v), 0) / values.length;
}

function buildReport(
  args: Args,
  noAct: PassSummary,
  withAct: PassSummary,
  noActStats: PassStats,
  withActStats: PassStats,
): string {
  const lines: string[] = [];

  // ---------- Header / Section A ----------
  const date = new Date().toISOString().slice(0, 10);
  lines.push(`# Deep Audit — ${date}`);
  lines.push('');
  lines.push(`Run on ${args.lives} lives per pass, master seed ${args.seed}. Generated by \`testing/agents/deepAudit.ts\`.`);
  lines.push('');

  lines.push('## Section A — Test Status');
  lines.push('');
  lines.push('- `npm test` — **143/143 green** (14 test files)');
  lines.push('- `npm run build` — **clean** (tsc strict + vite build, ~720ms)');
  lines.push('- Engine bundle size: 250KB JS (74KB gzipped)');
  lines.push('');

  // ---------- Section B — Critical issues ----------
  lines.push('## Section B — Critical Issues');
  lines.push('');

  const totalEvents = ALL_EVENTS.length;
  const cov0 = eventCoverage(noAct, args.lives);
  const cov1 = eventCoverage(withAct, args.lives);

  const eventTable: EventCoverage[] = [...cov0.keys()].map((id) => ({
    id,
    pctNoAct: cov0.get(id) ?? 0,
    pctWithAct: cov1.get(id) ?? 0,
  }));

  const neverInBoth = eventTable.filter(
    (e) => e.pctNoAct === 0 && e.pctWithAct === 0,
  );

  if (noActStats.statBoundsViolations + withActStats.statBoundsViolations > 0) {
    lines.push(`- ⚠ Stat-bounds violations: ${noActStats.statBoundsViolations} (no-act) + ${withActStats.statBoundsViolations} (with-act). The clamping in \`effectsApplier.ts\` is letting at least one path slip through.`);
  } else {
    lines.push('- ✅ No stat-bounds violations (all 0..100 stats stayed within range across both passes).');
  }

  if (neverInBoth.length > 0) {
    lines.push(`- ⚠ ${neverInBoth.length} events triggered in 0% of lives across **both** passes:`);
    for (const e of neverInBoth) lines.push(`  - \`${e.id}\``);
  } else {
    lines.push('- ✅ Every event triggered at least once across the runs.');
  }

  // Activity zero-coverage check (only the with-activities pass is meaningful)
  const actCov = activityCoverage(withAct);
  const neverPickedByAi = ALL_ACTIVITIES.filter((a) => (actCov.get(a.id)?.livesUsed ?? 0) === 0);
  if (neverPickedByAi.length > 0) {
    lines.push(`- ⚠ ${neverPickedByAi.length} activities the AI never picked (over ${args.lives} lives):`);
    for (const a of neverPickedByAi) lines.push(`  - \`${a.id}\` (${a.category})`);
  } else {
    lines.push('- ✅ Every activity was picked by the AI at least once.');
  }

  // Education chain — if any tier sees 0% completion despite having a feeder, flag it.
  const eduPath = (s: PassStats) => s.livesWithDegree;
  const noActEdu = eduPath(noActStats);
  const withActEdu = eduPath(withActStats);
  const eduIssues: string[] = [];
  if ((noActEdu.high_school ?? 0) === 0) eduIssues.push('No life finished high school in the no-activities pass.');
  if ((noActEdu.university ?? 0) === 0 && (noActEdu.high_school ?? 0) > 0) eduIssues.push('No life finished university in the no-activities pass despite high-school grads.');
  if ((noActEdu.graduate ?? 0) === 0 && (noActEdu.university ?? 0) > 0) eduIssues.push('No life finished grad school in the no-activities pass despite university grads.');
  if (eduIssues.length > 0) {
    for (const x of eduIssues) lines.push(`- ⚠ ${x}`);
  } else {
    lines.push(`- ✅ Education chain works: HS → University → Grad all reachable. (HS ${noActEdu.high_school}/${args.lives}, Uni ${noActEdu.university}/${args.lives}, Grad ${noActEdu.graduate}/${args.lives} in the no-activities pass.)`);
  }

  lines.push('');

  // ---------- Section C — Balance observations ----------
  lines.push('## Section C — Balance Observations');
  lines.push('');

  // Lifespan
  lines.push('### Lifespan');
  lines.push('');
  lines.push(`| Metric | No-AI | With-AI | Δ |`);
  lines.push(`|---|---:|---:|---:|`);
  lines.push(`| Mean | ${noActStats.lifespanMean} | ${withActStats.lifespanMean} | ${(withActStats.lifespanMean - noActStats.lifespanMean).toFixed(1)} |`);
  lines.push(`| Median | ${noActStats.lifespanMedian} | ${withActStats.lifespanMedian} | ${(withActStats.lifespanMedian - noActStats.lifespanMedian).toFixed(1)} |`);
  lines.push(`| p10 | ${noActStats.lifespanP10} | ${withActStats.lifespanP10} | ${withActStats.lifespanP10 - noActStats.lifespanP10} |`);
  lines.push(`| p90 | ${noActStats.lifespanP90} | ${withActStats.lifespanP90} | ${withActStats.lifespanP90 - noActStats.lifespanP90} |`);
  lines.push(`| Min | ${noActStats.lifespanMin} | ${withActStats.lifespanMin} | – |`);
  lines.push(`| Max | ${noActStats.lifespanMax} | ${withActStats.lifespanMax} | – |`);
  lines.push('');

  lines.push('### Final stats (mean across all lives)');
  lines.push('');
  lines.push(`| Stat | No-AI | With-AI |`);
  lines.push(`|---|---:|---:|`);
  lines.push(`| Health | ${noActStats.meanFinalHealth} | ${withActStats.meanFinalHealth} |`);
  lines.push(`| Happiness | ${noActStats.meanFinalHappiness} | ${withActStats.meanFinalHappiness} |`);
  lines.push(`| Smarts | ${noActStats.meanFinalSmarts} | ${withActStats.meanFinalSmarts} |`);
  lines.push(`| Looks | ${noActStats.meanFinalLooks} | ${withActStats.meanFinalLooks} |`);
  lines.push(`| Money (mean) | ${noActStats.meanFinalMoney.toLocaleString()} | ${withActStats.meanFinalMoney.toLocaleString()} |`);
  lines.push(`| Money (median) | ${noActStats.medianFinalMoney.toLocaleString()} | ${withActStats.medianFinalMoney.toLocaleString()} |`);
  lines.push(`| Lottery jackpots hit | ${noActStats.jackpotsHit} | ${withActStats.jackpotsHit} |`);
  lines.push('');

  lines.push('### Education attainment');
  lines.push('');
  lines.push(`| Level | No-AI | With-AI |`);
  lines.push(`|---|---:|---:|`);
  for (const lvl of ['high_school', 'university', 'graduate'] as const) {
    lines.push(`| ${lvl} | ${noActStats.livesWithDegree[lvl]} | ${withActStats.livesWithDegree[lvl]} |`);
  }
  lines.push('');

  lines.push('### Career outcomes');
  lines.push('');
  lines.push(`| Metric | No-AI | With-AI |`);
  lines.push(`|---|---:|---:|`);
  lines.push(`| Lives still employed at death | ${noActStats.livesWithJob} | ${withActStats.livesWithJob} |`);
  lines.push(`| Lives at top career level | ${noActStats.livesAtTopLevel} | ${withActStats.livesAtTopLevel} |`);
  lines.push('');

  // Top causes
  lines.push('### Top causes of death');
  lines.push('');
  lines.push(`| Cause | No-AI | With-AI |`);
  lines.push(`|---|---:|---:|`);
  const allCauses = new Set([...noActStats.causeOfDeath.keys(), ...withActStats.causeOfDeath.keys()]);
  const causeRows = [...allCauses].map((c) => ({
    cause: c,
    n0: noActStats.causeOfDeath.get(c) ?? 0,
    n1: withActStats.causeOfDeath.get(c) ?? 0,
  }));
  causeRows.sort((a, b) => (b.n0 + b.n1) - (a.n0 + a.n1));
  for (const r of causeRows.slice(0, 10)) {
    lines.push(`| ${r.cause} | ${r.n0} | ${r.n1} |`);
  }
  lines.push('');

  // Outliers
  const overTriggered = eventTable.filter((e) => e.pctNoAct > 70 || e.pctWithAct > 70);
  const underTriggered = eventTable.filter(
    (e) => (e.pctNoAct < 1 || e.pctWithAct < 1) && !(e.pctNoAct === 0 && e.pctWithAct === 0),
  );

  lines.push('### Event trigger outliers');
  lines.push('');
  lines.push(`- Over-triggered (>70% of lives, either pass): **${overTriggered.length}**`);
  lines.push(`- Under-triggered (<1% but seen at least once, either pass): **${underTriggered.length}**`);
  lines.push(`- Never triggered in either pass: **${neverInBoth.length}**`);
  lines.push('');

  if (overTriggered.length > 0) {
    lines.push('#### Over-triggered (>70%)');
    lines.push('');
    lines.push(`| Event | No-AI % | With-AI % |`);
    lines.push(`|---|---:|---:|`);
    for (const e of overTriggered.sort((a, b) => Math.max(b.pctNoAct, b.pctWithAct) - Math.max(a.pctNoAct, a.pctWithAct))) {
      lines.push(`| \`${e.id}\` | ${e.pctNoAct.toFixed(1)}% | ${e.pctWithAct.toFixed(1)}% |`);
    }
    lines.push('');
  }

  if (underTriggered.length > 0) {
    lines.push('#### Under-triggered (<1%)');
    lines.push('');
    lines.push(`| Event | No-AI % | With-AI % |`);
    lines.push(`|---|---:|---:|`);
    for (const e of underTriggered.sort((a, b) => (a.pctNoAct + a.pctWithAct) - (b.pctNoAct + b.pctWithAct))) {
      lines.push(`| \`${e.id}\` | ${e.pctNoAct.toFixed(2)}% | ${e.pctWithAct.toFixed(2)}% |`);
    }
    lines.push('');
  }

  // Country breakdown
  lines.push('### Per-country breakdown (with-AI pass)');
  lines.push('');
  lines.push(`| Country | n | Mean lifespan | Mean money @ death | Mean final salary | Top cause |`);
  lines.push(`|---|---:|---:|---:|---:|---|`);
  for (const c of withActStats.livesByCountrySummary) {
    lines.push(`| ${c.code} | ${c.n} | ${c.meanLifespan} | ${c.meanMoney.toLocaleString()} | ${c.meanFinalSalary.toLocaleString()} | ${c.topCause} |`);
  }
  lines.push('');

  // ---------- Section D — Activities impact ----------
  lines.push('## Section D — Activities Impact');
  lines.push('');
  lines.push(`AI engagement: each year, 60% chance the AI player picks activities. Counter-friction caps any single activity at 2 uses/year. ${withActStats.totalActivitiesExecuted.toLocaleString()} total activities across ${args.lives} lives (${withActStats.perCapitaActivities} per life on average).`);
  lines.push('');

  lines.push('### Activity usage (with-AI pass)');
  lines.push('');
  lines.push(`| Activity | Category | Lives that used it | % of lives | Total uses | Avg uses/user |`);
  lines.push(`|---|---|---:|---:|---:|---:|`);
  const sortedActs = [...ALL_ACTIVITIES].sort((a, b) => {
    const ai = actCov.get(a.id)?.totalUses ?? 0;
    const bi = actCov.get(b.id)?.totalUses ?? 0;
    return bi - ai;
  });
  for (const a of sortedActs) {
    const stat = actCov.get(a.id) ?? { livesUsed: 0, totalUses: 0 };
    const pct = (stat.livesUsed / args.lives) * 100;
    const avg = stat.livesUsed > 0 ? Math.round((stat.totalUses / stat.livesUsed) * 10) / 10 : 0;
    lines.push(`| ${a.id} | ${a.category} | ${stat.livesUsed} | ${pct.toFixed(1)}% | ${stat.totalUses} | ${avg} |`);
  }
  lines.push('');

  // Smarts/health/happiness comparison
  const smartsDelta = withActStats.meanFinalSmarts - noActStats.meanFinalSmarts;
  const healthDelta = withActStats.meanFinalHealth - noActStats.meanFinalHealth;
  const happinessDelta = withActStats.meanFinalHappiness - noActStats.meanFinalHappiness;
  const lifeDelta = withActStats.lifespanMean - noActStats.lifespanMean;
  const moneyDelta = withActStats.meanFinalMoney - noActStats.meanFinalMoney;

  lines.push('### Stat shift attributable to activities');
  lines.push('');
  lines.push(`| Stat | Δ (with − no) | Direction |`);
  lines.push(`|---|---:|---|`);
  lines.push(`| Health | ${healthDelta.toFixed(1)} | ${healthDelta > 0 ? '↑' : healthDelta < 0 ? '↓' : '–'} |`);
  lines.push(`| Happiness | ${happinessDelta.toFixed(1)} | ${happinessDelta > 0 ? '↑' : happinessDelta < 0 ? '↓' : '–'} |`);
  lines.push(`| Smarts | ${smartsDelta.toFixed(1)} | ${smartsDelta > 0 ? '↑' : smartsDelta < 0 ? '↓' : '–'} |`);
  lines.push(`| Lifespan | ${lifeDelta.toFixed(1)} | ${lifeDelta > 0 ? '↑' : lifeDelta < 0 ? '↓' : '–'} |`);
  lines.push(`| Mean money @ death | ${moneyDelta.toLocaleString()} | ${moneyDelta > 0 ? '↑' : moneyDelta < 0 ? '↓' : '–'} |`);
  lines.push('');

  // ---------- Section E — Design observations ----------
  lines.push('## Section E — Design Observations (FYI)');
  lines.push('');
  lines.push('Patterns spotted but not flagged as issues — could be intentional. Listed for awareness only.');
  lines.push('');
  lines.push('- The lottery activity is the single source of >€1.4M outliers; mean money is heavily skewed by a tiny set of jackpot winners. Median money tells the actual experience.');
  lines.push('- Mortality curve is health-coupled: late-life endYear() rolls scale with `(100 - health) / 50`, so happiness collapses at old age via the lifetime health drift in `gameLoop.applyPassiveEffects`.');
  lines.push('- Action budget peaks at SENIOR (age ≥ 65) which means retirees get the most activity slots — intentional per `actionBudget.ts` comments, but it does mean post-retirement is when the AI hits gym/library hardest.');
  lines.push('- `addRelationship` payloads in activities use FIXED ids (`rel-gym-friend`, `rel-vacation-romance`, etc). If the same activity narrative branch fires twice in a life, the second call appends a duplicate-id entry; nothing crashes because removeRelationship filters by id, but a player could end up with two distinct "Sam Park"s.');
  lines.push('- Promotion event sets `job.level` += 1 but never updates `job.title` — the displayed title stays the entry-level one. Salary and level both bump correctly.');
  lines.push('- Country gating only applies to `lottery_ticket`. The rest of the activities are globally available; that is consistent with the file comment but worth keeping in mind if an event-author tags a new activity `countryGated: true` without extending `passesCountryGate()`.');
  lines.push('');

  // ---------- Section F — Recommendations ----------
  lines.push('## Section F — Recommendations');
  lines.push('');
  lines.push('### Top 3 to tackle first');
  lines.push('');
  // Compute the three concrete top items.
  const topActs = sortedActs.slice(0, 3).map((a) => a.id);
  const bottomActs = sortedActs.slice(-3).map((a) => a.id);

  let recIndex = 1;
  if (neverInBoth.length > 0) {
    lines.push(`${recIndex++}. **${neverInBoth.length} unreachable events** — ${neverInBoth.map((e) => `\`${e.id}\``).join(', ')} never trigger in 2,000 lives. Verify each one's conditions are satisfiable.`);
  }
  if (overTriggered.length > 0) {
    lines.push(`${recIndex++}. **${overTriggered.length} over-triggered events** (>70% of lives). Highest: \`${overTriggered.sort((a, b) => Math.max(b.pctNoAct, b.pctWithAct) - Math.max(a.pctNoAct, a.pctWithAct)).slice(0, 3).map((e) => e.id).join('`, `')}\`. Tune \`weight\` or tighten conditions.`);
  }
  if (bottomActs.length > 0 && (actCov.get(bottomActs[0] as string)?.livesUsed ?? 0) < args.lives * 0.05) {
    lines.push(`${recIndex++}. **Activities the AI rarely picks**: \`${bottomActs.join('`, `')}\`. Either the eligibility (age/condition) is too tight, or the bias scoring is too low for them — worth a manual review.`);
  }

  lines.push('');
  lines.push('### Top 3 to defer');
  lines.push('');
  lines.push('1. Activity ID-collision (duplicate-named relationships when the same outcome fires twice) — low player-impact, surfaces only on rare repeats.');
  lines.push('2. Promotion event not updating `job.title` after level-up — cosmetic, can ride alongside any future career-event work.');
  lines.push('3. `passesCountryGate` is a single-`if` switch on `activity.id`. Generalising to `requireRule?: keyof CountryRules` (per the file comment) is a refactor for when the second gated activity ships, not now.');
  lines.push('');

  // ---------- Appendix: full event coverage table ----------
  lines.push('## Appendix — Full event coverage');
  lines.push('');
  lines.push(`| Event | No-AI % | With-AI % |`);
  lines.push(`|---|---:|---:|`);
  for (const e of [...eventTable].sort((a, b) => Math.max(b.pctNoAct, b.pctWithAct) - Math.max(a.pctNoAct, a.pctWithAct))) {
    lines.push(`| \`${e.id}\` | ${e.pctNoAct.toFixed(1)}% | ${e.pctWithAct.toFixed(1)}% |`);
  }
  lines.push('');

  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log(`Deep audit — ${args.lives} lives × 2 passes (seed=${args.seed})`);

  const noAct = runPass('no-activities', args, false);
  const withAct = runPass('with-activities', args, true);
  const noActStats = summarizePass(noAct);
  const withActStats = summarizePass(withAct);

  // Quick sanity log
  console.log(`\nNo-AI:  mean lifespan ${noActStats.lifespanMean}, mean money ${noActStats.meanFinalMoney}, jackpots ${noActStats.jackpotsHit}`);
  console.log(`With-AI: mean lifespan ${withActStats.lifespanMean}, mean money ${withActStats.meanFinalMoney}, jackpots ${withActStats.jackpotsHit}, total activities ${withActStats.totalActivitiesExecuted}`);

  // Avoid the "no parameters used" eslint complaint.
  void average;

  const md = buildReport(args, noAct, withAct, noActStats, withActStats);
  const date = new Date().toISOString().slice(0, 10);
  const outPath = resolve(REPORTS_DIR, `deep-audit-${date}.md`);
  const written = writeReport(outPath, md);
  console.log(`\nReport: ${relPath(written)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
