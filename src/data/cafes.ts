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

// 縣市北→南排序
const CITY_LATLNG_ORDER: Record<string, number> = {
  taipei: 0, newtaipei: 1, taoyuan: 2, taichung: 3, tainan: 4, kaohsiung: 5,
  yilan: 6, hsinchu_city: 7, hsinchu: 8, miaoli: 9, changhua: 10, nantou: 11,
  yunlin: 12, chiayi_city: 13, chiayi: 14, pingtung: 15, taitung: 16, hualien: 17,
  keelung: 18, penghu: 19, kinmen: 20, matsu: 21,
};

// 主要連鎖品牌優先 (使用者最容易查的)
const PREFERRED_BRANDS = [
  '星巴克', '85度C', '路易莎咖啡', 'cama', '伯朗', '怡客', '丹堤',
  '客美多咖啡', '西雅圖極品咖啡', '黑沃', 'Mövenpick', '多那之咖啡',
];

function brandPriority(brand: string | null | undefined): number {
  if (!brand) return 100;  // 獨立店
  for (let i = 0; i < PREFERRED_BRANDS.length; i++) {
    if (brand.includes(PREFERRED_BRANDS[i]) || PREFERRED_BRANDS[i].includes(brand)) {
      return i;
    }
  }
  return 50;  // 其他連鎖
}

// 將 OSM 資料轉成 Cafe 物件
const mappedCafes: MappedCafe[] = allCafes.map((c) => ({
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
  phone: c.phone,
  website: c.website,
  brand: c.brand,
  hasWifi: c.hasWifi,
} as Cafe & { phone?: string; website?: string; brand?: string; hasWifi?: boolean }));

// 排序策略 (round-robin by brand priority group):
// 1. 將所有 cafes 依 brandPriority 分組
// 2. 同 priority 內, 按 縣市 (北→南) → 店名
// 3. round-robin 合併: 從 priority 0 取 1 個, priority 1 取 1 個, ... 然後 priority 0 取下 1 個
// 4. 全部取完後, 剩下的獨立店依 縣市 → 店名 排
//
// 這確保 SSR 顯示的前 200 間, 會均勻混合各品牌 + 各縣市, 而不是全部星巴克

type MappedCafe = Cafe & { phone?: string | null; website?: string | null; brand?: string | null; hasWifi?: boolean };

function sortCafesRoundRobin(cafes: MappedCafe[]): MappedCafe[] {
  // Step 1: 分組
  const groups = new Map<number, MappedCafe[]>();
  for (const cafe of cafes) {
    const p = brandPriority(cafe.brand);
    if (!groups.has(p)) groups.set(p, []);
    groups.get(p)!.push(cafe);
  }

  // Step 2: 每組內部 sort (北→南, 然後店名)
  groups.forEach((group) => {
    group.sort((a, b) => {
      const ao = CITY_LATLNG_ORDER[a.cityId] ?? 50;
      const bo = CITY_LATLNG_ORDER[b.cityId] ?? 50;
      if (ao !== bo) return ao - bo;
      return a.name.localeCompare(b.name, 'zh');
    });
  });

  // Step 3: round-robin 合併 (priority 0 優先, 然後輪詢)
  const sortedPriorities = Array.from(groups.keys()).sort((a, b) => a - b);
  const result: MappedCafe[] = [];
  const cursors = new Map<number, number>();
  for (const p of sortedPriorities) cursors.set(p, 0);

  // 一輪一輪抽, 每輪從每組抽 1 個
  let totalRemaining = cafes.length;
  while (totalRemaining > 0) {
    let consumed = 0;
    for (const p of sortedPriorities) {
      const group = groups.get(p)!;
      const cursor = cursors.get(p)!;
      if (cursor < group.length) {
        result.push(group[cursor]);
        cursors.set(p, cursor + 1);
        totalRemaining--;
        consumed++;
      }
    }
    if (consumed === 0) break;  // safety
  }

  return result;
}

export const seedCafes: Cafe[] = sortCafesRoundRobin(mappedCafes) as unknown as Cafe[];
