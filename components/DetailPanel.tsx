'use client';

import { Cafe } from '@/types/cafe';

interface DetailPanelProps {
  cafe: Cafe | null;
  onClose: () => void;
}

function WifiBar({ quality }: { quality: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className={`w-3 h-3 rounded-sm ${i <= quality ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'}`}
          />
        ))}
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {quality === 5 ? 'Excellent' : quality === 4 ? 'Very Good' : quality === 3 ? 'Good' : quality === 2 ? 'Fair' : 'Poor'}
      </span>
    </div>
  );
}

function PowerIndicator({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3].map(i => (
          <span key={i} className={i <= level ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'}>⚡</span>
        ))}
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {level === 3 ? 'Every table' : level === 2 ? 'Usually available' : 'Limited'}
      </span>
    </div>
  );
}

function QuietIndicator({ level }: { level: number }) {
  const labels = ['', 'Can be loud', 'Moderate', 'Very quiet'];
  const icons = ['', '🔊', '😐', '😌'];
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm">{icons[level]}</span>
      <span className="text-xs text-gray-500 dark:text-gray-400">{labels[level]}</span>
    </div>
  );
}

export default function DetailPanel({ cafe, onClose }: DetailPanelProps) {
  if (!cafe) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white text-base leading-tight">{cafe.name}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-snug">{cafe.address}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg leading-none shrink-0"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Ratings Grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-2 text-center">
          <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">WiFi</div>
          <WifiBar quality={cafe.wifiQuality} />
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-2 text-center">
          <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Power</div>
          <PowerIndicator level={cafe.powerOutlets} />
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-2 text-center">
          <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Noise</div>
          <QuietIndicator level={cafe.quietness} />
        </div>
      </div>

      {/* Coordinates */}
      <div className="text-[10px] text-gray-400 dark:text-gray-500 mb-3 font-mono">
        📍 {cafe.lat.toFixed(4)}, {cafe.lng.toFixed(4)}
      </div>

      {/* Notes */}
      {cafe.notes && (
        <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
          <p className="text-xs text-gray-600 dark:text-gray-300 italic leading-relaxed">"{cafe.notes}"</p>
        </div>
      )}
    </div>
  );
}
