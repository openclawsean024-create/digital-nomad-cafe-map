/**
 * SPEC §15.13.4 — city reminder cron template (mock).
 *
 * Pure functions — no DOM, no React, no fetch, no Resend SDK, no I/O.
 *
 * Mock-only boundary: per Stage 5 (credentials not provided), this module
 * is a **payload generator**, not a runner. The output is a structural
 * snapshot — `{ payloads, totalSubscribers, totalEmails, runDate, frequencyDays }`
 * — that the founder (or a future real cron worker) can feed to Resend's
 * `emails.send({ to, subject, html, text })` API in production.
 *
 * The companion browser entry point is `/cron/reminder-dry-run` (founder-only),
 * which renders the same payload as a copy-paste-able JSON blob. The CLI
 * entry point is `npm run cron:dry`, which prints the payload to stdout.
 */

import type { City } from '@/domain/types';
import {
  buildReminderEmail,
  type ReminderEmail,
} from './email-template';

export interface CronSubscriber {
  email: string;
  cityId: string;
  /** ISO timestamp the subscriber signed up (used for analytics, never sent). */
  subscribedAt: string;
}

export interface CronReminderInput {
  /** Every subscriber captured by the /landing email form (mock-only). */
  subscribers: CronSubscriber[];
  /** All known cities (filter against this to skip unknown cityIds). */
  cities: City[];
  /** City IDs the cron job is targeting this run (e.g. ['taipei', 'tokyo']). */
  cityIds: string[];
  /** When this cron run is scheduled for; ISO string in the output. */
  runDate: Date;
  /** Cadence in days (7 = weekly, 14 = bi-weekly). */
  frequencyDays: number;
  /** Optional pre-counted "new cafes since last run" map; default 0 per city. */
  newCafeCounts?: Record<string, number>;
}

export interface CronReminderPayload {
  city: City;
  cafeCount: number;
  runDate: string;
  email: ReminderEmail;
  recipients: string[];
}

export interface CronReminderOutput {
  runDate: string;
  frequencyDays: number;
  totalSubscribers: number;
  totalEmails: number;
  payloads: CronReminderPayload[];
}

/**
 * Group subscribers by cityId, skipping any cityId that isn't in `cities`.
 */
export function groupEmailsByCity(subscribers: CronSubscriber[]): Map<string, string[]> {
  const grouped = new Map<string, string[]>();
  for (const sub of subscribers) {
    if (typeof sub.email !== 'string' || typeof sub.cityId !== 'string') continue;
    const list = grouped.get(sub.cityId) ?? [];
    list.push(sub.email);
    grouped.set(sub.cityId, list);
  }
  return grouped;
}

/**
 * Count of new cafes in a given city since `sinceIso`. Default 0 because we
 * never fabricate real metrics — the founder plugs in real counts from
 * Supabase once it is wired (Day 7+).
 */
export function countNewCafesForCity(_input: {
  cityId: string;
  sinceIso: string;
  nowIso?: string;
}): number {
  return 0;
}

/**
 * Build the full cron output: one payload per requested city that has at
 * least one subscriber. Cities with zero subscribers are skipped — no point
 * building an email nobody receives.
 */
export function generateReminderPayload(input: CronReminderInput): CronReminderOutput {
  const runDateIso = input.runDate.toISOString();
  const grouped = groupEmailsByCity(input.subscribers);
  const cityIndex = new Map(input.cities.map((c) => [c.id, c]));

  const payloads: CronReminderPayload[] = [];
  let totalEmails = 0;

  for (const cityId of input.cityIds) {
    const city = cityIndex.get(cityId);
    if (!city) continue; // unknown city → silently skip (defensive)
    const recipients = grouped.get(cityId) ?? [];
    if (recipients.length === 0) continue; // no subscribers → skip

    const cafeCount = input.newCafeCounts?.[cityId] ?? countNewCafesForCity({
      cityId,
      sinceIso: new Date(input.runDate.getTime() - input.frequencyDays * 86_400_000).toISOString(),
      nowIso: runDateIso,
    });

    payloads.push({
      city,
      cafeCount,
      runDate: runDateIso,
      email: buildReminderEmail({ city, cafeCount, frequencyDays: input.frequencyDays }),
      recipients,
    });
    totalEmails += recipients.length;
  }

  return {
    runDate: runDateIso,
    frequencyDays: input.frequencyDays,
    totalSubscribers: input.subscribers.length,
    totalEmails,
    payloads,
  };
}
