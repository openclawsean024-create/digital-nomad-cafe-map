'use client';

import { useState } from 'react';
import { Cafe } from '@/types/cafe';

interface CafeListProps {
  cafes: Cafe[];
  onEdit: (cafe: Cafe) => void;
  onDelete: (id: string) => void;
  onSelect: (cafe: Cafe) => void;
}

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="text-green-600">
      {'★'.repeat(value)}{'☆'.repeat(max - value)}
    </span>
  );
}

export default function CafeList({ cafes, onEdit, onDelete, onSelect }: CafeListProps) {
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

  if (cafes.length === 0) {
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
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as 'name' | 'wifi' | 'quiet')}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="name">Sort: Name</option>
          <option value="wifi">Sort: WiFi</option>
          <option value="quiet">Sort: Quiet</option>
        </select>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {filtered.map(cafe => (
          <div
            key={cafe.id}
            className="bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors cursor-pointer"
            onClick={() => onSelect(cafe)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-sm text-gray-900">{cafe.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{cafe.address}</p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); onEdit(cafe); }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium ml-2 shrink-0"
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
              <p className="text-xs text-gray-600 mt-1.5 italic line-clamp-1">"{cafe.notes}"</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
