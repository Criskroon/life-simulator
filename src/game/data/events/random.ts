import type { GameEvent } from '../../types/events';

export const RANDOM_EVENTS: GameEvent[] = [
  {
    id: 'random_lottery_win',
    category: 'random',
    weight: 0.05,
    minAge: 18,
    maxAge: 90,
    oncePerLife: true,
    title: 'Lottery Ticket',
    description: 'You bought a scratcher on a whim. It\'s a winner.',
    choices: [
      {
        label: 'Cash it in',
        effects: [
          { path: 'money', op: '+', value: 100000 },
          { path: 'stats.happiness', op: '+', value: 15 },
        ],
      },
      {
        label: 'Frame it instead',
        effects: [{ path: 'stats.happiness', op: '+', value: 4 }],
      },
    ],
  },
  {
    id: 'random_found_money',
    category: 'random',
    weight: 0.4,
    minAge: 5,
    maxAge: 90,
    title: 'Money on the Sidewalk',
    description: 'You spotted a folded bill on the sidewalk. Nobody\'s around.',
    choices: [
      {
        label: 'Pocket it',
        effects: [
          { path: 'money', op: '+', value: 40 },
          { path: 'stats.happiness', op: '+', value: 2 },
        ],
      },
      {
        label: 'Leave it for someone else',
        effects: [{ path: 'stats.happiness', op: '+', value: 1 }],
      },
    ],
  },
  {
    id: 'random_car_accident',
    category: 'random',
    weight: 0.15,
    minAge: 16,
    maxAge: 80,
    title: 'Car Accident',
    description: 'Someone ran a red light and slammed into your car.',
    choices: [
      {
        label: 'Sue them',
        effects: [
          { path: 'money', op: '+', value: 8000 },
          { path: 'stats.health', op: '-', value: 12 },
        ],
      },
      {
        label: 'Settle for medical bills',
        effects: [
          { path: 'money', op: '+', value: 1500 },
          { path: 'stats.health', op: '-', value: 10 },
        ],
      },
    ],
  },
  {
    id: 'random_food_poisoning',
    category: 'random',
    weight: 0.3,
    minAge: 5,
    maxAge: 90,
    title: 'Food Poisoning',
    description: 'That gas-station sushi was a mistake.',
    choices: [
      {
        label: 'Ride it out',
        effects: [
          { path: 'stats.health', op: '-', value: 5 },
          { path: 'stats.happiness', op: '-', value: 3 },
        ],
      },
      {
        label: 'Go to the ER',
        effects: [
          { path: 'stats.health', op: '-', value: 2 },
          { path: 'money', op: '-', value: 800 },
        ],
      },
    ],
  },
  {
    id: 'random_weird_dream',
    category: 'random',
    weight: 0.4,
    minAge: 5,
    maxAge: 90,
    title: 'Strange Dream',
    description: 'You had a very strange dream about a talking rabbit. It said something important. You can\'t remember what.',
    choices: [
      {
        label: 'Brush it off',
        effects: [{ path: 'stats.happiness', op: '+', value: 1 }],
      },
      {
        label: 'Write it down',
        effects: [{ path: 'stats.smarts', op: '+', value: 1 }],
      },
    ],
  },
  {
    id: 'random_gym_membership',
    category: 'random',
    weight: 0.4,
    minAge: 16,
    maxAge: 70,
    title: 'Gym Membership Offer',
    description: 'A new gym opened around the corner. Sign-up is half off this week.',
    choices: [
      {
        label: 'Join up',
        effects: [
          { path: 'money', op: '-', value: 600 },
          { path: 'stats.health', op: '+', value: 6 },
          { path: 'stats.looks', op: '+', value: 3 },
        ],
      },
      {
        label: 'Skip it',
        effects: [],
      },
    ],
  },
  {
    id: 'random_stranger_help',
    category: 'random',
    weight: 0.4,
    minAge: 10,
    maxAge: 90,
    title: 'Stranger in Need',
    description: 'A stranger\'s groceries spilled across the parking lot.',
    choices: [
      {
        label: 'Help them pick up',
        effects: [{ path: 'stats.happiness', op: '+', value: 4 }],
      },
      {
        label: 'Walk on by',
        effects: [{ path: 'stats.happiness', op: '-', value: 1 }],
      },
    ],
  },
  {
    id: 'random_meditation_phase',
    category: 'random',
    weight: 0.3,
    minAge: 18,
    maxAge: 80,
    title: 'Try Meditation?',
    description: 'A coworker won\'t shut up about their meditation app.',
    choices: [
      {
        label: 'Give it a real shot',
        effects: [
          { path: 'stats.happiness', op: '+', value: 5 },
          { path: 'stats.smarts', op: '+', value: 1 },
        ],
      },
      {
        label: 'Roll your eyes',
        effects: [],
      },
    ],
  },
  {
    id: 'random_jury_duty',
    category: 'random',
    weight: 0.25,
    minAge: 18,
    maxAge: 70,
    title: 'Jury Duty',
    description: 'A summons arrived in the mail.',
    choices: [
      {
        label: 'Serve civic-mindedly',
        effects: [
          { path: 'stats.happiness', op: '-', value: 2 },
          { path: 'stats.smarts', op: '+', value: 2 },
        ],
      },
      {
        label: 'Try to get out of it',
        effects: [{ path: 'stats.happiness', op: '+', value: 1 }],
      },
    ],
  },
  {
    id: 'random_neighbor_loud',
    category: 'random',
    weight: 0.4,
    minAge: 18,
    maxAge: 80,
    title: 'Loud Neighbor',
    description: 'Your neighbor has been throwing parties every weekend.',
    choices: [
      {
        label: 'Confront them politely',
        effects: [{ path: 'stats.happiness', op: '+', value: 3 }],
      },
      {
        label: 'Call the cops',
        effects: [
          { path: 'stats.happiness', op: '+', value: 2 },
          { path: 'stats.health', op: '+', value: 1 },
        ],
      },
      {
        label: 'Suffer in silence',
        effects: [
          { path: 'stats.happiness', op: '-', value: 4 },
          { path: 'stats.health', op: '-', value: 2 },
        ],
      },
    ],
  },
];
