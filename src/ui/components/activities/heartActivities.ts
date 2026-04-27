/**
 * The Heart — looking-for-someone activities. Engine will eventually
 * gate this list on relationship status (single only); for now every
 * row routes through ComingSoonHandler.
 */

import type { ActivitySpec } from './activitySpec';

export const HEART_ACTIVITIES: ReadonlyArray<ActivitySpec> = [
  {
    id: 'flirt-with-someone',
    label: 'Flirt with someone',
    description: 'A look. A line. A maybe.',
    apCost: 0,
    tier: 'light',
  },
  {
    id: 'reach-out-to-an-ex',
    label: 'Reach out to an ex',
    description: 'You know how this ends. Send it anyway.',
    apCost: 0,
    tier: 'light',
  },
  {
    id: 'confess-a-crush',
    label: 'Confess a crush',
    description: 'Out loud. To them. One time only.',
    apCost: 0,
    tier: 'light',
  },
  {
    id: 'make-a-dating-profile',
    label: 'Make a dating profile',
    description: 'Five photos. A line about hiking.',
    apCost: 0,
    tier: 'light',
  },
  {
    id: 'go-on-a-date',
    label: 'Go on a date',
    description: 'Pay the bill. Walk them home.',
    money: 70,
    apCost: 1,
    tier: 'light',
  },
  {
    id: 'send-flowers',
    label: 'Send flowers',
    description: 'A small gesture, well chosen.',
    money: 50,
    apCost: 1,
    tier: 'light',
  },
  {
    id: 'try-speed-dating',
    label: 'Try speed dating',
    description: 'Six minutes per stranger. Eight strangers.',
    money: 40,
    apCost: 1,
    tier: 'light',
  },
  {
    id: 'plan-a-romantic-trip',
    label: 'Plan a romantic trip',
    description: 'A weekend somewhere they’d remember.',
    money: 800,
    apCost: 1,
    tier: 'light',
  },
  {
    id: 'hire-a-matchmaker',
    label: 'Hire a matchmaker',
    description: 'Pay someone to do the looking for you.',
    money: 2500,
    apCost: 2,
    tier: 'big',
  },
  {
    id: 'propose-a-grand-gesture',
    label: 'Plan a grand gesture',
    description: 'Big swing. Half a year of nerve.',
    money: 1200,
    apCost: 2,
    tier: 'big',
  },
];
