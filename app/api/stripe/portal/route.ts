// app/api/stripe/portal/route.ts
// POST 建立 Customer Portal session — 升級/降級/取消自助
import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: Request) {
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
    return NextResponse.json({ code: 'UNAUTHENTICATED' }, { status: 401 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: profile } = await admin
    .from('users')
    .select('stripe_customer_id')
    .eq('id', userData.user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json(
      { code: 'NO_CUSTOMER', message: '尚未訂閱，請先升級' },
      { status: 404 }
    );
  }

  const origin = request.headers.get('origin') ?? 'https://dncafe-v2.vercel.app';

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/account`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json(
      { code: 'STRIPE_PORTAL_FAILED', message: err.message },
      { status: 502 }
    );
  }
}
