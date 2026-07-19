import { describe, expect, it } from 'vitest';
import { cities, seedCafes } from '@/data/cafes';

describe('pilot cafe database', () => {
  it('contains at least six Taiwan pilot cities', () => {
    expect(cities.filter((city) => city.countryCode === 'TW').length).toBeGreaterThanOrEqual(6);
  });

  it('contains exactly eight seed cafes for every Taiwan pilot city', () => {
    const taiwanCities = cities.filter((city) => city.countryCode === 'TW');
    for (const city of taiwanCities) {
      expect(seedCafes.filter((cafe) => cafe.cityId === city.id)).toHaveLength(8);
    }
  });

  it('contains global discovery cities outside Taiwan', () => {
    expect(cities.some((city) => city.countryCode !== 'TW')).toBe(true);
  });

  it('uses unique cafe ids', () => {
    expect(new Set(seedCafes.map((cafe) => cafe.id)).size).toBe(seedCafes.length);
  });

  it('keeps coordinates inside valid world bounds', () => {
    expect(seedCafes.every((cafe) => cafe.lat >= -90 && cafe.lat <= 90 && cafe.lng >= -180 && cafe.lng <= 180)).toBe(true);
  });

  it('keeps all scores inside domain ranges', () => {
    expect(seedCafes.every((cafe) => cafe.quietScore >= 1 && cafe.quietScore <= 5 && cafe.outletRate >= 0 && cafe.outletRate <= 100 && cafe.friendliness >= 1 && cafe.friendliness <= 5)).toBe(true);
  });

  it('ships initial user commentary for social proof', () => {
    expect(seedCafes.some((cafe) => cafe.reviews.length > 0)).toBe(true);
  });

  it('marks seed data as needing continued community verification', () => {
    expect(seedCafes.every((cafe) => cafe.verifierCount >= 1)).toBe(true);
  });
});
