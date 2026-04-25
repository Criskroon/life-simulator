import type { GameEvent } from '../../types/events';
import { CHILDHOOD_EVENTS } from './childhood';
import { EDUCATION_EVENTS } from './education';
import { CAREER_EVENTS } from './career';
import { RELATIONSHIP_EVENTS } from './relationships';
import { RANDOM_EVENTS } from './random';

export const ALL_EVENTS: GameEvent[] = [
  ...CHILDHOOD_EVENTS,
  ...EDUCATION_EVENTS,
  ...CAREER_EVENTS,
  ...RELATIONSHIP_EVENTS,
  ...RANDOM_EVENTS,
];

export {
  CHILDHOOD_EVENTS,
  EDUCATION_EVENTS,
  CAREER_EVENTS,
  RELATIONSHIP_EVENTS,
  RANDOM_EVENTS,
};
