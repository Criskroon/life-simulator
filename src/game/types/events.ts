export type EventCategory =
  | 'childhood'
  | 'education'
  | 'career'
  | 'relationships'
  | 'random'
  | 'health';

export type ConditionOp = '==' | '!=' | '>' | '<' | '>=' | '<=' | 'has' | 'lacks';

export interface Condition {
  /** Dotted path into PlayerState, e.g. "stats.happiness", "job.performance". */
  path: string;
  op: ConditionOp;
  value: number | string | boolean;
}

export type EffectOp = '+' | '-' | '*' | '/' | '=';

export type SpecialEffect =
  | 'addRelationship'
  | 'removeRelationship'
  | 'addAsset'
  | 'addCrime'
  | 'addEducation'
  | 'completeEducation'
  | 'setJob'
  | 'leaveJob'
  | 'die';

export interface Effect {
  /** Dotted path into PlayerState. Required when no `special` is set. */
  path?: string;
  op?: EffectOp;
  value?: number;
  special?: SpecialEffect;
  payload?: Record<string, unknown>;
}

/**
 * One possible result of a probabilistic choice. The resolver picks one of
 * the choice's outcomes via weighted random selection. A choice MUST set
 * either `effects` (deterministic) or `outcomes` (probabilistic), not both.
 */
export interface Outcome {
  /** Selection weight; relative to the other outcomes on the same choice. */
  weight: number;
  /** Player-facing flavor text describing what happened. Template tokens supported. */
  narrative: string;
  effects: Effect[];
  /** If set, queue this event after the outcome resolves. */
  followUpEventId?: string;
}

export interface Choice {
  label: string;
  /** Deterministic path: applied as-is. Mutually exclusive with `outcomes`. */
  effects?: Effect[];
  /** Probabilistic path: resolver weighted-picks one Outcome. ≥2 entries. */
  outcomes?: Outcome[];
  /** If set, after this choice resolves, queue the referenced event next. */
  followUpEventId?: string;
}

/**
 * The result of resolving a single choice: which effects actually applied,
 * which narrative the outcome produced (null for deterministic choices),
 * and the per-stat deltas the UI uses for the feedback overlay.
 */
export interface StatDelta {
  path: string;
  before: number;
  after: number;
}

export interface SpecialSummary {
  special: SpecialEffect;
  /** Short, UI-ready label, e.g. "Married Sara" or "New job: Junior Developer". */
  label: string;
}

export interface ResolvedChoice {
  appliedEffects: Effect[];
  narrative: string | null;
  deltas: StatDelta[];
  specials: SpecialSummary[];
  followUpEventId?: string;
}

export interface GameEvent {
  id: string;
  category: EventCategory;
  /** Base selection weight in [0..1+]. Higher = more likely. */
  weight: number;
  minAge?: number;
  maxAge?: number;
  /** ALL conditions must be true for the event to be eligible. */
  conditions?: Condition[];
  oncePerLife?: boolean;
  title: string;
  /** Supports {firstName}, {lastName}, {age}, {country} template tokens. */
  description: string;
  choices: Choice[];
}
