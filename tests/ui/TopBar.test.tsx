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
  it('does not render the back button when on Home', () => {
    const { queryByTestId } = render(
      <TopBar player={makePlayer()} showBack={false} onBack={vi.fn()} />,
    );
    expect(queryByTestId('top-bar-back-button')).toBeNull();
  });

  it('renders the back button when not on Home', () => {
    const { getByTestId } = render(
      <TopBar player={makePlayer()} showBack={true} onBack={vi.fn()} />,
    );
    expect(getByTestId('top-bar-back-button')).not.toBeNull();
  });

  it('does not render the legacy "tap to return" hint', () => {
    const { container, queryByTestId } = render(
      <TopBar player={makePlayer()} showBack={true} onBack={vi.fn()} />,
    );
    expect(queryByTestId('top-bar-return-hint')).toBeNull();
    expect(container.textContent ?? '').not.toMatch(/tap here to return/i);
  });

  it('fires onBack when the back button is clicked', () => {
    const onBack = vi.fn();
    const { getByTestId } = render(
      <TopBar player={makePlayer()} showBack={true} onBack={onBack} />,
    );
    fireEvent.click(getByTestId('top-bar-back-button'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('fires onProfilePress when the header card is clicked', () => {
    const onBack = vi.fn();
    const onProfilePress = vi.fn();
    const { getByTestId } = render(
      <TopBar
        player={makePlayer()}
        showBack={false}
        onBack={onBack}
        onProfilePress={onProfilePress}
      />,
    );
    fireEvent.click(getByTestId('top-bar-profile-trigger'));
    expect(onProfilePress).toHaveBeenCalledTimes(1);
    expect(onBack).not.toHaveBeenCalled();
  });

  it('logs a placeholder when no onProfilePress handler is provided', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { getByTestId } = render(
      <TopBar player={makePlayer()} showBack={false} onBack={vi.fn()} />,
    );
    fireEvent.click(getByTestId('top-bar-profile-trigger'));
    expect(log).toHaveBeenCalledWith('Profile menu coming soon');
    log.mockRestore();
  });

  it('renders the profile chevron indicator', () => {
    const { getByTestId } = render(
      <TopBar player={makePlayer()} showBack={false} onBack={vi.fn()} />,
    );
    expect(getByTestId('top-bar-profile-chevron')).not.toBeNull();
  });
});
