'use client';

import { JSX, Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { isFounder, readFounderEmailFromEnv } from '@/lib/founder-auth';
import { cities } from '@/data/cafes';
import { generateReminderPayload, type CronSubscriber } from '@/lib/cron-reminder-template';
import { PILOT_EMAILS_KEY } from '@/components/EmailCaptureForm';

const REMINDER_DRY_RUN_LOG_KEY = 'deskbound-cron-dry-run-log-v1';

function readSubscribersFromLocalStorage(): CronSubscriber[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(PILOT_EMAILS_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: CronSubscriber[] = [];
    for (const entry of parsed) {
      if (
        entry &&
        typeof entry === 'object' &&
        typeof (entry as { email?: unknown }).email === 'string' &&
        typeof (entry as { ts?: unknown }).ts === 'string'
      ) {
        // The /landing form only captures {email, ts}; default cityId is
        // the pilot city ('taipei'). Future schema can extend this.
        out.push({
          email: (entry as { email: string }).email,
          cityId: 'taipei',
          subscribedAt: (entry as { ts: string }).ts,
        });
      }
    }
    return out;
  } catch {
    return [];
  }
}

function appendDryRunLog(payloadJson: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(REMINDER_DRY_RUN_LOG_KEY);
    const list: string[] = Array.isArray(JSON.parse(raw ?? '[]'))
      ? (JSON.parse(raw ?? '[]') as string[])
      : [];
    list.push(payloadJson);
    // keep last 10 runs only — localStorage is small
    while (list.length > 10) list.shift();
    window.localStorage.setItem(REMINDER_DRY_RUN_LOG_KEY, JSON.stringify(list));
  } catch {
    // best-effort; failure to log should never break the page
  }
}

function buildPreview(subscribers: CronSubscriber[], cityIds: string[], frequencyDays: number) {
  const output = generateReminderPayload({
    subscribers,
    cities,
    cityIds,
    runDate: new Date(),
    frequencyDays,
  });
  return output;
}

function ReminderDryRunPageInner(): JSX.Element {
  const searchParams = useSearchParams();
  const founderEnv = readFounderEmailFromEnv();
  const check = isFounder({ query: searchParams, envEmail: founderEnv });
  const isFounderAllowed = check.isFounder;

  // The page is client-rendered so subscribers from localStorage are visible
  // without needing a server round-trip. Use state to allow re-render on refresh.
  const [refreshKey, setRefreshKey] = useState(0);
  const [cityIds, setCityIds] = useState<string[]>(['taipei']);
  const [frequencyDays, setFrequencyDays] = useState<number>(7);

  const subscribers = useMemo(
    () => (typeof window === 'undefined' ? [] : readSubscribersFromLocalStorage()),
    [refreshKey]
  );

  const preview = useMemo(
    () => buildPreview(subscribers, cityIds, frequencyDays),
    [subscribers, cityIds, frequencyDays, refreshKey]
  );

  const previewJson = useMemo(() => JSON.stringify(preview, null, 2), [preview]);

  function handleRefresh(): void {
    appendDryRunLog(previewJson);
    if (typeof console !== 'undefined') {
      console.log('[cron-dry-run] preview payload:');
      console.log(previewJson);
    }
    setRefreshKey((k) => k + 1);
  }

  function toggleCity(cityId: string): void {
    setCityIds((prev) =>
      prev.includes(cityId) ? prev.filter((c) => c !== cityId) : [...prev, cityId]
    );
  }

  if (!isFounderAllowed) {
    return (
      <main
        className="cron-shell cron-locked"
        data-testid="cron-locked"
      >
        <header>
          <p className="section-kicker">SPEC §15.13 — Pilot tooling</p>
          <h1>Founder-only access · 僅限 founder</h1>
        </header>
        <p>
          這頁是 founder-only cron dry-run：用來產生 SPEC §15.13 city reminder
          的 mock payload（subject + html + text + recipients），讓 founder 在
          真的接 Resend 之前先 preview 內容。目前 <code>?founder=1</code> 沒帶、
          env 也沒設 founder email。
        </p>
        <p>
          開發提示：用 <code>?founder=1</code> 進來，或在 build env 設
          <code>NEXT_PUBLIC_FOUNDER_EMAIL</code>。
        </p>
        <p className="cron-locked-hint">
          Demo URL：<code>/cron/reminder-dry-run?founder=1</code>
        </p>
        <nav className="cron-nav">
          <Link href="/">← Back to map</Link>
          <Link href="/landing">← Landing</Link>
          <Link href="/verify?founder=1">Verify →</Link>
          <Link href="/admin?founder=1">Admin →</Link>
        </nav>
      </main>
    );
  }

  const pilotCityIds = cities.filter((c) => c.pilot).map((c) => c.id);

  return (
    <main className="cron-shell" data-testid="cron-unlocked">
      <header className="cron-header">
        <p className="section-kicker">SPEC §15.13 — City reminder cron · dry-run</p>
        <h1>城市提醒 cron dry-run · 假裝寄出</h1>
        <p className="cron-meta">
          Founder 模式（reason: <strong>{check.reason}</strong>）。這個頁面
          會把目前 localStorage <code>deskbound-pilot-emails-v1</code> 收集到的
          subscriber + 你選擇的城市 + cadence 餵給 <code>generateReminderPayload</code>
          純函式，輸出 Resend-ready payload（subject + html + text + recipients）。
        </p>
        <p className="cron-meta cron-meta--warning" data-testid="cron-mock-disclaimer">
          <strong>Mock-only</strong> · 不會呼叫任何 Resend SDK / fetch / 真實寄出。
          Stage 5 邊界：無 Resend credentials。實際寄送請在 Day 8+ 用 <code>npm run cron:dry</code> +
          手動把 JSON 餵給 dev Resend 帳號。
        </p>
      </header>

      <section className="cron-controls" aria-label="dry-run controls">
        <h2>Dry-run controls</h2>

        <fieldset className="cron-fieldset">
          <legend>目標城市 · Target cities</legend>
          {pilotCityIds.map((id) => {
            const city = cities.find((c) => c.id === id);
            if (!city) return null;
            return (
              <label key={id} className="cron-checkbox">
                <input
                  type="checkbox"
                  checked={cityIds.includes(id)}
                  onChange={() => toggleCity(id)}
                  data-testid={`cron-city-${id}`}
                />
                {city.name}
              </label>
            );
          })}
        </fieldset>

        <label className="cron-field">
          Cadence (days)
          <select
            value={frequencyDays}
            onChange={(e) => setFrequencyDays(Number(e.target.value))}
            data-testid="cron-frequency-select"
          >
            <option value={7}>7 · 每週</option>
            <option value={14}>14 · 每兩週</option>
            <option value={30}>30 · 每月</option>
          </select>
        </label>

        <button
          type="button"
          className="cron-refresh"
          onClick={handleRefresh}
          data-testid="cron-refresh-button"
        >
          重新產生 payload · Re-run dry-run
        </button>
      </section>

      <section className="cron-summary" aria-label="payload summary">
        <h2>Summary</h2>
        <ul>
          <li>runDate: <code>{preview.runDate}</code></li>
          <li>frequencyDays: <code>{preview.frequencyDays}</code></li>
          <li>totalSubscribers (localStorage): <code>{preview.totalSubscribers}</code></li>
          <li>totalEmails (per-city recipients): <code>{preview.totalEmails}</code></li>
          <li>payloads: <code>{preview.payloads.length}</code></li>
        </ul>
      </section>

      <section className="cron-output" aria-label="payload output" data-testid="cron-dry-run-output">
        <h2>Payload preview (Resend-ready JSON)</h2>
        {preview.payloads.length === 0 ? (
          <p className="cron-empty">
            沒有可寄送的 payload。可能原因：localStorage 沒有 subscriber，或
            你選的城市都沒有對應的訂閱者。回 <Link href="/landing">/landing</Link>
            填 email 再回來。
          </p>
        ) : (
          preview.payloads.map((payload) => (
            <article
              key={payload.city.id}
              className="cron-payload"
              data-testid={`cron-payload-${payload.city.id}`}
            >
              <header className="cron-payload-head">
                <p className="cron-payload-city">
                  城市：<strong>{payload.city.name}</strong> · cityId:{' '}
                  <code>{payload.city.id}</code>
                </p>
                <p className="cron-payload-recipients">
                  recipients ({payload.recipients.length})：
                  <code>{payload.recipients.join(', ')}</code>
                </p>
                <p className="cron-payload-count">
                  cafeCount (本週新增): <code>{payload.cafeCount}</code>
                </p>
              </header>
              <label className="cron-field">
                Subject
                <input
                  type="text"
                  readOnly
                  value={payload.email.subject}
                  data-testid={`cron-subject-${payload.city.id}`}
                />
              </label>
              <label className="cron-field">
                Text body
                <textarea
                  readOnly
                  rows={6}
                  defaultValue={payload.email.text}
                  data-testid={`cron-text-${payload.city.id}`}
                />
              </label>
              <details className="cron-html-details">
                <summary>HTML body (preview)</summary>
                <textarea
                  readOnly
                  rows={12}
                  defaultValue={payload.email.html}
                  data-testid={`cron-html-${payload.city.id}`}
                />
              </details>
            </article>
          ))
        )}
      </section>

      <section className="cron-raw" aria-label="raw JSON">
        <h2>Raw JSON (Resend.send ready)</h2>
        <textarea
          readOnly
          rows={14}
          defaultValue={previewJson}
          data-testid="cron-raw-json"
        />
      </section>

      <nav className="cron-nav">
        <Link href="/">← Back to map</Link>
        <Link href="/landing">← Landing</Link>
        <Link href="/verify?founder=1">Verify →</Link>
        <Link href="/admin?founder=1">Admin →</Link>
      </nav>
    </main>
  );
}

export default function ReminderDryRunPage(): JSX.Element {
  // useSearchParams() requires a Suspense boundary under Next 16 static export.
  return (
    <Suspense fallback={<main className="cron-shell">載入中…</main>}>
      <ReminderDryRunPageInner />
    </Suspense>
  );
}
