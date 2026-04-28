import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TopBar } from '../../src/ui/components/TopBar';
import type {
  EducationState,
  Job,
  PlayerState,
} from '../../src/game/types/gameState';

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

describe('TopBar status row', () => {
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

  function job(overrides: Partial<Job> = {}): Job {
    return {
      title: 'Barista',
      careerId: 'service',
      level: 1,
      salary: 1800,
      performance: 50,
      yearsAtJob: 1,
      ...overrides,
    };
  }

  it('shows education stage and year when enrolled with no job', () => {
    const { getByTestId } = render(
      <TopBar player={makePlayer({ educationState: enrolled() })} />,
    );
    expect(getByTestId('top-bar-status-primary').textContent).toBe(
      'VWO · Year 4',
    );
  });

  it('shows specialization when set on the enrolled stage', () => {
    const { getByTestId } = render(
      <TopBar
        player={makePlayer({
          educationState: enrolled({ currentSpecialization: 'science' }),
        })}
      />,
    );
    expect(getByTestId('top-bar-status-secondary').textContent).toBe('Science');
  });

  it('falls back to GPA when no specialization is set', () => {
    const { getByTestId } = render(
      <TopBar player={makePlayer({ educationState: enrolled() })} />,
    );
    expect(getByTestId('top-bar-status-secondary').textContent).toBe('GPA 7.4');
  });

  it('prioritizes job title over education when both are present', () => {
    const { getByTestId } = render(
      <TopBar
        player={makePlayer({
          job: job({ title: 'Software Engineer' }),
          educationState: enrolled(),
        })}
      />,
    );
    expect(getByTestId('top-bar-status-primary').textContent).toBe(
      'Software Engineer',
    );
  });

  it('shows the job salary in the secondary slot', () => {
    const { getByTestId } = render(
      <TopBar player={makePlayer({ job: job({ salary: 1800 }) })} />,
    );
    // NL country, salary scaled by adjustSalary — value is country-adjusted at
    // setJob time, so here we just assert the format and currency symbol.
    const secondary = getByTestId('top-bar-status-secondary').textContent ?? '';
    expect(secondary).toMatch(/^€[\d,]+\/mo$/);
  });

  it('shows Unemployed when no job and not enrolled', () => {
    const { getByTestId } = render(<TopBar player={makePlayer()} />);
    expect(getByTestId('top-bar-status-primary').textContent).toBe('Unemployed');
    expect(getByTestId('top-bar-status-secondary').textContent).toBe('—');
  });
});
