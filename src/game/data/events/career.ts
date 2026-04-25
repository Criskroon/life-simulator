import type { GameEvent } from '../../types/events';

export const CAREER_EVENTS: GameEvent[] = [
  {
    id: 'career_first_job_offer_retail',
    category: 'career',
    weight: 1.5,
    minAge: 18,
    maxAge: 22,
    oncePerLife: true,
    conditions: [{ path: 'job', op: '==', value: null as unknown as string }],
    title: 'Job Offer: Cashier',
    description: 'A local store wants to hire you as a cashier. It\'s not glamorous, but it\'s pay.',
    choices: [
      {
        label: 'Accept the job',
        effects: [
          {
            special: 'setJob',
            payload: {
              title: 'Cashier',
              careerId: 'retail',
              level: 0,
              salary: 22000,
              performance: 60,
              yearsAtJob: 0,
            },
          },
        ],
      },
      {
        label: 'Hold out for something better',
        effects: [{ path: 'stats.happiness', op: '-', value: 2 }],
      },
    ],
  },
  {
    id: 'career_software_offer',
    category: 'career',
    weight: 1.0,
    minAge: 19,
    maxAge: 30,
    oncePerLife: true,
    conditions: [
      { path: 'stats.smarts', op: '>=', value: 60 },
      { path: 'job', op: '==', value: null as unknown as string },
    ],
    title: 'Junior Developer Role',
    description: 'A startup is looking for a junior developer. You meet the bar — barely.',
    choices: [
      {
        label: 'Take it',
        effects: [
          {
            special: 'setJob',
            payload: {
              title: 'Junior Developer',
              careerId: 'software',
              level: 0,
              salary: 38000,
              performance: 65,
              yearsAtJob: 0,
            },
          },
        ],
      },
      {
        label: 'Pass — it sounds like a sweatshop',
        effects: [{ path: 'stats.happiness', op: '+', value: 1 }],
      },
    ],
  },
  {
    id: 'career_promotion_offer',
    category: 'career',
    weight: 1.2,
    minAge: 20,
    maxAge: 65,
    conditions: [
      { path: 'job.performance', op: '>=', value: 70 },
      { path: 'job.yearsAtJob', op: '>=', value: 3 },
    ],
    title: 'Promotion Talks',
    description: 'Your boss pulled you into a meeting. They\'re considering you for a promotion.',
    choices: [
      {
        label: 'Pitch yourself hard',
        effects: [
          { path: 'job.salary', op: '*', value: 1 },
          { path: 'job.salary', op: '+', value: 12000 },
          { path: 'job.level', op: '+', value: 1 },
          { path: 'job.performance', op: '-', value: 5 },
          { path: 'stats.happiness', op: '+', value: 6 },
        ],
      },
      {
        label: 'Stay humble, stay where you are',
        effects: [{ path: 'job.performance', op: '+', value: 5 }],
      },
    ],
  },
  {
    id: 'career_fired',
    category: 'career',
    weight: 0.5,
    minAge: 18,
    maxAge: 65,
    conditions: [{ path: 'job.performance', op: '<', value: 30 }],
    title: 'You\'re Fired',
    description: 'HR scheduled a meeting for the end of the day. You already know what\'s coming.',
    choices: [
      {
        label: 'Take the severance and go',
        effects: [
          { path: 'money', op: '+', value: 3000 },
          { path: 'stats.happiness', op: '-', value: 8 },
          { special: 'leaveJob' },
        ],
      },
      {
        label: 'Fight it',
        outcomes: [
          {
            weight: 25,
            narrative: 'Your lawyer earns her fee. The company pays a settlement to make the whole thing go away quietly.',
            effects: [
              { path: 'money', op: '+', value: 8000 },
              { path: 'stats.happiness', op: '-', value: 2 },
              { special: 'leaveJob' },
            ],
          },
          {
            weight: 50,
            narrative: 'Six months of legal back-and-forth. You lose. Your reference is now worse than if you\'d just left.',
            effects: [
              { path: 'money', op: '-', value: 4000 },
              { path: 'stats.happiness', op: '-', value: 8 },
              { special: 'leaveJob' },
            ],
          },
          {
            weight: 25,
            narrative: 'They settle out of court. You get a small payout and an NDA you\'ll regret signing.',
            effects: [
              { path: 'money', op: '+', value: 1500 },
              { path: 'stats.happiness', op: '-', value: 6 },
              { special: 'leaveJob' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'career_workplace_romance',
    category: 'career',
    weight: 0.5,
    minAge: 21,
    maxAge: 50,
    oncePerLife: true,
    conditions: [{ path: 'job', op: '!=', value: null as unknown as string }],
    title: 'Coworker Romance',
    description: 'A coworker keeps lingering at your desk. There\'s clearly something there.',
    choices: [
      {
        label: 'Ask them out',
        effects: [
          { path: 'stats.happiness', op: '+', value: 6 },
          {
            special: 'addRelationship',
            payload: {
              id: 'rel-coworker-partner',
              type: 'partner',
              firstName: 'Riley',
              lastName: 'Chen',
              age: 28,
              alive: true,
              relationshipLevel: 65,
            },
          },
        ],
      },
      {
        label: 'Keep it professional',
        effects: [{ path: 'job.performance', op: '+', value: 4 }],
      },
    ],
  },
  {
    id: 'career_side_hustle',
    category: 'career',
    weight: 0.6,
    minAge: 18,
    maxAge: 60,
    title: 'Side Hustle',
    description: 'A friend wants to start a side business with you.',
    choices: [
      {
        label: 'Invest savings into it',
        outcomes: [
          {
            weight: 35,
            narrative: 'It works. Within months you\'re moving real product. Your friend even takes you out to celebrate.',
            effects: [
              { path: 'money', op: '+', value: 6000 },
              { path: 'stats.happiness', op: '+', value: 6 },
            ],
          },
          {
            weight: 30,
            narrative: 'You break even. The work was fine, the dream was bigger than the spreadsheet allowed.',
            effects: [
              { path: 'money', op: '-', value: 200 },
              { path: 'stats.happiness', op: '+', value: 1 },
            ],
          },
          {
            weight: 25,
            narrative: 'It flops. Your friend ghosts you when you ask about the books. The friendship doesn\'t survive.',
            effects: [
              { path: 'money', op: '-', value: 2500 },
              { path: 'stats.happiness', op: '-', value: 6 },
            ],
          },
          {
            weight: 10,
            narrative: 'It blows up — in a good way. You sell your stake for more than you ever made at your day job.',
            effects: [
              { path: 'money', op: '+', value: 25000 },
              { path: 'stats.happiness', op: '+', value: 10 },
            ],
          },
        ],
      },
      {
        label: 'Politely decline',
        outcomes: [
          {
            weight: 70,
            narrative: 'Your friend goes ahead without you. Nothing comes of it, and you sleep just fine.',
            effects: [],
          },
          {
            weight: 30,
            narrative: 'Two years later they\'re on a magazine cover. You watch from your cubicle and try not to scream.',
            effects: [{ path: 'stats.happiness', op: '-', value: 6 }],
          },
        ],
      },
    ],
  },
  {
    id: 'career_ask_for_raise',
    category: 'career',
    weight: 0.7,
    minAge: 20,
    maxAge: 65,
    conditions: [{ path: 'job.yearsAtJob', op: '>=', value: 2 }],
    title: 'Ask For a Raise',
    description: 'You haven\'t had a raise in years. Time to make your case.',
    choices: [
      {
        label: 'Ask confidently',
        outcomes: [
          {
            weight: 35,
            narrative: 'Your boss listens, nods, and approves the full bump. You leave the meeting walking taller.',
            effects: [
              { path: 'job.salary', op: '+', value: 6000 },
              { path: 'stats.happiness', op: '+', value: 6 },
            ],
          },
          {
            weight: 30,
            narrative: 'They give you half what you asked for and a vague promise about "next quarter." You take it.',
            effects: [
              { path: 'job.salary', op: '+', value: 2500 },
              { path: 'stats.happiness', op: '+', value: 1 },
            ],
          },
          {
            weight: 25,
            narrative: 'Your boss talks about "budget constraints" for fifteen minutes. You leave with nothing and a sour taste.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 5 },
              { path: 'job.performance', op: '-', value: 3 },
            ],
          },
          {
            weight: 10,
            narrative: 'You\'re told you\'re "lucky to have a job in this market." You spend the rest of the week updating your résumé.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 8 },
              { path: 'job.performance', op: '-', value: 6 },
            ],
          },
        ],
      },
      {
        label: 'Chicken out',
        outcomes: [
          {
            weight: 70,
            narrative: 'You walk past your boss\'s door three times and never knock. You stew about it for weeks.',
            effects: [{ path: 'stats.happiness', op: '-', value: 4 }],
          },
          {
            weight: 30,
            narrative: 'You don\'t ask, but at the company review your manager bumps you anyway. Small mercies.',
            effects: [
              { path: 'job.salary', op: '+', value: 1500 },
              { path: 'stats.happiness', op: '+', value: 1 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'career_burnout',
    category: 'career',
    weight: 0.4,
    minAge: 25,
    maxAge: 60,
    conditions: [
      { path: 'job', op: '!=', value: null as unknown as string },
      { path: 'stats.happiness', op: '<', value: 35 },
    ],
    title: 'Burnout',
    description: 'You\'re exhausted. The thought of going to work tomorrow feels physically heavy.',
    choices: [
      {
        label: 'Take a sabbatical',
        effects: [
          { path: 'stats.happiness', op: '+', value: 10 },
          { path: 'job.performance', op: '-', value: 10 },
          { path: 'money', op: '-', value: 5000 },
        ],
      },
      {
        label: 'Quit',
        effects: [
          { path: 'stats.happiness', op: '+', value: 6 },
          { special: 'leaveJob' },
        ],
      },
      {
        label: 'Push through',
        effects: [
          { path: 'stats.health', op: '-', value: 5 },
          { path: 'job.performance', op: '+', value: 3 },
        ],
      },
    ],
  },
  {
    id: 'career_bad_review',
    category: 'career',
    weight: 0.6,
    minAge: 18,
    maxAge: 65,
    conditions: [{ path: 'job', op: '!=', value: null as unknown as string }],
    title: 'Bad Performance Review',
    description: 'Your manager wants a word. The review on your desk has a lot of red ink on it.',
    choices: [
      {
        label: 'Apologize and improve',
        effects: [
          { path: 'job.performance', op: '+', value: 5 },
          { path: 'stats.happiness', op: '-', value: 3 },
        ],
      },
      {
        label: 'Argue every point',
        effects: [
          { path: 'job.performance', op: '-', value: 8 },
        ],
      },
    ],
  },
  {
    id: 'career_great_review',
    category: 'career',
    weight: 0.6,
    minAge: 18,
    maxAge: 65,
    conditions: [
      { path: 'job', op: '!=', value: null as unknown as string },
      { path: 'job.performance', op: '>=', value: 75 },
    ],
    title: 'Stellar Review',
    description: 'Your manager raved about your work. There\'s a small bonus attached.',
    choices: [
      {
        label: 'Take the bonus',
        effects: [
          { path: 'money', op: '+', value: 3000 },
          { path: 'stats.happiness', op: '+', value: 5 },
        ],
      },
    ],
  },
  {
    id: 'career_office_drama',
    category: 'career',
    weight: 0.5,
    minAge: 20,
    maxAge: 60,
    conditions: [{ path: 'job', op: '!=', value: null as unknown as string }],
    title: 'Office Drama',
    description: 'Two coworkers are fighting over a project and dragging you in.',
    choices: [
      {
        label: 'Pick a side',
        outcomes: [
          {
            weight: 45,
            narrative: 'You back the right horse. Their project wins out and you get credited as a key supporter.',
            effects: [
              { path: 'job.performance', op: '+', value: 6 },
              { path: 'stats.happiness', op: '+', value: 2 },
            ],
          },
          {
            weight: 40,
            narrative: 'You back the wrong horse. The other side wins and starts copying you on passive-aggressive emails.',
            effects: [
              { path: 'job.performance', op: '-', value: 5 },
              { path: 'stats.happiness', op: '-', value: 5 },
            ],
          },
          {
            weight: 15,
            narrative: 'Both sides escalate to HR. Everyone gets a mandatory mediation session, including you.',
            effects: [
              { path: 'job.performance', op: '-', value: 2 },
              { path: 'stats.happiness', op: '-', value: 4 },
            ],
          },
        ],
      },
      {
        label: 'Stay neutral',
        outcomes: [
          {
            weight: 60,
            narrative: 'Both sides try to recruit you. You dodge politely for weeks until the fight burns itself out.',
            effects: [{ path: 'stats.happiness', op: '-', value: 2 }],
          },
          {
            weight: 40,
            narrative: 'Both sides decide you\'re a coward and stop including you in anything. You eat lunch alone for a month.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 5 },
              { path: 'job.performance', op: '-', value: 3 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'career_long_hours',
    category: 'career',
    weight: 0.7,
    minAge: 22,
    maxAge: 60,
    conditions: [{ path: 'job', op: '!=', value: null as unknown as string }],
    title: 'Crunch Time',
    description: 'A deadline is looming. The team is pulling 12-hour days.',
    choices: [
      {
        label: 'Pull all-nighters with the team',
        effects: [
          { path: 'job.performance', op: '+', value: 8 },
          { path: 'stats.health', op: '-', value: 5 },
          { path: 'stats.happiness', op: '-', value: 3 },
        ],
      },
      {
        label: 'Leave at 5pm anyway',
        effects: [
          { path: 'job.performance', op: '-', value: 4 },
          { path: 'stats.happiness', op: '+', value: 2 },
        ],
      },
    ],
  },
  {
    id: 'career_quit_for_career_change',
    category: 'career',
    weight: 0.3,
    minAge: 28,
    maxAge: 50,
    conditions: [{ path: 'job', op: '!=', value: null as unknown as string }],
    title: 'Career Change?',
    description: 'You keep daydreaming about starting over in something completely different.',
    choices: [
      {
        label: 'Quit and figure it out',
        effects: [
          { path: 'stats.happiness', op: '+', value: 8 },
          { path: 'money', op: '-', value: 3000 },
          { special: 'leaveJob' },
        ],
      },
      {
        label: 'Stay put',
        effects: [{ path: 'stats.happiness', op: '-', value: 2 }],
      },
    ],
  },
  {
    id: 'career_unemployed_application',
    category: 'career',
    weight: 1.5,
    minAge: 18,
    maxAge: 65,
    conditions: [{ path: 'job', op: '==', value: null as unknown as string }],
    title: 'Job Search',
    description: 'You\'ve been firing off applications for weeks. One finally got a callback.',
    choices: [
      {
        label: 'Take the interview seriously',
        outcomes: [
          {
            weight: 55,
            narrative: 'You nail every question. They offer you the role on the spot, no haggling.',
            effects: [
              { path: 'stats.happiness', op: '+', value: 5 },
              {
                special: 'setJob',
                payload: {
                  title: 'Customer Service Rep',
                  careerId: 'retail',
                  level: 0,
                  salary: 26000,
                  performance: 65,
                  yearsAtJob: 0,
                },
              },
            ],
          },
          {
            weight: 25,
            narrative: 'They liked you, but went with someone "more experienced." A polite rejection email arrives a week later.',
            effects: [{ path: 'stats.happiness', op: '-', value: 4 }],
          },
          {
            weight: 15,
            narrative: 'You bomb the technical part. You can see it on the interviewer\'s face the moment it happens.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 7 },
              { path: 'stats.smarts', op: '-', value: 1 },
            ],
          },
          {
            weight: 5,
            narrative: 'They ghost you. No email, no call, no closure. You refresh your inbox for a month.',
            effects: [{ path: 'stats.happiness', op: '-', value: 6 }],
          },
        ],
      },
      {
        label: 'Skip it — sounds boring',
        effects: [{ path: 'stats.happiness', op: '-', value: 4 }],
      },
    ],
  },
  {
    id: 'career_retire',
    category: 'career',
    weight: 1.0,
    minAge: 65,
    maxAge: 75,
    oncePerLife: true,
    conditions: [{ path: 'job', op: '!=', value: null as unknown as string }],
    title: 'Retirement',
    description: 'You\'re old enough to stop. The math works out.',
    choices: [
      {
        label: 'Retire',
        effects: [
          { path: 'stats.happiness', op: '+', value: 10 },
          { special: 'leaveJob' },
        ],
      },
      {
        label: 'Keep working',
        effects: [
          { path: 'stats.happiness', op: '-', value: 2 },
          { path: 'money', op: '+', value: 5000 },
        ],
      },
    ],
  },
];
