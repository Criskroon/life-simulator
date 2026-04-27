/**
 * The Mind — learning, focus, and inner life. Therapy already lives in
 * The Body (it acts on health/happiness); The Mind leans into reading,
 * studying, and the small disciplines that make a head feel ordered.
 */

import type { ActivitySpec } from './activitySpec';

export const MIND_ACTIVITIES: ReadonlyArray<ActivitySpec> = [
  {
    id: 'read-a-book',
    label: 'Read a book',
    description: 'A whole one. The slow kind.',
    apCost: 0,
    tier: 'light',
  },
  {
    id: 'keep-a-journal',
    label: 'Keep a journal',
    description: 'Pages nobody else gets to see.',
    apCost: 0,
    tier: 'light',
  },
  {
    id: 'meditate',
    label: 'Meditate',
    description: 'Sit still until the noise quiets.',
    apCost: 0,
    tier: 'light',
  },
  {
    id: 'visit-the-library',
    label: 'Visit the library',
    description: 'Free, quiet, dignified.',
    apCost: 0,
    tier: 'light',
  },
  {
    id: 'take-a-class',
    label: 'Take a class',
    description: 'Show up for something other than work.',
    money: 200,
    apCost: 1,
    tier: 'light',
  },
  {
    id: 'learn-a-language',
    label: 'Learn a language',
    description: 'A year of small, embarrassing sentences.',
    money: 150,
    apCost: 1,
    tier: 'light',
  },
  {
    id: 'hire-a-tutor',
    label: 'Hire a tutor',
    description: 'Someone to make you sit down and try.',
    money: 400,
    apCost: 1,
    tier: 'light',
  },
  {
    id: 'attend-a-lecture',
    label: 'Attend a lecture',
    description: 'Listen to someone smarter than you.',
    money: 25,
    apCost: 1,
    tier: 'light',
  },
  {
    id: 'go-on-retreat',
    label: 'Go on a retreat',
    description: 'A week off the grid. Bring sandals.',
    money: 1200,
    apCost: 2,
    tier: 'big',
  },
  {
    id: 'study-abroad',
    label: 'Study abroad',
    description: 'A new country to be confused in.',
    money: 9500,
    apCost: 2,
    tier: 'big',
  },
];
