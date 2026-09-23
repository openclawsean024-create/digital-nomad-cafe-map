'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import type { Cafe } from '@/domain/types';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

interface WorkspaceMapProps {
  cafes: Cafe[];
  selectedId: string | null;
  onSelect: (cafeId: string) => void;
}

/**
 * Wraps the legacy MapView with a fallback banner. If the map fails to
 * initialise (offline, no WebGL, blocked script), we still keep the list
 * view usable — that's SPEC §4.7 ("list 必須在 map 失效時仍可用").
 */
export function WorkspaceMap({ cafes, selectedId, onSelect }: WorkspaceMapProps) {
  const [mapFailed, setMapFailed] = useState(false);

  useEffect(() => {
    const handle = (event: ErrorEvent) => {
      if (event.message?.toLowerCase().includes('leaflet')) {
        setMapFailed(true);
      }
    };
    window.addEventListener('error', handle);
    return () => window.removeEventListener('error', handle);
  }, []);

  if (mapFailed) {
    return (
      <div
        className="cw-map-fallback"
        role="status"
        data-testid="map-fallback"
      >
        <h2>地圖暫時無法載入</h2>
        <p>
          已自動切換到<strong>列表優先</strong>。你可以從左側的卡片繼續瀏覽,
          不會失去任何資料或互動。
        </p>
        <button
          type="button"
          className="cw-btn cw-btn--ghost"
          onClick={() => setMapFailed(false)}
        >
          重新嘗試載入地圖
        </button>
      </div>
    );
  }

  // MapView is legacy and passes the whole Cafe through onSelect; our
  // public explorer uses cafeId so we wrap it back here.
  const handleMapSelect = (cafe: Cafe) => onSelect(cafe.id);

  return (
    <div className="cw-map" data-testid="explorer-map">
      <MapView
        cafes={cafes}
        selectedId={selectedId}
        selectedCity={undefined}
        onSelect={handleMapSelect}
      />
    </div>
  );
}
