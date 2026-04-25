import type { GameEvent } from '../../types/events';

export const RANDOM_EVENTS: GameEvent[] = [
  {
    id: 'random_lottery_win',
    category: 'random',
    weight: 0.4,
    minAge: 18,
    maxAge: 90,
    title: 'Lottery Temptation',
    description: 'The jackpot is up to a hundred million. The ticket would cost you twenty bucks.',
    choices: [
      {
        label: 'Buy the ticket',
        outcomes: [
          {
            weight: 75,
            narrative: 'Three matching numbers. You\'re out twenty dollars and one daydream.',
            effects: [
              { path: 'money', op: '-', value: 20 },
              { path: 'stats.happiness', op: '-', value: 1 },
            ],
          },
          {
            weight: 20,
            narrative: 'Small win — enough for dinner and a bottle of something. The fantasy survives another week.',
            effects: [
              { path: 'money', op: '+', value: 80 },
              { path: 'stats.happiness', op: '+', value: 2 },
            ],
          },
          {
            weight: 4,
            narrative: 'You hit a mid-tier prize. Not life-changing, but enough to change the conversation at the next dinner.',
            effects: [
              { path: 'money', op: '+', value: 5000 },
              { path: 'stats.happiness', op: '+', value: 6 },
            ],
          },
          {
            weight: 1,
            narrative: 'The numbers all match. You read them three times. You sit on the floor for an hour before calling anyone.',
            effects: [
              { path: 'money', op: '+', value: 100000 },
              { path: 'stats.happiness', op: '+', value: 15 },
            ],
          },
        ],
      },
      {
        label: 'Save your money',
        effects: [],
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
        outcomes: [
          {
            weight: 60,
            narrative: 'Forty bucks. You buy yourself something stupid and feel briefly invincible.',
            effects: [
              { path: 'money', op: '+', value: 40 },
              { path: 'stats.happiness', op: '+', value: 3 },
            ],
          },
          {
            weight: 25,
            narrative: 'You unfold it. Two hundred. You glance around guiltily and walk faster.',
            effects: [
              { path: 'money', op: '+', value: 200 },
              { path: 'stats.happiness', op: '+', value: 5 },
            ],
          },
          {
            weight: 15,
            narrative: 'Halfway down the street, an old woman is in tears looking for "exactly that envelope." You keep walking but it bothers you for weeks.',
            effects: [
              { path: 'money', op: '+', value: 40 },
              { path: 'stats.happiness', op: '-', value: 4 },
            ],
          },
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
        outcomes: [
          {
            weight: 55,
            narrative: 'They thank you with the kind of warmth you remember for the rest of the week.',
            effects: [{ path: 'stats.happiness', op: '+', value: 5 }],
          },
          {
            weight: 25,
            narrative: 'They press a twenty into your hand. You try to refuse. They insist. You stop refusing.',
            effects: [
              { path: 'stats.happiness', op: '+', value: 4 },
              { path: 'money', op: '+', value: 20 },
            ],
          },
          {
            weight: 15,
            narrative: 'They get angry — accuse you of trying to steal something. You leave the cart on the asphalt and walk to your car.',
            effects: [{ path: 'stats.happiness', op: '-', value: 4 }],
          },
          {
            weight: 5,
            narrative: 'You throw out your back picking up a watermelon. Doctor says rest.',
            effects: [
              { path: 'stats.health', op: '-', value: 6 },
              { path: 'stats.happiness', op: '-', value: 2 },
            ],
          },
        ],
      },
      {
        label: 'Walk on by',
        outcomes: [
          {
            weight: 70,
            narrative: 'You don\'t look back. You also don\'t feel great about it.',
            effects: [{ path: 'stats.happiness', op: '-', value: 2 }],
          },
          {
            weight: 30,
            narrative: 'You barely register the encounter. By the time you reach your car you\'ve already forgotten about it.',
            effects: [],
          },
        ],
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
  {
    id: 'random_suspicious_stranger',
    category: 'random',
    weight: 0.3,
    minAge: 14,
    maxAge: 80,
    title: 'Suspicious Stranger',
    description: 'A man at the bus stop says he can "make you rich tonight" if you walk with him for ten minutes.',
    choices: [
      {
        label: 'Hear him out',
        outcomes: [
          {
            weight: 40,
            narrative: 'He pitches a multi-level marketing scheme for half an hour. You leave forty minutes older and exactly as poor.',
            effects: [{ path: 'stats.happiness', op: '-', value: 2 }],
          },
          {
            weight: 30,
            narrative: 'He offers you cash to deliver a package "no questions asked." You decline, but the way he looks at you stays with you for weeks.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 4 },
              { path: 'stats.smarts', op: '+', value: 1 },
            ],
          },
          {
            weight: 20,
            narrative: 'It\'s a scam. He needs your card to "verify your account." You play along just long enough to walk to a police officer.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 1 },
              { path: 'stats.smarts', op: '+', value: 2 },
            ],
          },
          {
            weight: 10,
            narrative: 'He robs you in a side alley. You hand over your wallet and walk home with shaking hands.',
            effects: [
              { path: 'money', op: '-', value: 300 },
              { path: 'stats.health', op: '-', value: 4 },
              { path: 'stats.happiness', op: '-', value: 10 },
            ],
          },
        ],
      },
      {
        label: 'Walk away fast',
        outcomes: [
          {
            weight: 80,
            narrative: 'You don\'t look back. By the time the bus arrives, you\'ve already half-forgotten the encounter.',
            effects: [],
          },
          {
            weight: 20,
            narrative: 'He follows you for two blocks shouting. You duck into a shop. He gives up eventually.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 4 },
            ],
          },
        ],
      },
    ],
  },
];
