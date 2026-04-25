import type { GameEvent } from '../../types/events';

export const EDUCATION_EVENTS: GameEvent[] = [
  {
    id: 'edu_high_school_start',
    category: 'education',
    weight: 4.0,
    minAge: 13,
    maxAge: 13,
    oncePerLife: true,
    title: 'High School Starts',
    description: 'Your first day of high school. The hallways feel enormous.',
    choices: [
      {
        label: 'Find the library',
        effects: [
          { path: 'stats.smarts', op: '+', value: 3 },
          {
            special: 'addEducation',
            payload: {
              level: 'high_school',
              institutionName: 'Local High School',
              startYear: 0,
              endYear: null,
              graduated: false,
              gpa: 75,
            },
          },
        ],
      },
      {
        label: 'Find the cafeteria',
        effects: [
          { path: 'stats.happiness', op: '+', value: 3 },
          {
            special: 'addEducation',
            payload: {
              level: 'high_school',
              institutionName: 'Local High School',
              startYear: 0,
              endYear: null,
              graduated: false,
              gpa: 60,
            },
          },
        ],
      },
    ],
  },
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
    id: 'edu_dropout',
    category: 'education',
    weight: 2.5,
    minAge: 16,
    maxAge: 18,
    conditions: [
      { path: 'education', op: 'has', value: 'high_school' },
      { path: 'stats.smarts', op: '<', value: 55 },
    ],
    title: 'Drop Out?',
    description: 'You\'re miserable at school. You could just leave.',
    choices: [
      {
        label: 'Drop out',
        effects: [
          { path: 'stats.happiness', op: '+', value: 5 },
          { path: 'stats.smarts', op: '-', value: 5 },
        ],
      },
      {
        label: 'Stick it out',
        effects: [
          { path: 'stats.happiness', op: '-', value: 2 },
          { path: 'stats.smarts', op: '+', value: 2 },
        ],
      },
    ],
  },
  {
    id: 'edu_graduate_high_school',
    category: 'education',
    weight: 20.0,
    minAge: 18,
    maxAge: 18,
    oncePerLife: true,
    conditions: [{ path: 'education', op: 'has', value: 'high_school' }],
    title: 'Graduation Day',
    description: 'Caps in the air. You made it through high school.',
    choices: [
      {
        label: 'Walk the stage',
        effects: [
          { path: 'stats.happiness', op: '+', value: 10 },
          { special: 'completeEducation', payload: { level: 'high_school' } },
        ],
      },
    ],
  },
  {
    id: 'edu_university_apply',
    category: 'education',
    weight: 3.0,
    minAge: 18,
    maxAge: 19,
    oncePerLife: true,
    conditions: [
      { path: 'stats.smarts', op: '>=', value: 60 },
      { path: 'education', op: 'has', value: 'high_school' },
    ],
    title: 'University Acceptance',
    description: 'A university accepted you. Tuition is steep, but it\'s a real opportunity.',
    choices: [
      {
        label: 'Accept and enroll',
        cost: -8000,
        effects: [
          { path: 'money', op: '-', value: 8000 },
          {
            special: 'addEducation',
            payload: {
              level: 'university',
              institutionName: 'State University',
              startYear: 0,
              endYear: null,
              graduated: false,
              gpa: 70,
            },
          },
        ],
      },
      {
        label: 'Skip it, save the money',
        outcomes: [
          {
            weight: 50,
            narrative: 'You start working instead. The money is nice, even if everyone you graduated with is now talking about majors.',
            effects: [
              { path: 'money', op: '+', value: 2000 },
              { path: 'stats.happiness', op: '+', value: 1 },
            ],
          },
          {
            weight: 35,
            narrative: 'You spend the year drifting between part-time jobs. Your parents are unimpressed and the money is gone by spring.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 5 },
            ],
          },
          {
            weight: 15,
            narrative: 'You teach yourself a trade online. Within a year you\'re billing more than most of your classmates ever will.',
            effects: [
              { path: 'money', op: '+', value: 6000 },
              { path: 'stats.smarts', op: '+', value: 4 },
              { path: 'stats.happiness', op: '+', value: 5 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'edu_uni_party_phase',
    category: 'education',
    weight: 0.7,
    minAge: 19,
    maxAge: 22,
    conditions: [{ path: 'education', op: 'has', value: 'university' }],
    title: 'College Bender',
    description: 'It\'s Thursday. Someone\'s parents are out of town. The dorm is a war zone.',
    choices: [
      {
        label: 'Embrace the chaos',
        outcomes: [
          {
            weight: 50,
            narrative: 'You wake up in a stranger\'s laundry room with a story you\'ll tell for the next decade. Worth it.',
            effects: [
              { path: 'stats.happiness', op: '+', value: 8 },
              { path: 'stats.health', op: '-', value: 4 },
              { path: 'stats.smarts', op: '-', value: 2 },
            ],
          },
          {
            weight: 30,
            narrative: 'You drink something blue out of a punch bowl. Your roommate finds you on the bathroom tile at 4am.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 2 },
              { path: 'stats.health', op: '-', value: 8 },
              { path: 'stats.smarts', op: '-', value: 3 },
            ],
          },
          {
            weight: 15,
            narrative: 'Campus security shuts it down. You spend the rest of the night writing an essay on personal accountability.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 4 },
              { path: 'stats.smarts', op: '-', value: 1 },
            ],
          },
          {
            weight: 5,
            narrative: 'Someone calls 911. You don\'t remember what happened. The university calls your parents.',
            effects: [
              { path: 'stats.health', op: '-', value: 12 },
              { path: 'stats.happiness', op: '-', value: 8 },
              { path: 'money', op: '-', value: 1500 },
            ],
          },
        ],
      },
      {
        label: 'Quietly study',
        outcomes: [
          {
            weight: 65,
            narrative: 'You finish the assignment by midnight. The dorm is loud, but you got what you came for.',
            effects: [{ path: 'stats.smarts', op: '+', value: 5 }],
          },
          {
            weight: 35,
            narrative: 'You stare at the textbook for three hours and absorb nothing. The bass through the wall wins.',
            effects: [
              { path: 'stats.smarts', op: '+', value: 1 },
              { path: 'stats.happiness', op: '-', value: 2 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'edu_uni_graduate',
    category: 'education',
    weight: 20.0,
    minAge: 22,
    maxAge: 22,
    oncePerLife: true,
    conditions: [{ path: 'education', op: 'has', value: 'university' }],
    title: 'University Graduation',
    description: 'You walk across the stage with a degree and a vague sense of dread about the job market.',
    choices: [
      {
        label: 'Celebrate',
        effects: [
          { path: 'stats.happiness', op: '+', value: 12 },
          { special: 'completeEducation', payload: { level: 'university' } },
        ],
      },
    ],
  },
  {
    id: 'edu_grad_school',
    category: 'education',
    weight: 0.6,
    minAge: 22,
    maxAge: 24,
    oncePerLife: true,
    conditions: [
      { path: 'stats.smarts', op: '>=', value: 75 },
      { path: 'education', op: 'has', value: 'university' },
    ],
    title: 'Apply to Grad School?',
    description: 'You could go for a graduate degree. It would take years and cost serious money.',
    choices: [
      {
        label: 'Apply',
        cost: -15000,
        effects: [
          { path: 'money', op: '-', value: 15000 },
          {
            special: 'addEducation',
            payload: {
              level: 'graduate',
              institutionName: 'State University Graduate Program',
              startYear: 0,
              endYear: null,
              graduated: false,
              gpa: 80,
            },
          },
        ],
      },
      {
        label: 'Get a job instead',
        effects: [{ path: 'stats.happiness', op: '+', value: 3 }],
      },
    ],
  },
  {
    id: 'edu_grad_school_complete',
    category: 'education',
    // Wide window + high weight: the previous (26-only, weight 12) version
    // missed roughly a third of grad students because the event-selector
    // rolls 30% quiet years and the 1-year window had no fallback. With
    // five years and a dominant weight, a grad student almost always sees
    // their own graduation. `oncePerLife` still prevents re-firing.
    weight: 30.0,
    minAge: 26,
    maxAge: 30,
    oncePerLife: true,
    conditions: [
      { path: 'education', op: 'has', value: 'graduate' },
    ],
    title: 'Graduate Degree Complete',
    description: 'Your defense is over. You\'re officially an expert in something almost no one else cares about.',
    choices: [
      {
        label: 'Take a deep breath',
        effects: [
          { path: 'stats.happiness', op: '+', value: 8 },
          { path: 'stats.smarts', op: '+', value: 5 },
          { special: 'completeEducation', payload: { level: 'graduate' } },
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
