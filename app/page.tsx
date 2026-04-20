'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Cafe, CafeInput } from '@/types/cafe';
import { getCafes, addCafe, updateCafe, deleteCafe } from '@/lib/data';
import CafeList from '@/components/CafeList';
import CafeForm from '@/components/CafeForm';
import DetailPanel from '@/components/DetailPanel';

// Dynamically import map and chart to avoid SSR issues with Leaflet/recharts
const CafeMap = dynamic(() => import('@/components/CafeMap'), { ssr: false });
const WifiChart = dynamic(() => import('@/components/WifiChart'), { ssr: false });

type View = 'list' | 'add' | 'edit';

export default function Home() {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [view, setView] = useState<View>('list');
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [editingCafe, setEditingCafe] = useState<Cafe | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20, 0]);
  const [darkMode, setDarkMode] = useState(false);

  // Initialize dark mode from localStorage and system preference
  useEffect(() => {
    const stored = localStorage.getItem('nomad-cafe-dark');
    if (stored !== null) {
      setDarkMode(stored === 'true');
    } else {
      setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  // Apply dark class to html element
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('nomad-cafe-dark', String(darkMode));
  }, [darkMode]);

  const loadCafes = useCallback(() => {
    const data = getCafes();
    setCafes(data);
  }, []);

  useEffect(() => {
    loadCafes();
  }, [loadCafes]);

  const handleAdd = (data: CafeInput) => {
    const newCafe = addCafe(data);
    setCafes(prev => [...prev, newCafe]);
    setView('list');
    setSelectedCafe(newCafe);
    setMapCenter([newCafe.lat, newCafe.lng]);
  };

  const handleUpdate = (data: CafeInput) => {
    if (!editingCafe) return;
    const updated = updateCafe(editingCafe.id, data);
    if (updated) {
      setCafes(prev => prev.map(c => c.id === updated.id ? updated : c));
      setSelectedCafe(updated);
      setMapCenter([updated.lat, updated.lng]);
    }
    setEditingCafe(null);
    setView('list');
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this cafe?')) return;
    deleteCafe(id);
    setCafes(prev => prev.filter(c => c.id !== id));
    if (selectedCafe?.id === id) setSelectedCafe(null);
    setEditingCafe(null);
    setView('list');
  };

  const handleSelect = (cafe: Cafe) => {
    setSelectedCafe(cafe);
    setMapCenter([cafe.lat, cafe.lng]);
  };

  const handleEdit = (cafe: Cafe) => {
    setEditingCafe(cafe);
    setView('edit');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">🌍 Digital Nomad Cafe Map</h1>
            <p className="text-blue-100 text-xs mt-0.5">Find the perfect cafe to work from anywhere</p>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setDarkMode(prev => !prev)}
              className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            {view === 'list' && (
              <button
                onClick={() => setView('add')}
                className="bg-white text-blue-600 px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-50 transition-colors"
              >
                + Add Cafe
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Stats Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{cafes.length}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Cafes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {cafes.length > 0 ? (cafes.reduce((s, c) => s + c.wifiQuality, 0) / cafes.length).toFixed(1) : '0'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Avg WiFi</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {cafes.filter(c => c.quietness === 3).length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Quiet</div>
                </div>
              </div>
            </div>

            {/* WiFi Chart */}
            {cafes.length > 0 && (
              <WifiChart cafes={cafes} />
            )}

            {/* Detail Panel - shows when a cafe is selected */}
            {selectedCafe && view === 'list' && (
              <DetailPanel
                cafe={selectedCafe}
                onClose={() => setSelectedCafe(null)}
              />
            )}

            {/* Panel */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              {view === 'list' && (
                <CafeList
                  cafes={cafes}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onSelect={handleSelect}
                />
              )}

              {view === 'add' && (
                <div>
                  <h2 className="text-base font-semibold mb-3 text-gray-900 dark:text-white">Add New Cafe</h2>
                  <CafeForm
                    onSubmit={handleAdd}
                    onCancel={() => setView('list')}
                  />
                </div>
              )}

              {view === 'edit' && editingCafe && (
                <div>
                  <h2 className="text-base font-semibold mb-3 text-gray-900 dark:text-white">Edit Cafe</h2>
                  <CafeForm
                    cafe={editingCafe}
                    onSubmit={handleUpdate}
                    onCancel={() => { setEditingCafe(null); setView('list'); }}
                  />
                  <button
                    onClick={() => handleDelete(editingCafe.id)}
                    className="mt-3 w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md py-2 text-sm transition-colors"
                  >
                    Delete this cafe
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            <div className="h-[500px] lg:h-[600px]">
              <CafeMap
                cafes={cafes}
                center={mapCenter}
                onMarkerClick={handleSelect}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-xs text-gray-400 dark:text-gray-500">
          Built for digital nomads · Data stored locally in your browser
        </div>
      </footer>
    </div>
  );
}
