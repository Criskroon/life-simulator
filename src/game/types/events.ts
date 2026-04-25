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

export interface Choice {
  label: string;
  effects: Effect[];
  /** If set, after this choice resolves, queue the referenced event next. */
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
