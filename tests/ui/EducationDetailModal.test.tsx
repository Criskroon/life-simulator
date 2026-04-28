import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  DiplomaRecord,
  EducationState,
  PlayerState,
} from '../../src/game/types/gameState';

// useGameStore is mocked via vi.hoisted so the spies are referenceable
// inside the vi.mock factory (which hoists above imports).
const storeMocks = vi.hoisted(() => ({
  reEnrollInStage: vi.fn(),
  dropOutOfSchool: vi.fn(),
}));

vi.mock('../../src/game/state/gameStore', () => ({
  useGameStore: (selector: (s: unknown) => unknown) =>
    selector({
      reEnrollInStage: storeMocks.reEnrollInStage,
      dropOutOfSchool: storeMocks.dropOutOfSchool,
    }),
}));

// Imports of the SUT must come AFTER vi.mock setup above.
import { EducationDetailModal } from '../../src/ui/components/career/EducationDetailModal';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  storeMocks.reEnrollInStage.mockClear();
  storeMocks.dropOutOfSchool.mockClear();
});

function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    firstName: 'Sam',
    lastName: 'Bakker',
    age: 24,
    country: 'NL',
    currentYear: 2050,
    money: 0,
    stats: { health: 70, happiness: 70, smarts: 80, looks: 50 },
    ...overrides,
  } as unknown as PlayerState;
}

function basisschoolDiploma(): DiplomaRecord {
  return {
    countryCode: 'NL',
    stageId: 'basisschool',
    iscedLevel: 1,
    yearObtained: 2038,
    ageObtained: 12,
    finalGpa: 7.0,
    graduated: true,
  };
}

function notEnrolled(
  overrides: Partial<EducationState> = {},
): EducationState {
  return {
    status: 'not_enrolled',
    currentStageId: null,
    yearOfStage: 0,
    currentGpa: 0,
    diplomas: [],
    dropOutReason: 'dropped_out',
    ...overrides,
  } as EducationState;
}

describe('EducationDetailModal — re-enrol surface', () => {
  it('lists the stages a dropped-out player can re-enrol in', () => {
    // Smarts 80 + basisschool diploma → vmbo, havo, vwo all pass canEnterStage.
    // (hbo/wo_bachelor need additional secondary diplomas → excluded.)
    const state = notEnrolled({ diplomas: [basisschoolDiploma()] });

    const { getByTestId, queryByTestId } = render(
      <EducationDetailModal
        player={makePlayer()}
        state={state}
        onClose={vi.fn()}
      />,
    );

    expect(getByTestId('education-detail-stage-vmbo')).not.toBeNull();
    expect(getByTestId('education-detail-stage-havo')).not.toBeNull();
    expect(getByTestId('education-detail-stage-vwo')).not.toBeNull();
    // basisschool is not isSelectable, must not appear
    expect(queryByTestId('education-detail-stage-basisschool')).toBeNull();
    // hbo_bachelor requires three diplomas (havo + mbo + vwo) — excluded
    expect(queryByTestId('education-detail-stage-hbo_bachelor')).toBeNull();
    // The stale "future session" copy must be gone
    expect(getByTestId('education-detail-modal').textContent).not.toContain(
      'future session',
    );
  });

  it('opens the specialisation picker when clicking a stage with hasSpecialization', () => {
    const state = notEnrolled({ diplomas: [basisschoolDiploma()] });

    const { getByTestId, queryByTestId } = render(
      <EducationDetailModal
        player={makePlayer()}
        state={state}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(getByTestId('education-detail-stage-vwo'));

    // After click, the stage list is replaced by the spec picker.
    expect(queryByTestId('education-detail-stage-vwo')).toBeNull();
    // VWO's specialisations: humanities, economics, health, science.
    expect(getByTestId('education-detail-spec-science')).not.toBeNull();
    expect(getByTestId('education-detail-spec-economics')).not.toBeNull();
    // reEnrollInStage must NOT have been called yet — only after spec.
    expect(storeMocks.reEnrollInStage).not.toHaveBeenCalled();
  });

  it('calls reEnrollInStage(stageId, spec) and closes when a spec is picked', () => {
    const onClose = vi.fn();
    const state = notEnrolled({ diplomas: [basisschoolDiploma()] });

    const { getByTestId } = render(
      <EducationDetailModal
        player={makePlayer()}
        state={state}
        onClose={onClose}
      />,
    );

    fireEvent.click(getByTestId('education-detail-stage-havo'));
    fireEvent.click(getByTestId('education-detail-spec-science'));

    expect(storeMocks.reEnrollInStage).toHaveBeenCalledTimes(1);
    expect(storeMocks.reEnrollInStage).toHaveBeenCalledWith('havo', 'science');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows the empty-state message when no stage passes canEnterStage', () => {
    // smarts: 0 + zero diplomas → vmbo's minSmarts (30) fails AND every
    // other stage's prereq chain breaks at basisschool. List is empty.
    const player = makePlayer({
      stats: { health: 70, happiness: 70, smarts: 0, looks: 50 },
    });
    const state = notEnrolled({ diplomas: [] });

    const { getByTestId, queryByTestId } = render(
      <EducationDetailModal player={player} state={state} onClose={vi.fn()} />,
    );

    expect(getByTestId('education-detail-no-paths')).not.toBeNull();
    expect(getByTestId('education-detail-no-paths').textContent).toContain(
      'No more education paths',
    );
    expect(queryByTestId('education-detail-stage-vmbo')).toBeNull();
    expect(queryByTestId('education-detail-stage-havo')).toBeNull();
  });
});
