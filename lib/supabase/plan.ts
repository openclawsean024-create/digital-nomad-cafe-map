// lib/supabase/plan.ts
// 取得當前 user 的 plan（用 cookie 同步，client 端可用）
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type Plan = 'FREE' | 'PRO' | 'BUSINESS';

export function isPro(plan: Plan | null | undefined): boolean {
  return plan === 'PRO' || plan === 'BUSINESS';
}

export function usePlan(): { plan: Plan | null; isPro: boolean; loading: boolean } {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setPlan(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('plan')
        .eq('id', userData.user.id)
        .single();

      if (!error && data) {
        setPlan((data.plan as Plan) ?? 'FREE');
      } else {
        setPlan('FREE');
      }
      setLoading(false);
    };
    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  return { plan, isPro: isPro(plan), loading };
}
