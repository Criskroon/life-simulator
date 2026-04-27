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
    // Pressure event, not a proposal: it surfaces the thought, and the
    // player decides what to do with it. The actual proposal lives on
    // `partner.propose` (X3a-2) so it stays a deliberate, profile-driven
    // action — not a random roll that auto-promotes someone to spouse.
    conditions: [
      { path: 'relationships', op: 'has', value: 'partner' },
      { path: 'relationships', op: 'lacks', value: 'spouse' },
    ],
    title: 'Propose?',
    description: 'You\'ve been together a while. The thought won\'t go away.',
    choices: [
      {
        label: 'Bring it up over dinner',
        effects: [
          { path: 'stats.happiness', op: '+', value: 5 },
          { special: 'adjustRelationshipLevel', payload: { slot: 'partner', delta: 6 } },
        ],
      },
      {
        label: 'Tell them you\'re not ready',
        effects: [
          { path: 'stats.happiness', op: '-', value: 6 },
          { special: 'adjustRelationshipLevel', payload: { slot: 'partner', delta: -8 } },
        ],
      },
      {
        label: 'Change the subject',
        effects: [
          { path: 'stats.happiness', op: '-', value: 2 },
          { special: 'adjustRelationshipLevel', payload: { slot: 'partner', delta: -2 } },
        ],
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
    // Soft pressure event — partner hints, no auto-promotion. The actual
    // engagement still has to come from `partner.propose` (X3a-2). Keeps
    // the engagement decision deliberate instead of a random outcome roll.
    conditions: [
      { path: 'relationships', op: 'has', value: 'partner' },
      { path: 'relationships', op: 'lacks', value: 'spouse' },
    ],
    title: 'They\'re Hinting',
    description: 'They\'ve started leaving wedding magazines on the coffee table. The look is getting harder to miss.',
    choices: [
      {
        label: 'Tell them you feel the same',
        effects: [
          { path: 'stats.happiness', op: '+', value: 6 },
          { special: 'adjustRelationshipLevel', payload: { slot: 'partner', delta: 8 } },
        ],
      },
      {
        label: 'Ask for time',
        effects: [
          { path: 'stats.happiness', op: '-', value: 3 },
          { special: 'adjustRelationshipLevel', payload: { slot: 'partner', delta: -4 } },
        ],
      },
      {
        label: 'Tell them it\'s not going to happen',
        effects: [
          { path: 'stats.happiness', op: '-', value: 8 },
          { special: 'adjustRelationshipLevel', payload: { slot: 'partner', delta: -15 } },
        ],
      },
    ],
  },
  // ===================================================================
  // SESSION A1 — Partner & Fiance content
  // ===================================================================
  // Twelve events that fill the gap audited in
  // docs/audits/relationship-depth-audit-2026-04-26.md: partner and fiance
  // slots had ~0.07 touches per year of existence with no fiance content
  // at all. Six partner-touch events, three fiance-touch events, three
  // breakup paths that don't require divorce.
  //
  // All depend on `relationshipState.partner.yearsTogether` /
  // `relationshipState.fiance.yearsTogether`, refreshed by
  // decayRelationships() each tick. The fiance counter is reset to 0 on
  // engagement so engaged-time is measured from the proposal, not from
  // the first date.
  // ===================================================================

  // -------------------------------------------------------------------
  // Partner events (6) — gates: has 'partner', lacks 'fiance'/'spouse'
  // -------------------------------------------------------------------
  {
    id: 'rel_partner_move_in_together',
    category: 'relationships',
    weight: 0.5,
    minAge: 18,
    maxAge: 60,
    oncePerLife: true,
    conditions: [
      { path: 'relationships', op: 'has', value: 'partner' },
      { path: 'relationships', op: 'lacks', value: 'fiance' },
      { path: 'relationships', op: 'lacks', value: 'spouse' },
      { path: 'relationshipState.partner.yearsTogether', op: '>=', value: 1 },
    ],
    title: 'Move In Together?',
    description: 'A year in. The "your place or mine" question is starting to feel like a chore.',
    choices: [
      {
        label: 'Move in together',
        cost: -3000,
        outcomes: [
          {
            weight: 60,
            narrative: 'You sign a lease together. The first month is a steep learning curve about whose dishes go in which cupboard. You find your rhythm.',
            effects: [
              { path: 'money', op: '-', value: 3000 },
              { path: 'stats.happiness', op: '+', value: 7 },
            ],
          },
          {
            weight: 25,
            narrative: 'It is fine. The honeymoon glow burns off in three weeks and you discover they leave wet towels on the bed.',
            effects: [
              { path: 'money', op: '-', value: 3000 },
              { path: 'stats.happiness', op: '+', value: 2 },
            ],
          },
          {
            weight: 15,
            narrative: 'Living together exposes everything proximity used to hide. You start sleeping in the spare room within four months.',
            effects: [
              { path: 'money', op: '-', value: 3000 },
              { path: 'stats.happiness', op: '-', value: 8 },
            ],
          },
        ],
      },
      {
        label: 'Stay separate for now',
        outcomes: [
          {
            weight: 60,
            narrative: '"No rush," they say. You both pretend it didn\'t bruise anything.',
            effects: [{ path: 'stats.happiness', op: '-', value: 2 }],
          },
          {
            weight: 40,
            narrative: 'They are visibly hurt. The next few weeks are quieter than they should be.',
            effects: [{ path: 'stats.happiness', op: '-', value: 5 }],
          },
        ],
      },
      {
        label: 'Suggest waiting another year',
        outcomes: [
          {
            weight: 70,
            narrative: 'They agree. You promise to revisit it. Both of you mean it.',
            effects: [{ path: 'stats.happiness', op: '+', value: 1 }],
          },
          {
            weight: 30,
            narrative: 'They smile and say sure. Two months later they tell you they want different things. You spend the rest of the year processing it.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 12 },
              { special: 'breakUpPartner' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'rel_partner_first_vacation',
    category: 'relationships',
    weight: 0.4,
    minAge: 18,
    maxAge: 65,
    oncePerLife: true,
    conditions: [
      { path: 'relationships', op: 'has', value: 'partner' },
      { path: 'relationships', op: 'lacks', value: 'spouse' },
    ],
    title: 'First Trip Together',
    description: 'You\'ve never traveled together. Someone brings it up over dinner.',
    choices: [
      {
        label: 'Plan a romantic getaway',
        cost: -2500,
        outcomes: [
          {
            weight: 65,
            narrative: 'A week somewhere with sunsets and slow mornings. You come back closer than you left.',
            effects: [
              { path: 'money', op: '-', value: 2500 },
              { path: 'stats.happiness', op: '+', value: 12 },
            ],
          },
          {
            weight: 25,
            narrative: 'The trip is good. The fight on day five about the rental car is bad. You both forget about it by the time you land.',
            effects: [
              { path: 'money', op: '-', value: 2500 },
              { path: 'stats.happiness', op: '+', value: 5 },
            ],
          },
          {
            weight: 10,
            narrative: 'Seven days in close quarters reveals something neither of you wanted to know. The flight home is silent.',
            effects: [
              { path: 'money', op: '-', value: 2500 },
              { path: 'stats.happiness', op: '-', value: 9 },
            ],
          },
        ],
      },
      {
        label: 'Suggest something budget-friendly',
        cost: -600,
        outcomes: [
          {
            weight: 55,
            narrative: 'A long weekend at a cabin. Cheap and good. You spend most of it indoors anyway.',
            effects: [
              { path: 'money', op: '-', value: 600 },
              { path: 'stats.happiness', op: '+', value: 6 },
            ],
          },
          {
            weight: 30,
            narrative: 'The motel is grim. The "nature view" is a parking lot. You laugh about it for years.',
            effects: [
              { path: 'money', op: '-', value: 600 },
              { path: 'stats.happiness', op: '+', value: 3 },
            ],
          },
          {
            weight: 15,
            narrative: 'They wanted the nice version. You can feel the disappointment from the passenger seat the whole drive.',
            effects: [
              { path: 'money', op: '-', value: 600 },
              { path: 'stats.happiness', op: '-', value: 4 },
            ],
          },
        ],
      },
      {
        label: 'Skip the vacation idea',
        outcomes: [
          {
            weight: 50,
            narrative: 'They drop it. Something small in them quietly recalibrates.',
            effects: [{ path: 'stats.happiness', op: '-', value: 3 }],
          },
          {
            weight: 50,
            narrative: 'They stop suggesting trips. You notice, eventually.',
            effects: [{ path: 'stats.happiness', op: '-', value: 5 }],
          },
        ],
      },
    ],
  },
  {
    id: 'rel_partner_meet_family',
    category: 'relationships',
    weight: 0.5,
    minAge: 18,
    maxAge: 60,
    oncePerLife: true,
    conditions: [
      { path: 'relationships', op: 'has', value: 'partner' },
      { path: 'relationships', op: 'lacks', value: 'spouse' },
      { path: 'relationshipState.partner.yearsTogether', op: '>=', value: 2 },
    ],
    title: 'Meet the Family',
    description: 'They want you to meet their parents. Or yours want to meet them. Either way, the table is being set.',
    choices: [
      {
        label: 'Take the leap',
        outcomes: [
          {
            weight: 45,
            narrative: 'It goes well. Awkward in the first ten minutes, fine after that. Someone takes a photo.',
            effects: [{ path: 'stats.happiness', op: '+', value: 6 }],
          },
          {
            weight: 30,
            narrative: 'Polite, careful, no disasters. Everyone leaves with the impression that everyone tried.',
            effects: [{ path: 'stats.happiness', op: '+', value: 2 }],
          },
          {
            weight: 15,
            narrative: 'Real warmth — by dessert, your parents are telling embarrassing stories and your partner is laughing along. Something settles.',
            effects: [
              { path: 'stats.happiness', op: '+', value: 9 },
              { path: 'stats.smarts', op: '+', value: 1 },
            ],
          },
          {
            weight: 10,
            narrative: 'It is a quiet catastrophe. A comment about politics, then a comment about their family, then dessert is skipped. You drive home not speaking.',
            effects: [{ path: 'stats.happiness', op: '-', value: 8 }],
          },
        ],
      },
      {
        label: 'Suggest waiting a bit longer',
        outcomes: [
          {
            weight: 60,
            narrative: 'They say "okay" in the tone people use when it isn\'t okay.',
            effects: [{ path: 'stats.happiness', op: '-', value: 3 }],
          },
          {
            weight: 40,
            narrative: 'They take it in stride. You schedule it for next year and both forget by spring.',
            effects: [{ path: 'stats.happiness', op: '-', value: 1 }],
          },
        ],
      },
      {
        label: 'Avoid the topic',
        outcomes: [
          {
            weight: 55,
            narrative: 'It hangs in the air for a few months. Eventually something else takes its place.',
            effects: [{ path: 'stats.happiness', op: '-', value: 4 }],
          },
          {
            weight: 45,
            narrative: 'They notice. They start to wonder which side of the secret they\'re on.',
            effects: [{ path: 'stats.happiness', op: '-', value: 7 }],
          },
        ],
      },
    ],
  },
  {
    id: 'rel_partner_argument_money',
    category: 'relationships',
    weight: 0.3,
    minAge: 18,
    maxAge: 65,
    conditions: [
      { path: 'relationships', op: 'has', value: 'partner' },
      { path: 'relationships', op: 'lacks', value: 'spouse' },
    ],
    title: 'A Fight About Money',
    description: 'A small disagreement about a purchase becomes a much larger conversation about everything.',
    choices: [
      {
        label: 'Stand your ground',
        outcomes: [
          {
            weight: 50,
            narrative: 'Neither of you backs down. The argument lasts the weekend and changes nothing except how you talk about money for the next year.',
            effects: [{ path: 'stats.happiness', op: '-', value: 6 }],
          },
          {
            weight: 30,
            narrative: 'They eventually concede. It feels like winning until you notice they stop bringing things up at all.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 3 },
              { path: 'stats.smarts', op: '+', value: 1 },
            ],
          },
          {
            weight: 20,
            narrative: 'You make a point so cleanly that they actually stop and think about it. Something resets.',
            effects: [{ path: 'stats.happiness', op: '+', value: 3 }],
          },
        ],
      },
      {
        label: 'Compromise',
        outcomes: [
          {
            weight: 70,
            narrative: 'You meet in the middle. Not satisfying, exactly, but functional.',
            effects: [{ path: 'stats.happiness', op: '+', value: 2 }],
          },
          {
            weight: 30,
            narrative: 'The compromise sticks. Months later you both reference it as "the time we figured something out."',
            effects: [{ path: 'stats.happiness', op: '+', value: 5 }],
          },
        ],
      },
      {
        label: 'Apologize and let it go',
        outcomes: [
          {
            weight: 60,
            narrative: 'The fight ends. You spend the next few days quietly aware that you didn\'t mean the apology.',
            effects: [{ path: 'stats.happiness', op: '+', value: 1 }],
          },
          {
            weight: 40,
            narrative: 'It works in the moment. Something small in you gives a little ground that you don\'t fully get back.',
            effects: [
              { path: 'stats.happiness', op: '+', value: 2 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'rel_partner_proposal_pressure',
    category: 'relationships',
    weight: 0.5,
    minAge: 22,
    maxAge: 50,
    conditions: [
      { path: 'relationships', op: 'has', value: 'partner' },
      { path: 'relationships', op: 'lacks', value: 'fiance' },
      { path: 'relationships', op: 'lacks', value: 'spouse' },
      { path: 'relationshipState.partner.yearsTogether', op: '>=', value: 3 },
    ],
    title: '"Where Is This Going?"',
    description: 'They\'ve started talking about weddings in the abstract. You can hear the question underneath.',
    choices: [
      {
        label: 'Pop the question',
        cost: -4500,
        outcomes: [
          {
            weight: 75,
            narrative: 'They say yes through tears and a half-laugh. You forget half of what you planned to say. You are engaged.',
            effects: [
              { path: 'money', op: '-', value: 4500 },
              { path: 'stats.happiness', op: '+', value: 14 },
              {
                special: 'addFiance',
                payload: { id: 'rel-fiance-from-partner', relationshipLevel: 88 },
              },
            ],
          },
          {
            weight: 20,
            narrative: 'They say yes, then start crying for a different reason than you expected. You spend the next hour reassuring each other. The ring is on, though.',
            effects: [
              { path: 'money', op: '-', value: 4500 },
              { path: 'stats.happiness', op: '+', value: 8 },
              {
                special: 'addFiance',
                payload: { id: 'rel-fiance-from-partner', relationshipLevel: 75 },
              },
            ],
          },
          {
            weight: 5,
            narrative: 'They say no. Not maybe — no. The ring goes back in the box and the relationship limps along for another month before ending.',
            effects: [
              { path: 'money', op: '-', value: 4500 },
              { path: 'stats.happiness', op: '-', value: 18 },
              { special: 'breakUpPartner' },
            ],
          },
        ],
      },
      {
        label: 'Tell them you\'re not ready',
        outcomes: [
          {
            weight: 50,
            narrative: 'They take it in. "Okay," they say. They mean it, mostly. Things are slightly different after.',
            effects: [{ path: 'stats.happiness', op: '-', value: 4 }],
          },
          {
            weight: 35,
            narrative: 'They\'re hurt and don\'t hide it. The conversation ends in different rooms.',
            effects: [{ path: 'stats.happiness', op: '-', value: 8 }],
          },
          {
            weight: 15,
            narrative: 'They thank you for being honest. You spend the night talking about what you both actually want. You don\'t agree on everything, but you\'re still in the same room in the morning.',
            effects: [
              { path: 'stats.happiness', op: '+', value: 2 },
              { path: 'stats.smarts', op: '+', value: 1 },
            ],
          },
        ],
      },
      {
        label: 'Change the subject',
        outcomes: [
          {
            weight: 60,
            narrative: 'They let you. The subject comes back two months later, harder.',
            effects: [{ path: 'stats.happiness', op: '-', value: 3 }],
          },
          {
            weight: 40,
            narrative: 'They notice. They start counting the times you do it.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 6 },
              { path: 'stats.smarts', op: '-', value: 1 },
            ],
          },
        ],
      },
      {
        label: 'Break up — this isn\'t what they want from you',
        effects: [
          { path: 'stats.happiness', op: '-', value: 10 },
          { special: 'breakUpPartner' },
        ],
      },
    ],
  },
  {
    id: 'rel_partner_long_term_commitment',
    category: 'relationships',
    weight: 0.4,
    minAge: 25,
    maxAge: 70,
    conditions: [
      { path: 'relationships', op: 'has', value: 'partner' },
      { path: 'relationships', op: 'lacks', value: 'fiance' },
      { path: 'relationships', op: 'lacks', value: 'spouse' },
      { path: 'relationshipState.partner.yearsTogether', op: '>=', value: 7 },
    ],
    title: 'Seven-Year Question',
    description: 'You\'ve been together long enough that people stopped asking when you\'d get married. Tonight, on the couch, the question shows up unprompted.',
    choices: [
      {
        label: 'Have the talk: are we okay like this?',
        outcomes: [
          {
            weight: 45,
            narrative: 'You both say yes. You mean it. Something quiet and good locks into place.',
            effects: [
              { path: 'stats.happiness', op: '+', value: 8 },
              { path: 'stats.smarts', op: '+', value: 1 },
            ],
          },
          {
            weight: 30,
            narrative: 'You discover you don\'t agree. One of you wants the paper. One of you doesn\'t. The conversation doesn\'t resolve.',
            effects: [{ path: 'stats.happiness', op: '-', value: 6 }],
          },
          {
            weight: 15,
            narrative: 'They tell you they\'ve been waiting for you to bring this up for years. The next morning you start looking at rings.',
            effects: [
              { path: 'stats.happiness', op: '+', value: 6 },
              {
                special: 'addFiance',
                payload: { id: 'rel-fiance-from-partner', relationshipLevel: 85 },
              },
            ],
          },
          {
            weight: 10,
            narrative: 'It turns out you\'ve been holding very different versions of this relationship in your head. The talk lasts three days and ends.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 14 },
              { special: 'breakUpPartner' },
            ],
          },
        ],
      },
      {
        label: 'Just keep going as we are',
        outcomes: [
          {
            weight: 70,
            narrative: 'Years pass. Neither of you brings it up again. It works.',
            effects: [{ path: 'stats.happiness', op: '+', value: 2 }],
          },
          {
            weight: 30,
            narrative: 'It works for a while. You wonder, sometimes, what either of you is actually waiting for.',
            effects: [{ path: 'stats.happiness', op: '-', value: 2 }],
          },
        ],
      },
      {
        label: 'Break up — this isn\'t going anywhere',
        effects: [
          { path: 'stats.happiness', op: '-', value: 12 },
          { special: 'breakUpPartner' },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------
  // Fiance events (3) — gates: has 'fiance'
  // -------------------------------------------------------------------
  {
    id: 'rel_fiance_planning_wedding',
    category: 'relationships',
    weight: 0.6,
    minAge: 22,
    maxAge: 60,
    conditions: [
      { path: 'relationships', op: 'has', value: 'fiance' },
      { path: 'relationshipState.fiance.yearsTogether', op: '>=', value: 1 },
    ],
    title: 'Planning the Wedding',
    description: 'The engagement is real. The wedding is now a thing with a budget and a date and an opinion from everyone you know.',
    choices: [
      {
        label: 'Big traditional wedding',
        cost: -25000,
        outcomes: [
          {
            weight: 60,
            narrative: 'A long day of the people you love being slightly too warm in formal clothes. You marry the person you wanted to marry. Worth it.',
            effects: [
              { path: 'money', op: '-', value: 25000 },
              { path: 'stats.happiness', op: '+', value: 18 },
              {
                special: 'addSpouse',
                payload: { id: 'rel-fiance-from-partner', relationshipLevel: 92 },
              },
            ],
          },
          {
            weight: 25,
            narrative: 'It rains. The cake is wrong. Your aunt cries for the wrong reason. You are still married by the end of it.',
            effects: [
              { path: 'money', op: '-', value: 25000 },
              { path: 'stats.happiness', op: '+', value: 10 },
              {
                special: 'addSpouse',
                payload: { id: 'rel-fiance-from-partner', relationshipLevel: 80 },
              },
            ],
          },
          {
            weight: 15,
            narrative: 'You realize at the rehearsal dinner you\'re marrying them for the wedding more than for them. You go through with it anyway.',
            effects: [
              { path: 'money', op: '-', value: 25000 },
              { path: 'stats.happiness', op: '+', value: 4 },
              {
                special: 'addSpouse',
                payload: { id: 'rel-fiance-from-partner', relationshipLevel: 68 },
              },
            ],
          },
        ],
      },
      {
        label: 'Small intimate ceremony',
        cost: -4000,
        outcomes: [
          {
            weight: 70,
            narrative: 'Twenty people in a room. Your best friend reads something they wrote. You both cry without trying to.',
            effects: [
              { path: 'money', op: '-', value: 4000 },
              { path: 'stats.happiness', op: '+', value: 14 },
              {
                special: 'addSpouse',
                payload: { id: 'rel-fiance-from-partner', relationshipLevel: 90 },
              },
            ],
          },
          {
            weight: 30,
            narrative: 'Quiet. A bit awkward. You spend the night at a hotel and wake up married, which still feels a little strange.',
            effects: [
              { path: 'money', op: '-', value: 4000 },
              { path: 'stats.happiness', op: '+', value: 9 },
              {
                special: 'addSpouse',
                payload: { id: 'rel-fiance-from-partner', relationshipLevel: 82 },
              },
            ],
          },
        ],
      },
      {
        label: 'Elope',
        cost: -800,
        outcomes: [
          {
            weight: 55,
            narrative: 'A courthouse, a witness from the queue behind you, a dinner that costs more than the ceremony. You drive home married and laughing.',
            effects: [
              { path: 'money', op: '-', value: 800 },
              { path: 'stats.happiness', op: '+', value: 12 },
              {
                special: 'addSpouse',
                payload: { id: 'rel-fiance-from-partner', relationshipLevel: 88 },
              },
            ],
          },
          {
            weight: 30,
            narrative: 'It\'s done in twenty minutes. Both of your families find out by text. Your mother does not respond for a week.',
            effects: [
              { path: 'money', op: '-', value: 800 },
              { path: 'stats.happiness', op: '+', value: 6 },
              {
                special: 'addSpouse',
                payload: { id: 'rel-fiance-from-partner', relationshipLevel: 78 },
              },
            ],
          },
          {
            weight: 15,
            narrative: 'The next morning one of you wonders out loud whether that counts. Neither of you says yes immediately.',
            effects: [
              { path: 'money', op: '-', value: 800 },
              { path: 'stats.happiness', op: '+', value: 2 },
              {
                special: 'addSpouse',
                payload: { id: 'rel-fiance-from-partner', relationshipLevel: 65 },
              },
            ],
          },
        ],
      },
      {
        label: 'Postpone the wedding',
        outcomes: [
          {
            weight: 50,
            narrative: 'They take it. "When you\'re ready," they say. They mean it less every time you say it.',
            effects: [{ path: 'stats.happiness', op: '-', value: 5 }],
          },
          {
            weight: 50,
            narrative: 'They are not okay with it. They don\'t leave, but something in the room cools.',
            effects: [{ path: 'stats.happiness', op: '-', value: 8 }],
          },
        ],
      },
    ],
  },
  {
    id: 'rel_fiance_cold_feet',
    category: 'relationships',
    weight: 0.4,
    minAge: 22,
    maxAge: 60,
    conditions: [
      { path: 'relationships', op: 'has', value: 'fiance' },
      { path: 'relationshipState.fiance.yearsTogether', op: '>=', value: 2 },
    ],
    title: 'Cold Feet',
    description: 'You wake up in the middle of the night and the doubt has a shape now. You don\'t know if you can do this.',
    choices: [
      {
        label: 'Push through your doubts',
        outcomes: [
          {
            weight: 60,
            narrative: 'You go through with it. The doubts dissolve, mostly. You marry them.',
            effects: [
              { path: 'stats.happiness', op: '+', value: 8 },
              {
                special: 'addSpouse',
                payload: { id: 'rel-fiance-from-partner', relationshipLevel: 80 },
              },
            ],
          },
          {
            weight: 25,
            narrative: 'You marry them. The doubts don\'t fully leave. They live somewhere quiet inside you for years.',
            effects: [
              { path: 'stats.happiness', op: '+', value: 2 },
              {
                special: 'addSpouse',
                payload: { id: 'rel-fiance-from-partner', relationshipLevel: 65 },
              },
            ],
          },
          {
            weight: 15,
            narrative: 'You marry them. By the second anniversary you know you made a mistake. You don\'t do anything about it yet.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 6 },
              {
                special: 'addSpouse',
                payload: { id: 'rel-fiance-from-partner', relationshipLevel: 55 },
              },
            ],
          },
        ],
      },
      {
        label: 'Talk to them about your feelings',
        outcomes: [
          {
            weight: 40,
            narrative: 'They listen. They\'ve been having the same thoughts. The conversation lasts the night and you both come out closer than you went in.',
            effects: [
              { path: 'stats.happiness', op: '+', value: 7 },
              { path: 'stats.smarts', op: '+', value: 1 },
            ],
          },
          {
            weight: 30,
            narrative: 'They take it badly. The next two weeks are tense. The engagement holds, but barely.',
            effects: [{ path: 'stats.happiness', op: '-', value: 6 }],
          },
          {
            weight: 20,
            narrative: 'They thank you for the honesty and ask for time. You give it. They come back ready, and so do you.',
            effects: [{ path: 'stats.happiness', op: '+', value: 4 }],
          },
          {
            weight: 10,
            narrative: 'You both realize, mid-conversation, that you\'ve been avoiding this for months. The engagement ends that night.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 14 },
              { special: 'endEngagement' },
            ],
          },
        ],
      },
      {
        label: 'Cancel the engagement',
        effects: [
          { path: 'stats.happiness', op: '-', value: 12 },
          { special: 'endEngagement' },
        ],
      },
      {
        label: 'Indefinitely postpone',
        outcomes: [
          {
            weight: 60,
            narrative: 'You stay engaged. The wedding becomes a thing you talk about less and less.',
            effects: [{ path: 'stats.happiness', op: '-', value: 4 }],
          },
          {
            weight: 40,
            narrative: 'Months later they ask, gently, what you\'re actually waiting for. You don\'t have an answer.',
            effects: [{ path: 'stats.happiness', op: '-', value: 7 }],
          },
        ],
      },
    ],
  },
  {
    id: 'rel_fiance_family_drama',
    category: 'relationships',
    weight: 0.4,
    minAge: 22,
    maxAge: 60,
    conditions: [
      { path: 'relationships', op: 'has', value: 'fiance' },
      { path: 'relationships', op: 'has', value: 'mother' },
    ],
    title: 'Your Family Has Opinions',
    description: 'Your mother sits you down. She has things to say about the person you\'re marrying.',
    choices: [
      {
        label: 'Defend your fiance',
        outcomes: [
          {
            weight: 50,
            narrative: 'You hold the line. Your mother backs off, eventually. Things are quieter at family dinners for a year.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 3 },
              { path: 'stats.smarts', op: '+', value: 1 },
            ],
          },
          {
            weight: 30,
            narrative: 'It escalates into the kind of fight where someone leaves the room. Your fiance hears about it and is touched. Your mother stops calling.',
            effects: [{ path: 'stats.happiness', op: '-', value: 7 }],
          },
          {
            weight: 20,
            narrative: 'You say something so clearly that even your mother stops to think about it. The temperature in the room drops by ten degrees and never quite recovers.',
            effects: [{ path: 'stats.happiness', op: '+', value: 2 }],
          },
        ],
      },
      {
        label: 'Listen to your family',
        outcomes: [
          {
            weight: 50,
            narrative: 'You let the doubt in. It sits there for weeks, coloring everything. You start noticing things you used to overlook.',
            effects: [{ path: 'stats.happiness', op: '-', value: 6 }],
          },
          {
            weight: 30,
            narrative: 'You decide they have a point. The next conversation with your fiance is harder than usual.',
            effects: [{ path: 'stats.happiness', op: '-', value: 4 }],
          },
          {
            weight: 20,
            narrative: 'The doubt grows until you can\'t ignore it. You break it off a few weeks later.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 16 },
              { special: 'endEngagement' },
            ],
          },
        ],
      },
      {
        label: 'Try to mediate',
        outcomes: [
          {
            weight: 45,
            narrative: 'You arrange a coffee. It\'s polite. Nobody convinces anybody, but the temperature is lower after.',
            effects: [{ path: 'stats.happiness', op: '+', value: 2 }],
          },
          {
            weight: 35,
            narrative: 'It backfires. Both sides leave more entrenched than they arrived. You spend the rest of the year managing two parallel relationships that don\'t want to coexist.',
            effects: [{ path: 'stats.happiness', op: '-', value: 6 }],
          },
          {
            weight: 20,
            narrative: 'A miracle: someone laughs at the right moment, and the room turns. You leave thinking maybe this will be fine.',
            effects: [{ path: 'stats.happiness', op: '+', value: 6 }],
          },
        ],
      },
      {
        label: 'Hide the conflict from your fiance',
        outcomes: [
          {
            weight: 60,
            narrative: 'It works for now. You wait for the day they find out.',
            effects: [{ path: 'stats.happiness', op: '-', value: 4 }],
          },
          {
            weight: 40,
            narrative: 'They find out from someone at the wedding rehearsal. The conversation in the parking lot afterward is the worst of your engagement.',
            effects: [{ path: 'stats.happiness', op: '-', value: 9 }],
          },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------
  // Breakup events (3) — partner crisis, fiance called off, cheating
  // -------------------------------------------------------------------
  {
    id: 'rel_partner_breakup_crisis',
    category: 'relationships',
    weight: 0.3,
    minAge: 18,
    maxAge: 70,
    conditions: [
      { path: 'relationships', op: 'has', value: 'partner' },
      { path: 'relationships', op: 'lacks', value: 'spouse' },
    ],
    title: 'A Bad Stretch',
    description: 'Something has been off for weeks. Tonight it surfaces in a fight that doesn\'t end clean.',
    choices: [
      {
        label: 'Try to work it out',
        outcomes: [
          {
            weight: 45,
            narrative: 'You both put in the work. It takes months. You come out of it knowing each other better than before.',
            effects: [
              { path: 'stats.happiness', op: '+', value: 5 },
              { path: 'stats.smarts', op: '+', value: 1 },
            ],
          },
          {
            weight: 35,
            narrative: 'You patch it. The patch holds for now. Neither of you fully trusts it.',
            effects: [{ path: 'stats.happiness', op: '-', value: 2 }],
          },
          {
            weight: 20,
            narrative: 'You try, you really do. It doesn\'t take. Six weeks later, one of you ends it.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 12 },
              { special: 'breakUpPartner' },
            ],
          },
        ],
      },
      {
        label: 'End the relationship',
        outcomes: [
          {
            weight: 70,
            narrative: 'A short, awful conversation. You sleep on the couch for a week. Then you stop sleeping on the couch.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 10 },
              { special: 'breakUpPartner' },
            ],
          },
          {
            weight: 30,
            narrative: 'You expected it to be harder. The relief surprises you for weeks.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 4 },
              { special: 'breakUpPartner' },
            ],
          },
        ],
      },
      {
        label: 'Take a break',
        outcomes: [
          {
            weight: 40,
            narrative: 'A month apart. You both miss each other. You come back together steadier than before.',
            effects: [
              { path: 'stats.happiness', op: '+', value: 3 },
            ],
          },
          {
            weight: 35,
            narrative: 'The break stretches into months. Neither of you reaches out. Eventually, by silence, it\'s over.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 8 },
              { special: 'breakUpPartner' },
            ],
          },
          {
            weight: 25,
            narrative: 'A few weeks apart and you both realize it was burnout, not a real problem. You come back closer.',
            effects: [{ path: 'stats.happiness', op: '+', value: 6 }],
          },
        ],
      },
    ],
  },
  {
    id: 'rel_fiance_called_off',
    category: 'relationships',
    weight: 0.3,
    minAge: 22,
    maxAge: 60,
    conditions: [
      { path: 'relationships', op: 'has', value: 'fiance' },
    ],
    title: 'Should We Call This Off?',
    description: 'A friend asks, gently, if you\'re sure about the wedding. The fact that you can\'t answer is its own answer.',
    choices: [
      {
        label: 'Cancel the engagement',
        outcomes: [
          {
            weight: 70,
            narrative: 'You break it to them in a quiet conversation. They don\'t fight it. The grief comes in waves for months.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 14 },
              { special: 'endEngagement' },
            ],
          },
          {
            weight: 30,
            narrative: 'They take it badly. There are things said in the kitchen you both wish you hadn\'t said. Eventually, they leave.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 18 },
              { special: 'endEngagement' },
            ],
          },
        ],
      },
      {
        label: 'Push for the wedding',
        outcomes: [
          {
            weight: 35,
            narrative: 'The wedding goes ahead. The doubts go with it. They don\'t leave the marriage.',
            effects: [
              { path: 'stats.happiness', op: '+', value: 4 },
              {
                special: 'addSpouse',
                payload: { id: 'rel-fiance-from-partner', relationshipLevel: 60 },
              },
            ],
          },
          {
            weight: 35,
            narrative: 'You marry. Within two years you both know you shouldn\'t have, but you stay anyway, for a while.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 4 },
              {
                special: 'addSpouse',
                payload: { id: 'rel-fiance-from-partner', relationshipLevel: 50 },
              },
            ],
          },
          {
            weight: 30,
            narrative: 'They sense your hesitation in the days before. They call it off themselves at the rehearsal.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 16 },
              { special: 'endEngagement' },
            ],
          },
        ],
      },
      {
        label: 'Postpone indefinitely',
        outcomes: [
          {
            weight: 55,
            narrative: 'You stay engaged on paper. Years pass. The wedding never quite materializes.',
            effects: [{ path: 'stats.happiness', op: '-', value: 5 }],
          },
          {
            weight: 45,
            narrative: 'They give it a year. Then they sit you down and tell you they need an answer or an exit.',
            effects: [{ path: 'stats.happiness', op: '-', value: 8 }],
          },
        ],
      },
    ],
  },
  {
    id: 'rel_partner_caught_cheating',
    category: 'relationships',
    weight: 0.25,
    minAge: 18,
    maxAge: 60,
    conditions: [
      { path: 'relationships', op: 'has', value: 'partner' },
      { path: 'relationships', op: 'lacks', value: 'spouse' },
      { path: 'relationshipState.partner.relationshipLevel', op: '<', value: 55 },
    ],
    title: 'Suspicions',
    description: 'They\'ve been quiet for months. Tonight they ask, almost casually, where you\'ve been the past few Tuesdays.',
    choices: [
      {
        label: 'Confess (you cheated)',
        outcomes: [
          {
            weight: 65,
            narrative: 'They go very still. Then they get up, pack a bag, and leave. You hear from a friend a week later that they\'re fine, mostly.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 18 },
              { special: 'breakUpPartner' },
            ],
          },
          {
            weight: 25,
            narrative: 'They cry. They say they want to try. You both go to therapy. The relationship doesn\'t survive the year, but it ends with less wreckage than it could have.',
            effects: [
              { path: 'money', op: '-', value: 1500 },
              { path: 'stats.happiness', op: '-', value: 14 },
              { special: 'breakUpPartner' },
            ],
          },
          {
            weight: 10,
            narrative: 'They listen. They take the time. They tell you, in the morning, that they want to try. You both do. It is hard for years and survives anyway.',
            effects: [{ path: 'stats.happiness', op: '-', value: 8 }],
          },
        ],
      },
      {
        label: 'Deny everything',
        outcomes: [
          {
            weight: 40,
            narrative: 'They drop it. The suspicion doesn\'t fully drop. You live with it watching you for a long time.',
            effects: [{ path: 'stats.happiness', op: '-', value: 6 }],
          },
          {
            weight: 35,
            narrative: 'They believe you. The relationship resets. You spend months not knowing whether to feel relieved or worse.',
            effects: [{ path: 'stats.happiness', op: '-', value: 4 }],
          },
          {
            weight: 25,
            narrative: 'They find out anyway, two weeks later. The lie is what ends it, more than the cheating. Cleanly, finally, badly.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 20 },
              { special: 'breakUpPartner' },
            ],
          },
        ],
      },
      {
        label: 'Break up first — get ahead of it',
        outcomes: [
          {
            weight: 55,
            narrative: 'You end it before they can. They are blindsided. You leave the kind of mess you can\'t clean up.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 10 },
              { special: 'breakUpPartner' },
            ],
          },
          {
            weight: 45,
            narrative: 'You break it off before the truth surfaces. The break is clean, on paper. You spend the next year wondering whether they ever really knew.',
            effects: [
              { path: 'stats.happiness', op: '-', value: 6 },
              { special: 'breakUpPartner' },
            ],
          },
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
