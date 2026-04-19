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
  {
    id: '4',
    name: 'Starbucks Reserve Tokyo',
    address: '2-7-3 Marunouchi, Chiyoda City, Tokyo, Japan',
    lat: 35.6812,
    lng: 139.7671,
    wifiQuality: 5,
    powerOutlets: 3,
    quietness: 3,
    notes: 'Premium Starbucks with excellent wifi and extremely quiet atmosphere. Perfect for focused work.',
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    id: '5',
    name: 'Blue Bottle Shibuya',
    address: '4-26-3 Shibuya, Shibuya City, Tokyo, Japan',
    lat: 35.6617,
    lng: 139.7047,
    wifiQuality: 5,
    powerOutlets: 2,
    quietness: 2,
    notes: 'Minimalist design, great coffee, and reliable WiFi. Popular with remote workers.',
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: '6',
    name: 'Paul Bassett Hongdae',
    address: '364-2 Seogyo-dong, Mapo-gu, Seoul, South Korea',
    lat: 37.5568,
    lng: 126.9231,
    wifiQuality: 4,
    powerOutlets: 3,
    quietness: 2,
    notes: 'Korean specialty coffee chain with spacious seating. Great for afternoon work sessions.',
    createdAt: Date.now() - 86400000 * 6,
  },
  {
    id: '7',
    name: 'Coffee Bean & Tea Leaf MRT',
    address: 'Amber at MRT SS3, Petaling Jaya, Malaysia',
    lat: 3.0764,
    lng: 101.5178,
    wifiQuality: 4,
    powerOutlets: 3,
    quietness: 3,
    notes: 'Air-conditioned, reliable WiFi, plenty of power outlets near MRT station. Great for digital nomads.',
    createdAt: Date.now() - 86400000 * 7,
  },
  {
    id: '8',
    name: 'Starbucks Central World',
    address: 'Central World Plaza, Bangkok, Thailand',
    lat: 13.7468,
    lng: 100.5398,
    wifiQuality: 4,
    powerOutlets: 2,
    quietness: 1,
    notes: 'Large flagship store in the heart of Bangkok. Gets busy but has dedicated work area upstairs.',
    createdAt: Date.now() - 86400000 * 8,
  },
  {
    id: '9',
    name: 'Gong Cha Urban Cafe',
    address: '2F No. 1 Songzhi Road, Taipei, Taiwan',
    lat: 25.0418,
    lng: 121.5625,
    wifiQuality: 5,
    powerOutlets: 3,
    quietness: 2,
    notes: 'Bubble tea meets co-working space. Free WiFi with QR code, comfortable seating, and boba!',
    createdAt: Date.now() - 86400000 * 9,
  },
  {
    id: '10',
    name: 'Glitch Coffee Koishi',
    address: '3-13-7 Ginza, Chuo City, Tokyo, Japan',
    lat: 35.6714,
    lng: 139.7649,
    wifiQuality: 3,
    powerOutlets: 1,
    quietness: 3,
    notes: 'Specialty coffee roaster with a quiet, focused atmosphere. Limited outlets but excellent for coffee lovers.',
    createdAt: Date.now() - 86400000 * 10,
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
