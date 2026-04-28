import type { GameEvent } from '../../types/events';

/**
 * School-themed events that don't touch education state. The legacy
 * stage-progression events (start/graduate high school, university apply,
 * etc.) were removed in Sessie 2.2.1 — `educationState` is now driven
 * exclusively by the progression engine. Events here only nudge stats or
 * fire one-shot story beats.
 */

export const EDUCATION_EVENTS: GameEvent[] = [
  {
    id: 'edu_party_invite',
    category: 'education',
    weight: 0.8,
    minAge: 14,
    maxAge: 19,
    title: 'Party Invitation',
    description: 'A senior is throwing a house party Friday night and somehow you got invited.',
    choices: [
      {
        label: 'Go and lose your mind',
        effects: [
          { path: 'stats.happiness', op: '+', value: 8 },
          { path: 'stats.smarts', op: '-', value: 2 },
          { path: 'stats.health', op: '-', value: 3 },
        ],
      },
      {
        label: 'Stay home and study',
        effects: [
          { path: 'stats.smarts', op: '+', value: 4 },
          { path: 'stats.happiness', op: '-', value: 2 },
        ],
      },
      {
        label: 'Go but leave early',
        effects: [
          { path: 'stats.happiness', op: '+', value: 3 },
        ],
      },
    ],
  },
  {
    id: 'edu_failed_test',
    category: 'education',
    weight: 0.7,
    minAge: 13,
    maxAge: 22,
    title: 'Failed a Test',
    description: 'You bombed your math test. The teacher wants to talk after class.',
    choices: [
      {
        label: 'Promise to study harder',
        effects: [
          { path: 'stats.smarts', op: '+', value: 3 },
          { path: 'stats.happiness', op: '-', value: 2 },
        ],
      },
      {
        label: 'Blame the teacher',
        effects: [
          { path: 'stats.smarts', op: '-', value: 2 },
          { path: 'stats.happiness', op: '+', value: 1 },
        ],
      },
    ],
  },
  {
    id: 'edu_first_kiss',
    category: 'education',
    weight: 0.5,
    minAge: 14,
    maxAge: 18,
    oncePerLife: true,
    title: 'First Kiss',
    description: 'A classmate leans in unexpectedly behind the gym.',
    choices: [
      {
        label: 'Kiss back',
        effects: [
          { path: 'stats.happiness', op: '+', value: 8 },
          { path: 'stats.looks', op: '+', value: 1 },
        ],
      },
      {
        label: 'Pull away',
        effects: [{ path: 'stats.happiness', op: '-', value: 2 }],
      },
    ],
  },
  {
    id: 'edu_join_sports',
    category: 'education',
    weight: 0.6,
    minAge: 13,
    maxAge: 21,
    title: 'Tryouts',
    description: 'Tryouts for the school team are this week.',
    choices: [
      {
        label: 'Try out',
        effects: [
          { path: 'stats.health', op: '+', value: 6 },
          { path: 'stats.looks', op: '+', value: 3 },
          { path: 'stats.happiness', op: '+', value: 3 },
        ],
      },
      {
        label: 'Skip it',
        effects: [{ path: 'stats.happiness', op: '+', value: 1 }],
      },
    ],
  },
  {
    id: 'edu_cheat_exam',
    category: 'education',
    weight: 0.5,
    minAge: 14,
    maxAge: 22,
    title: 'Cheat on a Final?',
    description: 'You have a clear shot at the answer key. No one would ever know.',
    choices: [
      {
        label: 'Take a peek',
        effects: [
          { path: 'stats.smarts', op: '-', value: 1 },
          { path: 'stats.happiness', op: '+', value: 2 },
          {
            special: 'addCrime',
            payload: {
              id: 'crime-academic-fraud',
              year: 0,
              age: 0,
              crime: 'academic dishonesty',
              caught: false,
              jailYears: 0,
            },
          },
        ],
      },
      {
        label: 'Trust your studying',
        effects: [{ path: 'stats.smarts', op: '+', value: 2 }],
      },
    ],
  },
  {
    id: 'edu_skip_class',
    category: 'education',
    weight: 0.6,
    minAge: 14,
    maxAge: 22,
    title: 'Skip Class',
    description: 'It\'s a beautiful day. Class is the last place you want to be.',
    choices: [
      {
        label: 'Cut and head outside',
        outcomes: [
          {
            weight: 55,
            narrative: 'You spend the afternoon at the park. Nobody notices, nothing happens. A perfect crime.',
            effects: [
              { path: 'stats.happiness', op: '+', value: 5 },
              { path: 'stats.smarts', op: '-', value: 1 },
            ],
          },
          {
            weight: 30,
            narrative: 'Your teacher calls home. You get a lecture about "your future" that lasts longer than the class would have.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 3 },
              { path: 'stats.smarts', op: '-', value: 2 },
            ],
          },
          {
            weight: 15,
            narrative: 'The pop quiz you missed gets graded as a zero. Your average tanks for the semester.',
            effects: [
              { path: 'stats.smarts', op: '-', value: 5 },
              { path: 'stats.happiness', op: '-', value: 2 },
            ],
          },
        ],
      },
      {
        label: 'Stay in class',
        outcomes: [
          {
            weight: 70,
            narrative: 'You take notes you\'ll actually use later. Boring, but honest work.',
            effects: [{ path: 'stats.smarts', op: '+', value: 3 }],
          },
          {
            weight: 30,
            narrative: 'You stay, but daydream the entire period. Pure self-flagellation for no reward.',
            effects: [{ path: 'stats.happiness', op: '-', value: 2 }],
          },
        ],
      },
    ],
  },
  {
    id: 'edu_mentor_teacher',
    category: 'education',
    weight: 0.4,
    minAge: 15,
    maxAge: 22,
    oncePerLife: true,
    title: 'Mentor Teacher',
    description: 'A teacher noticed your potential and offered to mentor you outside of class.',
    choices: [
      {
        label: 'Take them up on it',
        effects: [
          { path: 'stats.smarts', op: '+', value: 6 },
          { path: 'stats.happiness', op: '+', value: 3 },
        ],
      },
      {
        label: 'Politely decline',
        effects: [{ path: 'stats.happiness', op: '+', value: 1 }],
      },
    ],
  },
];
