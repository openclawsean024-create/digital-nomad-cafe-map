'use client';

import { Cafe } from '@/types/cafe';

interface DetailPanelProps {
  cafe: Cafe | null;
  onClose: () => void;
  onShare?: () => void;
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

export default function DetailPanel({ cafe, onClose, onShare }: DetailPanelProps) {
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

      {/* Actions */}
      <div className="flex gap-2 mt-3 border-t border-gray-100 dark:border-gray-700 pt-3">
        {onShare && (
          <button
            onClick={onShare}
            className="flex-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-md py-1.5 text-xs font-medium transition-colors flex items-center justify-center gap-1"
          >
            🔗 Share
          </button>
        )}
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${cafe.lat},${cafe.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-md py-1.5 text-xs font-medium transition-colors flex items-center justify-center gap-1"
        >
          🗺️ Google Maps
        </a>
      </div>
    </div>
  );
}
