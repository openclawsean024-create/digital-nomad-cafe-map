// app/account/page.tsx
// 帳號頁：顯示當前 plan + 升級 / 管理訂閱 + 我的最愛雲端同步通知
import { Metadata } from 'next';
import Link from 'next/link';
import AccountPanel from '@/components/AccountPanel';

export const metadata: Metadata = {
  title: '我的帳號 — 全球數位牧民咖啡廳地圖',
};

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block">
          ← 回到地圖
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          帳號設定
        </h1>
        <AccountPanel />
      </div>
    </div>
  );
}
