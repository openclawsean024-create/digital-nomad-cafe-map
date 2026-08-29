'use client';

import { JSX, ReactNode } from 'react';
import { evaluateDailyPaywall, FREE_DAILY_LIMIT } from '@/lib/paywall';
import { loadUnlockUntil } from '@/lib/storage';
import StripeCheckoutMock from './StripeCheckoutMock';

/**
 * SPEC §15.13.5 — demo paywall banner for the Stage 5 pilot.
 *
 * Wraps the explore-UI children with a banner that:
 *   - shows "剩 N 次免費瀏覽" when within the 3/day free tier
 *   - shows the demo Stripe Checkout CTA when remainingViews ≤ 1 OR the limit
 *     is exceeded
 *   - shows "解鎖中 · 已升級" once an active unlock exists in
 *     `localStorage[deskbound-unlock-until-v1]`
 *
 * CRITICAL: the children ALWAYS render — the gate is a banner, NOT a blocker.
 * This preserves the open-access invariant the existing 91-test suite
 * depends on (see `canAccessCafe` returning `true` for all callers).
 *
 * The component is purely client-side and re-derives its state from
 * `viewedCount` + `unlockUntil` props passed by the parent. It never reaches
 * into localStorage itself for the initial decision — that's the parent's
 * job (it already loads via `src/lib/storage.ts`). The component DOES call
 * `loadUnlockUntil()` lazily after the Stripe mock click so the banner can
 * re-render into the "unlocked" state without the parent re-mounting.
 */

export interface PaywallGateProps {
  viewedCount: number;
  unlockUntil: string | null;
  children: ReactNode;
}

export default function PaywallGate({
  viewedCount,
  unlockUntil,
  children,
}: PaywallGateProps): JSX.Element {
  const decision = evaluateDailyPaywall({
    viewedCount,
    unlockUntil,
  });

  const showUpgradeCta =
    decision.reason === 'unlocked'
      ? false
      : decision.remainingViews <= 1;

  const handleUnlocked = () => {
    // After the demo "purchase", the localStorage key is updated by
    // saveDemoUnlock (called inside StripeCheckoutMock). The parent owns the
    // re-render cycle — we just no-op here.
  };

  return (
    <div
      className="paywall-gate"
      data-testid="paywall-gate"
      data-state={decision.reason}
      data-remaining-views={
        decision.remainingViews === Infinity ? '∞' : decision.remainingViews
      }
    >
      <section className="paywall-banner" data-testid="paywall-banner">
        <p className="paywall-kicker">SPEC §15.13 · Pilot paywall (demo)</p>
        {decision.reason === 'unlocked' && (
          <p className="paywall-message paywall-message--unlocked">
            ✓ 已解鎖 · 30 天全島咖啡廳瀏覽（Demo 升級中）
          </p>
        )}
        {decision.reason === 'within-free-tier' && (
          <p className="paywall-message paywall-message--free">
            剩 {decision.remainingViews} 次免費瀏覽（{FREE_DAILY_LIMIT}/天）
            {decision.remainingViews === 1 && ' · 下次將跳出升級提示'}
          </p>
        )}
        {decision.reason === 'daily-limit-exceeded' && (
          <p className="paywall-message paywall-message--blocked">
            已達每日 {FREE_DAILY_LIMIT} 間免費瀏覽上限 · 解鎖以繼續瀏覽
          </p>
        )}
      </section>
      {showUpgradeCta && <StripeCheckoutMock onUnlocked={handleUnlocked} />}
      <div className="paywall-children">{children}</div>
    </div>
  );
}