/**
 * CLI entry point for the city reminder cron dry-run.
 *
 * Usage:
 *   npm run cron:dry                       # dry-run for Taipei
 *   npm run cron:dry -- --city=tokyo       # dry-run for Tokyo
 *   npm run cron:dry -- --city=taipei,tokyo --frequency=14
 *
 * Mock-only boundary: per Stage 5 (no Resend credentials), this CLI prints
 * the generated payload to stdout. The founder can copy/paste the JSON into
 * a dev Resend account or use it as a structural smoke test.
 *
 * NOTE: In a real cron job, `subscribers` would come from a Supabase query
 * against the `pilot_emails` table; here we emit an empty list so the output
 * shape is visible without needing any persisted state.
 */

import { generateReminderPayload, type CronSubscriber } from '@/lib/cron-reminder-template';
import { cities } from '@/data/cafes';

function parseArgs(argv: string[]): { cityIds: string[]; frequencyDays: number } {
  const out = { cityIds: ['taipei'] as string[], frequencyDays: 7 };
  for (const arg of argv) {
    if (arg.startsWith('--city=')) {
      const raw = arg.slice('--city='.length);
      const ids = raw.split(',').map((s) => s.trim()).filter(Boolean);
      if (ids.length > 0) out.cityIds = ids;
    } else if (arg.startsWith('--frequency=')) {
      const n = Number(arg.slice('--frequency='.length));
      if (Number.isFinite(n) && n > 0) out.frequencyDays = n;
    }
  }
  return out;
}

function main(): void {
  const { cityIds, frequencyDays } = parseArgs(process.argv.slice(2));

  // In CLI mode we have no localStorage — use an empty subscriber list so
  // the output shape is still verifiable. (Real cron job reads from Supabase.)
  const subscribers: CronSubscriber[] = [];

  const output = generateReminderPayload({
    subscribers,
    cities,
    cityIds,
    runDate: new Date(),
    frequencyDays,
  });

  console.log('========================================');
  console.log(' Cafework city-reminder cron · dry-run');
  console.log('========================================');
  console.log(`runDate:        ${output.runDate}`);
  console.log(`frequencyDays:  ${output.frequencyDays}`);
  console.log(`cityIds:        ${cityIds.join(', ')}`);
  console.log(`subscribers:    ${output.totalSubscribers} (CLI mock: empty)`);
  console.log(`payloads:       ${output.payloads.length}`);
  console.log(`totalEmails:    ${output.totalEmails}`);
  console.log('');
  console.log('Mock-only: 沒有 Resend 寄出。複製下方 JSON 到 dev Resend 帳號。');
  console.log('');
  console.log(JSON.stringify(output, null, 2));
}

main();
