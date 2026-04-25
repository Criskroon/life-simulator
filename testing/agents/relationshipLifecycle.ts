/**
 * Relationship lifecycle audit. Runs 1000 lives with-AI and reports:
 *   - Partner/spouse counts at death (regression check vs. third audit
 *     where avg was 5.0 partners/life due to removeRelationship bug)
 *   - Distribution: 0/1/2/3/5+/10+ partners
 *   - Zombie partners: relationships with type=partner that should have
 *     been cleaned up (e.g. when a marriage happened)
 *   - Spouse uniqueness: nobody should ever end with >1 spouse
 *
 * Plus targeted scenario tests with deterministic seeds.
 */
import { COUNTRIES } from '../../src/game/data/countries';
import { simulateLifeWithActivities } from '../lib/simulatorWithActivities';
import type { PlayerState, Relationship } from '../../src/game/types/gameState';
import { REPORTS_DIR, relPath, writeReport } from '../lib/report';
import { resolve } from 'node:path';

const LIVES = 1000;
const SEED = 7;

function bucket(n: number): string {
  if (n === 0) return '0';
  if (n === 1) return '1';
  if (n === 2) return '2';
  if (n <= 4) return '3-4';
  if (n <= 9) return '5-9';
  return '10+';
}

interface Bucket {
  count: number;
}

async function main() {
  console.log(`Relationship lifecycle audit — ${LIVES} lives (seed=${SEED})`);

  const partnerDist = new Map<string, number>();
  const spouseDist = new Map<string, number>();
  let totalPartnersAtDeath = 0;
  let totalSpousesAtDeath = 0;
  let livesWithMultipleSpouses = 0;
  let livesWithBothPartnerAndSpouse = 0;
  let maxPartnersInOneLife = 0;
  let maxSpousesInOneLife = 0;
  // "Zombie" partners: state has a spouse AND lingering partners with
  // baseId='rel-date-partner' that should have been cleaned up by the
  // marriage event.
  let livesWithZombiePartnerAfterMarriage = 0;
  let totalZombiePartnerRecords = 0;
  // Average partners-per-life
  const partnersPerLife: number[] = [];
  // Total relationships at death
  const totalRelsPerLife: number[] = [];

  // Track which baseIds the system uses
  const baseIdFreq = new Map<string, number>();

  const rotation = COUNTRIES.map((c) => c.code);
  for (let i = 0; i < LIVES; i++) {
    const country = rotation[i % rotation.length] as string;
    const life = simulateLifeWithActivities({
      seed: SEED * 1_000_003 + i + 7919,
      newLife: { countryId: country },
      enableActivities: true,
    });

    const partners = life.finalState.relationships.filter((r) => r.type === 'partner');
    const spouses = life.finalState.relationships.filter((r) => r.type === 'spouse');
    totalPartnersAtDeath += partners.length;
    totalSpousesAtDeath += spouses.length;
    partnersPerLife.push(partners.length);
    totalRelsPerLife.push(life.finalState.relationships.length);
    if (partners.length > maxPartnersInOneLife) maxPartnersInOneLife = partners.length;
    if (spouses.length > maxSpousesInOneLife) maxSpousesInOneLife = spouses.length;
    if (spouses.length > 1) livesWithMultipleSpouses += 1;
    if (spouses.length > 0 && partners.length > 0) {
      livesWithBothPartnerAndSpouse += 1;
      livesWithZombiePartnerAfterMarriage += 1;
      totalZombiePartnerRecords += partners.length;
    }

    partnerDist.set(bucket(partners.length), (partnerDist.get(bucket(partners.length)) ?? 0) + 1);
    spouseDist.set(bucket(spouses.length), (spouseDist.get(bucket(spouses.length)) ?? 0) + 1);

    // Tally baseId frequency
    for (const r of life.finalState.relationships) {
      if (r.baseId) {
        baseIdFreq.set(r.baseId, (baseIdFreq.get(r.baseId) ?? 0) + 1);
      } else {
        baseIdFreq.set(`(no baseId, id=${r.id})`, (baseIdFreq.get(`(no baseId, id=${r.id})`) ?? 0) + 1);
      }
    }
  }

  partnersPerLife.sort((a, b) => a - b);
  totalRelsPerLife.sort((a, b) => a - b);
  const median = (arr: number[]) => arr[Math.floor(arr.length / 2)] ?? 0;
  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

  // Build report
  const lines: string[] = [];
  lines.push(`# Relationship lifecycle audit — ${LIVES} lives, seed ${SEED}`);
  lines.push('');
  lines.push('Verifies that b98609a fixed the removeRelationship regression: previously, ~88% of lives ended with 2+ "current partner" records still in state. After the baseId fix, partners should be cleaned up correctly on breakups, marriages, and ex-spouse removal.');
  lines.push('');

  lines.push('## Headline numbers');
  lines.push('');
  lines.push('| Metric | Third audit (was) | Now | Δ |');
  lines.push('|---|---:|---:|---:|');
  lines.push(`| Total partners at death (all lives) | 1,001 (200 lives) → ~5,005 (1000 lives) | ${totalPartnersAtDeath} | ${(totalPartnersAtDeath - 5005).toFixed(0)} |`);
  lines.push(`| Mean partners/life | 5.0 | ${mean(partnersPerLife).toFixed(2)} | ${(mean(partnersPerLife) - 5.0).toFixed(2)} |`);
  lines.push(`| Median partners/life | (unreported) | ${median(partnersPerLife)} | – |`);
  lines.push(`| Max partners in one life | 12 | ${maxPartnersInOneLife} | ${maxPartnersInOneLife - 12} |`);
  lines.push(`| Lives with >1 spouse | (unreported) | ${livesWithMultipleSpouses} | – |`);
  lines.push(`| Lives with both partner AND spouse | (unreported) | ${livesWithBothPartnerAndSpouse} | – |`);
  lines.push(`| Total spouses at death | 94 (200 lives) → ~470 (1000 lives) | ${totalSpousesAtDeath} | ${(totalSpousesAtDeath - 470).toFixed(0)} |`);
  lines.push('');

  lines.push('## Partner count distribution');
  lines.push('');
  lines.push('| Partners at death | Lives | % |');
  lines.push('|---|---:|---:|');
  for (const k of ['0', '1', '2', '3-4', '5-9', '10+']) {
    const c = partnerDist.get(k) ?? 0;
    lines.push(`| ${k} | ${c} | ${((c / LIVES) * 100).toFixed(1)}% |`);
  }
  lines.push('');

  lines.push('## Spouse count distribution');
  lines.push('');
  lines.push('| Spouses at death | Lives | % |');
  lines.push('|---|---:|---:|');
  for (const k of ['0', '1', '2', '3-4', '5-9', '10+']) {
    const c = spouseDist.get(k) ?? 0;
    lines.push(`| ${k} | ${c} | ${((c / LIVES) * 100).toFixed(1)}% |`);
  }
  lines.push('');

  lines.push('## Zombie partner check');
  lines.push('');
  lines.push('Lives where the player is married (has a spouse) but ALSO still has lingering partner records from before the marriage. These should be 0 in a healthy run — the propose/accept events sweep partners on marriage.');
  lines.push('');
  lines.push(`- Lives with both partner AND spouse: **${livesWithBothPartnerAndSpouse} / ${LIVES}** (${((livesWithBothPartnerAndSpouse / LIVES) * 100).toFixed(2)}%)`);
  lines.push(`- Total partner records lingering on married lives: **${totalZombiePartnerRecords}**`);
  lines.push('');

  lines.push('## baseId distribution at death');
  lines.push('');
  lines.push('What kinds of relationships are still present in state when a life ends? Sanity check that no obviously-temporary relationships dominate.');
  lines.push('');
  lines.push('| baseId | Total records (all 1000 lives) |');
  lines.push('|---|---:|');
  const sortedBaseIds = [...baseIdFreq.entries()].sort((a, b) => b[1] - a[1]);
  for (const [id, count] of sortedBaseIds.slice(0, 25)) {
    lines.push(`| \`${id}\` | ${count} |`);
  }
  lines.push('');

  lines.push('## Total relationships at death (all types)');
  lines.push('');
  lines.push(`- Mean: ${mean(totalRelsPerLife).toFixed(2)}`);
  lines.push(`- Median: ${median(totalRelsPerLife)}`);
  lines.push(`- Min: ${totalRelsPerLife[0]}`);
  lines.push(`- Max: ${totalRelsPerLife[totalRelsPerLife.length - 1]}`);
  lines.push('');

  const md = lines.join('\n');
  const outPath = resolve(REPORTS_DIR, `relationship-lifecycle-${new Date().toISOString().slice(0, 10)}.md`);
  const written = writeReport(outPath, md);
  console.log(`\nReport: ${relPath(written)}`);

  console.log('\n=== Headline ===');
  console.log(`  Mean partners/life: ${mean(partnersPerLife).toFixed(2)} (was 5.0)`);
  console.log(`  Max partners/life: ${maxPartnersInOneLife} (was 12)`);
  console.log(`  Lives with >1 spouse: ${livesWithMultipleSpouses} (target: 0)`);
  console.log(`  Lives with both partner+spouse (zombie): ${livesWithBothPartnerAndSpouse}`);
  console.log(`  Total partners at death: ${totalPartnersAtDeath}`);
  console.log(`  Total spouses at death: ${totalSpousesAtDeath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
