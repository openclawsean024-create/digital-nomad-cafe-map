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
// 顯示為「尚無評分」, 並鼓勵使用者評分
//
// 排序: 連鎖品牌優先 (使用者最常查的), 同品牌內按縣市排, 獨立店排最後但地理均勻分布
// 這避免「所有 0 分南投排前面」這種 UI bug
const CITY_LATLNG_ORDER: Record<string, number> = {
  taipei: 0, newtaipei: 1, taoyuan: 2, taichung: 3, tainan: 4, kaohsiung: 5,
  yilan: 6, hsinchu_city: 7, hsinchu: 8, miaoli: 9, changhua: 10, nantou: 11,
  yunlin: 12, chiayi_city: 13, chiayi: 14, pingtung: 15, taitung: 16, hualien: 17,
  keelung: 18, penghu: 19, kinmen: 20, matsu: 21,
};

// 主要連鎖 (使用者最容易查的連鎖咖啡品牌, 排前面)
const PREFERRED_BRANDS = [
  '星巴克', '85度C', '路易莎咖啡', 'cama', '伯朗', '怡客', '丹堤',
  '客美多咖啡', '西雅圖極品咖啡', '黑沃', 'Mövenpick', '多那之咖啡',
];

function brandPriority(brand: string | null | undefined): number {
  if (!brand) return 100;
  for (let i = 0; i < PREFERRED_BRANDS.length; i++) {
    if (brand.includes(PREFERRED_BRANDS[i]) || PREFERRED_BRANDS[i].includes(brand)) {
      return i;
    }
  }
  return 50;  // 其他連鎖
}

export const seedCafes: Cafe[] = allCafes
  .map((c) => ({
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
  } as Cafe & { phone?: string; website?: string; brand?: string; hasWifi?: boolean }))
  // 預設排序: 主要連鎖 → 其他連鎖 → 獨立店
  // 同類型內按 縣市 (北→南) → 店名
  .sort((a, b) => {
    const ap = brandPriority((a as Cafe & { brand?: string | null }).brand);
    const bp = brandPriority((b as Cafe & { brand?: string | null }).brand);
    if (ap !== bp) return ap - bp;
    const ao = CITY_LATLNG_ORDER[a.cityId] ?? 50;
    const bo = CITY_LATLNG_ORDER[b.cityId] ?? 50;
    if (ao !== bo) return ao - bo;
    return a.name.localeCompare(b.name, 'zh');
  });
