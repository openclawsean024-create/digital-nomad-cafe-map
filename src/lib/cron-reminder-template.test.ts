import { describe, expect, it } from 'vitest';
import {
  generateReminderPayload,
  countNewCafesForCity,
  groupEmailsByCity,
  type CronReminderInput,
  type CronSubscriber,
} from './cron-reminder-template';
import type { City } from '@/domain/types';

const taipei: City = {
  id: 'taipei',
  name: '台北',
  country: 'Taiwan',
  countryCode: 'TW',
  lat: 25.033,
  lng: 121.5654,
  pilot: true,
};

const tokyo: City = {
  id: 'tokyo',
  name: '東京',
  country: 'Japan',
  countryCode: 'JP',
  lat: 35.6762,
  lng: 139.6503,
  pilot: false,
};

const SUBSCRIBERS: CronSubscriber[] = [
  { email: 'a@example.com', cityId: 'taipei', subscribedAt: '2026-08-01T00:00:00.000Z' },
  { email: 'b@example.com', cityId: 'taipei', subscribedAt: '2026-08-02T00:00:00.000Z' },
  { email: 'c@example.com', cityId: 'tokyo', subscribedAt: '2026-08-03T00:00:00.000Z' },
];

const CITIES: City[] = [taipei, tokyo];

describe('cron-reminder-template — generateReminderPayload (SPEC §15.13.4)', () => {
  it('returns a per-city payload array sized by cityIds.length', () => {
    const input: CronReminderInput = {
      subscribers: SUBSCRIBERS,
      cities: CITIES,
      cityIds: ['taipei', 'tokyo'],
      runDate: new Date('2026-08-29T00:00:00.000Z'),
      frequencyDays: 7,
    };
    const result = generateReminderPayload(input);
    expect(result.payloads).toHaveLength(2);
    expect(result.totalSubscribers).toBe(3);
    expect(result.totalEmails).toBe(3); // 2 Taipei + 1 Tokyo
  });

  it('only includes cities whose id is in cityIds (no extra cities leak in)', () => {
    const result = generateReminderPayload({
      subscribers: SUBSCRIBERS,
      cities: CITIES,
      cityIds: ['taipei'],
      runDate: new Date('2026-08-29T00:00:00.000Z'),
      frequencyDays: 7,
    });
    expect(result.payloads).toHaveLength(1);
    expect(result.payloads[0].city.id).toBe('taipei');
    expect(result.payloads[0].recipients).toHaveLength(2);
  });

  it('skips cities that have zero subscribers (no point building an empty email)', () => {
    const result = generateReminderPayload({
      subscribers: [{ email: 'a@example.com', cityId: 'taipei', subscribedAt: '2026-08-01T00:00:00.000Z' }],
      cities: CITIES,
      cityIds: ['taipei', 'tokyo'],
      runDate: new Date('2026-08-29T00:00:00.000Z'),
      frequencyDays: 7,
    });
    expect(result.payloads).toHaveLength(1);
    expect(result.payloads[0].city.id).toBe('taipei');
    // totalEmails counts only cities that actually got a payload
    expect(result.totalEmails).toBe(1);
  });

  it('payload[].email is the same shape Resend.send() expects (subject + html + text + recipients)', () => {
    const result = generateReminderPayload({
      subscribers: SUBSCRIBERS,
      cities: CITIES,
      cityIds: ['taipei'],
      runDate: new Date('2026-08-29T00:00:00.000Z'),
      frequencyDays: 7,
    });
    const payload = result.payloads[0];
    expect(payload.email.subject).toMatch(/台北/);
    // subject carries the period phrase in either form: '本週新增' (when count>0)
    // or '本週尚無新增' (empty-state). Both are valid; the key invariant is
    // the 台北 city name + a period mention.
    expect(payload.email.subject).toMatch(/本週(尚無)?新增/);
    expect(payload.email.html).toContain('台北');
    expect(payload.email.text).toContain('台北');
    expect(payload.recipients).toEqual(['a@example.com', 'b@example.com']);
    expect(payload.cafeCount).toBe(0); // no fake data
    expect(payload.runDate).toBe('2026-08-29T00:00:00.000Z');
  });

  it('empty subscribers → empty payloads (no errors, just structural empty)', () => {
    const result = generateReminderPayload({
      subscribers: [],
      cities: CITIES,
      cityIds: ['taipei', 'tokyo'],
      runDate: new Date('2026-08-29T00:00:00.000Z'),
      frequencyDays: 7,
    });
    expect(result.payloads).toEqual([]);
    expect(result.totalSubscribers).toBe(0);
    expect(result.totalEmails).toBe(0);
  });

  it('empty cityIds → empty payloads (no default cities injected)', () => {
    const result = generateReminderPayload({
      subscribers: SUBSCRIBERS,
      cities: CITIES,
      cityIds: [],
      runDate: new Date('2026-08-29T00:00:00.000Z'),
      frequencyDays: 7,
    });
    expect(result.payloads).toEqual([]);
  });

  it('unknown cityId in subscribers is filtered out (no crash)', () => {
    const result = generateReminderPayload({
      subscribers: [
        { email: 'x@example.com', cityId: 'unknown-city', subscribedAt: '2026-08-01T00:00:00.000Z' },
        { email: 'y@example.com', cityId: 'taipei', subscribedAt: '2026-08-01T00:00:00.000Z' },
      ],
      cities: [taipei],
      cityIds: ['taipei'],
      runDate: new Date('2026-08-29T00:00:00.000Z'),
      frequencyDays: 7,
    });
    expect(result.payloads).toHaveLength(1);
    expect(result.payloads[0].recipients).toEqual(['y@example.com']);
  });
});

describe('cron-reminder-template — helpers', () => {
  it('countNewCafesForCity returns 0 by default (no fake data)', () => {
    expect(countNewCafesForCity({ cityId: 'taipei', sinceIso: '2026-08-22T00:00:00.000Z' })).toBe(0);
  });

  it('groupEmailsByCity buckets subscribers by cityId', () => {
    const grouped = groupEmailsByCity(SUBSCRIBERS);
    expect(grouped.get('taipei')).toEqual(['a@example.com', 'b@example.com']);
    expect(grouped.get('tokyo')).toEqual(['c@example.com']);
  });
});
