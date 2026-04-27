import type { Metadata } from 'next';
import './globals.css';
import ThemeProvider from '@/components/ThemeProvider';

export const metadata: Metadata = {
  metadataBase: new URL('https://digital-nomad-cafe-map.vercel.app'),
  title: '全球數位牧民咖啡廳地圖 | 找到適合遠距工作的咖啡廳',
  description: '探索全球適合遠距工作的咖啡廳。以互動式地圖為核心，結合 WiFi、插座、安靜程度評比，快速找到符合需求的工作場所。',
  keywords: ['數位牧民', '遠距工作', '咖啡廳', 'wifi', '工作空間', 'coworking', 'digital nomad', 'cafe', 'remote work'],
  authors: [{ name: 'Digital Nomad Cafe Map' }],
  openGraph: {
    title: '全球數位牧民咖啡廳地圖',
    description: '找到適合遠距工作的完美咖啡廳',
    url: 'https://digital-nomad-cafe-map.vercel.app',
    siteName: 'Digital Nomad Cafe Map',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'zh_TW',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '全球數位牧民咖啡廳地圖',
    description: '找到適合遠距工作的完美咖啡廳',
    images: ['/og-image.svg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>☕</text></svg>" />
      </head>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
