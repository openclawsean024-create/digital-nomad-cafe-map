// app/api/stripe/checkout/route.ts
// POST 建立 Stripe Checkout session — 對應 SPEC §3.2 F-104
import { NextResponse } from 'next/server';
import { getStripe, PRICE_IDS } from '@/lib/stripe';
import { createClient as createSbClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: Request) {
  let body: { plan?: 'pro_monthly' | 'pro_yearly'; cafeId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { code: 'BAD_REQUEST', message: '無效的 JSON' },
      { status: 400 }
    );
  }

  const { plan = 'pro_monthly', cafeId } = body;
  const priceId = PRICE_IDS[plan];
  if (!priceId) {
    return NextResponse.json(
      { code: 'STRIPE_NOT_CONFIGURED', message: `Price ID 未設定: ${plan}. 請先在 Stripe dashboard 建立產品並把 price ID 加到 env vars。` },
      { status: 503 }
    );
  }

  // 取登入 user（用 @supabase/ssr 拿 cookies）
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (n) => cookieStore.get(n)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json(
      { code: 'UNAUTHENTICATED', message: '請先登入' },
      { status: 401 }
    );
  }

  // 用 service_role 抓 user 資料（拿 email + plan）
  const admin = createSbClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  const { data: profile } = await admin
    .from('users')
    .select('id, email, plan, stripe_customer_id')
    .eq('id', userData.user.id)
    .single();

  if (!profile) {
    return NextResponse.json(
      { code: 'USER_PROFILE_MISSING', message: '請重新登入再試' },
      { status: 404 }
    );
  }

  let customerId = profile.stripe_customer_id;
  const stripe = getStripe();

  // 沒 customer 就建一個
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile.email,
      metadata: { supabase_user_id: profile.id },
    });
    customerId = customer.id;
    await admin.from('users').update({ stripe_customer_id: customerId }).eq('id', profile.id);
  }

  // 建 Checkout session
  const origin = request.headers.get('origin') ?? 'https://dncafe-v2.vercel.app';

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/account?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/account?upgrade=cancel`,
      metadata: {
        supabase_user_id: profile.id,
        plan: plan.startsWith('pro') ? 'PRO' : 'BUSINESS',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json(
      { code: 'STRIPE_CHECKOUT_FAILED', message: err.message },
      { status: 502 }
    );
  }
}
