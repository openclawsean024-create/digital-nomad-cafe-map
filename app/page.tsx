'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Cafe, CafeInput } from '@/types/cafe';
import { getCafes, addCafe, updateCafe, deleteCafe } from '@/lib/data';
import CafeList from '@/components/CafeList';
import CafeForm from '@/components/CafeForm';

// Dynamically import map to avoid SSR issues with Leaflet
const CafeMap = dynamic(() => import('@/components/CafeMap'), { ssr: false });

type View = 'list' | 'add' | 'edit';

export default function Home() {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [view, setView] = useState<View>('list');
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [editingCafe, setEditingCafe] = useState<Cafe | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20, 0]);

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">🌍 Digital Nomad Cafe Map</h1>
            <p className="text-blue-100 text-xs mt-0.5">Find the perfect cafe to work from anywhere</p>
          </div>
          <div className="flex gap-2">
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
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{cafes.length}</div>
                  <div className="text-xs text-gray-500">Cafes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {cafes.length > 0 ? (cafes.reduce((s, c) => s + c.wifiQuality, 0) / cafes.length).toFixed(1) : '0'}
                  </div>
                  <div className="text-xs text-gray-500">Avg WiFi</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {cafes.filter(c => c.quietness === 3).length}
                  </div>
                  <div className="text-xs text-gray-500">Quiet</div>
                </div>
              </div>
            </div>

            {/* Panel */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              {view === 'list' && (
                <>
                  <CafeList
                    cafes={cafes}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onSelect={handleSelect}
                  />
                  {selectedCafe && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-semibold text-gray-700">Selected</h3>
                        <button
                          onClick={() => setSelectedCafe(null)}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="bg-blue-50 rounded-md p-3">
                        <h4 className="font-medium text-sm">{selectedCafe.name}</h4>
                        <p className="text-xs text-gray-600 mt-0.5">{selectedCafe.address}</p>
                        <div className="flex gap-4 mt-2 text-xs">
                          <span>📶 {'★'.repeat(selectedCafe.wifiQuality)}{'☆'.repeat(5 - selectedCafe.wifiQuality)}</span>
                          <span>🔌 {'★★★'.slice(0, selectedCafe.powerOutlets)}</span>
                          <span>{selectedCafe.quietness === 3 ? '😌' : selectedCafe.quietness === 2 ? '😐' : '🔊'}</span>
                        </div>
                        {selectedCafe.notes && (
                          <p className="text-xs text-gray-600 mt-1.5 italic">"{selectedCafe.notes}"</p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {view === 'add' && (
                <div>
                  <h2 className="text-base font-semibold mb-3">Add New Cafe</h2>
                  <CafeForm
                    onSubmit={handleAdd}
                    onCancel={() => setView('list')}
                  />
                </div>
              )}

              {view === 'edit' && editingCafe && (
                <div>
                  <h2 className="text-base font-semibold mb-3">Edit Cafe</h2>
                  <CafeForm
                    cafe={editingCafe}
                    onSubmit={handleUpdate}
                    onCancel={() => { setEditingCafe(null); setView('list'); }}
                  />
                  <button
                    onClick={() => handleDelete(editingCafe.id)}
                    className="mt-3 w-full text-red-500 hover:bg-red-50 border border-red-200 rounded-md py-2 text-sm transition-colors"
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
      <footer className="border-t border-gray-200 bg-white mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-xs text-gray-400">
          Built for digital nomads · Data stored locally in your browser
        </div>
      </footer>
    </div>
  );
}
