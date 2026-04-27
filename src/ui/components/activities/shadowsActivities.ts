/**
 * The Shadows — small dishonesties and corner-cuts. Sunny Side voice:
 * consequence is implied, never glamorised. Nothing here glorifies
 * violence, addiction, or harming a specific person. The line is
 * "small bad decision a real person might make," not "criminal
 * masterpiece."
 */

import type { ActivitySpec } from './activitySpec';

export const SHADOWS_ACTIVITIES: ReadonlyArray<ActivitySpec> = [
  {
    id: 'tell-a-small-lie',
    label: 'Tell a small lie',
    description: 'Costs nothing. Adds up.',
    apCost: 0,
    tier: 'light',
  },
  {
    id: 'spread-a-rumour',
    label: 'Spread a rumour',
    description: 'You heard it somewhere. Probably.',
    apCost: 0,
    tier: 'light',
  },
  {
    id: 'borrow-without-asking',
    label: 'Borrow without asking',
    description: 'You meant to mention it. You will.',
    apCost: 0,
    tier: 'light',
  },
  {
    id: 'shoplift',
    label: 'Shoplift',
    description: 'Try not to get caught.',
    apCost: 1,
    tier: 'light',
  },
  {
    id: 'sneak-onto-a-train',
    label: 'Sneak onto a train',
    description: 'Pretend you’re reading. Walk on.',
    apCost: 0,
    tier: 'light',
  },
  {
    id: 'bend-a-rule-at-work',
    label: 'Bend a rule at work',
    description: 'Nobody’s checking. Until they are.',
    apCost: 1,
    tier: 'light',
  },
  {
    id: 'fudge-the-taxes',
    label: 'Fudge the taxes',
    description: 'A round number in a soft column.',
    apCost: 1,
    tier: 'light',
  },
  {
    id: 'sell-a-fake',
    label: 'Sell a fake',
    description: 'Looks the part. Mostly.',
    money: 200,
    apCost: 1,
    tier: 'light',
  },
  {
    id: 'run-a-small-scam',
    label: 'Run a small scam',
    description: 'A whole scheme. A whole year of looking over your shoulder.',
    money: 500,
    apCost: 2,
    tier: 'big',
  },
];
