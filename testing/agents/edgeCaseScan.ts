/**
 * Bug & error scan. Runs a heavy load (3000 lives) and checks for state
 * invariants:
 *   - No NaN in stats / money
 *   - age == currentYear - birthYear (always)
 *   - All relationships have a valid type
 *   - Money never < -1000 unexpectedly (overdraft buffer is 1000)
 *   - No spouse count > 1
 *   - All relationship.firstName non-empty (and lastName)
 *   - Relationship ids are unique within a life
 *   - Stats stay in [0, 100]
 *
 * Surfaces violations with the seed and life that triggered them.
 */
import { COUNTRIES } from '../../src/game/data/countries';
import { simulateLifeWithActivities } from '../lib/simulatorWithActivities';
import type { PlayerState, RelationshipType } from '../../src/game/types/gameState';
import { REPORTS_DIR, relPath, writeReport } from '../lib/report';
import { resolve } from 'node:path';

const LIVES = 3000;
const SEED = 7;

const VALID_TYPES = new Set<RelationshipType>([
  'father', 'mother', 'sibling', 'child', 'friend', 'partner', 'spouse',
]);

interface Violation {
  category: string;
  detail: string;
  seed: number;
  age: number;
  countryId: string;
}

async function main() {
  console.log(`Edge-case scan — ${LIVES} lives (seed=${SEED})`);
  const violations: Violation[] = [];
  let livesWithMultipleSpouses = 0;
  let livesWithEmptyName = 0;
  let livesWithDuplicateIds = 0;
  let livesWithBigNegativeMoney = 0;
  let livesWithStatOOB = 0;
  let totalLives = 0;

  const rotation = COUNTRIES.map((c) => c.code);
  for (let i = 0; i < LIVES; i++) {
    const country = rotation[i % rotation.length] as string;
    const seed = SEED * 1_000_003 + i + 7919;
    const life = simulateLifeWithActivities({ seed, newLife: { countryId: country }, enableActivities: true });
    const s = life.finalState;
    totalLives++;

    // NaN check
    for (const k of ['health', 'happiness', 'smarts', 'looks'] as const) {
      if (Number.isNaN(s.stats[k])) {
        violations.push({ category: 'NaN-stat', detail: `stats.${k}=NaN`, seed, age: s.age, countryId: country });
      }
      if (s.stats[k] < 0 || s.stats[k] > 100) {
        violations.push({ category: 'stat-OOB', detail: `stats.${k}=${s.stats[k]}`, seed, age: s.age, countryId: country });
        livesWithStatOOB++;
      }
    }
    if (Number.isNaN(s.money)) {
      violations.push({ category: 'NaN-money', detail: 'money=NaN', seed, age: s.age, countryId: country });
    }
    if (s.money < -1000) {
      violations.push({ category: 'big-negative-money', detail: `money=${s.money}`, seed, age: s.age, countryId: country });
      livesWithBigNegativeMoney++;
    }

    // Age consistency
    if (s.alive === false) {
      // ok — death year and age relate
    }
    if (s.currentYear - s.birthYear !== s.age) {
      violations.push({
        category: 'age-mismatch',
        detail: `age=${s.age}, currentYear=${s.currentYear}, birthYear=${s.birthYear}, diff=${s.currentYear - s.birthYear}`,
        seed, age: s.age, countryId: country,
      });
    }

    // Spouse uniqueness
    const spouses = s.relationships.filter((r) => r.type === 'spouse');
    if (spouses.length > 1) {
      livesWithMultipleSpouses++;
      violations.push({
        category: 'multi-spouse',
        detail: `${spouses.length} spouses: ${spouses.map((sp) => `${sp.firstName} ${sp.lastName}`).join(', ')}`,
        seed, age: s.age, countryId: country,
      });
    }

    // Relationship validity
    let lifeHadEmpty = false;
    let lifeHadDup = false;
    const seenIds = new Set<string>();
    for (const r of s.relationships) {
      if (!VALID_TYPES.has(r.type)) {
        violations.push({ category: 'invalid-rel-type', detail: `id=${r.id}, type=${r.type}`, seed, age: s.age, countryId: country });
      }
      if (!r.firstName || r.firstName.trim() === '') {
        if (!lifeHadEmpty) violations.push({ category: 'empty-firstName', detail: `id=${r.id}, type=${r.type}, lastName=${r.lastName}`, seed, age: s.age, countryId: country });
        lifeHadEmpty = true;
      }
      if (!r.lastName || r.lastName.trim() === '') {
        if (!lifeHadEmpty) violations.push({ category: 'empty-lastName', detail: `id=${r.id}, type=${r.type}, firstName=${r.firstName}`, seed, age: s.age, countryId: country });
        lifeHadEmpty = true;
      }
      if (seenIds.has(r.id)) {
        if (!lifeHadDup) violations.push({ category: 'duplicate-relid', detail: `id=${r.id} appears 2+ times`, seed, age: s.age, countryId: country });
        lifeHadDup = true;
      }
      seenIds.add(r.id);
      // Relationship age sanity
      if (r.alive && (r.age < 0 || r.age > 200)) {
        violations.push({ category: 'rel-age-OOB', detail: `${r.firstName} ${r.lastName} age=${r.age}`, seed, age: s.age, countryId: country });
      }
    }
    if (lifeHadEmpty) livesWithEmptyName++;
    if (lifeHadDup) livesWithDuplicateIds++;
  }

  // Report
  const lines: string[] = [];
  lines.push(`# Edge-case scan — ${LIVES} lives, seed ${SEED}`);
  lines.push('');
  lines.push('Programmatic invariant check across a large life-batch. Each violation cited has a (seed, age, country) so it can be reproduced.');
  lines.push('');

  lines.push('## Headline');
  lines.push('');
  lines.push(`- Lives simulated: ${totalLives}`);
  lines.push(`- Lives with stat OOB (any stat outside 0..100 at death): **${livesWithStatOOB}**`);
  lines.push(`- Lives with money < -1000: **${livesWithBigNegativeMoney}**`);
  lines.push(`- Lives with >1 spouse: **${livesWithMultipleSpouses}**`);
  lines.push(`- Lives with empty firstName/lastName: **${livesWithEmptyName}**`);
  lines.push(`- Lives with duplicate relationship ids: **${livesWithDuplicateIds}**`);
  lines.push(`- Total violations recorded: **${violations.length}**`);
  lines.push('');

  // Group by category
  const byCategory = new Map<string, Violation[]>();
  for (const v of violations) {
    if (!byCategory.has(v.category)) byCategory.set(v.category, []);
    byCategory.get(v.category)!.push(v);
  }

  lines.push('## By category');
  lines.push('');
  for (const [cat, vs] of [...byCategory.entries()].sort((a, b) => b[1].length - a[1].length)) {
    lines.push(`### ${cat} — ${vs.length} occurrence(s)`);
    lines.push('');
    lines.push('| Seed | Country | Age@death | Detail |');
    lines.push('|---:|---|---:|---|');
    for (const v of vs.slice(0, 8)) {
      lines.push(`| ${v.seed} | ${v.countryId} | ${v.age} | ${v.detail} |`);
    }
    if (vs.length > 8) lines.push(`| _...${vs.length - 8} more_ | | | |`);
    lines.push('');
  }

  if (violations.length === 0) {
    lines.push('_No violations._');
    lines.push('');
  }

  const md = lines.join('\n');
  const outPath = resolve(REPORTS_DIR, `edge-case-scan-${new Date().toISOString().slice(0, 10)}.md`);
  const written = writeReport(outPath, md);
  console.log(`\nReport: ${relPath(written)}`);

  console.log('\n=== Headline ===');
  console.log(`  Total violations: ${violations.length}`);
  console.log(`  Categories: ${[...byCategory.keys()].join(', ') || '(none)'}`);
  console.log(`  Multi-spouse lives: ${livesWithMultipleSpouses}`);
  console.log(`  Stat OOB lives: ${livesWithStatOOB}`);
  console.log(`  Empty-name lives: ${livesWithEmptyName}`);
  console.log(`  Duplicate-id lives: ${livesWithDuplicateIds}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
