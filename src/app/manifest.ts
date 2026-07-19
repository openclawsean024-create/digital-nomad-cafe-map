import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Deskbound — 全球遠距工作咖啡地圖',
    short_name: 'Deskbound',
    description: '用 WiFi、插座與安靜度訊號找到真正能工作的咖啡廳。',
    start_url: '/',
    display: 'standalone',
    background_color: '#f4f1e8',
    theme_color: '#171814',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
