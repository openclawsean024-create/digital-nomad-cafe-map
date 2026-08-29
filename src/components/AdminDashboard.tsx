'use client';

import { JSX } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

/**
 * SPEC §15.13 — Admin dashboard, founder-only.
 *
 * Mock-only boundary: per Stage 5 constraints no Supabase/Stripe/Resend
 * credentials are wired. Every metric value renders as `—（unverified）` so
 * the founder knows the dashboard is structural placeholder, not real data.
 *
 * 4 metric cards (emails / reach / cafes / paid) + 1 recharts BarChart
 * mock (4 bars, all height 0). Bar height 0 is intentional: it visually
 * shows "we have no real metrics yet" without fabricating numbers.
 */

export interface AdminMetric {
  key: 'emails' | 'reach' | 'cafes' | 'paid';
  label: string;
  description: string;
}

export const ADMIN_METRICS: ReadonlyArray<AdminMetric> = [
  {
    key: 'emails',
    label: 'emails',
    description: 'Pilot landing page email capture (mock-only, localStorage)',
  },
  {
    key: 'reach',
    label: 'reach',
    description: 'Cumulative unique visitor count (no analytics wired yet)',
  },
  {
    key: 'cafes',
    label: 'cafes',
    description: 'Number of verified cafes in the pilot area',
  },
  {
    key: 'paid',
    label: 'paid',
    description: 'Demo paywall conversions (mock-only entitlement)',
  },
];

// Bar chart mock data — all values intentionally 0 (no fake numbers).
// Domain fixed at [0, 100] so future real values fit in the same scale.
const BAR_DATA = ADMIN_METRICS.map((metric) => ({
  label: metric.label,
  // value 0 is intentional: no fabricated metrics. SPEC §15.13.6 calls
  // out that pilot metrics are unverified until Day 7+ when verifications
  // and email captures land in real storage. The chart renders bars with
  // height 0 to make this explicit.
  value: 0,
}));

export default function AdminDashboard(): JSX.Element {
  return (
    <div className="admin-dashboard" data-testid="admin-dashboard">
      <header className="admin-header">
        <p className="section-kicker">SPEC §15.13 — Pilot metrics</p>
        <h1>Pilot metrics · 儀表板</h1>
        <p className="admin-meta">
          Founder-only view · 全部 metric 數值顯示「—（unverified）」
          placeholder。Bar chart bar height 為 0。所有數據待 Day 7+ 真實驗證
          + email capture 進來後再 render（Stage 5 boundary：no Supabase
          / Stripe / analytics credentials）。
        </p>
      </header>

      <section className="admin-metric-grid" aria-label="Pilot metrics">
        {ADMIN_METRICS.map((metric) => (
          <article
            key={metric.key}
            className="admin-metric-card"
            data-testid="admin-metric-card"
            data-metric={metric.key}
          >
            <p className="admin-metric-label">{metric.label}</p>
            <p className="admin-metric-value">—（unverified）</p>
            <p className="admin-metric-description">{metric.description}</p>
          </article>
        ))}
      </section>

      <section className="admin-chart" aria-label="Pilot metrics chart (mock)">
        <h2>Metrics bar chart (mock)</h2>
        <p className="admin-chart-note">
          Bar height = 0 by design. Recharts 渲染 placeholder，等真實
          verifications / email capture / paywall conversions 進來後再
          render 實際數值。
        </p>
        <div
          className="admin-chart-canvas"
          data-testid="admin-chart-canvas"
          // Fixed dimensions are intentional — ResponsiveContainer needs an
          // explicit parent height in jsdom. On the live site the parent
          // takes the natural width via CSS.
          style={{ width: '100%', height: 260 }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={BAR_DATA}
              margin={{ top: 16, right: 24, left: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#c9c5b8" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fontFamily: 'IBM Plex Mono, monospace' }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }}
              />
              <Tooltip
                formatter={(value) => [`${value}`, 'metric']}
                labelStyle={{ fontFamily: 'IBM Plex Mono, monospace' }}
              />
              <Bar dataKey="value" fill="#b7ef5a" stroke="#171814" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <footer className="admin-footer">
        <p className="admin-footer-note">
          Day 1-7 期間：所有 metric 值保持 placeholder。等 verifications 累積
          + email capture 數量達 50+ 再切換到真實數值（SPEC §15.13.6）。
        </p>
      </footer>
    </div>
  );
}
