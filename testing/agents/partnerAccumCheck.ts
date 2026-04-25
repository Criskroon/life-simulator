/**
 * Quick check: how many partners/spouses are still in state at death?
 * The fbedbed fix made addRelationship mint unique ids, but
 * removeRelationship still filters by exact id. So events that try to
 * remove `rel-date-partner` etc. silently no-op.
 */
import { COUNTRIES } from '../../src/game/data/countries';
import { simulateLifeWithActivities } from '../lib/simulatorWithActivities';

const LIVES = 200;
let totalPartners = 0;
let totalSpouses = 0;
let livesWithMultiplePartners = 0;
let maxPartnersInOneLife = 0;
const partnerCountDistribution = new Map<number, number>();

for (let i = 0; i < LIVES; i++) {
  const country = COUNTRIES[i % COUNTRIES.length]!.code;
  const life = simulateLifeWithActivities({
    seed: 7 * 1_000_003 + i + 7919,
    newLife: { countryId: country },
    enableActivities: true,
  });
  const partners = life.finalState.relationships.filter((r) => r.type === 'partner');
  const spouses = life.finalState.relationships.filter((r) => r.type === 'spouse');
  totalPartners += partners.length;
  totalSpouses += spouses.length;
  if (partners.length > 1) livesWithMultiplePartners += 1;
  if (partners.length > maxPartnersInOneLife) maxPartnersInOneLife = partners.length;
  partnerCountDistribution.set(
    partners.length,
    (partnerCountDistribution.get(partners.length) ?? 0) + 1,
  );
}

console.log(`Across ${LIVES} lives:`);
console.log(`  Total partner records still in state at death: ${totalPartners}`);
console.log(`  Total spouse records still in state at death: ${totalSpouses}`);
console.log(`  Average partners-per-life: ${(totalPartners / LIVES).toFixed(2)}`);
console.log(`  Lives with >1 simultaneous partner record: ${livesWithMultiplePartners} / ${LIVES}`);
console.log(`  Max partners in one life: ${maxPartnersInOneLife}`);
console.log('\nDistribution of partner-count at death:');
for (const [n, c] of [...partnerCountDistribution.entries()].sort((a, b) => a[0] - b[0])) {
  console.log(`  ${n} partner(s): ${c} lives`);
}
