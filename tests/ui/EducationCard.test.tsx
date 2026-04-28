import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EducationCard } from '../../src/ui/components/career/EducationCard';
import { getCountry } from '../../src/game/data/countries';
import type {
  EducationState,
  PlayerState,
} from '../../src/game/types/gameState';

afterEach(() => {
  cleanup();
});

const NL = getCountry('NL');

function makePlayer(): PlayerState {
  return {
    firstName: 'Eli',
    lastName: 'Park',
    age: 16,
    country: 'NL',
    currentYear: 2030,
    money: 0,
  } as unknown as PlayerState;
}

function enrolled(overrides: Partial<EducationState> = {}): EducationState {
  return {
    status: 'enrolled',
    currentStageId: 'vwo',
    yearOfStage: 4,
    currentGpa: 7.4,
    diplomas: [],
    ...overrides,
  } as EducationState;
}

describe('EducationCard specialization display', () => {
  it('renders the specialization next to the stage name when set', () => {
    const state = enrolled({ currentSpecialization: 'science' });
    const { getByTestId } = render(
      <EducationCard
        player={makePlayer()}
        state={state}
        country={NL}
        onClick={vi.fn()}
      />,
    );
    const title = getByTestId('education-card-title');
    expect(title.textContent).toBe('VWO — Science');
    expect(getByTestId('education-card-specialization')).not.toBeNull();
  });

  it('omits the specialization span when none is set', () => {
    const { getByTestId, queryByTestId } = render(
      <EducationCard
        player={makePlayer()}
        state={enrolled()}
        country={NL}
        onClick={vi.fn()}
      />,
    );
    const title = getByTestId('education-card-title');
    expect(title.textContent).toBe('VWO');
    expect(queryByTestId('education-card-specialization')).toBeNull();
  });

  it('formats specialization labels via formatSpecialization', () => {
    const state = enrolled({ currentSpecialization: 'computer_science' });
    const { getByTestId } = render(
      <EducationCard
        player={makePlayer()}
        state={state}
        country={NL}
        onClick={vi.fn()}
      />,
    );
    expect(getByTestId('education-card-specialization').textContent).toContain(
      'Computer Science',
    );
  });
});
