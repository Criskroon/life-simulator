import type { Choice } from '../types/events';
import type { PlayerState } from '../types/gameState';
import { adjustPrice, formatMoney, getCurrentCountry } from './countryEngine';

/**
 * UI-facing preview of a choice's monetary impact. The `cost` field on a
 * Choice is informative — the actual money mutation lives in `effects` /
 * `outcomes`. This helper takes that raw author-supplied number, runs it
 * through the same country adjustment as the eventual money effect, and
 * returns a label the EventModal can render directly.
 *
 * Affordability rule: only NEGATIVE costs gate affordability. A choice with
 * `cost: -2500` is unaffordable when the player has less than the
 * country-adjusted equivalent of $2,500. Positive costs (income previews)
 * are always affordable.
 */
export interface ChoicePreview {
  /** "$2,500" / "+$500" / null when the choice has no cost field. */
  costLabel: string | null;
  /** Country currency symbol — present even when costLabel is null. */
  currencySymbol: string;
  /**
   * False only when cost is negative AND adjusted absolute > player money.
   * Choices without a cost are always affordable.
   */
  isAffordable: boolean;
  /** Country-adjusted cost in player currency. Sign matches `choice.cost`. */
  adjustedCost: number | null;
}

export function getChoicePreview(
  choice: Choice,
  state: PlayerState,
): ChoicePreview {
  const country = getCurrentCountry(state);
  const symbol = country.currency.symbol;

  if (typeof choice.cost !== 'number' || choice.cost === 0) {
    return {
      costLabel: null,
      currencySymbol: symbol,
      isAffordable: true,
      adjustedCost: null,
    };
  }

  // Use the same adjustPrice the effects applier uses, so the previewed
  // figure matches the eventual deduction exactly.
  const adjusted = adjustPrice(choice.cost, country);
  const absoluteAdjusted = Math.abs(adjusted);
  const formatted = formatMoney(country, absoluteAdjusted);
  const costLabel = adjusted < 0 ? formatted : `+${formatted}`;
  const isAffordable = adjusted >= 0 || state.money >= absoluteAdjusted;

  return {
    costLabel,
    currencySymbol: symbol,
    isAffordable,
    adjustedCost: adjusted,
  };
}

/**
 * Single source of truth for "can the player afford this choice?". Uses the
 * same country-adjusted figures as the actual money deduction, so a choice
 * that looks affordable here is genuinely affordable. The store's intercept
 * and the simulator's AI both call through this — keeps the gate consistent.
 */
export function canAffordChoice(state: PlayerState, choice: Choice): boolean {
  return getChoicePreview(choice, state).isAffordable;
}
