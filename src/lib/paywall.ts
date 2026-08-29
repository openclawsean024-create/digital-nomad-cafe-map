/**
 * SPEC §15.13.5 — demo paywall logic for Stage 5 pilot.
 *
 * The product today ships a 公開版 (open version) — `canAccessCafe` in
 * `src/domain/cafes.ts` always returns `true` so all 4,357 cafes are visible
 * to everyone. Stage 5 (per the prompt) wants a demo paywall upgrade that
 * **keeps** the 3-free-views-per-day gate visible (banner + upgrade CTA) while
 * adding a Stripe Checkout mock UI for the pilot. This module is the
 * pure-function core that decides `allowed / reason / remainingViews`. The
 * UI layer (`PaywallGate`, `StripeCheckoutMock`) wraps this decision and never
 * mutates the underlying cafe list rendering — preserving the open-access
 * invariant that the existing 91-test suite guards.
 *
 * Mock-only boundary: no real Stripe / Supabase / analytics calls. The
 * `unlockUntil` input is an ISO string the UI layer persists to
 * `localStorage[deskbound-unlock-until-v1]` via `src/lib/storage.ts`.
 */

export const FREE_DAILY_LIMIT = 3;

export type PaywallReason = 'within-free-tier' | 'unlocked' | 'daily-limit-exceeded';

export type PaywallDecision =
  | { allowed: true; reason: 'within-free-tier'; remainingViews: number }
  | { allowed: true; reason: 'unlocked'; remainingViews: number }
  | { allowed: false; reason: 'daily-limit-exceeded'; remainingViews: number };

export interface PaywallInput {
  /** Number of cafe-card views the user has burned today. */
  viewedCount: number;
  /** ISO timestamp until which the user has an active unlock; `null` = none. */
  unlockUntil: string | null;
  /** Override "now" for tests; defaults to `Date.now()`. */
  now?: number;
}

/**
 * Pure function — no DOM, no React, no localStorage. Returns a decision object
 * the UI can render verbatim.
 *
 * Decision precedence:
 *   1. Active unlock (unlockUntil > now) → allowed: 'unlocked', remainingViews = Infinity
 *   2. viewedCount < FREE_DAILY_LIMIT   → allowed: 'within-free-tier', remaining = FREE_DAILY_LIMIT - viewedCount
 *   3. otherwise                        → allowed: false, reason 'daily-limit-exceeded'
 */
export function evaluateDailyPaywall(input: PaywallInput): PaywallDecision {
  const now = input.now ?? Date.now();
  const FREE_DAILY_LIMIT_LOCAL = FREE_DAILY_LIMIT;
  const unlockMs = input.unlockUntil ? new Date(input.unlockUntil).getTime() : null;

  if (unlockMs !== null && unlockMs > now) {
    return { allowed: true, reason: 'unlocked', remainingViews: Infinity };
  }

  if (input.viewedCount < FREE_DAILY_LIMIT_LOCAL) {
    return {
      allowed: true,
      reason: 'within-free-tier',
      remainingViews: FREE_DAILY_LIMIT_LOCAL - input.viewedCount,
    };
  }

  return {
    allowed: false,
    reason: 'daily-limit-exceeded',
    remainingViews: 0,
  };
}