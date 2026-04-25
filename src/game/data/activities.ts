import type { Activity } from '../types/activities';

/**
 * V1 activities — twelve player-initiated actions across three categories.
 * The split mirrors the BitLife Activities menu but the action-budget gate
 * (see actionBudget.ts) keeps min-maxing in check: you can't gym every
 * year of a 70-year life.
 *
 * Authoring conventions:
 *   - amounts in baseline (GB) units; the country engine adjusts on apply
 *   - probabilistic outcomes use the same Outcome shape as events
 *   - relationship payloads include a stable `id` so removeRelationship
 *     can target them later
 *   - narratives keep the BitLife-dry tone
 *
 * To add a new activity: append to ALL_ACTIVITIES, set category and
 * actionCost, then describe the outcomes. Tests in activityEngine.test.ts
 * pick the list up automatically.
 */
export const ALL_ACTIVITIES: Activity[] = [
  // -------------------------------------------------------------------
  // Mind & Body
  // -------------------------------------------------------------------
  {
    id: 'gym',
    category: 'mind_body',
    name: 'Hit the gym',
    description: 'A workout. Sweat now, look better later.',
    minAge: 12,
    actionCost: 1,
    cost: -50,
    icon: '🏋️',
    outcomes: [
      {
        weight: 70,
        narrative: 'A solid session. You leave a little sore and a lot smug.',
        effects: [
          { path: 'money', op: '-', value: 50 },
          { path: 'stats.health', op: '+', value: 4 },
          { path: 'stats.looks', op: '+', value: 2 },
        ],
      },
      {
        weight: 20,
        narrative: 'Someone strikes up a conversation between sets. They\'re cute and they have your number by the time you leave.',
        effects: [
          { path: 'money', op: '-', value: 50 },
          { path: 'stats.health', op: '+', value: 3 },
          { path: 'stats.happiness', op: '+', value: 4 },
          {
            special: 'addRelationship',
            payload: {
              id: 'rel-gym-friend',
              type: 'friend',
              age: 26,
              alive: true,
              relationshipLevel: 55,
            },
          },
        ],
      },
      {
        weight: 10,
        narrative: 'You go too heavy, something pops. A week of ice and ibuprofen ahead.',
        effects: [
          { path: 'money', op: '-', value: 50 },
          { path: 'stats.health', op: '-', value: 6 },
          { path: 'stats.happiness', op: '-', value: 3 },
        ],
      },
    ],
  },
  {
    id: 'library',
    category: 'mind_body',
    name: 'Library afternoon',
    description: 'Quiet. Books. The smell of old paper.',
    minAge: 12,
    actionCost: 1,
    icon: '📚',
    outcomes: [
      {
        weight: 70,
        narrative: 'You actually finish the chapter you started. Small victories.',
        effects: [
          { path: 'stats.smarts', op: '+', value: 3 },
          { path: 'stats.happiness', op: '+', value: 1 },
        ],
      },
      {
        weight: 20,
        narrative: 'You pull a book off the wrong shelf and spend the next two hours genuinely engrossed.',
        effects: [
          { path: 'stats.smarts', op: '+', value: 5 },
          { path: 'stats.happiness', op: '+', value: 4 },
        ],
      },
      {
        weight: 10,
        narrative: 'Someone at the next table whispers a recommendation. You leave with a new friend and a new book.',
        effects: [
          { path: 'stats.smarts', op: '+', value: 2 },
          { path: 'stats.happiness', op: '+', value: 3 },
          {
            special: 'addRelationship',
            payload: {
              id: 'rel-library-friend',
              type: 'friend',
              age: 31,
              alive: true,
              relationshipLevel: 50,
            },
          },
        ],
      },
    ],
  },
  {
    id: 'meditate',
    category: 'mind_body',
    name: 'Meditate',
    description: 'Twenty minutes of trying to think about nothing.',
    minAge: 14,
    actionCost: 1,
    icon: '🧘',
    outcomes: [
      {
        weight: 80,
        narrative: 'Calmer. Clearer. The to-do list looks less terrifying.',
        effects: [
          { path: 'stats.happiness', op: '+', value: 4 },
          { path: 'stats.health', op: '+', value: 2 },
        ],
      },
      {
        weight: 20,
        narrative: 'A small revelation lands. You don\'t share it with anyone, but it changes how you handle the rest of the week.',
        effects: [
          { path: 'stats.happiness', op: '+', value: 6 },
          { path: 'stats.smarts', op: '+', value: 2 },
        ],
      },
    ],
  },
  {
    id: 'vacation',
    category: 'mind_body',
    name: 'Take a vacation',
    description: 'A week somewhere else. Sand or snow or city, your call.',
    minAge: 18,
    actionCost: 2,
    cost: -2000,
    icon: '🏖️',
    outcomes: [
      {
        weight: 80,
        narrative: 'A week of doing nothing in particular. You come back lighter — actual relaxed lightness, not the post-trip kind.',
        effects: [
          { path: 'money', op: '-', value: 2000 },
          { path: 'stats.happiness', op: '+', value: 12 },
          { path: 'stats.health', op: '+', value: 3 },
        ],
      },
      {
        weight: 15,
        narrative: 'A stranger at the hotel bar turns into a four-night thing. You exchange numbers and zero promises.',
        effects: [
          { path: 'money', op: '-', value: 2000 },
          { path: 'stats.happiness', op: '+', value: 10 },
          {
            special: 'addRelationship',
            payload: {
              id: 'rel-vacation-romance',
              type: 'partner',
              age: 30,
              alive: true,
              relationshipLevel: 60,
            },
          },
        ],
      },
      {
        weight: 5,
        narrative: 'Flight cancelled, hotel double-booked, food poisoning on day two. You come home worse than you left.',
        effects: [
          { path: 'money', op: '-', value: 2000 },
          { path: 'stats.health', op: '-', value: 8 },
          { path: 'stats.happiness', op: '-', value: 6 },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------
  // Love & Social
  // -------------------------------------------------------------------
  {
    id: 'find_date',
    category: 'love_social',
    name: 'Find a date',
    description: 'Open the app, swipe, send the same opener to ten people.',
    minAge: 16,
    actionCost: 1,
    cost: -100,
    icon: '💌',
    outcomes: [
      {
        weight: 50,
        narrative: 'Pleasant enough. Two drinks, no fireworks. They text you "had fun" and never follow up.',
        effects: [
          { path: 'money', op: '-', value: 100 },
          { path: 'stats.happiness', op: '+', value: 2 },
        ],
      },
      {
        weight: 30,
        narrative: 'You actually like each other. By the end of the night you\'re making plans for next weekend.',
        effects: [
          { path: 'money', op: '-', value: 100 },
          { path: 'stats.happiness', op: '+', value: 7 },
          {
            special: 'addRelationship',
            payload: {
              id: 'rel-activity-partner',
              type: 'partner',
              age: 27,
              alive: true,
              relationshipLevel: 60,
            },
          },
        ],
      },
      {
        weight: 15,
        narrative: 'They spend the entire dinner on their phone. You pay for both meals out of grim politeness.',
        effects: [
          { path: 'money', op: '-', value: 100 },
          { path: 'stats.happiness', op: '-', value: 4 },
        ],
      },
      {
        weight: 5,
        narrative: 'Something rare clicks. By the time the bill comes you\'re already making plans you mean.',
        effects: [
          { path: 'money', op: '-', value: 100 },
          { path: 'stats.happiness', op: '+', value: 12 },
          {
            special: 'addRelationship',
            payload: {
              id: 'rel-activity-partner',
              type: 'partner',
              age: 28,
              alive: true,
              relationshipLevel: 80,
            },
          },
        ],
      },
    ],
  },
  {
    id: 'family_time',
    category: 'love_social',
    name: 'Family time',
    description: 'A long lunch with the people who knew you when you were small.',
    minAge: 5,
    actionCost: 1,
    icon: '👨‍👩‍👧',
    outcomes: [
      {
        weight: 80,
        narrative: 'Easy conversation. Everyone leaves a little happier than they arrived.',
        effects: [
          { path: 'stats.happiness', op: '+', value: 4 },
        ],
      },
      {
        weight: 20,
        narrative: 'Mom tells a story you\'ve never heard about her own twenties. It rearranges something in your head.',
        effects: [
          { path: 'stats.happiness', op: '+', value: 5 },
          { path: 'stats.smarts', op: '+', value: 2 },
        ],
      },
    ],
  },
  {
    id: 'call_friend',
    category: 'love_social',
    name: 'Call a friend',
    description: 'Pick up the phone. Yes, an actual call.',
    minAge: 12,
    actionCost: 1,
    icon: '📞',
    conditions: [{ path: 'relationships', op: 'has', value: 'friend' }],
    outcomes: [
      {
        weight: 70,
        narrative: 'Two hours fly by. You forget what you were even worried about earlier.',
        effects: [
          { path: 'stats.happiness', op: '+', value: 5 },
        ],
      },
      {
        weight: 20,
        narrative: 'They drop news that takes a while to digest. Good news, the kind that makes you re-evaluate your own week.',
        effects: [
          { path: 'stats.happiness', op: '+', value: 3 },
          { path: 'stats.smarts', op: '+', value: 1 },
        ],
      },
      {
        weight: 10,
        narrative: 'It turns into the same fight you\'ve had three times this year. You hang up first.',
        effects: [
          { path: 'stats.happiness', op: '-', value: 6 },
        ],
      },
    ],
  },
  {
    id: 'volunteer',
    category: 'love_social',
    name: 'Volunteer',
    description: 'A few hours doing something for someone you don\'t know.',
    minAge: 14,
    actionCost: 1,
    icon: '🤝',
    outcomes: [
      {
        weight: 80,
        narrative: 'Tiring but worth it. You sleep well that night.',
        effects: [
          { path: 'stats.happiness', op: '+', value: 5 },
          { path: 'stats.health', op: '+', value: 1 },
        ],
      },
      {
        weight: 20,
        narrative: 'Someone running the program tells you their story. You leave with a different definition of "a hard year."',
        effects: [
          { path: 'stats.happiness', op: '+', value: 6 },
          { path: 'stats.smarts', op: '+', value: 2 },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------
  // Career & Money
  // -------------------------------------------------------------------
  {
    id: 'work_harder',
    category: 'career_money',
    name: 'Work harder',
    description: 'Stay late, take the harder projects, skip the long lunch.',
    minAge: 18,
    actionCost: 1,
    icon: '💻',
    conditions: [{ path: 'job', op: '!=', value: null as unknown as string }],
    outcomes: [
      {
        weight: 70,
        narrative: 'You ship more than usual. Your boss notices. Your friends notice you\'re tired.',
        effects: [
          { path: 'job.performance', op: '+', value: 6 },
          { path: 'stats.happiness', op: '-', value: 2 },
        ],
      },
      {
        weight: 20,
        narrative: 'A senior leader pulls you into a meeting you weren\'t supposed to be in. Career-shifting kind of conversation.',
        effects: [
          { path: 'job.performance', op: '+', value: 12 },
          { path: 'stats.happiness', op: '+', value: 3 },
        ],
      },
      {
        weight: 10,
        narrative: 'You hit the wall. Bad sleep, snapping at people, the works.',
        effects: [
          { path: 'job.performance', op: '+', value: 2 },
          { path: 'stats.health', op: '-', value: 5 },
          { path: 'stats.happiness', op: '-', value: 6 },
        ],
      },
    ],
  },
  {
    id: 'ask_raise',
    category: 'career_money',
    name: 'Ask for a raise',
    description: 'Walk into your manager\'s office. Don\'t over-rehearse.',
    minAge: 20,
    actionCost: 1,
    icon: '💰',
    conditions: [
      { path: 'job', op: '!=', value: null as unknown as string },
      { path: 'job.yearsAtJob', op: '>=', value: 1 },
    ],
    outcomes: [
      {
        weight: 35,
        narrative: 'They say yes immediately. You wonder how long you should\'ve asked sooner.',
        effects: [
          { path: 'job.salary', op: '*', value: 1.1 },
          { path: 'stats.happiness', op: '+', value: 6 },
        ],
      },
      {
        weight: 40,
        narrative: 'They give you a vague "let\'s revisit next quarter." You leave the room a little smaller.',
        effects: [
          { path: 'stats.happiness', op: '-', value: 3 },
        ],
      },
      {
        weight: 20,
        narrative: 'They counter with a token bump. Better than nothing, worse than what you asked for.',
        effects: [
          { path: 'job.salary', op: '*', value: 1.03 },
          { path: 'stats.happiness', op: '+', value: 1 },
        ],
      },
      {
        weight: 5,
        narrative: 'It goes wrong. They tell you the company is restructuring and your seat is one of the cuts.',
        effects: [
          { path: 'stats.happiness', op: '-', value: 10 },
          { special: 'leaveJob' },
        ],
      },
    ],
  },
  {
    id: 'visit_doctor',
    category: 'career_money',
    name: 'Visit the doctor',
    description: 'A check-up. Better safe than ignoring that thing on your back.',
    minAge: 0,
    actionCost: 1,
    cost: -200,
    icon: '🩺',
    outcomes: [
      {
        weight: 60,
        narrative: 'All clear. The doctor lectures you about flossing. You promise to start.',
        effects: [
          { path: 'money', op: '-', value: 200 },
          { path: 'stats.health', op: '+', value: 2 },
        ],
      },
      {
        weight: 30,
        narrative: 'They catch something early. The treatment is short and you walk out grateful and a little freaked.',
        effects: [
          { path: 'money', op: '-', value: 200 },
          { path: 'stats.health', op: '+', value: 8 },
          { path: 'stats.happiness', op: '+', value: 2 },
        ],
      },
      {
        weight: 10,
        narrative: 'The doctor schedules a follow-up and won\'t quite say why. You spend the week looking up symptoms you shouldn\'t.',
        effects: [
          { path: 'money', op: '-', value: 200 },
          { path: 'stats.health', op: '-', value: 4 },
          { path: 'stats.happiness', op: '-', value: 8 },
        ],
      },
    ],
  },
  {
    id: 'lottery_ticket',
    category: 'career_money',
    name: 'Buy a lottery ticket',
    description: 'Twenty bucks. The odds are insulting. You buy it anyway.',
    minAge: 18,
    actionCost: 1,
    cost: -20,
    countryGated: true,
    icon: '🎟️',
    outcomes: [
      {
        weight: 95,
        narrative: 'No matches. The fantasy was the point.',
        effects: [
          { path: 'money', op: '-', value: 20 },
          { path: 'stats.happiness', op: '-', value: 1 },
        ],
      },
      {
        weight: 4,
        narrative: 'A small win. Enough for dinner and a story.',
        effects: [
          { path: 'money', op: '+', value: 200 },
          { path: 'stats.happiness', op: '+', value: 3 },
        ],
      },
      {
        weight: 0.9,
        narrative: 'A real win. Not life-changing, but it changes the conversation at the next dinner.',
        effects: [
          { path: 'money', op: '+', value: 25000 },
          { path: 'stats.happiness', op: '+', value: 8 },
        ],
      },
      {
        weight: 0.1,
        narrative: 'You read the numbers three times. Then you call your bank, then your mother, then a lawyer, in that order.',
        effects: [
          { path: 'money', op: '+', value: 1_500_000 },
          { path: 'stats.happiness', op: '+', value: 20 },
        ],
      },
    ],
  },
];
