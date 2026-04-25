/**
 * Name-frequency audit. Simulates 100 lives with the activities-AI active,
 * collects every relationship name produced, and prints frequency tables.
 *
 * Drives the "Sam Park" investigation: are the activity-generated names
 * truly hardcoded, and how often do duplicates land in the same life?
 */
import { COUNTRIES } from '../../src/game/data/countries';
import { simulateLifeWithActivities } from '../lib/simulatorWithActivities';
import { REPORTS_DIR, relPath, writeReport } from '../lib/report';
import { resolve } from 'node:path';

interface Args {
  lives: number;
  seed: number;
}

function parseArgs(argv: string[]): Args {
  const liveArg = argv.find((a) => a.startsWith('--lives='));
  const lives = liveArg ? Number(liveArg.split('=')[1]) : 100;
  const seedArg = argv.find((a) => a.startsWith('--seed='));
  const seed = seedArg ? Number(seedArg.split('=')[1]) : 42;
  return { lives, seed };
}

function topN<K>(c: Map<K, number>, n: number): Array<[K, number]> {
  return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

function bump<K>(map: Map<K, number>, key: K, n: number = 1): void {
  map.set(key, (map.get(key) ?? 0) + n);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log(`Name-frequency audit — ${args.lives} lives (seed=${args.seed})`);

  const firstNames = new Map<string, number>();
  const lastNames = new Map<string, number>();
  const fullNames = new Map<string, number>();
  // Per-life: how many distinct relationships shared the same firstName+lastName?
  const intraLifeDuplicates = new Map<string, number>();
  // For "Sam Park" specifically:
  let livesWithSamPark = 0;
  let totalSamParkRecords = 0;
  const samParkPerLife = new Map<number, number>();
  // For Jordan Reyes (the spouse):
  let livesWithJordanReyes = 0;
  let totalJordanReyesRecords = 0;

  // Skip the player's own name (they pick or get a random one); only count
  // relationships. Also skip parents (they're seeded in newLife from the
  // names pool, but rotated per life — they're the diversity baseline).
  const relTypesToCount = new Set([
    'friend',
    'partner',
    'spouse',
    'child',
    'sibling',
  ]);

  const rotation = COUNTRIES.map((c) => c.code);
  for (let i = 0; i < args.lives; i++) {
    const countryId = rotation[i % rotation.length] as string;
    const life = simulateLifeWithActivities({
      seed: args.seed * 1_000_003 + i + 7919,
      newLife: { countryId },
      enableActivities: true,
    });

    let samParkInThisLife = 0;
    let sawJordanReyesInThisLife = false;
    const seenFullNames = new Map<string, number>();

    for (const rel of life.finalState.relationships) {
      if (!relTypesToCount.has(rel.type)) continue;
      const first = rel.firstName || '(empty)';
      const last = rel.lastName || '(empty)';
      const full = `${first} ${last}`.trim();

      bump(firstNames, first);
      bump(lastNames, last);
      bump(fullNames, full);
      bump(seenFullNames, full);

      if (first === 'Sam' && last === 'Park') {
        samParkInThisLife += 1;
        totalSamParkRecords += 1;
      }
      if (first === 'Jordan' && last === 'Reyes') {
        sawJordanReyesInThisLife = true;
        totalJordanReyesRecords += 1;
      }
    }

    if (samParkInThisLife > 0) livesWithSamPark += 1;
    samParkPerLife.set(samParkInThisLife, (samParkPerLife.get(samParkInThisLife) ?? 0) + 1);
    if (sawJordanReyesInThisLife) livesWithJordanReyes += 1;

    for (const [full, count] of seenFullNames.entries()) {
      if (count > 1) {
        bump(intraLifeDuplicates, full, count - 1); // count-1 dupes
      }
    }
  }

  // Output report
  const lines: string[] = [];
  lines.push(`# Name-frequency audit — ${args.lives} lives, seed ${args.seed}`);
  lines.push('');
  lines.push('Run after the fbedbed dedupe fix to see whether relationship names still repeat across (and within) lives.');
  lines.push('');

  lines.push('## Top 20 first names (relationships only, excluding parents)');
  lines.push('');
  lines.push('| Rank | First name | Occurrences |');
  lines.push('|---:|---|---:|');
  topN(firstNames, 20).forEach(([n, c], i) => lines.push(`| ${i + 1} | ${n} | ${c} |`));
  lines.push('');

  lines.push('## Top 20 last names (relationships only, excluding parents)');
  lines.push('');
  lines.push('| Rank | Last name | Occurrences |');
  lines.push('|---:|---|---:|');
  topN(lastNames, 20).forEach(([n, c], i) => lines.push(`| ${i + 1} | ${n} | ${c} |`));
  lines.push('');

  lines.push('## Top 20 full names (firstName lastName combinations)');
  lines.push('');
  lines.push('| Rank | Full name | Occurrences | % of all relationship records |');
  lines.push('|---:|---|---:|---:|');
  const totalRelRecords = [...fullNames.values()].reduce((a, b) => a + b, 0);
  topN(fullNames, 20).forEach(([n, c], i) =>
    lines.push(`| ${i + 1} | ${n} | ${c} | ${((c / totalRelRecords) * 100).toFixed(1)}% |`),
  );
  lines.push('');
  lines.push(`Total relationship records collected (excluding parents): **${totalRelRecords}**.`);
  lines.push('');

  lines.push('## Intra-life duplicates (same firstName+lastName appearing twice in one life)');
  lines.push('');
  lines.push('Counts how many duplicate-named relationships appeared *within* a single life. After the fbedbed fix the IDs are unique, but the names can still collide because activity payloads hardcode them.');
  lines.push('');
  lines.push('| Full name | Total duplicate records across all lives |');
  lines.push('|---|---:|');
  topN(intraLifeDuplicates, 20).forEach(([n, c]) => lines.push(`| ${n} | ${c} |`));
  if (intraLifeDuplicates.size === 0) {
    lines.push('| (none) | 0 |');
  }
  lines.push('');

  lines.push('## "Sam Park" specifically');
  lines.push('');
  lines.push(`- Lives that had at least one "Sam Park": **${livesWithSamPark} / ${args.lives}** (${((livesWithSamPark / args.lives) * 100).toFixed(1)}%)`);
  lines.push(`- Total "Sam Park" records across all lives: **${totalSamParkRecords}**`);
  lines.push(`- Average "Sam Park" records per life that had any: **${livesWithSamPark > 0 ? (totalSamParkRecords / livesWithSamPark).toFixed(2) : '0'}**`);
  lines.push('');
  lines.push('Distribution: how many "Sam Park"s did each life end up with?');
  lines.push('');
  lines.push('| Sam Parks per life | Number of lives |');
  lines.push('|---:|---:|');
  for (const [n, c] of [...samParkPerLife.entries()].sort((a, b) => a[0] - b[0])) {
    lines.push(`| ${n} | ${c} |`);
  }
  lines.push('');

  lines.push('## "Jordan Reyes" (the spouse)');
  lines.push('');
  lines.push(`- Lives that had at least one "Jordan Reyes": **${livesWithJordanReyes} / ${args.lives}** (${((livesWithJordanReyes / args.lives) * 100).toFixed(1)}%)`);
  lines.push(`- Total "Jordan Reyes" records across all lives: **${totalJordanReyesRecords}**`);
  lines.push('');

  const md = lines.join('\n');
  const outPath = resolve(REPORTS_DIR, `name-frequency-${new Date().toISOString().slice(0, 10)}.md`);
  const written = writeReport(outPath, md);
  console.log(`\nReport: ${relPath(written)}`);

  // Also print to stdout for quick reading
  console.log('\n=== TOP 10 FIRST NAMES ===');
  topN(firstNames, 10).forEach(([n, c]) => console.log(`  ${c.toString().padStart(4)}  ${n}`));
  console.log('\n=== TOP 10 LAST NAMES ===');
  topN(lastNames, 10).forEach(([n, c]) => console.log(`  ${c.toString().padStart(4)}  ${n}`));
  console.log('\n=== TOP 10 FULL NAMES ===');
  topN(fullNames, 10).forEach(([n, c]) => console.log(`  ${c.toString().padStart(4)}  ${n}`));
  console.log(`\nSam Park: appears in ${livesWithSamPark}/${args.lives} lives, ${totalSamParkRecords} total records`);
  console.log(`Jordan Reyes: appears in ${livesWithJordanReyes}/${args.lives} lives, ${totalJordanReyesRecords} total records`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
