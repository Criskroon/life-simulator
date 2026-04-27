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

/**
 * Mock company-name lookup keyed by the engine's `careerId`. The engine
 * has no employer concept; the rich Current Position card needs *some*
 * company name for the secondary line ("ING · Amsterdam · 5y") to read
 * naturally, so we synthesise one from the careerId. Values are bland on
 * purpose — they exist to ground the layout, not to invent flavour the
 * engine can't back.
 */
export const COMPANY_BY_CAREER: Record<string, string> = {
  software: 'Tech corp',
  medicine: 'Local hospital',
  retail: 'Supermarket chain',
  teaching: 'Local school',
  trades: 'Independent',
};

/**
 * Mock city-by-country lookup. Country records hold no city data, so we
 * pick the most-recognisable city per country code. Falls back to '—' so
 * a save with an unfamiliar code still renders cleanly. Uppercased at
 * render time to match the eyebrow style.
 */
export const CITY_BY_COUNTRY: Record<string, string> = {
  NL: 'Amsterdam',
  US: 'New York',
  GB: 'London',
};

/**
 * Vignette copy keyed by performance star bucket (1..5). Surfaced as the
 * italic line at the bottom of the Current Position card. Author-curated
 * single-line observations in Sunny Side voice — what a manager might
 * actually be thinking when they look at the player's last review.
 */
export const VIGNETTE_BY_STARS: Record<number, string> = {
  1: 'They\'ve noticed. So have you.',
  2: 'You\'re showing up. That\'s not the same as showing.',
  3: 'Reliable. Quiet. Hard to argue with.',
  4: 'Strong year. The next one will be watched.',
  5: 'Two more strong years and a leadership push could open the door.',
};

export interface CareerHistoryEntry {
  id: string;
  title: string;
  company: string;
  /** Inclusive years on the job — used to print "1990–1995". */
  startYear: number;
  endYear: number;
  /** Short Sunny Side reason — never an HR euphemism. */
  reason: string;
}

/**
 * Mock past-jobs ledger. The engine has no concept of a job history yet
 * (`player.job` is single-slot), so the HISTORY section reads from this
 * fixed table to demonstrate the layout. When job history lands in the
 * engine, this constant goes away and the section reads from state.
 */
export const MOCK_CAREER_HISTORY: ReadonlyArray<CareerHistoryEntry> = [
  {
    id: 'mock-history-1',
    title: 'Junior Analyst',
    company: 'ING',
    startYear: 1989,
    endYear: 1991,
    reason: 'Promoted internally.',
  },
  {
    id: 'mock-history-2',
    title: 'Intern',
    company: 'Rabobank',
    startYear: 1988,
    endYear: 1989,
    reason: 'Six months. Learned what suit to buy.',
  },
];

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
