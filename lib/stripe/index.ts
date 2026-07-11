// lib/stripe/index.ts
// Stripe server client — STRIPE_SECRET_KEY 從 env 來
import Stripe from 'stripe';

let _client: Stripe | null = null;

export function getStripe(): Stripe {
  if (_client) return _client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      'Missing STRIPE_SECRET_KEY. Stripe test mode 用 sk_test_xxx, live 用 sk_live_xxx. ' +
      '到 https://dashboard.stripe.com/apikeys 申請。'
    );
  }
  _client = new Stripe(key, {
    apiVersion: '2026-06-24.dahlia' as any,
    typescript: true,
  });
  return _client;
}

// 4 個 price IDs — Stripe dashboard 建立後填入
export const PRICE_IDS = {
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? '',
  pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY ?? '',
  business_monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY ?? '',
} as const;
