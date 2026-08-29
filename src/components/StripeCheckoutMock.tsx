'use client';

import { JSX } from 'react';
import { saveDemoUnlock } from '@/lib/storage';

/**
 * SPEC §15.13.5 — Stage 5 pilot paywall demo CTA.
 *
 * Mock-only boundary: this component is the "Stripe Checkout" button that the
 * founder and pilot participants click to "unlock" the app. It DOES NOT
 * contact Stripe, the network, or any real payment processor. Clicking the
 * button:
 *   1. writes an ISO timestamp 30 days in the future to
 *      `localStorage[deskbound-unlock-until-v1]` (via the existing
 *      `saveDemoUnlock` helper from `src/lib/storage.ts`)
 *   2. invokes the `onUnlocked` callback so the parent can re-evaluate the
 *      paywall decision and re-render.
 *
 * The reason this is a separate component (rather than inline in PaywallGate)
 * is so the CTA can be re-used later in /landing or /verify if needed, and so
 * the "Demo: 假裝付款成功" copy + accessibility wording stay consistent across
 * pages.
 */

export interface StripeCheckoutMockProps {
  /** Fires with the unlock ISO string after the demo "purchase" succeeds. */
  onUnlocked: (unlockUntil: string) => void;
  /** Optional override of the unlock window in days (defaults to 30). */
  unlockDays?: number;
}

export default function StripeCheckoutMock({
  onUnlocked,
  unlockDays = 30,
}: StripeCheckoutMockProps): JSX.Element {
  const handleClick = () => {
    // Pure client-side mock — no fetch, no Stripe.js, no analytics.
    const unlockUntil = saveDemoUnlock(unlockDays);
    onUnlocked(unlockUntil);
  };

  return (
    <aside className="paywall-checkout" data-testid="paywall-checkout">
      <header className="paywall-checkout-head">
        <p className="paywall-checkout-kicker">Stripe Checkout · Demo Mode</p>
        <h3 className="paywall-checkout-title">
          升級解鎖 30 天（Demo · 無真實信用卡處理）
        </h3>
      </header>
      <p className="paywall-checkout-body">
        按下下方按鈕即可解鎖 30 天全島咖啡廳瀏覽。這是 demo paywall CTA，
        <strong>不會向您收取費用，也不會連線到 Stripe。</strong>
        實際上線時才會接 Stripe Checkout（SPEC §15.13.5，pilot 期間）。
      </p>
      <button
        type="button"
        className="paywall-checkout-button"
        data-testid="paywall-checkout-button"
        onClick={handleClick}
      >
        Demo：假裝付款成功（寫入 localStorage）
      </button>
      <p className="paywall-checkout-note">
        Mock-only · localStorage <code>deskbound-unlock-until-v1</code> ·{' '}
        {unlockDays} 天
      </p>
    </aside>
  );
}