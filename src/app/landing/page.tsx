'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import EmailCaptureForm from '@/components/EmailCaptureForm';
import LandingHero from '@/components/LandingHero';

export default function LandingPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  function handleSubmitted(email: string): void {
    setSubmittedEmail(email);
    // Mock only — no external service called. localStorage write happens inside the form.
    // Log line helps founder verify wiring in DevTools / curl-fetched HTML.
    // eslint-disable-next-line no-console
    console.log('[landing] email captured', { email, ts: new Date().toISOString() });
  }

  return (
    <main className="landing-shell">
      <LandingHero />

      <section className="landing-five-dim" aria-label="5-dim demo">
        <h2>5 維評分 demo</h2>
        <ul>
          <li><strong>WiFi</strong><span>實測下載 Mbps</span></li>
          <li><strong>安靜</strong><span>1–5 噪音/干擾</span></li>
          <li><strong>插座</strong><span>有插座座位比率 %</span></li>
          <li><strong>價格</strong><span>1–5 對久坐友善</span></li>
          <li><strong>友善</strong><span>不限時 + 對工作者態度</span></li>
        </ul>
      </section>

      <section className="landing-capture" aria-label="Email capture">
        <h2>Day 1 launch 通知</h2>
        {submittedEmail ? (
          <p data-testid="landing-thanks" className="landing-thanks">
            感謝訂閱！Day 1 launch 通知會寄到 <strong>{submittedEmail}</strong>。
          </p>
        ) : (
          <EmailCaptureForm onSubmitted={handleSubmitted} />
        )}
      </section>

      <nav className="landing-nav">
        <Link href="/" aria-label="Back to the cafe map">← Back to map</Link>
      </nav>
    </main>
  );
}