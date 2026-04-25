import { describe, it, expect } from 'vitest';
import { getChoicePreview } from '../../src/game/engine/choicePreview';
import type { Choice } from '../../src/game/types/events';
import type { PlayerState } from '../../src/game/types/gameState';

const baseState: PlayerState = {
  id: 'test',
  firstName: 'Test',
  lastName: 'User',
  age: 25,
  gender: 'female',
  country: 'GB',
  alive: true,
  birthYear: 2000,
  currentYear: 2025,
  stats: { health: 80, happiness: 70, smarts: 65, looks: 50 },
  money: 5000,
  job: null,
  education: [],
  relationships: [],
  assets: [],
  criminalRecord: [],
  history: [],
  triggeredEventIds: [],
  actionsRemainingThisYear: 3,
};

describe('getChoicePreview', () => {
  it('returns null label and affordable=true when choice has no cost', () => {
    const choice: Choice = { label: 'Do thing', effects: [] };
    const preview = getChoicePreview(choice, baseState);
    expect(preview.costLabel).toBeNull();
    expect(preview.isAffordable).toBe(true);
    expect(preview.adjustedCost).toBeNull();
  });

  it('returns null label when cost is zero', () => {
    const choice: Choice = { label: 'Free', effects: [], cost: 0 };
    const preview = getChoicePreview(choice, baseState);
    expect(preview.costLabel).toBeNull();
    expect(preview.isAffordable).toBe(true);
  });

  it('formats a negative cost with the country currency symbol', () => {
    const choice: Choice = { label: 'Buy', effects: [], cost: -2500 };
    const preview = getChoicePreview(choice, baseState);
    expect(preview.costLabel).toBe('£2,500');
    expect(preview.currencySymbol).toBe('£');
    expect(preview.adjustedCost).toBe(-2500);
  });

  it('formats a positive cost with a leading +', () => {
    const choice: Choice = { label: 'Bonus', effects: [], cost: 1200 };
    const preview = getChoicePreview(choice, baseState);
    expect(preview.costLabel).toBe('+£1,200');
    expect(preview.adjustedCost).toBe(1200);
  });

  it('marks affordable when player has exactly the required amount', () => {
    const choice: Choice = { label: 'Tight', effects: [], cost: -5000 };
    const preview = getChoicePreview(choice, baseState);
    expect(preview.isAffordable).toBe(true);
    expect(preview.costLabel).toBe('£5,000');
  });

  it('marks unaffordable when player has less than the required amount', () => {
    const choice: Choice = { label: 'Too dear', effects: [], cost: -10000 };
    const preview = getChoicePreview(choice, baseState);
    expect(preview.isAffordable).toBe(false);
    expect(preview.costLabel).toBe('£10,000');
  });

  it('treats positive cost as always affordable, even with zero money', () => {
    const broke: PlayerState = { ...baseState, money: 0 };
    const choice: Choice = { label: 'Earn', effects: [], cost: 500 };
    const preview = getChoicePreview(choice, broke);
    expect(preview.isAffordable).toBe(true);
    expect(preview.costLabel).toBe('+£500');
  });

  it('uses the Netherlands euro symbol for an NL player', () => {
    const dutch: PlayerState = { ...baseState, country: 'NL' };
    const choice: Choice = { label: 'Buy', effects: [], cost: -100 };
    const preview = getChoicePreview(choice, dutch);
    expect(preview.currencySymbol).toBe('€');
    expect(preview.costLabel?.startsWith('€')).toBe(true);
  });

  it('uses the US dollar symbol for a US player', () => {
    const american: PlayerState = { ...baseState, country: 'US' };
    const choice: Choice = { label: 'Buy', effects: [], cost: -100 };
    const preview = getChoicePreview(choice, american);
    expect(preview.currencySymbol).toBe('$');
    expect(preview.costLabel?.startsWith('$')).toBe(true);
  });

  it('country-adjusts the displayed cost — NL is cheaper than the GB baseline', () => {
    const dutch: PlayerState = { ...baseState, country: 'NL', money: 100000 };
    const choice: Choice = { label: 'Buy', effects: [], cost: -1000 };
    const preview = getChoicePreview(choice, dutch);
    // NL costOfLivingIndex = 0.97 → adjusted absolute = 970
    expect(preview.adjustedCost).toBe(-970);
    expect(preview.costLabel).toBe('€970');
  });

  it('country-adjusts the displayed cost — US is more expensive', () => {
    const american: PlayerState = { ...baseState, country: 'US', money: 100000 };
    const choice: Choice = { label: 'Buy', effects: [], cost: -1000 };
    const preview = getChoicePreview(choice, american);
    // US costOfLivingIndex = 1.07 → adjusted absolute = 1070
    expect(preview.adjustedCost).toBe(-1070);
    expect(preview.costLabel).toBe('$1,070');
  });

  it('compares affordability against the country-adjusted figure, not the raw cost', () => {
    // GB cost -1000, US adjusts to -1070. Player has 1050: affordable in GB,
    // unaffordable in US.
    const choice: Choice = { label: 'Edge', effects: [], cost: -1000 };
    const briton: PlayerState = { ...baseState, country: 'GB', money: 1050 };
    expect(getChoicePreview(choice, briton).isAffordable).toBe(true);
    const american: PlayerState = { ...baseState, country: 'US', money: 1050 };
    expect(getChoicePreview(choice, american).isAffordable).toBe(false);
  });
});
