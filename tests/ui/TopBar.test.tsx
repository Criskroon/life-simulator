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
  it('does not render a back button (BackButton was retired in 1.1d)', () => {
    const { queryByTestId } = render(<TopBar player={makePlayer()} />);
    expect(queryByTestId('top-bar-back-button')).toBeNull();
  });

  it('does not render the legacy "tap to return" hint', () => {
    const { container, queryByTestId } = render(<TopBar player={makePlayer()} />);
    expect(queryByTestId('top-bar-return-hint')).toBeNull();
    expect(container.textContent ?? '').not.toMatch(/tap here to return/i);
  });

  it('fires onProfilePress when the header card is clicked', () => {
    const onProfilePress = vi.fn();
    const { getByTestId } = render(
      <TopBar player={makePlayer()} onProfilePress={onProfilePress} />,
    );
    fireEvent.click(getByTestId('top-bar-profile-trigger'));
    expect(onProfilePress).toHaveBeenCalledTimes(1);
  });

  it('logs a placeholder when no onProfilePress handler is provided', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { getByTestId } = render(<TopBar player={makePlayer()} />);
    fireEvent.click(getByTestId('top-bar-profile-trigger'));
    expect(log).toHaveBeenCalledWith('Profile menu coming soon');
    log.mockRestore();
  });

  it('renders the profile chevron indicator', () => {
    const { getByTestId } = render(<TopBar player={makePlayer()} />);
    expect(getByTestId('top-bar-profile-chevron')).not.toBeNull();
  });

  it('uses the largest font size for short names', () => {
    const { getByTestId } = render(
      <TopBar player={makePlayer({ firstName: 'Eli', lastName: 'Park' })} />,
    );
    const name = getByTestId('top-bar-player-name');
    expect(name.className).toContain('text-[28px]');
  });

  it('shrinks the name font when it exceeds 18 chars', () => {
    const { getByTestId } = render(
      <TopBar
        player={makePlayer({ firstName: 'Daphne', lastName: 'van den Hoek' })}
      />,
    );
    const name = getByTestId('top-bar-player-name');
    expect(name.className).toContain('text-2xl');
  });

  it('shrinks the name font further when it exceeds 25 chars', () => {
    const { getByTestId } = render(
      <TopBar
        player={makePlayer({
          firstName: 'Maximilianus',
          lastName: 'van den Hoekstra-Smeets',
        })}
      />,
    );
    const name = getByTestId('top-bar-player-name');
    expect(name.className).toContain('text-xl');
  });

  it('clamps the name container to two lines via line-clamp', () => {
    const { getByTestId } = render(
      <TopBar
        player={makePlayer({
          firstName: 'Maximilianus',
          lastName: 'van den Hoekstra-Smeets',
        })}
      />,
    );
    const name = getByTestId('top-bar-player-name');
    expect((name as HTMLElement).style.webkitLineClamp).toBe('2');
  });

  it('uses the larger NET WORTH font for short amounts', () => {
    const { getByTestId } = render(
      <TopBar player={makePlayer({ money: 0 })} />,
    );
    const worth = getByTestId('top-bar-net-worth');
    expect(worth.className).toContain('text-2xl');
  });

  it('shrinks the NET WORTH font when the formatted amount exceeds 8 chars', () => {
    const { getByTestId } = render(
      <TopBar player={makePlayer({ money: 1234567 })} />,
    );
    const worth = getByTestId('top-bar-net-worth');
    expect(worth.className).toContain('text-xl');
  });
});
