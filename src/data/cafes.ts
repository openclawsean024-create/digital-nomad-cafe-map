import type { Cafe, City, Review } from '@/domain/types';
import { allCafes, allCities } from './cafes-data';

// 從 OSM 真實資料擴展成 Cafe 格式
// 注意: 因為真實資料沒有結構化 wifi/安靜度 評分,這些欄位都是 null
// 用戶可透過 UI 留下評分,但預設是「未知」狀態

export const cities: City[] = allCities.map((c) => ({
  id: c.id,
  name: c.name,
  country: c.country,
  countryCode: c.countryCode,
  lat: c.lat,
  lng: c.lng,
  pilot: c.pilot,
}));

// 預設 5 維評分為「null」代表「未知」,不顯示在工作分數中
// 顯示為「尚無評分」,並鼓勵使用者評分
export const seedCafes: Cafe[] = allCafes.map((c) => ({
  id: c.id,
  name: c.name,
  address: c.address,
  cityId: c.cityId,
  cityName: c.cityName,
  country: c.country,
  countryCode: c.countryCode,
  lat: c.lat,
  lng: c.lng,
  wifiMbps: c.wifiMbps ?? 0,
  quietScore: c.quietScore ?? 0,
  outletRate: c.outletRate ?? 0,
  priceMedian: c.priceMedian ?? 0,
  friendliness: c.friendliness ?? 0,
  verifierCount: c.verifierCount,
  status: c.status as 'active',
  hours: c.hours ?? '營業時間請見店家公告',
  tags: c.tags,
  reviews: c.reviews as Review[],
  createdAt: c.createdAt,
  lastVerifiedAt: c.lastVerifiedAt ?? c.createdAt,
  // 擴展欄位（給前端使用）
  phone: c.phone,
  website: c.website,
  brand: c.brand,
  hasWifi: c.hasWifi,
} as Cafe & { phone?: string; website?: string; brand?: string; hasWifi?: boolean }));
