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

export function calculateWorkScore(cafe: Cafe): number {
  const wifi = clamp(cafe.wifiMbps / 100, 0, 1) * 30;
  const quiet = clamp(cafe.quietScore / 5, 0, 1) * 30;
  const outlets = clamp(cafe.outletRate / 100, 0, 1) * 20;
  const price = (1 - clamp((cafe.priceMedian - 80) / 320, 0, 1)) * 10;
  const friendliness = clamp(cafe.friendliness / 5, 0, 1) * 10;
  return Math.round(wifi + quiet + outlets + price + friendliness);
}

export function filterAndSortCafes(cafes: Cafe[], filters: CafeFilters): Cafe[] {
  const query = filters.query.trim().toLocaleLowerCase();
  return cafes
    .filter((cafe) => cafe.status !== 'closed')
    .filter((cafe) => filters.cityId === 'all' || cafe.cityId === filters.cityId)
    .filter((cafe) => !query || `${cafe.name} ${cafe.address} ${cafe.cityName}`.toLocaleLowerCase().includes(query))
    .filter((cafe) => cafe.wifiMbps >= filters.minWifi)
    .filter((cafe) => cafe.quietScore >= filters.minQuiet)
    .filter((cafe) => cafe.outletRate >= filters.minOutlets)
    .sort((left, right) => {
      if (filters.sortBy === 'wifi') return right.wifiMbps - left.wifiMbps;
      if (filters.sortBy === 'verified') return right.verifierCount - left.verifierCount;
      return calculateWorkScore(right) - calculateWorkScore(left);
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

export function isUnlockActive(validUntil: string | null, now = new Date()): boolean {
  return validUntil !== null && new Date(validUntil).getTime() > now.getTime();
}

export function canAccessCafe(cityIndex: number, validUntil: string | null, now = new Date()): boolean {
  return cityIndex < 3 || isUnlockActive(validUntil, now);
}

export function aggregateReviews(reviews: Review[]): { count: number; average: number } {
  if (reviews.length === 0) return { count: 0, average: 0 };
  const average = reviews.reduce((total, review) => total + review.rating, 0) / reviews.length;
  return { count: reviews.length, average: Math.round(average * 10) / 10 };
}

export function createReview(
  cafeId: string,
  input: ReviewInput,
  idFactory: () => string = () => crypto.randomUUID(),
  now = new Date(),
): Review {
  return {
    id: idFactory(),
    cafeId,
    author: input.author.trim(),
    rating: input.rating,
    comment: input.comment.trim(),
    visitedAt: input.visitedAt ?? now.toISOString().slice(0, 10),
    createdAt: now.toISOString(),
  };
}

export function mergeCafeCollections(seed: Cafe[], contributed: Cafe[]): Cafe[] {
  const byId = new Map(seed.map((cafe) => [cafe.id, cafe]));
  for (const cafe of contributed) byId.set(cafe.id, cafe);
  return [...byId.values()];
}

export function upsertCafeReview(cafes: Cafe[], review: Review): Cafe[] {
  return cafes.map((cafe) => cafe.id === review.cafeId ? { ...cafe, reviews: [...cafe.reviews.filter((item) => item.id !== review.id), review] } : cafe);
}

export function addCityReminder(current: string[], cityId: string): string[] {
  if (current.includes(cityId) || current.length >= 3) return current;
  return [...current, cityId];
}

export function buildAdminStats(cafes: Cafe[]): AdminStats {
  const activeCafes = cafes.filter((cafe) => cafe.status === 'active').length;
  const reviews = cafes.reduce((total, cafe) => total + cafe.reviews.length, 0);
  const verifications = cafes.reduce((total, cafe) => total + cafe.verifierCount, 0);
  return { activeCafes, reviews, verifications, estimatedRevenue: reviews * 99 + Math.floor(verifications / 3) * 199 };
}
