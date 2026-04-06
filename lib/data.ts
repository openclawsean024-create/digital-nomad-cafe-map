import { Cafe } from '@/types/cafe';

const STORAGE_KEY = 'nomad-cafes';

const sampleCafes: Cafe[] = [
  {
    id: '1',
    name: 'Workation Space Bangkok',
    address: '123 Sukhumvit Road, Bangkok, Thailand',
    lat: 13.7563,
    lng: 100.5018,
    wifiQuality: 5,
    powerOutlets: 3,
    quietness: 3,
    notes: 'Great co-working cafe with fast WiFi and plenty of outlets. Perfect for long work sessions.',
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: '2',
    name: 'Digital Nomad Hub Bali',
    address: '456 Canggu Beach, Bali, Indonesia',
    lat: -8.6478,
    lng: 115.1385,
    wifiQuality: 4,
    powerOutlets: 2,
    quietness: 2,
    notes: 'Beachside cafe with good vibes. Can get crowded on weekends.',
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: '3',
    name: 'Taipei Remote Office',
    address: '78 Xinyi Road, Taipei, Taiwan',
    lat: 25.0330,
    lng: 121.5654,
    wifiQuality: 5,
    powerOutlets: 3,
    quietness: 3,
    notes: 'Quiet neighborhood cafe with amazing Taiwanese tea and fast fiber internet.',
    createdAt: Date.now() - 86400000,
  },
];

export function getCafes(): Cafe[] {
  if (typeof window === 'undefined') return sampleCafes;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    saveCafes(sampleCafes);
    return sampleCafes;
  }
  return JSON.parse(stored);
}

export function saveCafes(cafes: Cafe[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cafes));
}

export function addCafe(cafe: Omit<Cafe, 'id' | 'createdAt'>): Cafe {
  const cafes = getCafes();
  const newCafe: Cafe = {
    ...cafe,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  saveCafes([...cafes, newCafe]);
  return newCafe;
}

export function updateCafe(id: string, updates: Partial<Omit<Cafe, 'id' | 'createdAt'>>): Cafe | null {
  const cafes = getCafes();
  const index = cafes.findIndex(c => c.id === id);
  if (index === -1) return null;
  cafes[index] = { ...cafes[index], ...updates };
  saveCafes(cafes);
  return cafes[index];
}

export function deleteCafe(id: string): boolean {
  const cafes = getCafes();
  const filtered = cafes.filter(c => c.id !== id);
  if (filtered.length === cafes.length) return false;
  saveCafes(filtered);
  return true;
}
