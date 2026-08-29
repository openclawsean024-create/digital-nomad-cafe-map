/**
 * SPEC §15.13.4 / §15.13.5 — city reminder email template (Resend mock).
 *
 * Pure functions — no DOM, no React, no Resend SDK, no fetch, no I/O.
 * The output is a structural `{ subject, html, text }` envelope that a real
 * Resend client (or a founder running `npm run cron:dry`) can hand to the
 * Resend SDK or paste into a campaign UI.
 *
 * Mock-only boundary: the founder never actually sends these in Stage 5 —
 * the `/cron/reminder-dry-run` page renders the same payload in a browser
 * `<textarea>` so the founder can copy/paste into their dev Resend account
 * manually (or use as a structural smoke test before production wiring).
 *
 * No fabricated data: `cafeCount = 0` renders an explicit empty-state copy
 * ("本週尚無新增咖啡廳") instead of inventing fake numbers. Every city name
 * is HTML-escaped so the function is XSS-safe even if the city name comes
 * from user input.
 */

import type { City } from '@/domain/types';

export interface ReminderEmailInput {
  /** City the reminder is about. Name is HTML-escaped in the html body. */
  city: City;
  /** Number of new cafes added in this period (0 is a valid empty-state value). */
  cafeCount: number;
  /** Cadence hint, in days. 7 = weekly, 14 = bi-weekly, etc. */
  frequencyDays: number;
}

export interface ReminderEmail {
  subject: string;
  html: string;
  text: string;
}

/**
 * Subject line. Includes city name, this week's new-cafe count, and the
 * cadence hint so subscribers can recognize the email at a glance.
 *
 * Subject template (canonical):
 *   "Cafework · 台北 本週新增 12 間咖啡廳（每 7 天）"
 *
 * When `cafeCount === 0` falls back to an explicit empty-state copy:
 *   "Cafework · 台北 本週尚無新增咖啡廳（每 7 天）"
 */
export function buildReminderSubject(input: ReminderEmailInput): string {
  const { city, cafeCount, frequencyDays } = input;
  const headline =
    cafeCount === 0
      ? `本週尚無新增咖啡廳`
      : `本週新增 ${cafeCount} 間咖啡廳`;
  const cadence = cadenceLabel(frequencyDays);
  return `Cafework · ${city.name} ${headline}（${cadence}）`;
}

/**
 * HTML body. Inline-styled for maximum email-client compatibility
 * (Gmail / Outlook strip most <style> tags). Includes SPEC hero copy,
 * city block, cadence block, mock Resend footer, unsubscribe link.
 */
export function buildReminderHtmlBody(input: ReminderEmailInput): string {
  const { city, cafeCount, frequencyDays } = input;
  const safeName = escapeHtml(city.name);
  const cadence = cadenceLabel(frequencyDays);
  const cafeLine =
    cafeCount === 0
      ? `<p style="margin:0 0 12px 0;color:#5a5b54;font-size:14px;line-height:1.55;">本週尚無新增咖啡廳。下次更新：${cadence}。</p>`
      : `<p style="margin:0 0 12px 0;color:#5a5b54;font-size:14px;line-height:1.55;">本週新增 <strong style="color:#171814;">${cafeCount}</strong> 間已驗證的咖啡廳。</p>`;

  return [
    '<div style="max-width:560px;margin:0 auto;padding:24px 20px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;color:#171814;line-height:1.55;">',
    `  <p style="margin:0 0 4px 0;font:600 10px 'IBM Plex Mono',monospace;letter-spacing:.08em;text-transform:uppercase;color:#5a5b54;">SPEC §15.13 · Cafework reminder</p>`,
    `  <h1 style="margin:0 0 12px 0;font-size:24px;letter-spacing:-.02em;line-height:1.25;">Find a cafe that actually lets you work</h1>`,
    `  <p style="margin:0 0 18px 0;color:#5a5b54;font-size:14px;line-height:1.55;">追蹤 ${safeName} 之後，這週的新增如下（每 ${frequencyDays} 天寄一次）。</p>`,
    `  <div style="margin:0 0 18px 0;padding:16px 18px;border:1px solid #c9c5b8;border-radius:8px;background:#f6f3e7;">`,
    `    <p style="margin:0 0 6px 0;font:600 11px 'IBM Plex Mono',monospace;letter-spacing:.06em;text-transform:uppercase;color:#3a6b1f;">城市 · City</p>`,
    `    <p style="margin:0;font-size:18px;font-weight:700;">${safeName}</p>`,
    `  </div>`,
    `  ${cafeLine}`,
    `  <p style="margin:0 0 4px 0;font:600 11px 'IBM Plex Mono',monospace;letter-spacing:.06em;text-transform:uppercase;color:#5a5b54;">更新頻率 · Cadence</p>`,
    `  <p style="margin:0 0 18px 0;font-size:14px;color:#171814;">${cadence}</p>`,
    `  <p style="margin:0 0 8px 0;">`,
    `    <a href="https://digital-nomad-cafe-map.vercel.app/?city=${encodeURIComponent(city.id)}" style="display:inline-block;padding:10px 14px;border:1px solid #171814;border-radius:6px;background:#b7ef5a;color:#171814;font-weight:700;text-decoration:none;">在 Cafework 上看 ${safeName}</a>`,
    `  </p>`,
    `  <hr style="margin:24px 0 16px 0;border:none;border-top:1px solid #c9c5b8;" />`,
    `  <p style="margin:0 0 6px 0;font-size:12px;color:#5a5b54;">Mock-only · Resend 模擬寄出 · 不會真的向您收費或寄送郵件（Stage 5 邊界：無 Resend credentials）</p>`,
    `  <p style="margin:0;font-size:12px;color:#5a5b54;"><a href="https://digital-nomad-cafe-map.vercel.app/landing?unsubscribe=1" style="color:#5a5b54;text-decoration:underline;">Unsubscribe · 退訂</a></p>`,
    `</div>`,
  ].join('\n');
}

/**
 * Plain-text twin of the html body. Resend (and most ESPs) require a `text`
 * version for accessibility / spam-score reasons. We never embed raw HTML
 * tags here.
 */
export function buildReminderTextBody(input: ReminderEmailInput): string {
  const { city, cafeCount, frequencyDays } = input;
  const cadence = cadenceLabel(frequencyDays);
  const cafeLine =
    cafeCount === 0
      ? `本週尚無新增咖啡廳。下次更新：${cadence}。`
      : `本週新增 ${cafeCount} 間已驗證的咖啡廳。`;
  return [
    `Cafework · ${city.name} reminder`,
    ``,
    `Find a cafe that actually lets you work`,
    ``,
    `城市：${city.name}`,
    cafeLine,
    `更新頻率：${cadence}`,
    ``,
    `在 Cafework 上看：https://digital-nomad-cafe-map.vercel.app/?city=${city.id}`,
    ``,
    `---`,
    `Mock-only · Resend 模擬寄出 · 不會真的向您收費或寄送郵件（Stage 5 邊界：無 Resend credentials）`,
    `Unsubscribe / 退訂：https://digital-nomad-cafe-map.vercel.app/landing?unsubscribe=1`,
  ].join('\n');
}

/**
 * Convenience envelope: same shape Resend's `emails.send()` accepts as
 * `{ subject, html, text }`. Caller supplies the recipient list separately.
 */
export function buildReminderEmail(input: ReminderEmailInput): ReminderEmail {
  return {
    subject: buildReminderSubject(input),
    html: buildReminderHtmlBody(input),
    text: buildReminderTextBody(input),
  };
}

// --- internal helpers --------------------------------------------------------

function cadenceLabel(frequencyDays: number): string {
  if (frequencyDays === 7) return '每 7 天 · 每週';
  if (frequencyDays === 14) return '每 14 天 · 每兩週';
  if (frequencyDays === 30) return '每 30 天 · 每月';
  return `每 ${frequencyDays} 天`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
