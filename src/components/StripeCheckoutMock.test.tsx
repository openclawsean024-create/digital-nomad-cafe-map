// @vitest-environment jsdom
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import StripeCheckoutMock from './StripeCheckoutMock';

describe('StripeCheckoutMock (SPEC §15.13.5 — demo paywall CTA, mock-only)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders the demo Stripe Checkout banner with a CTA button', () => {
    const onUnlocked = vi.fn();
    render(<StripeCheckoutMock onUnlocked={onUnlocked} />);
    // Banner title — explicit "Demo" prefix so founder/QA knows it's mock
    expect(screen.getByText(/stripe checkout.*demo mode/i)).toBeTruthy();
    expect(screen.getByRole('heading', { name: /升級解鎖|30 天|Demo/i })).toBeTruthy();
    // Mock CTA — never says "Pay" alone, always says "假裝" / "Mock"
    const button = screen.getByRole('button');
    expect(button.textContent).toMatch(/假裝|mock/i);
    expect(button.textContent).not.toMatch(/^Pay$/i);
  });

  it('clicking the CTA writes deskbound-unlock-until-v1 to localStorage with a future timestamp', () => {
    const onUnlocked = vi.fn();
    const before = Date.now();
    render(<StripeCheckoutMock onUnlocked={onUnlocked} />);
    fireEvent.click(screen.getByRole('button'));
    const stored = window.localStorage.getItem('deskbound-unlock-until-v1');
    expect(stored).not.toBeNull();
    const parsed = new Date(stored!).getTime();
    // Unlock must be in the future, at least 1 day ahead
    expect(parsed).toBeGreaterThan(before);
    expect(parsed - before).toBeGreaterThanOrEqual(86_400_000 - 1_000); // allow 1s slack
    // onUnlocked callback fires with the unlock ISO string
    expect(onUnlocked).toHaveBeenCalledTimes(1);
    expect(onUnlocked.mock.calls[0][0]).toBe(stored);
  });

  it('does not call any external network (no fetch / stripe.redirectToCheckout)', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch').mockImplementation(() => Promise.resolve(new Response()));
    const onUnlocked = vi.fn();
    render(<StripeCheckoutMock onUnlocked={onUnlocked} />);
    fireEvent.click(screen.getByRole('button'));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('shows a visible "no real charge" disclaimer in the DOM', () => {
    render(<StripeCheckoutMock onUnlocked={() => {}} />);
    // Mock-only boundary must be obvious to anyone reading the page
    expect(screen.getAllByText(/無真實|mock|假裝/i).length).toBeGreaterThanOrEqual(1);
  });
});