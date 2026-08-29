// @vitest-environment jsdom
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import AdminPage from './page';

// Stub next/navigation's useSearchParams so we can drive the gating
const mockSearchParams = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams(),
  usePathname: () => '/admin',
}));

function withQuery(value: string | null): URLSearchParams {
  if (value === null) return new URLSearchParams('');
  return new URLSearchParams(value);
}

describe('/admin page (SPEC §15.13 pilot metrics dashboard, founder-only)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockSearchParams.mockReset();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => {
    cleanup();
  });

  it('non-founder (no ?founder=1, no env match) sees access denied + the ?founder=1 hint', () => {
    mockSearchParams.mockReturnValue(withQuery(''));
    render(<AdminPage />);
    expect(
      screen.getByRole('heading', { name: /founder-only access|僅限 founder/i })
    ).toBeTruthy();
    // Hint mentions the query flag
    expect(screen.getAllByText(/founder=1/i).length).toBeGreaterThanOrEqual(1);
    // The 4 metric labels should NOT be visible
    for (const label of ['emails', 'reach', 'cafes', 'paid']) {
      expect(screen.queryAllByText(new RegExp(`^${label}$`, 'i')).length).toBe(0);
    }
  });

  it('?founder=1 query-flag unlocks the admin dashboard', () => {
    mockSearchParams.mockReturnValue(withQuery('founder=1'));
    render(<AdminPage />);
    // No access-denied banner
    expect(
      screen.queryByRole('heading', { name: /founder-only access|僅限 founder/i })
    ).toBeNull();
    // Dashboard heading visible
    expect(
      screen.getByRole('heading', { name: /pilot metrics|admin|儀表板/i })
    ).toBeTruthy();
  });

  it('renders exactly 4 metric cards labeled emails / reach / cafes / paid', () => {
    mockSearchParams.mockReturnValue(withQuery('founder=1'));
    render(<AdminPage />);
    for (const label of ['emails', 'reach', 'cafes', 'paid']) {
      expect(screen.getAllByText(new RegExp(label, 'i')).length).toBeGreaterThanOrEqual(1);
    }
    // 4 distinct metric card containers
    const cards = screen.getAllByTestId('admin-metric-card');
    expect(cards.length).toBe(4);
  });

  it('every metric card shows "—（unverified）" placeholder value (no fake data)', () => {
    mockSearchParams.mockReturnValue(withQuery('founder=1'));
    render(<AdminPage />);
    const cards = screen.getAllByTestId('admin-metric-card');
    expect(cards.length).toBe(4);
    for (const card of cards) {
      // Each card displays the placeholder; no numeric value is fabricated
      expect(card.textContent).toMatch(/—（unverified）/);
    }
    // Sanity: no metric card shows a fabricated integer like 0, 1, 42, etc.
    for (const card of cards) {
      expect(card.textContent).not.toMatch(/:\s*\d+\s/);
    }
  });
});
