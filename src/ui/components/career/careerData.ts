/**
 * Mock listings used by the Career screen until engine wiring lands.
 * Salaries are GB-baseline figures (matching the convention used in
 * `src/game/data/careers.ts`); the screen scales them to the player's
 * country at render time via `adjustSalary` so a Dutch player sees euros
 * roughly in line with their other money UI.
 */

export interface JobListingSpec {
  id: string;
  title: string;
  /** Short, observed line — Sunny Side voice. */
  hook: string;
  /** Annual salary in GB-baseline units. Scaled per country at render. */
  baseAnnualSalary: number;
}

export const FIND_WORK_LISTINGS: ReadonlyArray<JobListingSpec> = [
  {
    id: 'cashier',
    title: 'Cashier',
    hook: 'Stand up all day, scan things, smile at strangers.',
    baseAnnualSalary: 22000,
  },
  {
    id: 'junior-developer',
    title: 'Junior Developer',
    hook: 'Write code that someone else will later rewrite.',
    baseAnnualSalary: 38000,
  },
  {
    id: 'bartender',
    title: 'Bartender',
    hook: 'Late nights, cash tips, regulars who tell you everything.',
    baseAnnualSalary: 24000,
  },
  {
    id: 'teaching-assistant',
    title: 'Teaching Assistant',
    hook: 'Help one classroom and you help thirty futures.',
    baseAnnualSalary: 28000,
  },
  {
    id: 'apprentice-plumber',
    title: 'Apprentice Plumber',
    hook: 'Hard, useful, never out of demand.',
    baseAnnualSalary: 26000,
  },
];

export interface SpecialCareerSpec {
  id: string;
  title: string;
  /** What the player needs to start — short, mood-setting. */
  gateLabel: string;
  hook: string;
  /** Sub-line for the Coming-soon toast — sets the tone for the path. */
  toastDetail: string;
}

export const SPECIAL_CAREERS: ReadonlyArray<SpecialCareerSpec> = [
  {
    id: 'acting',
    title: 'Acting',
    gateLabel: 'Audition required',
    hook: 'Most days you wait. Some days you become someone else.',
    toastDetail: 'Auditions, agents, and cold-read rooms arrive later.',
  },
  {
    id: 'music',
    title: 'Music',
    gateLabel: 'Build a following',
    hook: 'A song nobody hears is still a song.',
    toastDetail: 'Bands, gigs, and slow streams land in a later session.',
  },
  {
    id: 'athlete',
    title: 'Pro Athlete',
    gateLabel: 'Train daily',
    hook: 'Wake early. Hurt often. Quit later than you should.',
    toastDetail: 'Training cycles and contracts arrive once sport is wired.',
  },
  {
    id: 'military',
    title: 'Military',
    gateLabel: 'Enlist',
    hook: 'Wear the uniform. Find out who else you are.',
    toastDetail: 'Enlistment and deployments come with a future pass.',
  },
  {
    id: 'crime',
    title: 'Crime',
    gateLabel: 'Off the books',
    hook: 'Good money. Worse mornings. No two careers like it.',
    toastDetail: 'Already lives partly in The Shadows — fuller next pass.',
  },
];
