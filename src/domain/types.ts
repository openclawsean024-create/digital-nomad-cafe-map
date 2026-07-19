export type CafeStatus = 'active' | 'pending_close' | 'closed';
export type SortMode = 'workScore' | 'wifi' | 'verified';

export interface City {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  pilot: boolean;
}

export interface Review {
  id: string;
  cafeId: string;
  author: string;
  rating: number;
  comment: string;
  visitedAt: string;
  createdAt: string;
}

export interface Cafe {
  id: string;
  name: string;
  address: string;
  cityId: string;
  cityName: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  wifiMbps: number;
  quietScore: number;
  outletRate: number;
  priceMedian: number;
  friendliness: number;
  verifierCount: number;
  status: CafeStatus;
  hours: string;
  tags: string[];
  reviews: Review[];
  createdAt: string;
  lastVerifiedAt: string;
}

export type CafeInput = Omit<Cafe, 'id' | 'reviews' | 'createdAt' | 'lastVerifiedAt' | 'verifierCount' | 'status'>;

export interface ReviewInput {
  author: string;
  rating: number;
  comment: string;
  visitedAt?: string;
}

export interface VerificationInput {
  wifiMbps: number;
  quietScore: number;
  outletRate: number;
  friendliness: number;
  photoName: string;
}

export interface CafeFilters {
  cityId: string;
  query: string;
  minWifi: number;
  minQuiet: number;
  minOutlets: number;
  sortBy: SortMode;
}

export interface AdminStats {
  activeCafes: number;
  reviews: number;
  verifications: number;
  estimatedRevenue: number;
}
