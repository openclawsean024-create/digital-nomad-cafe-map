// @vitest-environment jsdom
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import PaywallGate from './PaywallGate';

describe('PaywallGate (SPEC §15.13.5 — demo paywall banner over the explore UI)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders an "active unlock" badge when unlockUntil is in the future', () => {
    const future = new Date(Date.now() + 7 * 86_400_000).toISOString();
    render(
      <PaywallGate viewedCount={10} unlockUntil={future}>
        <div data-testid="child">child content</div>
      </PaywallGate>
    );
    // Children always render — the gate is a banner, not a blocker
    expect(screen.getByTestId('child')).toBeTruthy();
    // "unlocked" state shows positive messaging, no upgrade CTA
    expect(screen.getByTestId('paywall-gate').getAttribute('data-state')).toBe('unlocked');
    expect(screen.queryByTestId('paywall-checkout')).toBeNull();
  });

  it('shows "剩 N 次免費瀏覽" with remaining > 1 (within free tier)', () => {
    render(
      <PaywallGate viewedCount={1} unlockUntil={null}>
        <div data-testid="child">child</div>
      </PaywallGate>
    );
    const gate = screen.getByTestId('paywall-gate');
    expect(gate.getAttribute('data-state')).toBe('within-free-tier');
    expect(gate.textContent).toMatch(/剩 2 次免費瀏覽/);
    // Within free tier, NO upgrade CTA yet
    expect(screen.queryByTestId('paywall-checkout')).toBeNull();
  });

  it('shows "剩 1 次免費瀏覽" with the upgrade CTA when remainingViews === 1', () => {
    render(
      <PaywallGate viewedCount={2} unlockUntil={null}>
        <div data-testid="child">child</div>
      </PaywallGate>
    );
    const gate = screen.getByTestId('paywall-gate');
    expect(gate.getAttribute('data-state')).toBe('within-free-tier');
    expect(gate.textContent).toMatch(/剩 1 次免費瀏覽/);
    // Last free view — show upgrade CTA so users see it before hitting the limit
    expect(screen.queryByTestId('paywall-checkout')).toBeTruthy();
  });

  it('shows the upgrade CTA when daily limit is exceeded', () => {
    render(
      <PaywallGate viewedCount={3} unlockUntil={null}>
        <div data-testid="child">child</div>
      </PaywallGate>
    );
    const gate = screen.getByTestId('paywall-gate');
    expect(gate.getAttribute('data-state')).toBe('daily-limit-exceeded');
    expect(gate.textContent).toMatch(/已達.*3.*天.*上限|每日.*上限/);
    expect(screen.queryByTestId('paywall-checkout')).toBeTruthy();
  });

  it('renders children regardless of paywall state (open access invariant preserved)', () => {
    // Even when limit exceeded, the children MUST still render — the gate is a
    // banner, not a blocker. This is the open-access invariant that 91
    // existing tests rely on.
    const { rerender } = render(
      <PaywallGate viewedCount={0} unlockUntil={null}>
        <div data-testid="child">child</div>
      </PaywallGate>
    );
    expect(screen.getByTestId('child')).toBeTruthy();

    rerender(
      <PaywallGate viewedCount={3} unlockUntil={null}>
        <div data-testid="child">child</div>
      </PaywallGate>
    );
    expect(screen.getByTestId('child')).toBeTruthy();
  });

  it('clicking the demo CTA inside the gate transitions state to unlocked (localStorage written)', () => {
    render(
      <PaywallGate viewedCount={3} unlockUntil={null}>
        <div data-testid="child">child</div>
      </PaywallGate>
    );
    // Initially limit-exceeded
    expect(screen.getByTestId('paywall-gate').getAttribute('data-state')).toBe(
      'daily-limit-exceeded'
    );
    // Click the demo Stripe button
    const button = screen.getByTestId('paywall-checkout-button');
    fireEvent.click(button);
    // After click, localStorage should hold an unlock ISO string
    const stored = window.localStorage.getItem('deskbound-unlock-until-v1');
    expect(stored).not.toBeNull();
    expect(new Date(stored!).getTime()).toBeGreaterThan(Date.now());
  });
});