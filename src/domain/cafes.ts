import type {
  AdminStats,
  Cafe,
  CafeFilters,
  CafeInput,
  Review,
  ReviewInput,
  VerificationInput,
} from './types';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * 計算工作分數
 * wifi 30% + 安靜 30% + 插座 20% + 價格 10% + 友善 10% = 100%
 * 評分欄位為 0 (=「未知」), 該維度取得 0 分但 weight 仍佔 (該維度給 0 分)
 * 完全沒評分 = 0 分; 完全滿分 = 100 分
 */
export function calculateWorkScore(cafe: Cafe): number {
  const wifi = clamp(cafe.wifiMbps / 100, 0, 1) * 30;
  const quiet = clamp(cafe.quietScore / 5, 0, 1) * 30;
  const outlets = clamp(cafe.outletRate / 100, 0, 1) * 20;
  const price = (1 - clamp((cafe.priceMedian - 80) / 320, 0, 1)) * 10;
  const friendliness = clamp(cafe.friendliness / 5, 0, 1) * 10;
  return Math.round(wifi + quiet + outlets + price + friendliness);
}

export function aggregateReviews(reviews: Review[]): { count: number; average: number } {
  if (reviews.length === 0) return { count: 0, average: 0 };
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return { count: reviews.length, average: Math.round((total / reviews.length) * 10) / 10 };
}

export function isUnlockActive(unlockUntil: string | null, now = new Date()): boolean {
  if (!unlockUntil) return false;
  return new Date(unlockUntil).getTime() > now.getTime();
}

/**
 * 公開版: 永遠允許存取所有店家
 * (老邏輯: 前 3 間免費, 第 4 間起要 unlock — 已棄用)
 */
export function canAccessCafe(_index: number, _unlockUntil?: string | null, _now?: Date): boolean {
  return true;
}

/**
 * 篩選咖啡廳
 * 0 評分 = 未知, 視為「通過」篩選
 */
export function filterAndSortCafes(cafes: Cafe[], filters: CafeFilters): Cafe[] {
  const query = filters.query.trim().toLocaleLowerCase();
  return cafes
    .filter((cafe) => cafe.status !== 'closed')
    .filter((cafe) => filters.cityId === 'all' || cafe.cityId === filters.cityId)
    .filter((cafe) => {
      if (!query) return true;
      const extra = (cafe as Cafe & { brand?: string | null }).brand ?? '';
      const haystack = `${cafe.name} ${cafe.address} ${cafe.cityName} ${extra}`.toLocaleLowerCase();
      return haystack.includes(query);
    })
    .filter((cafe) => cafe.wifiMbps === 0 || cafe.wifiMbps >= filters.minWifi)
    .filter((cafe) => cafe.quietScore === 0 || cafe.quietScore >= filters.minQuiet)
    .filter((cafe) => cafe.outletRate === 0 || cafe.outletRate >= filters.minOutlets)
    .sort((left, right) => {
      if (filters.sortBy === 'wifi') {
        if (left.wifiMbps === 0 && right.wifiMbps === 0) return 0;
        if (left.wifiMbps === 0) return 1;
        if (right.wifiMbps === 0) return -1;
        return right.wifiMbps - left.wifiMbps;
      }
      if (filters.sortBy === 'verified') return right.verifierCount - left.verifierCount;
      // workScore: 無評分 (workScore=0) 一律排最後
      const ls = calculateWorkScore(left);
      const rs = calculateWorkScore(right);
      if (ls === 0 && rs === 0) return 0;
      if (ls === 0) return 1;
      if (rs === 0) return -1;
      return rs - ls;
    });
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

export function formatRelativeDate(value: string, now = new Date()): string {
  const millisecondsPerDay = 86_400_000;
  const days = Math.max(0, Math.floor((now.getTime() - new Date(value).getTime()) / millisecondsPerDay));
  return days === 0 ? '今天驗證' : `${days} 天前驗證`;
}

export function validateCafeInput(input: CafeInput): string[] {
  const errors: string[] = [];
  if (!input.name.trim()) errors.push('請輸入店名');
  if (!input.address.trim()) errors.push('請輸入地址');
  if (input.lat < -90 || input.lat > 90) errors.push('緯度需介於 -90 與 90');
  if (input.lng < -180 || input.lng > 180) errors.push('經度需介於 -180 與 180');
  if (input.wifiMbps < 0) errors.push('WiFi 速度不可為負數');
  if (input.quietScore < 1 || input.quietScore > 5) errors.push('安靜度需介於 1 與 5');
  if (input.outletRate < 0 || input.outletRate > 100) errors.push('插座率需介於 0 與 100');
  if (input.friendliness < 1 || input.friendliness > 5) errors.push('久坐友善度需介於 1 與 5');
  return errors;
}

export function validateReviewInput(input: ReviewInput): string[] {
  const errors: string[] = [];
  if (!input.author.trim()) errors.push('請輸入顯示名稱');
  if (input.rating < 1 || input.rating > 5) errors.push('評分需介於 1 與 5');
  if (input.comment.trim().length < 6) errors.push('評論至少需要 6 個字');
  return errors;
}

export function validateVerificationInput(input: VerificationInput): string[] {
  const errors: string[] = [];
  if (input.wifiMbps < 0) errors.push('WiFi 速度不可為負數');
  if (input.quietScore < 1 || input.quietScore > 5) errors.push('安靜度需介於 1 與 5');
  if (input.outletRate < 0 || input.outletRate > 100) errors.push('插座率需介於 0 與 100');
  if (input.friendliness < 1 || input.friendliness > 5) errors.push('久坐友善度需介於 1 與 5');
  if (!input.photoName.trim()) errors.push('請提供至少一張座位照片');
  return errors;
}

/**
 * 創建一個 Review 物件
 * 注: 從測試看, signature 是 createReview(cafeId, input, genId?, now?)
 */
export function createReview(
  cafeId: string,
  input: ReviewInput,
  genId: () => string = () => `${cafeId}-review-${Date.now()}`,
  now: Date = new Date(),
): Review {
  return {
    id: genId(),
    cafeId,
    author: input.author,
    rating: input.rating,
    comment: input.comment,
    visitedAt: input.visitedAt ?? now.toISOString().slice(0, 10),
    createdAt: now.toISOString(),
  };
}

/**
 * 把 Review 加到 Cafe
 */
export function addReviewToCafe(cafe: Cafe, review: Review): Cafe {
  return { ...cafe, reviews: [...cafe.reviews, review] };
}

/**
 * 對 cafes 陣列加 review (找到對應 cafe)
 */
export function upsertCafeReview(cafes: Cafe[], review: Review): Cafe[] {
  return cafes.map((cafe) => cafe.id === review.cafeId ? addReviewToCafe(cafe, review) : cafe);
}

export function getCafeById(cafes: Cafe[], id: string): Cafe | undefined {
  return cafes.find((c) => c.id === id);
}

export function addCityReminder(reminders: string[], cityId: string): string[] {
  if (reminders.includes(cityId)) return reminders;
  if (reminders.length >= 3) return reminders;  // 最多 3 個
  return [...reminders, cityId];
}

export function removeCityReminder(reminders: string[], cityId: string): string[] {
  return reminders.filter((id) => id !== cityId);
}

export function mergeCafeCollections(seed: Cafe[], contributed: Cafe[]): Cafe[] {
  const byId = new Map<string, Cafe>();
  for (const c of seed) byId.set(c.id, c);
  for (const c of contributed) byId.set(c.id, c);
  return Array.from(byId.values());
}

export function buildAdminStats(cafes: Cafe[]): AdminStats {
  const active = cafes.filter((c) => c.status === 'active');
  const reviews = active.reduce((sum, c) => sum + c.reviews.length, 0);
  const verifications = active.reduce((sum, c) => sum + c.verifierCount, 0);
  const estimatedRevenue = Math.floor(verifications / 100) * 199;
  return {
    activeCafes: active.length,
    reviews,
    verifications,
    estimatedRevenue,
  };
}

/**
 * 套用 on-site verification, 計算新的平均
 */
export function createVerification(cafe: Cafe, input: VerificationInput): Cafe {
  const oldCount = cafe.verifierCount || 0;
  const newCount = oldCount + 1;
  const avg = (old: number, val: number) =>
    oldCount === 0 ? val : (old * oldCount + val) / newCount;

  return {
    ...cafe,
    wifiMbps: Math.round(avg(cafe.wifiMbps, input.wifiMbps)),
    quietScore: Math.round(avg(cafe.quietScore, input.quietScore) * 10) / 10,
    outletRate: Math.round(avg(cafe.outletRate, input.outletRate)),
    friendliness: Math.round(avg(cafe.friendliness, input.friendliness) * 10) / 10,
    verifierCount: newCount,
    lastVerifiedAt: new Date().toISOString(),
  };
}
