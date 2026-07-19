import { describe, expect, it } from 'vitest';
import {
  aggregateReviews,
  canAccessCafe,
  createReview,
  isUnlockActive,
  validateCafeInput,
  validateReviewInput,
  validateVerificationInput,
} from '@/domain/cafes';
import type { Cafe, CafeInput, Review } from '@/domain/types';

const cafe: Cafe = {
  id: 'cafe-a', name: 'Sunroom', address: '5 Main Street', cityId: 'taipei', cityName: '台北', country: '台灣', countryCode: 'TW',
  lat: 25, lng: 121, wifiMbps: 60, quietScore: 4, outletRate: 70, priceMedian: 150, friendliness: 4,
  verifierCount: 2, status: 'active', hours: '09:00–18:00', tags: [], reviews: [],
  createdAt: '2026-07-01T00:00:00.000Z', lastVerifiedAt: '2026-07-18T00:00:00.000Z',
};
const validCafeInput: CafeInput = {
  name: 'New Cafe', address: '1 New Road', cityId: 'tainan', cityName: '台南', country: '台灣', countryCode: 'TW',
  lat: 22.99, lng: 120.2, wifiMbps: 70, quietScore: 4, outletRate: 80, priceMedian: 180, friendliness: 4,
  hours: '08:00–18:00', tags: ['插座多'],
};

describe('cafe contribution validation', () => {
  it('accepts a complete cafe', () => expect(validateCafeInput(validCafeInput)).toEqual([]));
  it('requires a name', () => expect(validateCafeInput({ ...validCafeInput, name: '' })).toContain('請輸入店名'));
  it('requires an address', () => expect(validateCafeInput({ ...validCafeInput, address: '' })).toContain('請輸入地址'));
  it('rejects latitude over 90', () => expect(validateCafeInput({ ...validCafeInput, lat: 91 })).toContain('緯度需介於 -90 與 90'));
  it('rejects longitude under -180', () => expect(validateCafeInput({ ...validCafeInput, lng: -181 })).toContain('經度需介於 -180 與 180'));
  it('rejects negative wifi speed', () => expect(validateCafeInput({ ...validCafeInput, wifiMbps: -1 })).toContain('WiFi 速度不可為負數'));
  it('rejects quiet scores above five', () => expect(validateCafeInput({ ...validCafeInput, quietScore: 6 })).toContain('安靜度需介於 1 與 5'));
  it('rejects outlet rates above 100', () => expect(validateCafeInput({ ...validCafeInput, outletRate: 101 })).toContain('插座率需介於 0 與 100'));
  it('rejects friendliness below one', () => expect(validateCafeInput({ ...validCafeInput, friendliness: 0 })).toContain('久坐友善度需介於 1 與 5'));
});

describe('review and verification validation', () => {
  it('accepts a useful review', () => expect(validateReviewInput({ author: 'Mina', rating: 5, comment: '插座充足，下午很安靜。' })).toEqual([]));
  it('requires a review author', () => expect(validateReviewInput({ author: '', rating: 5, comment: '很適合工作。' })).toContain('請輸入顯示名稱'));
  it('requires at least six review characters', () => expect(validateReviewInput({ author: 'Mina', rating: 5, comment: '很好' })).toContain('評論至少需要 6 個字'));
  it('rejects ratings outside one to five', () => expect(validateReviewInput({ author: 'Mina', rating: 0, comment: '這是一段有效評論' })).toContain('評分需介於 1 與 5'));
  it('accepts a complete on-site verification', () => expect(validateVerificationInput({ wifiMbps: 88, quietScore: 4, outletRate: 75, friendliness: 5, photoName: 'seat.jpg' })).toEqual([]));
  it('requires a seat photo for verification', () => expect(validateVerificationInput({ wifiMbps: 88, quietScore: 4, outletRate: 75, friendliness: 5, photoName: '' })).toContain('請提供至少一張座位照片'));
  it('rejects impossible verification wifi', () => expect(validateVerificationInput({ wifiMbps: -2, quietScore: 4, outletRate: 75, friendliness: 5, photoName: 'seat.jpg' })).toContain('WiFi 速度不可為負數'));
});

describe('free access and unlocks', () => {
  it('allows the first three cafes in a city for free', () => expect(canAccessCafe(2, null, new Date('2026-07-19'))).toBe(true));
  it('locks the fourth cafe without an unlock', () => expect(canAccessCafe(3, null, new Date('2026-07-19'))).toBe(false));
  it('accepts an unlock whose expiry is in the future', () => expect(isUnlockActive('2026-08-01T00:00:00.000Z', new Date('2026-07-19'))).toBe(true));
  it('rejects an expired unlock', () => expect(isUnlockActive('2026-07-01T00:00:00.000Z', new Date('2026-07-19'))).toBe(false));
  it('allows the fourth cafe with an active unlock', () => expect(canAccessCafe(3, '2026-08-01T00:00:00.000Z', new Date('2026-07-19'))).toBe(true));
});

describe('review aggregation', () => {
  const reviews: Review[] = [
    { id: 'r1', cafeId: 'cafe-a', author: 'A', rating: 5, comment: '很安靜且插座很多', createdAt: '2026-07-18T00:00:00.000Z', visitedAt: '2026-07-17' },
    { id: 'r2', cafeId: 'cafe-a', author: 'B', rating: 3, comment: '下午人潮稍微多了', createdAt: '2026-07-19T00:00:00.000Z', visitedAt: '2026-07-18' },
  ];

  it('returns review count and average', () => expect(aggregateReviews(reviews)).toEqual({ count: 2, average: 4 }));
  it('returns zero aggregation for no reviews', () => expect(aggregateReviews([])).toEqual({ count: 0, average: 0 }));
  it('creates a review associated with a cafe', () => {
    const review = createReview('cafe-a', { author: 'Mina', rating: 4, comment: '網路穩定而且空間舒服', visitedAt: '2026-07-19' }, () => 'id-fixed', new Date('2026-07-19T12:00:00.000Z'));
    expect(review).toMatchObject({ id: 'id-fixed', cafeId: 'cafe-a', rating: 4, author: 'Mina' });
  });

  it('does not mutate existing cafe reviews', () => {
    const before = cafe.reviews.length;
    createReview(cafe.id, { author: 'Mina', rating: 4, comment: '網路穩定而且空間舒服', visitedAt: '2026-07-19' }, () => 'id-fixed', new Date());
    expect(cafe.reviews).toHaveLength(before);
  });
});
