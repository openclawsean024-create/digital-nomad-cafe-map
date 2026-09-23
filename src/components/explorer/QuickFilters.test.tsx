// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { QuickFilters } from './QuickFilters';

describe('QuickFilters — chip rendering per SPEC §4.5', () => {
  beforeEach(() => cleanup());
  afterEach(() => cleanup());

  it('renders all four chip ids with description text', () => {
    render(<QuickFilters activeChip={null} onToggle={() => {}} />);
    expect(document.body.querySelector('[data-testid=chip-wifi-50]')).not.toBeNull();
    expect(document.body.querySelector('[data-testid=chip-outlet-rich]')).not.toBeNull();
    expect(document.body.querySelector('[data-testid=chip-quiet-4]')).not.toBeNull();
    expect(document.body.querySelector('[data-testid=chip-no-time-limit]')).not.toBeNull();
  });

  it('passes aria-pressed=false when chip is inactive', () => {
    render(<QuickFilters activeChip={null} onToggle={() => {}} />);
    const wifi = document.body.querySelector(
      '[data-testid=chip-wifi-50]',
    ) as HTMLButtonElement;
    expect(wifi.getAttribute('aria-pressed')).toBe('false');
  });

  it('passes aria-pressed=true when chip is active', () => {
    render(<QuickFilters activeChip="wifi-50" onToggle={() => {}} />);
    const wifi = document.body.querySelector(
      '[data-testid=chip-wifi-50]',
    ) as HTMLButtonElement;
    expect(wifi.getAttribute('aria-pressed')).toBe('true');
  });

  it('invokes onToggle with the clicked chip id', () => {
    const onToggle = vi.fn();
    render(<QuickFilters activeChip={null} onToggle={onToggle} />);
    fireEvent.click(
      document.body.querySelector(
        '[data-testid=chip-no-time-limit]',
      ) as HTMLButtonElement,
    );
    expect(onToggle).toHaveBeenCalledWith('no-time-limit');
  });
});
