'use client';

import { useState } from 'react';
import { Cafe } from '@/types/cafe';
import { StarbucksStore } from '@/types/starbucks';

interface CafeListProps {
  cafes: Cafe[];
  starbucksData?: StarbucksStore[];
  showStarbucks?: boolean;
  onEdit: (cafe: Cafe) => void;
  onDelete: (id: string) => void;
  onSelect: (cafe: Cafe) => void;
  onToggleStarbucks?: (show: boolean) => void;
  onStarbucksSelect?: (store: StarbucksStore) => void;
}

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="text-green-600">
      {'★'.repeat(value)}{'☆'.repeat(max - value)}
    </span>
  );
}

export default function CafeList({
  cafes,
  starbucksData = [],
  showStarbucks = false,
  onEdit,
  onDelete,
  onSelect,
  onToggleStarbucks,
  onStarbucksSelect,
}: CafeListProps) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'wifi' | 'quiet'>('name');

  const filtered = cafes
    .filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.address.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'wifi') return b.wifiQuality - a.wifiQuality;
      if (sortBy === 'quiet') return b.quietness - a.quietness;
      return a.name.localeCompare(b.name);
    });

  const filteredStarbucks = starbucksData
    .filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.address.toLowerCase().includes(search.toLowerCase())
    );

  if (cafes.length === 0 && starbucksData.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="text-4xl mb-3">☕</div>
        <p>No cafes yet. Add your first one!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search cafes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as 'name' | 'wifi' | 'quiet')}
          className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="name">Sort: Name</option>
          <option value="wifi">Sort: WiFi</option>
          <option value="quiet">Sort: Quiet</option>
        </select>
      </div>

      {/* Starbucks toggle */}
      {starbucksData.length > 0 && (
        <button
          onClick={() => onToggleStarbucks?.(!showStarbucks)}
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            showStarbucks
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <span>★</span>
          <span>{showStarbucks ? 'Hide' : 'Show'} Starbucks ({starbucksData.length})</span>
        </button>
      )}

      {/* Starbucks list */}
      {showStarbucks && filteredStarbucks.length > 0 && (
        <>
          <div className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide px-1">
            ★ Starbucks ({filteredStarbucks.length})
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {filteredStarbucks.map(store => (
              <div
                key={store.id}
                className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 hover:border-green-400 dark:hover:border-green-500 transition-colors cursor-pointer"
                onClick={() => onStarbucksSelect?.(store)}
              >
                <div className="flex items-start gap-1.5">
                  <span className="text-green-600 font-bold text-sm shrink-0">★</span>
                  <div>
                    <h3 className="font-medium text-sm text-green-700 dark:text-green-300">{store.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{store.address}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {store.features.slice(0, 3).map(f => (
                        <span key={f} className="text-[10px] bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded">{f}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Regular cafes */}
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide px-1">
        ☕ Cafes ({filtered.length})
      </div>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {filtered.map(cafe => (
          <div
            key={cafe.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:border-blue-300 dark:hover:border-blue-500 transition-colors cursor-pointer"
            onClick={() => onSelect(cafe)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-sm text-gray-900 dark:text-white">{cafe.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{cafe.address}</p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); onEdit(cafe); }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium ml-2 shrink-0"
              >
                Edit
              </button>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs">
              <span title="WiFi Quality">
                📶 <StarRating value={cafe.wifiQuality} />
              </span>
              <span title="Power Outlets">
                🔌 {cafe.powerOutlets === 3 ? '★★★' : cafe.powerOutlets === 2 ? '★★☆' : '★☆☆'}
              </span>
              <span title="Quietness">
                {cafe.quietness === 3 ? '😌' : cafe.quietness === 2 ? '😐' : '🔊'}
              </span>
            </div>
            {cafe.notes && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 italic line-clamp-1">"{cafe.notes}"</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
