import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cafework｜找到真的能工作的地方',
  description:
    '從 OpenStreetMap 公開資料出發,用 Wi-Fi / 安靜 / 插座 / 友善度四維交叉比對 — 沒有實地驗證的資料預設不顯示數字,免登入、免付費。',
  openGraph: {
    title: 'Cafework — 全台咖啡廳工作訊號地圖',
    description: '在台灣找能工作的咖啡廳',
    url: 'https://digital-nomad-cafe-map.vercel.app',
    siteName: 'Cafework',
    locale: 'zh_TW',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f4f1e8',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
