export interface Cafe {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  wifiQuality: 1 | 2 | 3 | 4 | 5; // 1=poor, 5=excellent
  powerOutlets: 1 | 2 | 3; // 1=few, 2=some, 3=plenty
  quietness: 1 | 2 | 3; // 1=loud, 2=moderate, 3=quiet
  notes: string;
  createdAt: number;
}

export type CafeInput = Omit<Cafe, 'id' | 'createdAt'>;
