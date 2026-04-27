/**
 * The Body — static activity list shown when a player taps the Body
 * Section card. Pure data; engine wiring lands in a later session, so
 * each row currently routes through ComingSoonHandler.
 */

import type { ActivitySpec } from './activitySpec';

export const BODY_ACTIVITIES: ReadonlyArray<ActivitySpec> = [
  {
    id: 'hit-the-gym',
    label: 'Hit the gym',
    description: 'Iron sharpens iron.',
    apCost: 0,
    tier: 'light',
  },
  {
    id: 'take-a-walk',
    label: 'Take a walk',
    description: 'Slow legs, steady head.',
    apCost: 0,
    tier: 'light',
  },
  {
    id: 'sleep-in',
    label: 'Sleep in',
    description: 'Catch up on what you owe yourself.',
    apCost: 0,
    tier: 'light',
  },
  {
    id: 'go-for-a-run',
    label: 'Go for a run',
    description: 'Out the door before you change your mind.',
    apCost: 0,
    tier: 'light',
  },
  {
    id: 'see-a-doctor',
    label: 'See a doctor',
    description: 'Find out what’s wrong.',
    money: 60,
    apCost: 1,
    tier: 'light',
  },
  {
    id: 'try-a-new-diet',
    label: 'Try a new diet',
    description: 'Promises kept this time.',
    apCost: 1,
    tier: 'light',
  },
  {
    id: 'therapy-session',
    label: 'Therapy session',
    description: 'Talk to someone paid to listen.',
    money: 120,
    apCost: 1,
    tier: 'light',
  },
  {
    id: 'get-a-tattoo',
    label: 'Get a tattoo',
    description: 'Permanent reminder of a temporary feeling.',
    money: 180,
    apCost: 1,
    tier: 'light',
  },
  {
    id: 'marathon-training',
    label: 'Marathon training',
    description: 'A year of legs and lungs.',
    money: 120,
    apCost: 2,
    tier: 'big',
  },
  {
    id: 'plastic-surgery',
    label: 'Plastic surgery',
    description: 'Surgery isn’t the answer. But it might be.',
    money: 8500,
    apCost: 2,
    tier: 'big',
  },
];
