/**
 * The Mirror — small acts of self-redefinition. Cosmetic on the
 * surface, identity-adjacent underneath. Tattoos and surgery live in
 * The Body (they're medical); The Mirror covers haircut, wardrobe,
 * name, and the year you decide to become someone slightly else.
 */

import type { ActivitySpec } from './activitySpec';

export const MIRROR_ACTIVITIES: ReadonlyArray<ActivitySpec> = [
  {
    id: 'reflect-on-the-year',
    label: 'Reflect on the year',
    description: 'A long walk. An honest list.',
    apCost: 0,
    tier: 'light',
  },
  {
    id: 'take-a-personality-quiz',
    label: 'Take a personality quiz',
    description: 'You already know the answer.',
    apCost: 0,
    tier: 'light',
  },
  {
    id: 'try-a-new-look',
    label: 'Try a new look',
    description: 'Different parting. Same face. Almost.',
    apCost: 0,
    tier: 'light',
  },
  {
    id: 'get-a-haircut',
    label: 'Get a haircut',
    description: 'Shorter than you meant. Better than you thought.',
    money: 45,
    apCost: 1,
    tier: 'light',
  },
  {
    id: 'buy-new-clothes',
    label: 'Buy new clothes',
    description: 'A wardrobe with a thesis.',
    money: 350,
    apCost: 1,
    tier: 'light',
  },
  {
    id: 'get-a-piercing',
    label: 'Get a piercing',
    description: 'A small hole. A small statement.',
    money: 60,
    apCost: 1,
    tier: 'light',
  },
  {
    id: 'dye-your-hair',
    label: 'Dye your hair',
    description: 'A colour you’d have judged at twenty.',
    money: 90,
    apCost: 1,
    tier: 'light',
  },
  {
    id: 'sit-for-a-portrait',
    label: 'Sit for a portrait',
    description: 'See yourself the way someone else does.',
    money: 250,
    apCost: 1,
    tier: 'light',
  },
  {
    id: 'change-your-name',
    label: 'Change your name',
    description: 'Forms, fees, a new signature.',
    money: 400,
    apCost: 2,
    tier: 'big',
  },
  {
    id: 'reinvent-yourself',
    label: 'Reinvent yourself',
    description: 'Move cities. Start over. Tell no one.',
    money: 4500,
    apCost: 2,
    tier: 'big',
  },
];
