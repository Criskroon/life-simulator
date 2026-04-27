import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BottomNav, type BottomNavTab } from '../../src/ui/components/BottomNav';

afterEach(() => {
  cleanup();
});

function renderNav(overrides: Partial<Parameters<typeof BottomNav>[0]> = {}) {
  const onTabChange = vi.fn();
  const onAgeUp = vi.fn();
  const result = render(
    <BottomNav
      activeTab="home"
      onTabChange={onTabChange}
      onAgeUp={onAgeUp}
      {...overrides}
    />,
  );
  return { ...result, onTabChange, onAgeUp };
}

describe('BottomNav', () => {
  it('renders four side tabs and the Age+1 FAB', () => {
    const { getByTestId } = renderNav();
    const tabs: Array<Exclude<BottomNavTab, 'home'>> = [
      'career',
      'assets',
      'people',
      'activities',
    ];
    for (const tab of tabs) {
      expect(getByTestId(`bottom-nav-tab-${tab}`)).toBeTruthy();
    }
    expect(getByTestId('bottom-nav-ageup')).toBeTruthy();
  });

  it('fires onTabChange with the tab id when a side tab is clicked', () => {
    const { getByTestId, onTabChange } = renderNav();
    fireEvent.click(getByTestId('bottom-nav-tab-people'));
    expect(onTabChange).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith('people');
  });

  it('fires onAgeUp when the FAB is clicked', () => {
    const { getByTestId, onAgeUp } = renderNav();
    fireEvent.click(getByTestId('bottom-nav-ageup'));
    expect(onAgeUp).toHaveBeenCalledTimes(1);
  });

  it('marks the active tab and leaves the others inactive', () => {
    const { getByTestId } = renderNav({ activeTab: 'career' });
    expect(getByTestId('bottom-nav-tab-career').dataset.active).toBe('true');
    expect(getByTestId('bottom-nav-tab-people').dataset.active).toBe('false');
    expect(getByTestId('bottom-nav-tab-activities').dataset.active).toBe('false');
    // aria-current is set on the active tab so assistive tech can find it.
    expect(
      getByTestId('bottom-nav-tab-career').getAttribute('aria-current'),
    ).toBe('page');
  });

  it('disables the FAB when ageUpDisabled is true and skips onAgeUp clicks', () => {
    const { getByTestId, onAgeUp } = renderNav({ ageUpDisabled: true });
    const fab = getByTestId('bottom-nav-ageup') as HTMLButtonElement;
    expect(fab.disabled).toBe(true);
    fireEvent.click(fab);
    expect(onAgeUp).not.toHaveBeenCalled();
  });

  it('renders a badge for a tab with a positive count', () => {
    const { getByTestId, queryByTestId } = renderNav({
      badges: [{ tab: 'activities', count: 3 }],
    });
    const badge = getByTestId('bottom-nav-badge-activities');
    expect(badge.textContent).toBe('3');
    // Tabs without a badge entry should not render a dot.
    expect(queryByTestId('bottom-nav-badge-people')).toBeNull();
  });

  it('hides the badge when its count is zero', () => {
    const { queryByTestId } = renderNav({
      badges: [{ tab: 'activities', count: 0 }],
    });
    expect(queryByTestId('bottom-nav-badge-activities')).toBeNull();
  });

  it('renders the Aging Stone with both "Age" and "+1" labels stacked', () => {
    const { getByTestId } = renderNav();
    const fab = getByTestId('bottom-nav-ageup');
    // Both lines are present as separate text nodes inside the button.
    expect(fab.textContent).toContain('Age');
    expect(fab.textContent).toContain('+1');
  });

  it('marks the FAB with data-pulse="true" when ageUpPulse is set and not disabled', () => {
    const { getByTestId } = renderNav({ ageUpPulse: true });
    expect(getByTestId('bottom-nav-ageup').dataset.pulse).toBe('true');
  });

  it('suppresses the pulse flag when the FAB is disabled, even with ageUpPulse=true', () => {
    const { getByTestId } = renderNav({ ageUpPulse: true, ageUpDisabled: true });
    expect(getByTestId('bottom-nav-ageup').dataset.pulse).toBe('false');
  });

  it('omits the pulse flag when ageUpPulse is not set', () => {
    const { getByTestId } = renderNav();
    expect(getByTestId('bottom-nav-ageup').dataset.pulse).toBe('false');
  });
});
