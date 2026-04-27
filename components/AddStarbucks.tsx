'use client';

import { useState } from 'react';
import { Cafe } from '@/types/cafe';

const STARBUCKS_TAIWAN: Omit<Cafe, 'id' | 'createdAt'>[] = [
  // Taipei
  { name: '星巴克台北時代寓所', address: '台北市大安區信義路四段33號', lat: 25.0330, lng: 121.5654, wifiQuality: 5, powerOutlets: 3, quietness: 3, notes: 'Design hotel cafe, very quiet, excellent wifi.' },
  { name: '星巴克信義門市', address: '台北市信義區松高路12號', lat: 25.0381, lng: 121.5650, wifiQuality: 5, powerOutlets: 3, quietness: 2, notes: 'Central shopping district, spacious, reliable wifi.' },
  { name: '星巴克北車微風', address: '台北市北平西路3號（台北車站）', lat: 25.0479, lng: 121.5174, wifiQuality: 4, powerOutlets: 2, quietness: 1, notes: 'Busy station location, good for travel breaks.' },
  { name: '星巴克中山門市', address: '台北市中山區南京西路15號', lat: 25.0529, lng: 121.5590, wifiQuality: 4, powerOutlets: 2, quietness: 2, notes: 'Classic urban store, near Zhongshan metro.' },
  { name: '星巴克西門町門市', address: '台北市萬華區成都路12號', lat: 25.0425, lng: 121.5075, wifiQuality: 4, powerOutlets: 2, quietness: 1, notes: 'Youth district, often crowded but great location.' },
  { name: '星巴克內湖門市', address: '台北市內湖區洲子街68號', lat: 25.0792, lng: 121.5696, wifiQuality: 5, powerOutlets: 3, quietness: 2, notes: 'Tech campus area, quiet work-friendly.' },
  // New Taipei
  { name: '星巴克板橋車站', address: '新北市板橋區縣民大道二段7號', lat: 25.0142, lng: 121.5152, wifiQuality: 4, powerOutlets: 2, quietness: 2, notes: 'Station store, moderate noise.' },
  { name: '星巴克新店門市', address: '新北市新店區北新路一段78號', lat: 24.9707, lng: 121.5421, wifiQuality: 4, powerOutlets: 3, quietness: 3, notes: 'Quiet residential area, good for long sessions.' },
  // Taichung
  { name: '星巴克台中市政店', address: '台中市西屯區惠來路一段98號', lat: 24.8012, lng: 120.6443, wifiQuality: 5, powerOutlets: 3, quietness: 2, notes: 'Business district, excellent facilities for remote work.' },
  { name: '星巴克勤美誠品', address: '台中市西區公益路68號', lat: 24.1506, lng: 120.6630, wifiQuality: 4, powerOutlets: 2, quietness: 2, notes: 'Bookstore adjacent, good atmosphere.' },
  { name: '星巴克台中站前', address: '台中市中區台灣大道一段23號', lat: 24.1368, lng: 120.6826, wifiQuality: 4, powerOutlets: 2, quietness: 2, notes: 'Central station area, busy but reliable.' },
  // Tainan
  { name: '星巴克台南小西門', address: '台南市中西區西門路一段658號', lat: 22.9914, lng: 120.1962, wifiQuality: 4, powerOutlets: 3, quietness: 2, notes: 'Modern mall store, comfortable seating.' },
  { name: '星巴克台南 Focus', address: '台南市東區前鋒路21號', lat: 22.9934, lng: 120.2223, wifiQuality: 4, powerOutlets: 2, quietness: 2, notes: 'Small store, local favorite.' },
  // Kaohsiung
  { name: '星巴克高雄夢時代', address: '高雄市前鎮區中華五路789號', lat: 22.5847, lng: 120.3083, wifiQuality: 5, powerOutlets: 3, quietness: 2, notes: 'Large mall store, plenty of seating and outlets.' },
  { name: '星巴克高雄漢神巨蛋', address: '高雄市左營區博愛二路777號', lat: 22.6651, lng: 120.3128, wifiQuality: 5, powerOutlets: 3, quietness: 2, notes: 'Upscale area, very work-friendly.' },
  { name: '星巴克高雄車站', address: '高雄市三民區建國二路320號', lat: 22.6459, lng: 120.3029, wifiQuality: 4, powerOutlets: 2, quietness: 1, notes: 'Station store, busy but functional.' },
];

interface AddStarbucksProps {
  onAdd: (cafe: Cafe) => void;
}

export default function AddStarbucks({ onAdd }: AddStarbucksProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  const handleAdd = () => {
    if (selected === null) return;
    const template = STARBUCKS_TAIWAN[selected];
    const newCafe: Cafe = {
      ...template,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    onAdd(newCafe);
    setSelected(null);
    setOpen(false);
  };

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 rounded-md text-xs font-medium transition-colors"
      >
        ☕ Add Starbucks Taiwan
      </button>

      {open && (
        <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 overflow-hidden">
          <div className="p-2 bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 dark:text-gray-400">
            Select a store to add to your map
          </div>
          <div className="max-h-64 overflow-y-auto">
            {STARBUCKS_TAIWAN.map((sb, i) => (
              <label
                key={i}
                className={`flex items-start gap-2 p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 last:border-0 ${selected === i ? 'bg-green-50 dark:bg-green-900/20' : ''}`}
              >
                <input
                  type="radio"
                  name="starbucks"
                  value={i}
                  checked={selected === i}
                  onChange={() => setSelected(i)}
                  className="mt-0.5 shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-gray-900 dark:text-white">{sb.name}</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">{sb.address}</div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                    📶 {sb.wifiQuality}/5 · 🔌 {sb.powerOutlets === 3 ? 'Every table' : sb.powerOutlets === 2 ? 'Usually' : 'Limited'} · {sb.quietness === 3 ? '😌' : sb.quietness === 2 ? '😐' : '🔊'}
                  </div>
                </div>
              </label>
            ))}
          </div>
          <div className="p-2 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleAdd}
              disabled={selected === null}
              className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md text-xs font-medium transition-colors"
            >
              Add to Map
            </button>
          </div>
        </div>
      )}
    </div>
  );
}