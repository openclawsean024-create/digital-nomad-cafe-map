// components/PortalButton.tsx
// 已訂閱使用者打開 Stripe Customer Portal（升級/降級/取消）
'use client';

import { useState } from 'react';

export default function PortalButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.message ?? 'Portal 建立失敗');
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={busy}
        className="bg-gray-700 hover:bg-gray-800 text-white font-medium py-2 px-4 rounded text-sm transition-colors disabled:opacity-50"
      >
        {busy ? '處理中...' : '⚙️ 管理訂閱'}
      </button>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}
