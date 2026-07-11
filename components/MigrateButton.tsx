// components/MigrateButton.tsx
// 一鍵把 localStorage v1 資料匯入到 Supabase
'use client';

import { useState } from 'react';
import { getCafesFromLocalStorage, upsertCafeFromLocalStorage, loadCafes } from '@/lib/data-v2';
import { createClient } from '@/lib/supabase/client';

export default function MigrateButton() {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const supabase = createClient();

  const handleMigrate = async () => {
    setBusy(true);
    setStatus('檢查中...');

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setStatus('請先登入');
      setBusy(false);
      return;
    }

    const localCafes = getCafesFromLocalStorage();
    if (localCafes.length === 0) {
      setStatus('localStorage 沒有資料可遷移');
      setBusy(false);
      return;
    }

    setStatus(`找到 ${localCafes.length} 筆，匯入中...`);
    try {
      const inserted = await upsertCafeFromLocalStorage(
        localCafes.map((c) => ({
          id: c.id,
          name: c.name,
          address: c.address,
          lat: c.lat,
          lng: c.lng,
          wifiQuality: c.wifiQuality,
          powerOutlets: c.powerOutlets,
          quietness: c.quietness,
          notes: c.notes ?? '',
          createdAt: c.createdAt,
        }))
      );
      setStatus(`✅ 成功匯入 ${inserted} 筆到 Supabase`);
    } catch (e) {
      setStatus(`❌ 失敗: ${(e as Error).message}`);
    }
    setBusy(false);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleMigrate}
        disabled={busy}
        className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded disabled:opacity-50"
      >
        {busy ? '處理中...' : '🔼 將 localStorage 資料遷移到雲端'}
      </button>
      {status && <span className="text-xs text-gray-700 dark:text-gray-300">{status}</span>}
    </div>
  );
}
