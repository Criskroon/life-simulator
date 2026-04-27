/**
 * The Town — civic life and going outside. Mostly small, social actions
 * that happen because the player decided to leave the house.
 */

import type { ActivitySpec } from './activitySpec';

export const TOWN_ACTIVITIES: ReadonlyArray<ActivitySpec> = [
  {
    id: 'volunteer',
    label: 'Volunteer',
    description: 'Hours given without an invoice attached.',
    apCost: 0,
    tier: 'light',
  },
  {
    id: 'go-to-the-park',
    label: 'Go to the park',
    description: 'A bench, a tree, an afternoon.',
    apCost: 0,
    tier: 'light',
  },
  {
    id: 'visit-a-museum',
    label: 'Visit a museum',
    description: 'Walk slowly. Read the small placards.',
    apCost: 0,
    tier: 'light',
  },
  {
    id: 'attend-a-protest',
    label: 'Attend a protest',
    description: 'Stand in the street with strangers who agree.',
    apCost: 0,
    tier: 'light',
  },
  {
    id: 'go-to-a-cafe',
    label: 'Go to a café',
    description: 'A coffee, a window, an hour of nothing.',
    money: 8,
    apCost: 1,
    tier: 'light',
  },
  {
    id: 'see-a-show',
    label: 'See a show',
    description: 'Theatre, music, anything with a curtain.',
    money: 60,
    apCost: 1,
    tier: 'light',
  },
  {
    id: 'host-a-dinner',
    label: 'Host a dinner',
    description: 'Cook for people who might cook back.',
    money: 90,
    apCost: 1,
    tier: 'light',
  },
  {
    id: 'go-to-a-party',
    label: 'Go to a party',
    description: 'Loud room, soft strangers, late cab.',
    money: 40,
    apCost: 1,
    tier: 'light',
  },
  {
    id: 'join-a-club',
    label: 'Join a club',
    description: 'A standing weekly thing. The good kind.',
    money: 200,
    apCost: 2,
    tier: 'big',
  },
  {
    id: 'run-for-office',
    label: 'Run for local office',
    description: 'Knock on doors. Lose, probably.',
    money: 1500,
    apCost: 2,
    tier: 'big',
  },
];
