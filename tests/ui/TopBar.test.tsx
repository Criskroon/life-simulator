import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TopBar } from '../../src/ui/components/TopBar';
import type { PlayerState } from '../../src/game/types/gameState';

afterEach(() => {
  cleanup();
});

// Lean fixture — TopBar only reads a handful of fields. Casting through
// `unknown` keeps us from constructing the full PlayerState shape just to
// test a presentation component.
function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    firstName: 'La',
    lastName: 'La',
    age: 4,
    country: 'NL',
    currentYear: 2030,
    money: 0,
    ...overrides,
  } as unknown as PlayerState;
}

describe('TopBar', () => {
  it('does not render the return hint when already on Home', () => {
    const { queryByTestId } = render(
      <TopBar
        player={makePlayer()}
        showReturnHint={false}
        onReturnHome={vi.fn()}
      />,
    );
    expect(queryByTestId('top-bar-return-hint')).toBeNull();
  });

  it('renders the return hint when not on Home', () => {
    const { getByTestId } = render(
      <TopBar
        player={makePlayer()}
        showReturnHint={true}
        onReturnHome={vi.fn()}
      />,
    );
    expect(getByTestId('top-bar-return-hint').textContent).toMatch(/return/i);
  });

  it('fires onReturnHome when the header is clicked', () => {
    const onReturnHome = vi.fn();
    const { getByTestId } = render(
      <TopBar
        player={makePlayer()}
        showReturnHint={true}
        onReturnHome={onReturnHome}
      />,
    );
    fireEvent.click(getByTestId('top-bar-home-trigger'));
    expect(onReturnHome).toHaveBeenCalledTimes(1);
  });
});
