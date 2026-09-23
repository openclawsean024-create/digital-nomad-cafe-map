export type CafeStatus = 'active' | 'pending_close' | 'closed';
export type SortMode = 'workScore' | 'wifi' | 'verified';
export type CafeMetric = number | null;
export type EvidenceStatus = 'imported' | 'partial' | 'verified' | 'stale';

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

// 擴展 Cafe 欄位: 加上 phone/website/brand/hasWifi 等公開資訊。
// 工作條件欄位使用 null 表示「尚未觀察」；0 是一個實際數值，不再拿來當未知值。
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
  wifiMbps: CafeMetric;
  quietScore: CafeMetric;
  outletRate: CafeMetric;
  priceMedian: CafeMetric;
  friendliness: CafeMetric;
  verifierCount: number;
  status: CafeStatus;
  hours: string;
  tags: string[];
  reviews: Review[];
  createdAt: string;
  lastVerifiedAt: string | null;
  // 公開版擴展欄位
  phone?: string | null;
  website?: string | null;
  brand?: string | null;
  hasWifi?: boolean;
}

export type CafeInput = Omit<Cafe, 'id' | 'reviews' | 'createdAt' | 'lastVerifiedAt' | 'verifierCount' | 'status' | 'wifiMbps' | 'quietScore' | 'outletRate' | 'priceMedian' | 'friendliness'> & {
  wifiMbps: number;
  quietScore: number;
  outletRate: number;
  priceMedian: number;
  friendliness: number;
};

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
