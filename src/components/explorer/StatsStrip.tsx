/**
 * StatsStrip — the "what is this dataset" line above the explorer toolbar.
 *
 * SPEC §4 / UI-SPEC §4 calls for four cards: 已收錄 / 已驗證 / 城市 / 最近更新.
 * Every value must be derivable from the seed + localStorage contributions; we
 * never invent a number. Verifications and contributions are local-only data,
 * so the page remains an honest at-a-glance counter, not a marketing banner.
 */
import type { Cafe, City } from '@/domain/types';
import { evidenceMarker, formatLastVerified } from '@/domain/filter';

interface StatsStripProps {
  cafes: Cafe[];
  cities: City[];
  contributionCount: number;
  /** ISO string of the most recent lastVerifiedAt across all cafes. */
  latestVerificationISO: string | null;
  now?: Date;
}

export function StatsStrip({
  cafes,
  cities,
  contributionCount,
  latestVerificationISO,
  now,
}: StatsStripProps) {
  const verifiedCount = cafes.filter(
    (cafe) => evidenceMarker(cafe).status === 'verified',
  ).length;
  const latestLabel = formatLastVerified(latestVerificationISO, now);

  return (
    <section
      className="cw-stats"
      aria-label="資料總覽"
      data-testid="stats-strip"
    >
      <article className="cw-stat-card" data-testid="stat-card">
        <span className="cw-stat-number">{cafes.length.toLocaleString('zh-TW')}</span>
        <span className="cw-stat-label">已收錄咖啡廳</span>
        <span className="cw-stat-meta">資料來源 OpenStreetMap 公開資料</span>
      </article>
      <article className="cw-stat-card" data-testid="stat-card">
        <span className="cw-stat-number">
          {verifiedCount > 0 ? verifiedCount.toLocaleString('zh-TW') : '—'}
        </span>
        <span className="cw-stat-label">已驗證工作條件</span>
        <span className="cw-stat-meta">全部仍待社群實地驗證</span>
      </article>
      <article className="cw-stat-card" data-testid="stat-card">
        <span className="cw-stat-number">{cities.length}</span>
        <span className="cw-stat-label">涵蓋縣市</span>
        <span className="cw-stat-meta">{cities[0]?.name ?? '—'} － {cities.at(-1)?.name ?? '—'}</span>
      </article>
      <article className="cw-stat-card" data-testid="stat-card">
        <span className="cw-stat-number">{contributionCount.toLocaleString('zh-TW')}</span>
        <span className="cw-stat-label">在地使用者補充</span>
        <span className="cw-stat-meta">僅存於你的瀏覽器，不公開同步</span>
        <span className="cw-stat-foot">{latestLabel}</span>
      </article>
    </section>
  );
}
