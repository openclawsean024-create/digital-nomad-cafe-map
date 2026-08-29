import { describe, expect, it } from 'vitest';
import {
  buildReminderEmail,
  buildReminderSubject,
  buildReminderHtmlBody,
  buildReminderTextBody,
  type ReminderEmailInput,
} from './email-template';
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

const baseInput: ReminderEmailInput = {
  city: taipei,
  cafeCount: 12,
  frequencyDays: 7,
};

describe('email-template — buildReminderEmail (SPEC §15.13.5 city reminder cron template)', () => {
  it('returns subject + html + text for the given city + cafeCount', () => {
    const result = buildReminderEmail(baseInput);
    expect(result.subject).toMatch(/台北/);
    expect(result.subject).toMatch(/12/);
    expect(result.html).toContain('台北');
    expect(result.html).toContain('12');
    expect(result.text).toContain('台北');
    expect(result.text).toContain('12');
  });

  it('subject includes the frequency hint so the cadence is recognizable to subscribers', () => {
    const result = buildReminderEmail({ ...baseInput, frequencyDays: 14 });
    expect(result.subject).toMatch(/每兩週|每14天|14/);
  });

  it('cafeCount === 0 renders an explicit empty-state placeholder (no fake numbers)', () => {
    const result = buildReminderEmail({ ...baseInput, cafeCount: 0 });
    expect(result.subject).toMatch(/本週新增\s*0\s*間|0\s*間|尚無新增/);
    expect(result.text).toMatch(/本週尚無新增|0 間|empty-state|—/);
  });

  it('non-Taipei city (Tokyo) uses the city name + cafeCount in subject', () => {
    const result = buildReminderEmail({ city: tokyo, cafeCount: 5, frequencyDays: 7 });
    expect(result.subject).toContain('東京');
    expect(result.subject).toContain('5');
    expect(result.html).toContain('東京');
    expect(result.text).toContain('東京');
  });

  it('html contains an unsubscribe link + Resend-mock footer disclaimer', () => {
    const result = buildReminderEmail(baseInput);
    expect(result.html.toLowerCase()).toMatch(/unsubscribe|退訂/);
    expect(result.html.toLowerCase()).toMatch(/resend.*mock|mock.*resend|resend 模擬|mock-only|mock 模式/);
  });

  it('text body is the plain-text twin of html (always present even when html rendered)', () => {
    const result = buildReminderEmail(baseInput);
    expect(typeof result.text).toBe('string');
    expect(result.text.length).toBeGreaterThan(0);
    // text body should NOT contain raw HTML tags
    expect(result.text).not.toMatch(/<\/?[a-z][^>]*>/i);
  });

  it('subject length stays under Resend-style 256-char practical limit', () => {
    const longCity: City = { ...taipei, name: '台北市中正區羅斯福路一段' };
    const result = buildReminderEmail({ city: longCity, cafeCount: 200, frequencyDays: 7 });
    expect(result.subject.length).toBeLessThan(256);
  });

  it('html escapes HTML-significant characters in the city name (no XSS)', () => {
    const xssCity: City = { ...taipei, name: '<script>alert(1)</script>' };
    const result = buildReminderEmail({ city: xssCity, cafeCount: 3, frequencyDays: 7 });
    expect(result.html).not.toContain('<script>alert(1)</script>');
    expect(result.html).toContain('&lt;script&gt;');
  });

  it('always includes the pilot email cadence mention (frequencyDays) in html', () => {
    const r7 = buildReminderEmail({ ...baseInput, frequencyDays: 7 });
    const r14 = buildReminderEmail({ ...baseInput, frequencyDays: 14 });
    expect(r7.html).toMatch(/7/);
    expect(r14.html).toMatch(/14/);
  });
});

describe('email-template — granular subject / html / text builders', () => {
  it('buildReminderSubject produces a stable, non-empty subject line', () => {
    expect(buildReminderSubject(baseInput)).toBeTruthy();
    expect(buildReminderSubject(baseInput)).toContain('台北');
  });

  it('buildReminderHtmlBody contains SPEC §15.13 hero copy + city block + cadence', () => {
    const html = buildReminderHtmlBody(baseInput);
    expect(html).toMatch(/Find a cafe|讓你工作|cafe that lets you work/i);
    expect(html).toContain('台北');
    expect(html).toMatch(/每\s*7\s*天|每週/);
  });

  it('buildReminderTextBody mirrors html in plain text', () => {
    const text = buildReminderTextBody(baseInput);
    expect(text).toContain('台北');
    expect(text).not.toMatch(/<\/?[a-z][^>]*>/i);
  });
});
