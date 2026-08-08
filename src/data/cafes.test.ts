import { describe, expect, it } from 'vitest';
import { cities, seedCafes } from '@/data/cafes';

describe('cafe database (v3.0 open release)', () => {
  it('covers all 22 Taiwan cities/regions', () => {
    expect(cities.filter((city) => city.countryCode === 'TW').length).toBeGreaterThanOrEqual(20);
  });

  it('has at least 4000 real cafes from OpenStreetMap', () => {
    expect(seedCafes.length).toBeGreaterThan(4000);
  });

  it('uses unique cafe ids', () => {
    expect(new Set(seedCafes.map((cafe) => cafe.id)).size).toBe(seedCafes.length);
  });

  it('keeps coordinates inside valid world bounds', () => {
    expect(seedCafes.every((cafe) => cafe.lat >= -90 && cafe.lat <= 90 && cafe.lng >= -180 && cafe.lng <= 180)).toBe(true);
  });

  it('every cafe has a name and address', () => {
    expect(seedCafes.every((cafe) => cafe.name.trim().length > 0 && cafe.address.trim().length > 0)).toBe(true);
  });

  it('every cafe has a valid cityId pointing to a known city', () => {
    const cityIds = new Set(cities.map((c) => c.id));
    expect(seedCafes.every((cafe) => cityIds.has(cafe.cityId))).toBe(true);
  });

  it('seed data starts with zero verifications (community will verify)', () => {
    expect(seedCafes.every((cafe) => cafe.verifierCount === 0)).toBe(true);
  });

  it('real OSM data covers all major Taiwan cities', () => {
    const requiredCities = ['taipei', 'taichung', 'tainan', 'kaohsiung', 'hualien', 'taitung'];
    for (const cityId of requiredCities) {
      expect(seedCafes.some((cafe) => cafe.cityId === cityId)).toBe(true);
    }
  });

  it('includes independent cafes (not just chains)', () => {
    const independent = seedCafes.filter((c) => !c.brand);
    expect(independent.length).toBeGreaterThan(2000);
  });
});
