import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HeaderStrip } from '../../src/ui/components/HeaderStrip';

afterEach(() => {
  cleanup();
});

describe('HeaderStrip', () => {
  it('renders the title in uppercase as supplied', () => {
    const { getByTestId } = render(
      <HeaderStrip title="PEOPLE" onClose={vi.fn()} />,
    );
    expect(getByTestId('header-strip-title').textContent).toBe('PEOPLE');
  });

  it('fires onClose when the X button is clicked', () => {
    const onClose = vi.fn();
    const { getByTestId } = render(
      <HeaderStrip title="CAREER" onClose={onClose} />,
    );
    fireEvent.click(getByTestId('header-strip-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders an aria-label that mirrors the section title', () => {
    const { getByTestId } = render(
      <HeaderStrip title="ASSETS" onClose={vi.fn()} />,
    );
    const close = getByTestId('header-strip-close');
    expect(close.getAttribute('aria-label')).toBe('Close assets');
  });
});
