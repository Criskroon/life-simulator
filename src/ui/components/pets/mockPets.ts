// Hardcoded UI fixtures used while the engine has no pets data.
//
// TODO(engine): when `PlayerState.pets` lands, delete this file and read
// pets from the player state in PeopleScreenWithPets / PetProfileModal.

import type { DeceasedPet, Pet } from './types';

export const MOCK_PETS: Pet[] = [
  {
    id: 'pet-bowie',
    name: 'Bowie',
    kind: 'dog',
    color: 'golden',
    breed: 'Golden Retriever',
    age: 6,
    adoptedYear: 1990,
    bond: 78,
    condition: 'healthy',
    estLifeLeft: 7,
    lastVet: "'95",
    vigor: 92,
    vignette: "He waits at the door before you've reached for your keys.",
    milestonesRecorded: 4,
  },
  {
    id: 'pet-miso',
    name: 'Miso',
    kind: 'cat',
    color: 'gingercat',
    breed: 'Ginger Tabby',
    age: 3,
    adoptedYear: 1993,
    bond: 54,
    condition: 'healthy',
    estLifeLeft: 12,
    lastVet: "'94",
    vigor: 88,
    vignette: 'Tolerates you most evenings. Prefers the windowsill.',
    milestonesRecorded: 2,
  },
];

export const MOCK_DECEASED_PETS: DeceasedPet[] = [
  {
    id: 'pet-bibi',
    name: 'Bibi',
    kind: 'cat',
    color: 'blackcat',
    breed: 'Tabby',
    bornYear: 1978,
    diedYear: 1993,
    yearsTogether: 15,
  },
];
