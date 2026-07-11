// app/pricing/page.tsx
// 公開定價頁 — SPEC §9.1 變現方案
import type { Metadata } from 'next';
import UpgradeButton from '@/components/UpgradeButton';

export const metadata: Metadata = {
  title: '定價方案 — 全球數位牧民咖啡廳地圖',
  description: '選擇最適合你的方案：免費版、Pro 個人版、或咖啡廳業者版。每個月不到一杯咖啡的價格，找到全亞太最好工作咖啡廳。',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            找到對的工作咖啡廳，加速你的遠距生產力
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            每月不到一杯咖啡的價格，省下找錯店 5 小時的時間
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Free */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">🆓 免費版</h2>
              <div className="mt-3 text-5xl font-bold text-gray-900 dark:text-white">NT$0</div>
              <p className="text-sm text-gray-500 mt-1">永久免費</p>
            </div>
            <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300 mb-6">
              <li>✅ 地圖瀏覽</li>
              <li>✅ 評論 3 維評分</li>
              <li>✅ 我的最愛（本機儲存）</li>
              <li>❌ 進階篩選</li>
              <li>❌ 評論照片</li>
              <li>❌ 雲端同步</li>
            </ul>
            <a
              href="/"
              className="block w-full text-center bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-2 px-4 rounded transition-colors"
            >
              開始使用
            </a>
          </div>

          {/* Pro — 主推 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 border-2 border-blue-500 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              ⭐ 最受歡迎
            </div>
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-blue-600">⭐ Pro 個人版</h2>
              <div className="mt-3">
                <div className="text-5xl font-bold text-blue-600">NT$99</div>
                <p className="text-sm text-gray-500 mt-1">/月 或 NT$899/年</p>
                <p className="text-xs text-green-600 mt-1">年繳省 NT$289（25% off）</p>
              </div>
            </div>
            <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300 mb-6">
              <li>✅ 免費版全部功能</li>
              <li>✅ 進階篩選（不限時 + WiFi ≥4 + 座位 ≥10）</li>
              <li>✅ 評論照片上傳</li>
              <li>✅ 我的最愛雲端同步（多裝置）</li>
              <li>✅ 5/9 維評分</li>
              <li>✅ 優先客服</li>
            </ul>
            <UpgradeButton
              plan="pro_monthly"
              label="🚀 升級 Pro（NT$99/月）"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
            />
          </div>

          {/* Business */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-purple-600">🏪 業者版</h2>
              <div className="mt-3 text-5xl font-bold text-purple-600">NT$499</div>
              <p className="text-sm text-gray-500 mt-1">/月</p>
            </div>
            <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300 mb-6">
              <li>✅ Pro 全部功能</li>
              <li>✅ 付費曝光（搜尋結果 top 5）</li>
              <li>✅ 商家頁面管理</li>
              <li>✅ 評論回覆</li>
              <li>✅ 數據分析 dashboard</li>
              <li>✅ 廣告版位</li>
            </ul>
            <UpgradeButton
              plan="business_monthly"
              label="聯絡業務"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
            />
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-sm text-yellow-800 dark:text-yellow-200">
          💡 <strong>為什麼要收費？</strong> 我們用 Pro 訂閱維持資料庫與伺服器開銷，
          並支付人工驗證咖啡廳評論的成本。免費版依然可用，是我們的核心使命。
        </div>

        <div className="text-center mt-8">
          <a
            href="/"
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            ← 回到首頁
          </a>
        </div>
      </div>
    </div>
  );
}
