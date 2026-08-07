import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cafework — 全台 994 間遠距工作咖啡廳地圖',
  description: '在台灣找能工作的咖啡廳:5 維評分 WiFi、插座、安靜度、價格、友善度。資料來源 OpenStreetMap,完全免費、免登入。',
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
