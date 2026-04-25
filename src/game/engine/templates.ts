import { getCountry } from '../data/countries';
import type { PlayerState } from '../types/gameState';

const TOKEN_PATTERN = /\{(\w+)\}/g;

/**
 * Resolve `{firstName}`, `{age}`, `{country}`, `{lastName}`, `{currentYear}`
 * tokens in event copy. Unknown tokens are left as-is so authoring mistakes
 * are visible in playtests rather than silently swallowed.
 */
export function renderTemplate(text: string, state: PlayerState): string {
  return text.replace(TOKEN_PATTERN, (match, key: string) => {
    switch (key) {
      case 'firstName':
        return state.firstName;
      case 'lastName':
        return state.lastName;
      case 'age':
        return String(state.age);
      case 'country':
        return getCountry(state.country).name;
      case 'currentYear':
        return String(state.currentYear);
      case 'gender':
        return state.gender;
      case 'jobTitle':
        return state.job?.title ?? 'unemployed';
      default:
        return match;
    }
  });
}
