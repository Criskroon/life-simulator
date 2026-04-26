import type { GameEvent } from '../../types/events';

export const RELATIONSHIP_EVENTS: GameEvent[] = [
  {
    id: 'rel_first_date',
    category: 'relationships',
    weight: 0.7,
    minAge: 16,
    maxAge: 35,
    conditions: [{ path: 'relationships', op: 'lacks', value: 'partner' }],
    title: 'A Date',
    description: 'Someone you barely know asked you out for coffee.',
    choices: [
      {
        label: 'Say yes',
        outcomes: [
          {
            weight: 45,
            narrative: 'You click instantly. The coffee turns into dinner. Dinner turns into a relationship.',
            effects: [
              { path: 'stats.happiness', op: '+', value: 8 },
              {
                special: 'addRelationship',
                payload: {
                  id: 'rel-date-partner',
                  type: 'partner',
                  age: 24,
                  alive: true,
                  relationshipLevel: 60,
                },
              },
            ],
          },
          {
            weight: 30,
            narrative: 'It\'s pleasant. They text you "had fun!" the next morning. Neither of you ever follows up.',
            effects: [{ path: 'stats.happiness', op: '+', value: 1 }],
          },
          {
            weight: 20,
            narrative: 'They spend an hour talking about their ex. You pay for both coffees out of sheer numb politeness.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 4 },
              { path: 'money', op: '-', value: 20 },
            ],
          },
          {
            weight: 5,
            narrative: 'They are catfishing. Whoever shows up is not in the photos and is wearing a wedding ring.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 8 },
            ],
          },
        ],
      },
      {
        label: 'Decline',
        effects: [{ path: 'stats.happiness', op: '-', value: 2 }],
      },
    ],
  },
  {
    id: 'rel_breakup',
    category: 'relationships',
    weight: 0.5,
    minAge: 16,
    maxAge: 70,
    conditions: [{ path: 'relationships', op: 'has', value: 'partner' }],
    title: 'Breakup Talk',
    description: 'Things have been off with your partner. Tonight feels like the night.',
    choices: [
      {
        label: 'End it',
        effects: [
          { path: 'stats.happiness', op: '-', value: 8 },
          // Sweep every partner-base the player could have picked up. Each
          // removeRelationship now wipes all records sharing the base, so
          // even if rel-vacation-romance fired three times across activities,
          // one call here cleans them all out.
          { special: 'removeRelationship', payload: { id: 'rel-date-partner' } },
          { special: 'removeRelationship', payload: { id: 'rel-coworker-partner' } },
          { special: 'removeRelationship', payload: { id: 'rel-blind-date' } },
          { special: 'removeRelationship', payload: { id: 'rel-vacation-romance' } },
          { special: 'removeRelationship', payload: { id: 'rel-activity-partner' } },
        ],
      },
      {
        label: 'Try couples therapy',
        cost: -1500,
        effects: [
          { path: 'money', op: '-', value: 1500 },
          { path: 'stats.happiness', op: '-', value: 2 },
        ],
      },
    ],
  },
  {
    id: 'rel_propose',
    category: 'relationships',
    weight: 0.6,
    minAge: 22,
    maxAge: 50,
    // No oncePerLife — `lacks spouse` already gates re-proposals so divorced
    // or widowed players can re-marry. Without this, the second-marriage
    // narrative shape was structurally impossible.
    conditions: [
      { path: 'relationships', op: 'has', value: 'partner' },
      { path: 'relationships', op: 'lacks', value: 'spouse' },
    ],
    title: 'Propose?',
    description: 'You\'ve been together a while. The thought won\'t go away.',
    choices: [
      {
        label: 'Get the ring',
        cost: -4500,
        outcomes: [
          {
            weight: 70,
            narrative: 'They cry the good kind of cry and say yes before you finish the question. You forget half of what you planned to say.',
            effects: [
              { path: 'money', op: '-', value: 4500 },
              { path: 'stats.happiness', op: '+', value: 14 },
              // Partner becomes spouse — sweep every partner-base so old
              // dating records don't hang around alongside the marriage.
              { special: 'removeRelationship', payload: { id: 'rel-date-partner' } },
              { special: 'removeRelationship', payload: { id: 'rel-coworker-partner' } },
              { special: 'removeRelationship', payload: { id: 'rel-blind-date' } },
              { special: 'removeRelationship', payload: { id: 'rel-vacation-romance' } },
              { special: 'removeRelationship', payload: { id: 'rel-activity-partner' } },
              {
                special: 'addRelationship',
                payload: {
                  id: 'rel-spouse',
                  type: 'spouse',
                  age: 28,
                  alive: true,
                  relationshipLevel: 88,
                },
              },
            ],
          },
          {
            weight: 20,
            narrative: 'They ask for time to think. Two weeks of awful silence later, they say yes — but the magic is bruised.',
            effects: [
              { path: 'money', op: '-', value: 4500 },
              { path: 'stats.happiness', op: '+', value: 5 },
              { special: 'removeRelationship', payload: { id: 'rel-date-partner' } },
              { special: 'removeRelationship', payload: { id: 'rel-coworker-partner' } },
              { special: 'removeRelationship', payload: { id: 'rel-blind-date' } },
              { special: 'removeRelationship', payload: { id: 'rel-vacation-romance' } },
              { special: 'removeRelationship', payload: { id: 'rel-activity-partner' } },
              {
                special: 'addRelationship',
                payload: {
                  id: 'rel-spouse',
                  type: 'spouse',
                  age: 28,
                  alive: true,
                  relationshipLevel: 70,
                },
              },
            ],
          },
          {
            weight: 10,
            narrative: 'They say no. You spend the rest of the year figuring out where the ring goes and what to call them now.',
            effects: [
              { path: 'money', op: '-', value: 4500 },
              { path: 'stats.happiness', op: '-', value: 16 },
              { special: 'removeRelationship', payload: { id: 'rel-date-partner' } },
              { special: 'removeRelationship', payload: { id: 'rel-coworker-partner' } },
              { special: 'removeRelationship', payload: { id: 'rel-blind-date' } },
              { special: 'removeRelationship', payload: { id: 'rel-vacation-romance' } },
              { special: 'removeRelationship', payload: { id: 'rel-activity-partner' } },
            ],
          },
        ],
      },
      {
        label: 'Wait another year',
        effects: [{ path: 'stats.happiness', op: '-', value: 2 }],
      },
    ],
  },
  {
    id: 'rel_have_a_kid',
    category: 'relationships',
    weight: 0.4,
    minAge: 22,
    maxAge: 45,
    conditions: [{ path: 'relationships', op: 'has', value: 'spouse' }],
    title: 'Should We Have a Kid?',
    description: 'Your spouse has been hinting. The conversation is here.',
    choices: [
      {
        label: 'Yes, let\'s try',
        cost: -3000,
        effects: [
          { path: 'money', op: '-', value: 3000 },
          { path: 'stats.happiness', op: '+', value: 8 },
          { path: 'stats.health', op: '-', value: 3 },
          {
            special: 'addRelationship',
            payload: {
              id: 'rel-child-1',
              type: 'child',
              age: 0,
              alive: true,
              relationshipLevel: 90,
            },
          },
        ],
      },
      {
        label: 'Not now',
        effects: [
          { path: 'stats.happiness', op: '-', value: 2 },
        ],
      },
    ],
  },
  {
    id: 'rel_friend_wedding',
    category: 'relationships',
    weight: 0.5,
    minAge: 22,
    maxAge: 45,
    title: 'Friend\'s Wedding',
    description: 'Your friend is getting married. The invitation includes a cash bar.',
    choices: [
      {
        label: 'Go all out',
        cost: -400,
        effects: [
          { path: 'money', op: '-', value: 400 },
          { path: 'stats.happiness', op: '+', value: 6 },
        ],
      },
      {
        label: 'Make an excuse and skip',
        effects: [
          { path: 'stats.happiness', op: '-', value: 3 },
        ],
      },
    ],
  },
  {
    id: 'rel_meet_old_friend',
    category: 'relationships',
    weight: 0.5,
    minAge: 18,
    maxAge: 80,
    title: 'Old Friend Reaches Out',
    description: 'An old friend you haven\'t seen in years messaged you out of the blue.',
    choices: [
      {
        label: 'Catch up over drinks',
        cost: -60,
        effects: [
          { path: 'stats.happiness', op: '+', value: 4 },
          { path: 'money', op: '-', value: 60 },
        ],
      },
      {
        label: 'Ignore it',
        effects: [{ path: 'stats.happiness', op: '-', value: 2 }],
      },
    ],
  },
  {
    id: 'rel_anniversary',
    category: 'relationships',
    weight: 0.6,
    minAge: 24,
    maxAge: 80,
    conditions: [{ path: 'relationships', op: 'has', value: 'spouse' }],
    title: 'Anniversary',
    description: 'It\'s your wedding anniversary. You should probably do something.',
    choices: [
      {
        label: 'Plan a romantic getaway',
        cost: -2000,
        effects: [
          { path: 'money', op: '-', value: 2000 },
          { path: 'stats.happiness', op: '+', value: 9 },
        ],
      },
      {
        label: 'Cook dinner at home',
        cost: -80,
        effects: [
          { path: 'money', op: '-', value: 80 },
          { path: 'stats.happiness', op: '+', value: 4 },
        ],
      },
      {
        label: 'Forget the date',
        effects: [{ path: 'stats.happiness', op: '-', value: 8 }],
      },
    ],
  },
  {
    id: 'rel_parent_dies',
    category: 'relationships',
    weight: 0.3,
    minAge: 30,
    maxAge: 75,
    oncePerLife: true,
    conditions: [{ path: 'relationships', op: 'has', value: 'mother' }],
    title: 'A Parent Passed Away',
    description: 'A late-night phone call. Your mother is gone.',
    choices: [
      {
        label: 'Grieve',
        effects: [
          { path: 'stats.happiness', op: '-', value: 15 },
          { path: 'money', op: '+', value: 25000 },
          { special: 'removeRelationship', payload: { id: 'rel-mother' } },
        ],
      },
    ],
  },
  {
    id: 'rel_friendship_drifts',
    category: 'relationships',
    weight: 0.5,
    minAge: 25,
    maxAge: 70,
    conditions: [{ path: 'relationships', op: 'has', value: 'friend' }],
    title: 'A Friendship is Fading',
    description: 'You haven\'t talked to one of your friends in months. Should you reach out?',
    choices: [
      {
        label: 'Make the call',
        effects: [{ path: 'stats.happiness', op: '+', value: 3 }],
      },
      {
        label: 'Let it die',
        effects: [{ path: 'stats.happiness', op: '-', value: 4 }],
      },
    ],
  },
  {
    id: 'rel_blind_date',
    category: 'relationships',
    weight: 0.4,
    minAge: 25,
    maxAge: 55,
    conditions: [{ path: 'relationships', op: 'lacks', value: 'partner' }],
    title: 'Blind Date',
    description: 'A friend insisted on setting you up. You agreed in a moment of weakness.',
    choices: [
      {
        label: 'Show up',
        effects: [
          { path: 'stats.happiness', op: '+', value: 3 },
          {
            special: 'addRelationship',
            payload: {
              id: 'rel-blind-date',
              type: 'partner',
              age: 32,
              alive: true,
              relationshipLevel: 50,
            },
          },
        ],
      },
      {
        label: 'Bail at the last minute',
        effects: [{ path: 'stats.happiness', op: '-', value: 2 }],
      },
    ],
  },
  {
    id: 'rel_received_proposal',
    category: 'relationships',
    weight: 0.4,
    minAge: 22,
    maxAge: 50,
    // No oncePerLife — see rel_propose. `lacks spouse` already gates this
    // so re-marriage after divorce/widowhood is possible.
    conditions: [
      { path: 'relationships', op: 'has', value: 'partner' },
      { path: 'relationships', op: 'lacks', value: 'spouse' },
    ],
    title: 'They Proposed',
    description: 'Your partner is on one knee. The whole restaurant is watching.',
    choices: [
      {
        label: 'Yes — yes, of course',
        effects: [
          { path: 'stats.happiness', op: '+', value: 14 },
          { special: 'removeRelationship', payload: { id: 'rel-date-partner' } },
          { special: 'removeRelationship', payload: { id: 'rel-coworker-partner' } },
          { special: 'removeRelationship', payload: { id: 'rel-blind-date' } },
          { special: 'removeRelationship', payload: { id: 'rel-vacation-romance' } },
          { special: 'removeRelationship', payload: { id: 'rel-activity-partner' } },
          {
            special: 'addRelationship',
            payload: {
              id: 'rel-spouse',
              type: 'spouse',
              age: 28,
              alive: true,
              relationshipLevel: 90,
            },
          },
        ],
      },
      {
        label: 'I need time to think',
        outcomes: [
          {
            weight: 40,
            narrative: 'They give you the space. A month later you say yes, calmer this time. The wedding is smaller.',
            effects: [
              { path: 'stats.happiness', op: '+', value: 6 },
              { special: 'removeRelationship', payload: { id: 'rel-date-partner' } },
              { special: 'removeRelationship', payload: { id: 'rel-coworker-partner' } },
              { special: 'removeRelationship', payload: { id: 'rel-blind-date' } },
              { special: 'removeRelationship', payload: { id: 'rel-vacation-romance' } },
              { special: 'removeRelationship', payload: { id: 'rel-activity-partner' } },
              {
                special: 'addRelationship',
                payload: {
                  id: 'rel-spouse',
                  type: 'spouse',
                  age: 28,
                  alive: true,
                  relationshipLevel: 75,
                },
              },
            ],
          },
          {
            weight: 35,
            narrative: 'They\'re hurt and don\'t hide it. The relationship limps on for a few months before quietly ending.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 10 },
              { special: 'removeRelationship', payload: { id: 'rel-date-partner' } },
              { special: 'removeRelationship', payload: { id: 'rel-coworker-partner' } },
              { special: 'removeRelationship', payload: { id: 'rel-blind-date' } },
              { special: 'removeRelationship', payload: { id: 'rel-vacation-romance' } },
              { special: 'removeRelationship', payload: { id: 'rel-activity-partner' } },
            ],
          },
          {
            weight: 25,
            narrative: 'They smile, take it back, and say "okay, when you\'re ready." You stay together but the ring goes back in a drawer.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 2 },
            ],
          },
        ],
      },
      {
        label: 'No. I\'m sorry.',
        effects: [
          { path: 'stats.happiness', op: '-', value: 12 },
          { special: 'removeRelationship', payload: { id: 'rel-date-partner' } },
          { special: 'removeRelationship', payload: { id: 'rel-coworker-partner' } },
          { special: 'removeRelationship', payload: { id: 'rel-blind-date' } },
          { special: 'removeRelationship', payload: { id: 'rel-vacation-romance' } },
          { special: 'removeRelationship', payload: { id: 'rel-activity-partner' } },
        ],
      },
    ],
  },
  {
    id: 'rel_family_argument',
    category: 'relationships',
    weight: 0.5,
    minAge: 14,
    maxAge: 70,
    conditions: [{ path: 'relationships', op: 'has', value: 'mother' }],
    title: 'Family Argument',
    description: 'A holiday dinner spirals into the same fight you\'ve had a dozen times.',
    choices: [
      {
        label: 'Hold your ground',
        outcomes: [
          {
            weight: 40,
            narrative: 'You make your point clearly and refuse to budge. The room goes quiet, but you can feel something shift in your favor.',
            effects: [
              { path: 'stats.happiness', op: '+', value: 3 },
              { path: 'stats.smarts', op: '+', value: 1 },
            ],
          },
          {
            weight: 45,
            narrative: 'It escalates. Your mother stops speaking to you for three months. The silence is worse than the fight was.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 8 },
            ],
          },
          {
            weight: 15,
            narrative: 'You finally say the thing you\'ve been holding back for years. They cry. You cry. Something heavy lifts.',
            effects: [
              { path: 'stats.happiness', op: '+', value: 6 },
            ],
          },
        ],
      },
      {
        label: 'Apologize to keep the peace',
        outcomes: [
          {
            weight: 65,
            narrative: 'Dinner resumes. Everyone pretends nothing happened. You feel the resentment settle in alongside the dessert.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 4 },
            ],
          },
          {
            weight: 35,
            narrative: 'They take the apology and double down. You spend the rest of the evening being lectured.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 6 },
            ],
          },
        ],
      },
      {
        label: 'Walk out of the room',
        outcomes: [
          {
            weight: 50,
            narrative: 'You sit on the porch in the cold for half an hour. Your father comes out with a beer and doesn\'t say a word.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 1 },
            ],
          },
          {
            weight: 50,
            narrative: 'You hear the argument continue without you, louder now. Someone is going to bring it up at every dinner from now on.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 5 },
            ],
          },
        ],
      },
    ],
  },
];
