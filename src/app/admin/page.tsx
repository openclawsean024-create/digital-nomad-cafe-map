'use client';

import { JSX, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { isFounder, readFounderEmailFromEnv } from '@/lib/founder-auth';
import AdminDashboard from '@/components/AdminDashboard';

function AdminPageInner(): JSX.Element {
  const searchParams = useSearchParams();
  const founderEnv = readFounderEmailFromEnv();
  const check = isFounder({
    query: searchParams,
    envEmail: founderEnv,
  });
  const isFounderAllowed = check.isFounder;

  if (!isFounderAllowed) {
    return (
      <main className="admin-shell admin-locked" data-testid="admin-locked">
        <header>
          <p className="section-kicker">SPEC §15.13 — Pilot tooling</p>
          <h1>Founder-only access · 僅限 founder</h1>
        </header>
        <p>
          這頁是 founder-only pilot metrics 儀表板：用來追蹤 email capture、
          reach、verified cafes、paywall conversions 等 pilot 指標。目前
          <code>?founder=1</code> 沒帶、env 也沒設 founder email。
        </p>
        <p>
          開發提示：用 <code>?founder=1</code> 進來，或在 build env 設
          <code>NEXT_PUBLIC_FOUNDER_EMAIL</code>。
        </p>
        <p className="admin-locked-hint">
          Demo URL：<code>/admin?founder=1</code>
        </p>
        <nav className="admin-nav">
          <Link href="/">← Back to map</Link>
          <Link href="/landing">← Landing</Link>
          <Link href="/verify?founder=1">Verify form →</Link>
        </nav>
      </main>
    );
  }

  return (
    <main className="admin-shell" data-testid="admin-unlocked">
      <AdminDashboard />
      <nav className="admin-nav">
        <Link href="/">← Back to map</Link>
        <Link href="/landing">← Landing</Link>
        <Link href="/verify?founder=1">Verify form →</Link>
      </nav>
    </main>
  );
}

export default function AdminPage(): JSX.Element {
  // useSearchParams() requires a Suspense boundary under Next 16 static export.
  return (
    <Suspense fallback={<main className="admin-shell">載入中…</main>}>
      <AdminPageInner />
    </Suspense>
  );
}
