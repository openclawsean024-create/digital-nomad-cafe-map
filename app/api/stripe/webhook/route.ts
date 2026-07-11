// app/api/stripe/webhook/route.ts
// Stripe webhook 處理 — 對應 SPEC §3.4 AC-006 (idempotent)
// 流程：rawBody → stripe.webhooks.constructEvent → 依 event.type 處理
// idempotency：用 event.id 存進 `processed_webhooks` 表（自動去重）
import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

// 關閉 body parsing — Stripe 需要 raw body 驗簽
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'missing signature' }, { status: 400 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'webhook secret not configured' }, { status: 503 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (e) {
    const err = e as Error;
    return NextResponse.json(
      { error: `signature 驗證失敗: ${err.message}` },
      { status: 400 }
    );
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // AC-006: idempotency — 用 event.id 存進 processed_webhooks 表
  // 若重發，回 200 略過（這是 Stripe 重試的標準 SOP）
  const { data: existing, error: dupError } = await admin
    .from('processed_webhooks')
    .select('event_id')
    .eq('event_id', event.id)
    .single();

  if (existing) {
    return NextResponse.json({ ok: true, dedup: true });
  }
  // 重複嘗試但 RPC 失敗不影響流程

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const plan = session.metadata?.plan ?? 'PRO';
        if (!userId) break;

        // 抓 subscription 詳情寫入
        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        // Stripe API 2024+ 把 current_period_end 移到 items.data
        const periodEndUnix = (subscription as any).current_period_end
          ?? subscription.items.data[0]?.current_period_end
          ?? Math.floor(Date.now() / 1000) + 30 * 24 * 3600;

        await admin.from('users').update({ plan }).eq('id', userId);
        await admin.from('subscriptions').upsert({
          user_id: userId,
          stripe_sub_id: subscription.id,
          tier: plan,
          status: subscription.status,
          current_period_end: new Date(periodEndUnix * 1000).toISOString(),
        });
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;
        if (!userId) break;

        const isActive = subscription.status === 'active' || subscription.status === 'trialing';
        const periodEndUnix = (subscription as any).current_period_end
          ?? subscription.items.data[0]?.current_period_end
          ?? Math.floor(Date.now() / 1000) + 30 * 24 * 3600;

        await admin.from('subscriptions').upsert({
          user_id: userId,
          stripe_sub_id: subscription.id,
          tier: isActive ? 'PRO' : 'FREE',
          status: subscription.status,
          current_period_end: new Date(periodEndUnix * 1000).toISOString(),
        });
        await admin.from('users').update({
          plan: isActive ? 'PRO' : 'FREE',
        }).eq('id', userId);
        break;
      }

      case 'invoice.payment_failed': {
        // 訂閱扣款失敗 → 把用戶降級
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const { data: user } = await admin
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();
        if (user) {
          await admin.from('users').update({ plan: 'FREE' }).eq('id', user.id);
        }
        break;
      }

      default:
        // 不處理的事件：略過
        break;
    }

    // 記錄已處理 event.id（AC-006 idempotency）
    await admin.from('processed_webhooks').insert({
      event_id: event.id,
      event_type: event.type,
      processed_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, received: event.type });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json(
      { error: `handler failed: ${err.message}` },
      { status: 500 }
    );
  }
}
