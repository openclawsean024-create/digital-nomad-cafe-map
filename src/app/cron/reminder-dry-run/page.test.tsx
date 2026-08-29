// @vitest-environment jsdom
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import ReminderDryRunPage from './page';

// Stub next/navigation's useSearchParams so we can drive the gating
const mockSearchParams = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams(),
  usePathname: () => '/cron/reminder-dry-run',
}));

function withQuery(value: string | null): URLSearchParams {
  if (value === null) return new URLSearchParams('');
  return new URLSearchParams(value);
}

describe('/cron/reminder-dry-run page (SPEC §15.13 city reminder cron, founder-only)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockSearchParams.mockReset();
    // silence console.log from the page itself
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => {
    cleanup();
  });

  it('non-founder (no ?founder=1, no env match) sees access denied + the ?founder=1 hint', () => {
    mockSearchParams.mockReturnValue(withQuery(''));
    render(<ReminderDryRunPage />);
    expect(
      screen.getByRole('heading', { name: /founder-only access|僅限 founder/i })
    ).toBeTruthy();
    expect(screen.getAllByText(/\?founder=1|founder=1/i).length).toBeGreaterThanOrEqual(1);
    // No dry-run JSON payload should leak to non-founder
    expect(screen.queryByTestId('cron-dry-run-output')).toBeNull();
  });

  it('?founder=1 query-flag unlocks the dry-run page', () => {
    mockSearchParams.mockReturnValue(withQuery('founder=1'));
    render(<ReminderDryRunPage />);
    expect(
      screen.queryByRole('heading', { name: /founder-only access|僅限 founder/i })
    ).toBeNull();
    expect(
      screen.getByRole('heading', { name: /cron reminder|城市提醒|cron dry/i })
    ).toBeTruthy();
  });

  it('founder sees the mock-only disclaimer (no Resend, no real send)', () => {
    mockSearchParams.mockReturnValue(withQuery('founder=1'));
    render(<ReminderDryRunPage />);
    // The page must always remind the founder that this is mock-only
    expect(screen.getAllByText(/mock|mock-only|模擬|不會.*寄/i).length).toBeGreaterThanOrEqual(1);
  });

  it('founder sees a payload output area + at least one city reminder preview', () => {
    mockSearchParams.mockReturnValue(withQuery('founder=1'));
    render(<ReminderDryRunPage />);
    // The output region exists
    expect(screen.getByTestId('cron-dry-run-output')).toBeTruthy();
    // The page lists the cities that will be processed (default = ['taipei'])
    // We check for the city name in the rendered output rather than asserting
    // exact JSON, since the page renders a structural preview.
    expect(screen.getAllByText(/taipei|台北/i).length).toBeGreaterThanOrEqual(1);
  });

  it('clicking the "重新產生 payload" / refresh button re-runs the dry-run (no network call)', () => {
    mockSearchParams.mockReturnValue(withQuery('founder=1'));
    const fetchSpy = vi.spyOn(window, 'fetch').mockImplementation(() => Promise.reject(new Error('no network')));
    render(<ReminderDryRunPage />);
    const refresh = screen.getByTestId('cron-refresh-button');
    fireEvent.click(refresh);
    // No network call should have been made — payload is purely client-side
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('non-founder access path does not leak subscriber emails (privacy boundary)', () => {
    // Plant a subscriber in localStorage; non-founder must not see it.
    window.localStorage.setItem(
      'deskbound-pilot-emails-v1',
      JSON.stringify([{ email: 'leak-check@example.com', ts: '2026-08-29T00:00:00.000Z' }])
    );
    mockSearchParams.mockReturnValue(withQuery(''));
    render(<ReminderDryRunPage />);
    expect(screen.queryByText(/leak-check@example.com/i)).toBeNull();
  });
});
