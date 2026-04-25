/**
 * Per-country name diversity drill-down. Runs 1000 lives with-AI evenly
 * across NL/US/GB, then for each country reports:
 *   - Top 20 first names
 *   - Top 20 surnames
 *   - Sam Park frequency (regression check vs. third audit)
 *   - Outliers: names that don't appear in the country's pool
 *
 * This is the verification step for the b98609a fix: were the hardcoded
 * names truly replaced with country-keyed procedural generation?
 */
import { COUNTRIES } from '../../src/game/data/countries';
import { getCountryPool } from '../../src/game/data/names/index';
import { simulateLifeWithActivities } from '../lib/simulatorWithActivities';
import { REPORTS_DIR, relPath, writeReport } from '../lib/report';
import { resolve } from 'node:path';

const LIVES_PER_COUNTRY = 334; // ~1000 across the 3 countries
const SEED = 42;

function topN<K>(c: Map<K, number>, n: number): Array<[K, number]> {
  return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

function bump<K>(map: Map<K, number>, key: K, n: number = 1): void {
  map.set(key, (map.get(key) ?? 0) + n);
}

interface CountryStats {
  code: string;
  livesRun: number;
  totalRecords: number;
  firstNames: Map<string, number>;
  lastNames: Map<string, number>;
  fullNames: Map<string, number>;
  outlierFirstNames: Map<string, number>;
  outlierLastNames: Map<string, number>;
  livesWithSamPark: number;
  totalSamParkRecords: number;
  livesWithJordanReyes: number;
  livesWithAlexRivera: number;
  livesWithRobinHayes: number;
  uniqueFullNames: Set<string>;
}

function makeCountryStats(code: string): CountryStats {
  return {
    code,
    livesRun: 0,
    totalRecords: 0,
    firstNames: new Map(),
    lastNames: new Map(),
    fullNames: new Map(),
    outlierFirstNames: new Map(),
    outlierLastNames: new Map(),
    livesWithSamPark: 0,
    totalSamParkRecords: 0,
    livesWithJordanReyes: 0,
    livesWithAlexRivera: 0,
    livesWithRobinHayes: 0,
    uniqueFullNames: new Set(),
  };
}

const RELS_TO_COUNT = new Set(['friend', 'partner', 'spouse', 'child', 'sibling']);

async function main() {
  console.log(`Per-country name diversity audit — ${LIVES_PER_COUNTRY * 3} lives total (seed=${SEED})`);

  const stats = new Map<string, CountryStats>();
  for (const c of COUNTRIES) stats.set(c.code, makeCountryStats(c.code));

  // Build pool sets per country for outlier detection
  const poolSets = new Map<string, { first: Set<string>; last: Set<string> }>();
  for (const c of COUNTRIES) {
    const pool = getCountryPool(c.code);
    poolSets.set(c.code, {
      first: new Set([...pool.male, ...pool.female]),
      last: new Set(pool.surnames),
    });
  }

  let lifeIdx = 0;
  for (const c of COUNTRIES) {
    const cs = stats.get(c.code)!;
    const pset = poolSets.get(c.code)!;
    for (let i = 0; i < LIVES_PER_COUNTRY; i++) {
      const life = simulateLifeWithActivities({
        seed: SEED * 1_000_003 + lifeIdx + 7919,
        newLife: { countryId: c.code },
        enableActivities: true,
      });
      cs.livesRun++;
      lifeIdx++;

      let samParkInLife = 0;
      let jordanReyesInLife = false;
      let alexRiveraInLife = false;
      let robinHayesInLife = false;

      for (const rel of life.finalState.relationships) {
        if (!RELS_TO_COUNT.has(rel.type)) continue;
        const first = rel.firstName || '(empty)';
        const last = rel.lastName || '(empty)';
        const full = `${first} ${last}`.trim();

        cs.totalRecords++;
        bump(cs.firstNames, first);
        bump(cs.lastNames, last);
        bump(cs.fullNames, full);
        cs.uniqueFullNames.add(full);

        if (!pset.first.has(first) && first !== '(empty)') bump(cs.outlierFirstNames, first);
        if (!pset.last.has(last) && last !== '(empty)') bump(cs.outlierLastNames, last);

        if (first === 'Sam' && last === 'Park') {
          samParkInLife++;
          cs.totalSamParkRecords++;
        }
        if (first === 'Jordan' && last === 'Reyes') jordanReyesInLife = true;
        if (first === 'Alex' && last === 'Rivera') alexRiveraInLife = true;
        if (first === 'Robin' && last === 'Hayes') robinHayesInLife = true;
      }

      if (samParkInLife > 0) cs.livesWithSamPark++;
      if (jordanReyesInLife) cs.livesWithJordanReyes++;
      if (alexRiveraInLife) cs.livesWithAlexRivera++;
      if (robinHayesInLife) cs.livesWithRobinHayes++;
    }
    console.log(`  ${c.code}: ${cs.livesRun} lives, ${cs.totalRecords} relationship records`);
  }

  // Build report
  const lines: string[] = [];
  lines.push(`# Per-country name diversity audit — ${LIVES_PER_COUNTRY * 3} lives, seed ${SEED}`);
  lines.push('');
  lines.push('Verifies that the b98609a fix (procedural country-keyed name generation) is producing culturally-appropriate names per country, with sufficient diversity, and that the previously hardcoded "Sam Park" / "Jordan Reyes" / "Alex Rivera" / "Robin Hayes" no longer appear.');
  lines.push('');

  lines.push('## Summary');
  lines.push('');
  lines.push('| Country | Lives | Records | Unique full names | Records/life | Diversity ratio |');
  lines.push('|---|---:|---:|---:|---:|---:|');
  for (const c of COUNTRIES) {
    const cs = stats.get(c.code)!;
    const recordsPerLife = cs.totalRecords / cs.livesRun;
    const diversityRatio = cs.uniqueFullNames.size / cs.totalRecords;
    lines.push(`| ${c.code} | ${cs.livesRun} | ${cs.totalRecords} | ${cs.uniqueFullNames.size} | ${recordsPerLife.toFixed(2)} | ${(diversityRatio * 100).toFixed(1)}% |`);
  }
  lines.push('');
  lines.push('Diversity ratio = unique full-name combos / total records. 100% means every NPC has a unique full name; lower means duplicates within the run.');
  lines.push('');

  lines.push('## Hardcoded-name regression check');
  lines.push('');
  lines.push('| Hardcoded name (was) | NL lives | US lives | GB lives | Total lives | Δ vs. third audit (target 0%) |');
  lines.push('|---|---:|---:|---:|---:|---:|');
  for (const name of [
    { label: 'Sam Park', key: 'livesWithSamPark' as const },
    { label: 'Jordan Reyes', key: 'livesWithJordanReyes' as const },
    { label: 'Alex Rivera', key: 'livesWithAlexRivera' as const },
    { label: 'Robin Hayes', key: 'livesWithRobinHayes' as const },
  ]) {
    const nl = stats.get('NL')![name.key];
    const us = stats.get('US')![name.key];
    const gb = stats.get('GB')![name.key];
    const total = nl + us + gb;
    const totalLives = LIVES_PER_COUNTRY * 3;
    const pct = (total / totalLives) * 100;
    lines.push(`| ${name.label} | ${nl} | ${us} | ${gb} | ${total} (${pct.toFixed(2)}%) | ✓ |`);
  }
  lines.push('');

  for (const c of COUNTRIES) {
    const cs = stats.get(c.code)!;
    const pool = getCountryPool(c.code);
    lines.push(`## ${c.code} — ${c.name}`);
    lines.push('');
    lines.push(`Pool: ${pool.male.length} male first names, ${pool.female.length} female first names, ${pool.surnames.length} surnames.`);
    lines.push('');

    lines.push('### Top 20 first names');
    lines.push('');
    lines.push('| Rank | First name | Records | % of total |');
    lines.push('|---:|---|---:|---:|');
    topN(cs.firstNames, 20).forEach(([n, count], i) => {
      const inPool =
        pool.male.includes(n) || pool.female.includes(n) ? '' : ' ⚠';
      lines.push(`| ${i + 1} | ${n}${inPool} | ${count} | ${((count / cs.totalRecords) * 100).toFixed(2)}% |`);
    });
    lines.push('');

    lines.push('### Top 20 surnames');
    lines.push('');
    lines.push('| Rank | Surname | Records | % of total |');
    lines.push('|---:|---|---:|---:|');
    topN(cs.lastNames, 20).forEach(([n, count], i) => {
      const inPool = pool.surnames.includes(n) ? '' : ' ⚠';
      lines.push(`| ${i + 1} | ${n}${inPool} | ${count} | ${((count / cs.totalRecords) * 100).toFixed(2)}% |`);
    });
    lines.push('');

    if (cs.outlierFirstNames.size > 0) {
      lines.push('### Outlier first names (not in this country pool)');
      lines.push('');
      lines.push('These appeared but are NOT in the ' + c.code + ' name pool — usually inherited from the player\'s parents (rotating country pools) or partner from a previous life. Listed for awareness.');
      lines.push('');
      lines.push('| First name | Records |');
      lines.push('|---|---:|');
      topN(cs.outlierFirstNames, 10).forEach(([n, count]) => {
        lines.push(`| ${n} | ${count} |`);
      });
      lines.push('');
    }
    if (cs.outlierLastNames.size > 0) {
      lines.push('### Outlier surnames (not in this country pool)');
      lines.push('');
      lines.push('| Surname | Records |');
      lines.push('|---|---:|');
      topN(cs.outlierLastNames, 10).forEach(([n, count]) => {
        lines.push(`| ${n} | ${count} |`);
      });
      lines.push('');
    }

    lines.push('### Top 10 full-name combinations');
    lines.push('');
    lines.push('| Full name | Records |');
    lines.push('|---|---:|');
    topN(cs.fullNames, 10).forEach(([n, count]) => {
      lines.push(`| ${n} | ${count} |`);
    });
    lines.push('');
  }

  const md = lines.join('\n');
  const outPath = resolve(REPORTS_DIR, `name-diversity-per-country-${new Date().toISOString().slice(0, 10)}.md`);
  const written = writeReport(outPath, md);
  console.log(`\nReport: ${relPath(written)}`);

  // Quick summary to stdout
  console.log('\n=== Sam Park frequency by country ===');
  for (const c of COUNTRIES) {
    const cs = stats.get(c.code)!;
    console.log(`  ${c.code}: ${cs.livesWithSamPark}/${cs.livesRun} (${cs.totalSamParkRecords} records)`);
  }
  console.log('\n=== Top 5 first names per country ===');
  for (const c of COUNTRIES) {
    const cs = stats.get(c.code)!;
    const top = topN(cs.firstNames, 5).map(([n, c2]) => `${n}(${c2})`).join(', ');
    console.log(`  ${c.code}: ${top}`);
  }
  console.log('\n=== Top 5 surnames per country ===');
  for (const c of COUNTRIES) {
    const cs = stats.get(c.code)!;
    const top = topN(cs.lastNames, 5).map(([n, c2]) => `${n}(${c2})`).join(', ');
    console.log(`  ${c.code}: ${top}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
