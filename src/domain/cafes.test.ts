import { describe, expect, it } from 'vitest';
import {
  calculateWorkScore,
  filterAndSortCafes,
  formatRelativeDate,
  median,
} from '@/domain/cafes';
import type { Cafe, CafeFilters } from '@/domain/types';

const baseCafe: Cafe = {
  id: 'cafe-1',
  name: 'Paper Plane Coffee',
  address: '12 Test Lane',
  cityId: 'taipei',
  cityName: '台北',
  country: '台灣',
  countryCode: 'TW',
  lat: 25.04,
  lng: 121.55,
  wifiMbps: 80,
  quietScore: 4,
  outletRate: 75,
  priceMedian: 160,
  friendliness: 4.5,
  verifierCount: 3,
  status: 'active',
  hours: '08:00–19:00',
  tags: ['不限時', '自然光'],
  reviews: [],
  createdAt: '2026-07-01T00:00:00.000Z',
  lastVerifiedAt: '2026-07-18T00:00:00.000Z',
};

const defaultFilters: CafeFilters = {
  cityId: 'all',
  query: '',
  minWifi: 0,
  minQuiet: 0,
  minOutlets: 0,
  sortBy: 'workScore',
};

describe('calculateWorkScore', () => {
  it('returns 100 for ideal work conditions', () => {
    expect(calculateWorkScore({ ...baseCafe, wifiMbps: 100, quietScore: 5, outletRate: 100, priceMedian: 80, friendliness: 5 })).toBe(100);
  });

  it('returns 0 for the lowest possible conditions', () => {
    expect(calculateWorkScore({ ...baseCafe, wifiMbps: 0, quietScore: 0, outletRate: 0, priceMedian: 400, friendliness: 0 })).toBe(0);
  });

  it('caps wifi contribution at 30 points', () => {
    const a = calculateWorkScore({ ...baseCafe, wifiMbps: 100 });
    const b = calculateWorkScore({ ...baseCafe, wifiMbps: 900 });
    expect(a).toBe(b);
  });

  it('weights quietness at 30 percent', () => {
    const low = calculateWorkScore({ ...baseCafe, quietScore: 0 });
    const high = calculateWorkScore({ ...baseCafe, quietScore: 5 });
    expect(high - low).toBe(30);
  });

  it('weights outlet availability at 20 percent', () => {
    const low = calculateWorkScore({ ...baseCafe, outletRate: 0 });
    const high = calculateWorkScore({ ...baseCafe, outletRate: 100 });
    expect(high - low).toBe(20);
  });

  it('weights friendliness at 10 percent', () => {
    const low = calculateWorkScore({ ...baseCafe, friendliness: 0 });
    const high = calculateWorkScore({ ...baseCafe, friendliness: 5 });
    expect(high - low).toBe(10);
  });

  it('rewards a lower median price', () => {
    expect(calculateWorkScore({ ...baseCafe, priceMedian: 100 })).toBeGreaterThan(calculateWorkScore({ ...baseCafe, priceMedian: 300 }));
  });

  it('rounds the result to a whole number', () => {
    expect(Number.isInteger(calculateWorkScore(baseCafe))).toBe(true);
  });
});

describe('filterAndSortCafes', () => {
  const cafes: Cafe[] = [
    baseCafe,
    { ...baseCafe, id: 'cafe-2', name: 'Quiet Corner', cityId: 'tainan', cityName: '台南', wifiMbps: 55, quietScore: 4.9, outletRate: 95, verifierCount: 8 },
    { ...baseCafe, id: 'cafe-3', name: 'Fast Network Lab', address: '1 Zhongxiao Road', wifiMbps: 180, quietScore: 2.5, outletRate: 40, verifierCount: 12 },
    { ...baseCafe, id: 'cafe-4', name: 'Closed House', status: 'closed' },
  ];

  it('excludes closed cafes', () => {
    expect(filterAndSortCafes(cafes, defaultFilters).map((cafe) => cafe.id)).not.toContain('cafe-4');
  });

  it('filters by city', () => {
    expect(filterAndSortCafes(cafes, { ...defaultFilters, cityId: 'tainan' })).toHaveLength(1);
  });

  it('searches cafe names case-insensitively', () => {
    expect(filterAndSortCafes(cafes, { ...defaultFilters, query: 'quiet' })[0]?.id).toBe('cafe-2');
  });

  it('searches addresses', () => {
    expect(filterAndSortCafes(cafes, { ...defaultFilters, query: 'zhongxiao' })[0]?.id).toBe('cafe-3');
  });

  it('filters minimum wifi speed', () => {
    expect(filterAndSortCafes(cafes, { ...defaultFilters, minWifi: 100 }).map((cafe) => cafe.id)).toEqual(['cafe-3']);
  });

  it('filters minimum quiet score', () => {
    expect(filterAndSortCafes(cafes, { ...defaultFilters, minQuiet: 4.5 }).map((cafe) => cafe.id)).toEqual(['cafe-2']);
  });

  it('filters minimum outlet rate', () => {
    expect(filterAndSortCafes(cafes, { ...defaultFilters, minOutlets: 90 }).map((cafe) => cafe.id)).toEqual(['cafe-2']);
  });

  it('sorts by work score descending', () => {
    const result = filterAndSortCafes(cafes, defaultFilters);
    expect(calculateWorkScore(result[0])).toBeGreaterThanOrEqual(calculateWorkScore(result[1]));
  });

  it('sorts by wifi speed descending', () => {
    expect(filterAndSortCafes(cafes, { ...defaultFilters, sortBy: 'wifi' })[0]?.id).toBe('cafe-3');
  });

  it('sorts by verifier count descending', () => {
    expect(filterAndSortCafes(cafes, { ...defaultFilters, sortBy: 'verified' })[0]?.id).toBe('cafe-3');
  });

  it('returns an empty result when no cafe matches', () => {
    expect(filterAndSortCafes(cafes, { ...defaultFilters, query: 'impossible' })).toEqual([]);
  });
});

describe('small data utilities', () => {
  it('calculates the median of an odd list', () => expect(median([9, 2, 5])).toBe(5));
  it('calculates the median of an even list', () => expect(median([2, 8, 4, 6])).toBe(5));
  it('returns zero for an empty median input', () => expect(median([])).toBe(0));
  it('formats same-day verification as today', () => expect(formatRelativeDate('2026-07-19T08:00:00.000Z', new Date('2026-07-19T12:00:00.000Z'))).toBe('今天驗證'));
  it('formats a recent verification in days', () => expect(formatRelativeDate('2026-07-16T08:00:00.000Z', new Date('2026-07-19T12:00:00.000Z'))).toBe('3 天前驗證'));
});
