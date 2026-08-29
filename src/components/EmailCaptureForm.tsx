'use client';

import { FormEvent, JSX, useState } from 'react';

export const PILOT_EMAILS_KEY = 'deskbound-pilot-emails-v1';

export interface EmailCaptureFormProps {
  onSubmitted?: (email: string) => void;
}

export default function EmailCaptureForm({ onSubmitted }: EmailCaptureFormProps): JSX.Element {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const trimmed = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
      setError('請輸入有效的 email');
      return;
    }
    setError(null);
    // Mock persistence — no Mailchimp / Resend wiring (no credentials per Stage 5 boundary).
    const existing = readStoredEmails();
    const next = [...existing, { email: trimmed, ts: new Date().toISOString() }];
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PILOT_EMAILS_KEY, JSON.stringify(next));
    }
    onSubmitted?.(trimmed);
  }

  return (
    <form className="email-capture-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor="landing-email-input" className="email-capture-label">
        Email（Day 1 launch 通知）
        <input
          id="landing-email-input"
          type="email"
          required
          autoComplete="email"
          placeholder="you@work.cafe"
          aria-label="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <button type="submit" className="button primary email-capture-submit">
        Notify me at launch
      </button>
      {error ? (
        <p role="alert" className="email-capture-error">
          {error}
        </p>
      ) : null}
      <p className="email-capture-note">
        Demo mode — 表單 submit 寫 localStorage，不會寄出（credentials 尚未提供）。
      </p>
    </form>
  );
}

function readStoredEmails(): Array<{ email: string; ts: string }> {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(PILOT_EMAILS_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is { email: string; ts: string } =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as { email?: unknown }).email === 'string' &&
        typeof (entry as { ts?: unknown }).ts === 'string'
    );
  } catch {
    return [];
  }
}