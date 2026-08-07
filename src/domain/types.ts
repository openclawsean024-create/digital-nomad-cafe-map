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

// 擴展 Cafe 欄位: 加上 phone/website/brand/hasWifi 等公開資訊
// wifiMbps 等評分欄位可以是 0 (= 未知; 介面顯示「尚無評分」)
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
  // 公開版擴展欄位
  phone?: string | null;
  website?: string | null;
  brand?: string | null;
  hasWifi?: boolean;
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
