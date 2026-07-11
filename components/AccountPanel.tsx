// components/AccountPanel.tsx
// 用戶帳號 panel — 顯示 plan、最愛雲端同步、訂閱管理
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { usePlan } from '@/lib/supabase/plan';
import PortalButton from '@/components/PortalButton';
import UpgradeButton from '@/components/UpgradeButton';
import Link from 'next/link';

export default function AccountPanel() {
  const { plan, isPro, loading } = usePlan();
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      setEmail(userData.user.email ?? null);
      setDisplayName(
        (userData.user.user_metadata?.full_name as string) ??
        (userData.user.user_metadata?.name as string) ??
        null
      );
    };
    init();
  }, [supabase]);

  if (loading) {
    return <div className="text-gray-500">載入中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 用戶資料 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          個人資料
        </h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">姓名</dt>
            <dd className="text-gray-900 dark:text-gray-100">{displayName ?? '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Email</dt>
            <dd className="text-gray-900 dark:text-gray-100">{email ?? '—'}</dd>
          </div>
          <div className="flex justify-between items-center">
            <dt className="text-gray-500">方案</dt>
            <dd>
              <span
                className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${
                  isPro
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {plan ?? 'FREE'}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      {/* 升級 / 管理訂閱 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {isPro ? '訂閱管理' : '升級方案'}
        </h2>
        {isPro ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              您目前是 <strong>{plan}</strong> 訂閱者。感謝支持 🙏
            </p>
            <PortalButton />
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              升級 Pro 解鎖進階篩選、評論照片、雲端最愛、月 NT$99 不到一杯咖啡。
            </p>
            <Link
              href="/pricing"
              className="inline-block text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              → 查看完整方案
            </Link>
            <div className="pt-2">
              <UpgradeButton plan="pro_monthly" />
            </div>
          </div>
        )}
      </div>

      {/* Pro 功能預覽（給 free user 看的對照） */}
      {!isPro && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-6 border border-blue-200 dark:border-gray-600">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
            🚀 Pro 解鎖功能
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300">
            <li>✨ 進階篩選（不限時 + WiFi ≥4）</li>
            <li>📸 評論照片上傳</li>
            <li>☁️ 最愛雲端同步（多裝置）</li>
            <li>⭐ 5/9 維評分</li>
            <li>🚫 無廣告</li>
            <li>💬 優先客服</li>
          </ul>
        </div>
      )}
    </div>
  );
}
