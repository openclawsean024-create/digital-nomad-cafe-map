import { describe, expect, it } from 'vitest';
import { evaluateDailyPaywall, FREE_DAILY_LIMIT } from './paywall';

describe('paywall — evaluateDailyPaywall (SPEC §15.13.5 demo paywall)', () => {
  it('within free tier (viewedCount < FREE_DAILY_LIMIT) returns allowed + remaining > 0', () => {
    const result = evaluateDailyPaywall({ viewedCount: 0, unlockUntil: null, now: 1_000 });
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('within-free-tier');
    expect(result.remainingViews).toBe(FREE_DAILY_LIMIT);
  });

  it('decrements remainingViews as viewedCount increases within free tier', () => {
    expect(evaluateDailyPaywall({ viewedCount: 1, unlockUntil: null, now: 1_000 }).remainingViews).toBe(2);
    expect(evaluateDailyPaywall({ viewedCount: 2, unlockUntil: null, now: 1_000 }).remainingViews).toBe(1);
  });

  it('at limit (viewedCount === FREE_DAILY_LIMIT) returns denied with remaining = 0', () => {
    const result = evaluateDailyPaywall({ viewedCount: FREE_DAILY_LIMIT, unlockUntil: null, now: 1_000 });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('daily-limit-exceeded');
    expect(result.remainingViews).toBe(0);
  });

  it('over limit also returns denied', () => {
    const result = evaluateDailyPaywall({ viewedCount: 10, unlockUntil: null, now: 1_000 });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('daily-limit-exceeded');
    expect(result.remainingViews).toBe(0);
  });

  it('valid unlockUntil in the future overrides the free tier limit', () => {
    const now = 1_700_000_000_000;
    const unlockUntil = new Date(now + 86_400_000).toISOString(); // +1 day
    const result = evaluateDailyPaywall({
      viewedCount: 100, // way over the free tier
      unlockUntil,
      now,
    });
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('unlocked');
    expect(result.remainingViews).toBe(Infinity);
  });

  it('expired unlockUntil (in the past) falls back to the free-tier check', () => {
    const now = 1_700_000_000_000;
    const unlockUntil = new Date(now - 86_400_000).toISOString(); // -1 day
    const result = evaluateDailyPaywall({
      viewedCount: 1,
      unlockUntil,
      now,
    });
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('within-free-tier');
    expect(result.remainingViews).toBe(FREE_DAILY_LIMIT - 1);
  });

  it('null unlockUntil falls back to the free-tier check (legacy open access)', () => {
    const result = evaluateDailyPaywall({
      viewedCount: 0,
      unlockUntil: null,
      now: 1_700_000_000_000,
    });
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('within-free-tier');
    expect(result.remainingViews).toBe(FREE_DAILY_LIMIT);
  });

  it('FREE_DAILY_LIMIT is exported as 3 (SPEC §15.13 demo gate)', () => {
    // This is the demo paywall constant — SPEC says "免費 3/天 gate 維持"
    expect(FREE_DAILY_LIMIT).toBe(3);
  });
});