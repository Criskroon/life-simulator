import { COUNTRIES, getCountry } from '../data/countries';
import { calculateActionBudget } from '../engine/actionBudget';
import { getNamePool } from '../engine/countryEngine';
import { randomFirstName, randomSurname } from '../data/names';
import type { Gender, PlayerState, Relationship } from '../types/gameState';
import type { Rng } from '../engine/rng';

export interface NewLifeOptions {
  firstName?: string;
  lastName?: string;
  gender?: Gender;
  countryId?: string;
}

/**
 * Build a fresh PlayerState. Uses the provided RNG for any randomized
 * fields (parents' names, starting stats, etc.) so tests can pin a seed
 * and get a deterministic starting state.
 */
export function createNewLife(rng: Rng, options: NewLifeOptions = {}): PlayerState {
  const country = getCountry(options.countryId ?? pickCountry(rng));
  const namePool = getNamePool(country);
  const gender: Gender = options.gender ?? pickGender(rng);
  const firstName =
    options.firstName ?? randomFirstName(namePool, gender, () => rng.next());
  const lastName = options.lastName ?? randomSurname(namePool, () => rng.next());

  const fatherFirst = randomFirstName(namePool, 'male', () => rng.next());
  const motherFirst = randomFirstName(namePool, 'female', () => rng.next());
  const motherMaiden = randomSurname(namePool, () => rng.next());

  const currentYear = new Date().getFullYear();

  const parents: Relationship[] = [
    {
      id: 'rel-father',
      baseId: 'rel-father',
      type: 'father',
      firstName: fatherFirst,
      lastName,
      age: 28 + rng.int(0, 10),
      alive: true,
      relationshipLevel: 70,
    },
    {
      id: 'rel-mother',
      baseId: 'rel-mother',
      type: 'mother',
      firstName: motherFirst,
      lastName: motherMaiden,
      age: 26 + rng.int(0, 10),
      alive: true,
      relationshipLevel: 75,
    },
  ];

  // 50% chance of having a sibling — keeps childhood events that depend on
  // siblings interesting without forcing them on every life.
  if (rng.next() < 0.5) {
    parents.push({
      id: 'rel-sibling',
      baseId: 'rel-sibling',
      type: 'sibling',
      firstName: randomFirstName(namePool, pickGender(rng), () => rng.next()),
      lastName,
      age: rng.int(0, 8),
      alive: true,
      relationshipLevel: 65,
    });
  }

  const player: PlayerState = {
    id: `life-${Date.now()}-${rng.int(1000, 9999)}`,
    firstName,
    lastName,
    age: 0,
    gender,
    country: country.code,
    alive: true,
    birthYear: currentYear,
    currentYear,
    stats: {
      health: 70 + rng.int(0, 20),
      happiness: 60 + rng.int(0, 30),
      smarts: 40 + rng.int(0, 40),
      looks: 40 + rng.int(0, 40),
    },
    money: 0,
    job: null,
    education: [
      {
        level: 'primary',
        institutionName: 'Local Primary School',
        startYear: currentYear,
        endYear: null,
        graduated: false,
        gpa: 70,
      },
    ],
    relationships: parents,
    assets: [],
    criminalRecord: [],
    history: [
      {
        year: currentYear,
        age: 0,
        eventId: 'birth',
        description: `${firstName} ${lastName} was born in ${country.name}.`,
      },
    ],
    triggeredEventIds: [],
    actionsRemainingThisYear: 0,
  };
  // Compute the budget after the rest of the state is built so the modifiers
  // (job=null, low health, etc.) see the final values.
  return { ...player, actionsRemainingThisYear: calculateActionBudget(player) };
}

function pickGender(rng: Rng): Gender {
  const roll = rng.next();
  if (roll < 0.49) return 'male';
  if (roll < 0.98) return 'female';
  return 'nonbinary';
}

function pickCountry(rng: Rng): string {
  return (rng.pick(COUNTRIES)).code;
}
