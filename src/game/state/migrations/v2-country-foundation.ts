import type { CountryCode } from '../../data/countries/schema';

/**
 * Migration v2 — Country Foundation
 *
 * Pre: existing saves have `player.country` as a string ('NL').
 * Post: player gains `countryCode` (same string but typed as CountryCode).
 *
 * Non-destructive — the legacy `country` field is preserved so older code
 * paths (legacy `data/countries.ts`) keep working.
 */

export interface PreV2PlayerState {
  country?: string;
  countryCode?: string;
  [key: string]: unknown;
}

export interface PostV2PlayerState {
  country?: string;
  countryCode: CountryCode;
  [key: string]: unknown;
}

const VALID_COUNTRY_CODES: CountryCode[] = ['NL', 'US', 'JP', 'BR', 'ZA'];

function isValidCountryCode(code: unknown): code is CountryCode {
  return (
    typeof code === 'string' &&
    VALID_COUNTRY_CODES.includes(code as CountryCode)
  );
}

export function migrateToV2(state: PreV2PlayerState): PostV2PlayerState {
  let countryCode: CountryCode = 'NL';

  if (isValidCountryCode(state.countryCode)) {
    countryCode = state.countryCode;
  } else if (isValidCountryCode(state.country)) {
    countryCode = state.country;
  }

  return {
    ...state,
    country: state.country ?? countryCode,
    countryCode,
  };
}

export function needsV2Migration(state: PreV2PlayerState): boolean {
  return !isValidCountryCode(state.countryCode);
}
