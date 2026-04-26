/**
 * Procedural NPC name generation. Used at resolve-time (not apply-time)
 * because applyEffect must stay `(state, effect) -> state` per the engine's
 * purity contract. The resolveEvent / executeActivity paths thread an Rng
 * already; we hook into that.
 *
 * Convention: an `addRelationship` payload with no `firstName` (or an empty
 * string) is treated as a "please generate" marker. The enrichment step
 * fills firstName + lastName from the player's country pool and leaves
 * every other field (type, age, baseId, relationshipLevel) untouched.
 *
 * Backwards compatible: payloads with an explicit firstName pass through
 * unchanged, so any future content that wants a named NPC ("your aunt
 * Margaret") still works.
 */
import type { Country } from '../types/country';
import { getCountryPool } from '../data/names/index';
import type { Effect } from '../types/events';
import type {
  Gender,
  PlayerState,
  Relationship,
  RelationshipType,
} from '../types/gameState';
import { getCurrentCountry } from './countryEngine';
import type { Rng } from './rng';

/** Pick a country-appropriate first + last name for an NPC. */
export function generateNPCName(
  country: Country,
  gender: Gender,
  rng: Rng,
): { firstName: string; lastName: string } {
  const pool = getCountryPool(country.code);
  const firstName =
    gender === 'male'
      ? rng.pick(pool.male)
      : gender === 'female'
        ? rng.pick(pool.female)
        : rng.pick([...pool.male, ...pool.female]);
  const lastName = rng.pick(pool.surnames);
  return { firstName, lastName };
}

/**
 * Probabilistic gender pick for an NPC when the payload doesn't specify
 * one. Uses the same male/female/nonbinary split as the player, so an NPC
 * pool isn't suddenly all male.
 */
function pickNPCGender(rng: Rng): Gender {
  const roll = rng.next();
  if (roll < 0.49) return 'male';
  if (roll < 0.98) return 'female';
  return 'nonbinary';
}

/**
 * Romantic-slot specials and relationship types. Anything that lands in
 * partner / fiance / spouse / casualEx / significantEx is treated as
 * romantic for gender-default purposes.
 */
const ROMANTIC_SPECIALS = new Set([
  'addPartner',
  'addFiance',
  'addSpouse',
  'addCasualEx',
  'addSignificantEx',
]);

const ROMANTIC_TYPES = new Set<RelationshipType>([
  'partner',
  'fiance',
  'spouse',
  'casualEx',
  'significantEx',
]);

/**
 * Default-gender pick for a romantic NPC. Defaults to opposite of the
 * player so a heterosexual partner-formation is the unsurprising case;
 * a nonbinary player still gets a randomized partner. Explicit `gender`
 * on the payload always wins (caller intent overrides default).
 *
 * Always consumes one rng draw — the same rng-cost as `pickNPCGender` —
 * so swapping in this picker doesn't shift downstream stochastic tests
 * that depend on a stable rng stream.
 *
 * TODO: When sexual_orientation player-stat is introduced, replace
 * opposite-gender default with orientation-aware logic.
 */
function pickRomanticPartnerGender(state: PlayerState, rng: Rng): Gender {
  const fallback = pickNPCGender(rng);
  if (state.gender === 'male') return 'female';
  if (state.gender === 'female') return 'male';
  return fallback;
}

function needsName(rel: Partial<Relationship>): boolean {
  return !rel.firstName || rel.firstName.trim().length === 0;
}

/**
 * Specials whose payload represents a person and should get a generated
 * name when one wasn't supplied. Kept in a Set so adding a new
 * person-creating special is one line in two places (here + the handler
 * registry in effectsApplier).
 */
const PERSON_CREATING_SPECIALS = new Set([
  'addRelationship',
  'addPartner',
  'addFiance',
  'addSpouse',
  'addCasualEx',
  'addSignificantEx',
  'addFriend',
  'addFamilyMember',
]);

/**
 * Walk an effects array and fill in firstName/lastName for any
 * person-creating payload that didn't supply one. The payload's
 * `gender` (if present) overrides the random pick — useful for content
 * that wants e.g. a wife specifically. Most event payloads omit gender,
 * so we pick one off the rng to guarantee a name; otherwise the row in
 * the relationships panel renders as "Casual ex (former partner) — age 32"
 * with no name at all.
 *
 * Returns a new array; never mutates the input. Pure besides the rng calls.
 */
export function enrichGeneratedRelationships(
  effects: Effect[],
  state: PlayerState,
  rng: Rng,
): Effect[] {
  const country = getCurrentCountry(state);
  return effects.map((effect) => {
    if (!effect.special || !PERSON_CREATING_SPECIALS.has(effect.special)) return effect;
    if (!effect.payload) return effect;
    const rel = effect.payload as Partial<Relationship> & {
      gender?: Gender;
      memberType?: string;
    };
    if (!needsName(rel)) return effect;
    const isRomantic =
      ROMANTIC_SPECIALS.has(effect.special) ||
      (rel.type ? ROMANTIC_TYPES.has(rel.type as RelationshipType) : false);
    const gender =
      rel.gender ??
      (isRomantic ? pickRomanticPartnerGender(state, rng) : pickNPCGender(rng));
    const { firstName, lastName } = generateNPCName(country, gender, rng);
    // Children (legacy `addRelationship` with type:'child' and the new
    // `addFamilyMember` with memberType/type:'child') inherit the player's
    // surname unless the payload set one explicitly.
    const isChild = rel.type === 'child' || rel.memberType === 'child';
    return {
      ...effect,
      payload: {
        ...effect.payload,
        firstName,
        lastName: rel.lastName || (isChild ? state.lastName : lastName),
      },
    };
  });
}
