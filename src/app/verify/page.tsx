'use client';

import { JSX, Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { isFounder, readFounderEmailFromEnv } from '@/lib/founder-auth';
import SpeedtestMock from '@/components/SpeedtestMock';
import VerifyForm from '@/components/VerifyForm';

function VerifyPageInner(): JSX.Element {
  const searchParams = useSearchParams();
  const founderEnv = readFounderEmailFromEnv();
  const check = isFounder({
    query: searchParams,
    envEmail: founderEnv,
  });
  const isFounderAllowed = check.isFounder;
  const [speedtestMbps, setSpeedtestMbps] = useState<number | null>(null);

  if (!isFounderAllowed) {
    return (
      <main className="verify-shell verify-locked" data-testid="verify-locked">
        <header>
          <p className="section-kicker">SPEC §15.13 — Pilot tooling</p>
          <h1>Founder-only access · 僅限 founder</h1>
        </header>
        <p>
          這頁是 founder-only 驗證工具：用來到店跑 speedtest mock、5 維評分、拍照上傳 schema。
          目前 <code>?founder=1</code> 沒帶、env 也沒設 founder email。
        </p>
        <p>
          開發提示：用 <code>?founder=1</code> 進來，或在 build env 設
          <code>NEXT_PUBLIC_FOUNDER_EMAIL</code>。
        </p>
        <p className="verify-locked-hint">
          Demo URL：<code>/verify?founder=1</code>
        </p>
        <nav className="verify-nav">
          <Link href="/">← Back to map</Link>
          <Link href="/landing">← Landing</Link>
        </nav>
      </main>
    );
  }

  return (
    <main className="verify-shell" data-testid="verify-unlocked">
      <header>
        <p className="section-kicker">SPEC §15.13 — Pilot verification</p>
        <h1>到店驗證 · On-site verification</h1>
        <p className="verify-meta">
          Founder 模式（reason: <strong>{check.reason}</strong>）。
          下方所有欄位都會寫到 localStorage（<code>deskbound-verifications-v1</code>），
          不會呼叫任何外部 service。
        </p>
      </header>

      <section className="verify-section" aria-label="speedtest">
        <h2>Step 1 · WiFi speedtest</h2>
        <SpeedtestMock onResult={setSpeedtestMbps} />
      </section>

      <section className="verify-section" aria-label="verification form">
        <h2>Step 2 · 5 維評分 + 照片</h2>
        <VerifyForm initialWifiMbps={speedtestMbps} />
      </section>

      <nav className="verify-nav">
        <Link href="/">← Back to map</Link>
        <Link href="/admin?founder=1">Admin dashboard →</Link>
      </nav>
    </main>
  );
}

export default function VerifyPage(): JSX.Element {
  // useSearchParams() requires a Suspense boundary under Next 16 static export.
  return (
    <Suspense fallback={<main className="verify-shell">載入中…</main>}>
      <VerifyPageInner />
    </Suspense>
  );
}
