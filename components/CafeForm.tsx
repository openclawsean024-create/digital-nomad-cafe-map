'use client';

import { useState, useEffect } from 'react';
import { Cafe, CafeInput } from '@/types/cafe';

interface CafeFormProps {
  cafe?: Cafe;
  onSubmit: (data: CafeInput) => void;
  onCancel: () => void;
}

const initialData: CafeInput = {
  name: '',
  address: '',
  lat: 0,
  lng: 0,
  wifiQuality: 3,
  powerOutlets: 2,
  quietness: 2,
  notes: '',
};

export default function CafeForm({ cafe, onSubmit, onCancel }: CafeFormProps) {
  const [data, setData] = useState<CafeInput>(initialData);
  const [geoError, setGeoError] = useState('');

  useEffect(() => {
    if (cafe) {
      setData({
        name: cafe.name,
        address: cafe.address,
        lat: cafe.lat,
        lng: cafe.lng,
        wifiQuality: cafe.wifiQuality,
        powerOutlets: cafe.powerOutlets,
        quietness: cafe.quietness,
        notes: cafe.notes,
      });
    }
  }, [cafe]);

  const handleLocationDetect = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported');
      return;
    }
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setData(d => ({ ...d, lat: pos.coords.latitude, lng: pos.coords.longitude }));
      },
      () => setGeoError('Could not get location')
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.name.trim() || !data.address.trim()) return;
    if (data.lat === 0 && data.lng === 0) {
      setGeoError('Please set a location');
      return;
    }
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Cafe Name *</label>
        <input
          type="text"
          required
          value={data.name}
          onChange={e => setData(d => ({ ...d, name: e.target.value }))}
          placeholder="e.g. Cozy Work Cafe"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Address *</label>
        <input
          type="text"
          required
          value={data.address}
          onChange={e => setData(d => ({ ...d, address: e.target.value }))}
          placeholder="Full street address"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Location</label>
        <div className="flex gap-2 items-start mt-1">
          <div className="flex-1 grid grid-cols-2 gap-2">
            <div>
              <span className="text-xs text-gray-500">Latitude</span>
              <input
                type="number"
                step="any"
                value={data.lat || ''}
                onChange={e => setData(d => ({ ...d, lat: parseFloat(e.target.value) || 0 }))}
                placeholder="e.g. 25.033"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <span className="text-xs text-gray-500">Longitude</span>
              <input
                type="number"
                step="any"
                value={data.lng || ''}
                onChange={e => setData(d => ({ ...d, lng: parseFloat(e.target.value) || 0 }))}
                placeholder="e.g. 121.565"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleLocationDetect}
            className="mt-5 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-xs font-medium transition-colors"
          >
            📍 Use My Location
          </button>
        </div>
        {geoError && <p className="text-xs text-red-500 mt-1">{geoError}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          WiFi Quality: <span className="text-blue-600">{'★'.repeat(data.wifiQuality)}{'☆'.repeat(5 - data.wifiQuality)}</span>
        </label>
        <input
          type="range"
          min="1"
          max="5"
          value={data.wifiQuality}
          onChange={e => setData(d => ({ ...d, wifiQuality: parseInt(e.target.value) as 1|2|3|4|5 }))}
          className="mt-1 w-full accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
          <span>Poor</span><span>Excellent</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Power Outlets</label>
          <select
            value={data.powerOutlets}
            onChange={e => setData(d => ({ ...d, powerOutlets: parseInt(e.target.value) as 1|2|3 }))}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>Few (limited)</option>
            <option value={2}>Some (usually available)</option>
            <option value={3}>Plenty (every table)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Quietness</label>
          <select
            value={data.quietness}
            onChange={e => setData(d => ({ ...d, quietness: parseInt(e.target.value) as 1|2|3 }))}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>Can be loud</option>
            <option value={2}>Moderate noise</option>
            <option value={3}>Very quiet</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          value={data.notes}
          onChange={e => setData(d => ({ ...d, notes: e.target.value }))}
          placeholder="Good for meetings, has good food, etc."
          rows={3}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md py-2 text-sm font-medium transition-colors"
        >
          {cafe ? 'Update Cafe' : 'Add Cafe'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md py-2 text-sm font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
