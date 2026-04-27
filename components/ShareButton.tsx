'use client';

import { useCallback } from 'react';

interface ShareButtonProps {
  cafeId: string;
  cafeName: string;
  className?: string;
}

export default function ShareButton({ cafeId, cafeName, className = '' }: ShareButtonProps) {
  const handleShare = useCallback(async () => {
    const shareUrl = `https://digital-nomad-cafe-map.vercel.app/?cafe=${cafeId}`;
    const shareText = `☕ ${cafeName} - 全球數位牧民咖啡廳地圖`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareText,
          text: `查看 ${cafeName} 的詳細資訊：WiFi、插座、安靜程度評比`,
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or share failed, fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      // Brief visual feedback could be added here with state
    } catch {
      // Clipboard not available
    }
  }, [cafeId, cafeName]);

  return (
    <button
      onClick={handleShare}
      className={`flex items-center gap-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors ${className}`}
      title="Share this cafe"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3"/>
        <circle cx="6" cy="12" r="3"/>
        <circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>
      Share
    </button>
  );
}
