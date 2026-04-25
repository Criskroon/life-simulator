import type { GameEvent } from '../../types/events';

export const CHILDHOOD_EVENTS: GameEvent[] = [
  {
    id: 'child_birthday_party',
    category: 'childhood',
    weight: 0.8,
    minAge: 4,
    maxAge: 12,
    title: 'Birthday Party',
    description: 'Your parents threw you a birthday party. Three kids showed up.',
    choices: [
      {
        label: 'Have fun anyway',
        effects: [{ path: 'stats.happiness', op: '+', value: 6 }],
      },
      {
        label: 'Sulk in your room',
        effects: [{ path: 'stats.happiness', op: '-', value: 4 }],
      },
    ],
  },
  {
    id: 'child_got_a_pet',
    category: 'childhood',
    weight: 0.5,
    minAge: 5,
    maxAge: 11,
    oncePerLife: true,
    title: 'A New Pet',
    description: 'Your parents brought home a scruffy little dog and asked if you wanted to keep it.',
    choices: [
      {
        label: 'Keep the dog!',
        effects: [
          { path: 'stats.happiness', op: '+', value: 12 },
          { path: 'stats.health', op: '+', value: 3 },
        ],
      },
      {
        label: 'Send it back, too much work',
        effects: [{ path: 'stats.happiness', op: '-', value: 2 }],
      },
    ],
  },
  {
    id: 'child_school_play',
    category: 'childhood',
    weight: 0.6,
    minAge: 6,
    maxAge: 12,
    title: 'School Play',
    description: 'Your school is putting on a play. The teacher asks if you want a part.',
    choices: [
      {
        label: 'Audition for the lead',
        effects: [
          { path: 'stats.looks', op: '+', value: 2 },
          { path: 'stats.happiness', op: '+', value: 4 },
        ],
      },
      {
        label: 'Help backstage',
        effects: [
          { path: 'stats.smarts', op: '+', value: 2 },
          { path: 'stats.happiness', op: '+', value: 2 },
        ],
      },
      {
        label: 'Refuse to participate',
        effects: [{ path: 'stats.happiness', op: '-', value: 2 }],
      },
    ],
  },
  {
    id: 'child_sibling_fight',
    category: 'childhood',
    weight: 0.7,
    minAge: 4,
    maxAge: 12,
    conditions: [{ path: 'relationships', op: 'has', value: 'sibling' }],
    title: 'Sibling Squabble',
    description: 'Your sibling broke your favorite toy. They claim it was an accident.',
    choices: [
      {
        label: 'Forgive them',
        effects: [{ path: 'stats.happiness', op: '-', value: 2 }],
      },
      {
        label: 'Tell mom',
        effects: [
          { path: 'stats.happiness', op: '+', value: 2 },
        ],
      },
      {
        label: 'Plot revenge',
        effects: [
          { path: 'stats.happiness', op: '+', value: 4 },
          { path: 'stats.smarts', op: '+', value: 1 },
        ],
      },
    ],
  },
  {
    id: 'child_good_grades',
    category: 'childhood',
    weight: 0.7,
    minAge: 6,
    maxAge: 12,
    title: 'Report Card',
    description: 'It\'s report card day. You can study hard or just hope for the best.',
    choices: [
      {
        label: 'Study every night',
        effects: [
          { path: 'stats.smarts', op: '+', value: 5 },
          { path: 'stats.happiness', op: '-', value: 2 },
        ],
      },
      {
        label: 'Wing it',
        effects: [
          { path: 'stats.smarts', op: '-', value: 2 },
          { path: 'stats.happiness', op: '+', value: 1 },
        ],
      },
    ],
  },
  {
    id: 'child_park_friend',
    category: 'childhood',
    weight: 0.5,
    minAge: 5,
    maxAge: 11,
    title: 'A Kid at the Park',
    description: 'A kid at the park asked if you wanted to play.',
    choices: [
      {
        label: 'Make a new friend',
        effects: [
          { path: 'stats.happiness', op: '+', value: 5 },
          {
            special: 'addRelationship',
            payload: {
              id: 'rel-park-friend',
              type: 'friend',
              firstName: 'Alex',
              lastName: 'Park',
              age: 8,
              alive: true,
              relationshipLevel: 60,
            },
          },
        ],
      },
      {
        label: 'Pretend you didn\'t hear them',
        effects: [{ path: 'stats.happiness', op: '-', value: 3 }],
      },
    ],
  },
  {
    id: 'child_chickenpox',
    category: 'childhood',
    weight: 0.3,
    minAge: 3,
    maxAge: 9,
    oncePerLife: true,
    title: 'Chickenpox',
    description: 'You came down with chickenpox. Two weeks of itching ahead.',
    choices: [
      {
        label: 'Suffer through it',
        effects: [
          { path: 'stats.health', op: '-', value: 5 },
          { path: 'stats.happiness', op: '-', value: 4 },
        ],
      },
    ],
  },
  {
    id: 'child_summer_camp',
    category: 'childhood',
    weight: 0.5,
    minAge: 7,
    maxAge: 12,
    title: 'Summer Camp',
    description: 'Your parents are sending you to summer camp. Two weeks of forced fun.',
    choices: [
      {
        label: 'Throw yourself into it',
        effects: [
          { path: 'stats.happiness', op: '+', value: 6 },
          { path: 'stats.health', op: '+', value: 3 },
        ],
      },
      {
        label: 'Hide in your bunk',
        effects: [{ path: 'stats.happiness', op: '-', value: 4 }],
      },
    ],
  },
  {
    id: 'child_stole_candy',
    category: 'childhood',
    weight: 0.4,
    minAge: 6,
    maxAge: 12,
    title: 'Tempting Candy',
    description: 'You\'re alone in the corner store. The candy is right there. No one\'s watching.',
    choices: [
      {
        label: 'Pocket a chocolate bar',
        effects: [
          { path: 'stats.happiness', op: '+', value: 3 },
          {
            special: 'addCrime',
            payload: {
              id: 'crime-petty-theft-1',
              year: 0,
              age: 0,
              crime: 'shoplifting candy',
              caught: false,
              jailYears: 0,
            },
          },
        ],
      },
      {
        label: 'Walk out empty-handed',
        effects: [{ path: 'stats.smarts', op: '+', value: 1 }],
      },
    ],
  },
  {
    id: 'child_picky_eater',
    category: 'childhood',
    weight: 0.5,
    minAge: 3,
    maxAge: 8,
    title: 'Vegetables for Dinner',
    description: 'Mom served broccoli. Again.',
    choices: [
      {
        label: 'Eat it like a champ',
        effects: [{ path: 'stats.health', op: '+', value: 4 }],
      },
      {
        label: 'Refuse and pout',
        effects: [
          { path: 'stats.health', op: '-', value: 2 },
          { path: 'stats.happiness', op: '+', value: 1 },
        ],
      },
      {
        label: 'Hide it under the napkin',
        effects: [{ path: 'stats.smarts', op: '+', value: 1 }],
      },
    ],
  },
  {
    id: 'child_treehouse',
    category: 'childhood',
    weight: 0.3,
    minAge: 7,
    maxAge: 12,
    oncePerLife: true,
    title: 'Build a Treehouse',
    description: 'You and a neighbor decide to build a treehouse in the backyard.',
    choices: [
      {
        label: 'Build it carefully',
        effects: [
          { path: 'stats.smarts', op: '+', value: 3 },
          { path: 'stats.happiness', op: '+', value: 5 },
        ],
      },
      {
        label: 'Slap it together fast',
        effects: [
          { path: 'stats.happiness', op: '+', value: 4 },
          { path: 'stats.health', op: '-', value: 5 },
        ],
      },
    ],
  },
  {
    id: 'child_bullied',
    category: 'childhood',
    weight: 0.5,
    minAge: 6,
    maxAge: 12,
    title: 'Bullied at School',
    description: 'A kid at school keeps shoving you in the hallway.',
    choices: [
      {
        label: 'Tell a teacher',
        effects: [
          { path: 'stats.happiness', op: '+', value: 1 },
        ],
      },
      {
        label: 'Fight back',
        effects: [
          { path: 'stats.health', op: '-', value: 4 },
          { path: 'stats.happiness', op: '+', value: 3 },
        ],
      },
      {
        label: 'Take it quietly',
        effects: [
          { path: 'stats.happiness', op: '-', value: 6 },
        ],
      },
    ],
  },
  {
    id: 'child_library_books',
    category: 'childhood',
    weight: 0.5,
    minAge: 7,
    maxAge: 12,
    title: 'Library Visit',
    description: 'You\'re at the library. The books look interesting today.',
    choices: [
      {
        label: 'Read everything you can',
        effects: [
          { path: 'stats.smarts', op: '+', value: 4 },
          { path: 'stats.happiness', op: '+', value: 2 },
        ],
      },
      {
        label: 'Skim a comic and leave',
        effects: [{ path: 'stats.smarts', op: '+', value: 1 }],
      },
    ],
  },
  {
    id: 'child_lost_tooth',
    category: 'childhood',
    weight: 0.6,
    minAge: 5,
    maxAge: 9,
    title: 'Lost a Tooth',
    description: 'Your front tooth fell out at lunch. You can put it under your pillow.',
    choices: [
      {
        label: 'Tooth fairy time',
        effects: [
          { path: 'money', op: '+', value: 5 },
          { path: 'stats.happiness', op: '+', value: 3 },
        ],
      },
      {
        label: 'Throw it out',
        effects: [{ path: 'stats.happiness', op: '-', value: 1 }],
      },
    ],
  },
  {
    id: 'child_swim_lessons',
    category: 'childhood',
    weight: 0.5,
    minAge: 5,
    maxAge: 10,
    oncePerLife: true,
    title: 'Swim Lessons',
    description: 'Mom signed you up for swim lessons.',
    choices: [
      {
        label: 'Learn to swim',
        effects: [
          { path: 'stats.health', op: '+', value: 5 },
          { path: 'stats.looks', op: '+', value: 2 },
        ],
      },
      {
        label: 'Skip every class',
        effects: [{ path: 'stats.happiness', op: '+', value: 1 }],
      },
    ],
  },
  {
    id: 'child_scraped_knee',
    category: 'childhood',
    weight: 0.6,
    minAge: 4,
    maxAge: 11,
    title: 'Scraped Your Knee',
    description: 'You wiped out on your bike going down the hill.',
    choices: [
      {
        label: 'Cry and run home',
        effects: [
          { path: 'stats.health', op: '-', value: 3 },
          { path: 'stats.happiness', op: '-', value: 2 },
        ],
      },
      {
        label: 'Get back on the bike',
        effects: [
          { path: 'stats.health', op: '-', value: 2 },
          { path: 'stats.happiness', op: '+', value: 3 },
        ],
      },
    ],
  },
  {
    id: 'child_gift_grandparents',
    category: 'childhood',
    weight: 0.4,
    minAge: 4,
    maxAge: 12,
    title: 'Gift From Grandma',
    description: 'Grandma sent you a card with cash inside.',
    choices: [
      {
        label: 'Save it',
        effects: [{ path: 'money', op: '+', value: 50 }],
      },
      {
        label: 'Spend it on candy',
        effects: [
          { path: 'money', op: '+', value: 10 },
          { path: 'stats.happiness', op: '+', value: 4 },
          { path: 'stats.health', op: '-', value: 2 },
        ],
      },
    ],
  },
  {
    id: 'child_class_pet',
    category: 'childhood',
    weight: 0.3,
    minAge: 6,
    maxAge: 11,
    oncePerLife: true,
    title: 'Class Pet for the Weekend',
    description: 'The teacher chose you to take the class hamster home for the weekend.',
    choices: [
      {
        label: 'Care for it diligently',
        effects: [
          { path: 'stats.happiness', op: '+', value: 5 },
          { path: 'stats.smarts', op: '+', value: 2 },
        ],
      },
      {
        label: 'Forget to feed it',
        effects: [{ path: 'stats.happiness', op: '-', value: 6 }],
      },
    ],
  },
  {
    id: 'child_recital',
    category: 'childhood',
    weight: 0.4,
    minAge: 7,
    maxAge: 12,
    title: 'Music Recital',
    description: 'Your music teacher signed you up for the recital.',
    choices: [
      {
        label: 'Practice for weeks',
        effects: [
          { path: 'stats.smarts', op: '+', value: 2 },
          { path: 'stats.happiness', op: '+', value: 4 },
        ],
      },
      {
        label: 'Fake an illness',
        effects: [
          { path: 'stats.happiness', op: '-', value: 3 },
        ],
      },
    ],
  },
  {
    id: 'child_made_up_story',
    category: 'childhood',
    weight: 0.5,
    minAge: 5,
    maxAge: 12,
    title: 'Caught in a Lie',
    description: 'You told the teacher the dog ate your homework. The teacher knows you don\'t have a dog.',
    choices: [
      {
        label: 'Confess immediately',
        effects: [
          { path: 'stats.happiness', op: '-', value: 2 },
        ],
      },
      {
        label: 'Double down on the lie',
        effects: [
          { path: 'stats.smarts', op: '+', value: 2 },
          { path: 'stats.happiness', op: '-', value: 4 },
        ],
      },
    ],
  },
];
