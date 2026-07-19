import { describe, expect, it } from 'vitest';
import { addCityReminder, buildAdminStats, mergeCafeCollections, upsertCafeReview } from '@/domain/cafes';
import type { Cafe, Review } from '@/domain/types';

const makeCafe = (id: string, cityId = 'taipei'): Cafe => ({
  id, name: `Cafe ${id}`, address: `${id} Road`, cityId, cityName: cityId, country: '台灣', countryCode: 'TW',
  lat: 25, lng: 121, wifiMbps: 60, quietScore: 4, outletRate: 70, priceMedian: 150, friendliness: 4,
  verifierCount: 2, status: 'active', hours: '09:00–18:00', tags: [], reviews: [],
  createdAt: '2026-07-01T00:00:00.000Z', lastVerifiedAt: '2026-07-18T00:00:00.000Z',
});

describe('local-first repository behavior', () => {
  it('adds contributed cafes after seed cafes', () => {
    expect(mergeCafeCollections([makeCafe('seed')], [makeCafe('new')]).map((cafe) => cafe.id)).toEqual(['seed', 'new']);
  });

  it('lets a contributed cafe replace a seed record with the same id', () => {
    const updated = { ...makeCafe('same'), name: 'Updated' };
    expect(mergeCafeCollections([makeCafe('same')], [updated])).toEqual([updated]);
  });

  it('upserts a review without mutating the source cafe', () => {
    const source = makeCafe('one');
    const review: Review = { id: 'r1', cafeId: 'one', author: 'A', rating: 5, comment: '非常適合整天工作', visitedAt: '2026-07-19', createdAt: '2026-07-19T12:00:00.000Z' };
    const result = upsertCafeReview([source], review);
    expect(result[0].reviews).toHaveLength(1);
    expect(source.reviews).toHaveLength(0);
  });

  it('does not add a review to another cafe', () => {
    const review: Review = { id: 'r1', cafeId: 'other', author: 'A', rating: 5, comment: '非常適合整天工作', visitedAt: '2026-07-19', createdAt: '2026-07-19T12:00:00.000Z' };
    expect(upsertCafeReview([makeCafe('one')], review)[0].reviews).toHaveLength(0);
  });
});

describe('reminders and admin statistics', () => {
  it('adds a city reminder', () => expect(addCityReminder([], 'taipei')).toEqual(['taipei']));
  it('does not duplicate a reminder', () => expect(addCityReminder(['taipei'], 'taipei')).toEqual(['taipei']));
  it('limits reminders to three cities', () => expect(addCityReminder(['taipei', 'tainan', 'taichung'], 'hualien')).toEqual(['taipei', 'tainan', 'taichung']));
  it('calculates active cafe, review, and verification totals', () => {
    const cafes = [{ ...makeCafe('one'), verifierCount: 3 }, { ...makeCafe('two'), verifierCount: 4, reviews: [{ id: 'r1', cafeId: 'two', author: 'A', rating: 5, comment: '很適合工作一整天', visitedAt: '2026-07-18', createdAt: '2026-07-18T00:00:00.000Z' }] }];
    expect(buildAdminStats(cafes)).toMatchObject({ activeCafes: 2, reviews: 1, verifications: 7 });
  });
});
