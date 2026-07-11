// components/UpgradeButton.tsx
// 升級按鈕：呼叫 /api/stripe/checkout 後 redirect 到 Stripe Checkout
'use client';

import { useState } from 'react';
import { usePlan } from '@/lib/supabase/plan';

type PlanOption = 'pro_monthly' | 'pro_yearly' | 'business_monthly';

interface UpgradeButtonProps {
  plan: PlanOption;
  label?: string;
  className?: string;
}

export default function UpgradeButton({ plan, label, className }: UpgradeButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { plan: currentPlan } = usePlan();

  const handleClick = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.message ?? `Checkout 建立失敗 (${res.status})`);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };

  // 已是 PRO 就顯示「管理訂閱」
  if (currentPlan === 'PRO' || currentPlan === 'BUSINESS') {
    return null; // 由 PortalButton 顯示
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={busy}
        className={
          className ??
          'w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50'
        }
      >
        {busy ? '處理中...' : (label ?? '升級 Pro')}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
