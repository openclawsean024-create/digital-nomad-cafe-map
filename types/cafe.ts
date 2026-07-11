export interface Cafe {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  city?: string | null;
  country?: string | null;
  wifiQuality: 1 | 2 | 3 | 4 | 5; // 1=poor, 5=excellent
  powerOutlets: 1 | 2 | 3; // 1=few, 2=some, 3=plenty
  quietness: 1 | 2 | 3; // 1=loud, 2=moderate, 3=quiet
  /** v2 擴充 (F-003b) */
  timeLimit?: 'UNLIMITED' | 'ONE_HOUR' | 'TWO_HOURS' | 'THREE_HOURS';
  seating?: 1 | 2 | 3 | 4 | 5;
  notes: string;
  createdAt: number;
}

export type CafeInput = Omit<Cafe, 'id' | 'createdAt'>;
