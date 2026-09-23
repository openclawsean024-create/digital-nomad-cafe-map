'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Cafe, CafeFilters } from '@/domain/types';
import { applyExplorerFilters, DEFAULT_FILTERS, type QuickChipId } from '@/domain/filter';
import { StatsStrip } from './StatsStrip';
import { ExplorerToolbar } from './ExplorerToolbar';
import { QuickFilters } from './QuickFilters';
import { TruthNote } from './TruthNote';
import { CafeList } from './CafeList';
import { DetailModal } from './DetailModal';
import { MobileTabs, type MobileTab } from './MobileTabs';
import { WorkspaceMap } from './WorkspaceMap';
import { cities, seedCafes } from '@/data/cafes';
import {
  loadContributedCafes,
} from '@/lib/storage';

const SSR_CAP = 200;

export interface CafeExplorerViewProps {
  /** Optional override for tests/storybook; defaults to the OSM seed. */
  source?: Cafe[];
}

/**
 * Public, no-account explorer view (SPEC §4 / UI-SPEC).
 *
 * Stays SSR-friendly: server renders the first SSR_CAP cafes using default
 * filters. Client takes over with full filtering, localStorage contributions,
 * and a MapView that loads only when the JS bundle arrives.
 */
export default function CafeExplorerView({ source }: CafeExplorerViewProps = {}) {
  const [contributions, setContributions] = useState<Cafe[]>([]);
  const [filters, setFilters] = useState<CafeFilters>(DEFAULT_FILTERS);
  const [chip, setChip] = useState<QuickChipId | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>('list');

  useEffect(() => {
    // localStorage is allowed here because we already guard it with
    // typeof window !== 'undefined'. Pure component logic lives in
    // src/domain; the only side-effectful bit is the local contribution
    // count + the latest-verification ISO timestamp.
    if (typeof window === 'undefined') return;
    try {
      const stored = loadContributedCafes();
      setContributions(stored);
    } catch {
      // localStorage unavailable — fall back to seed only.
      setContributions([]);
    }
  }, []);

  const dataset = useMemo<Cafe[]>(
    () => (source ?? [...seedCafes, ...contributions]),
    [source, contributions],
  );

  const filtered = useMemo(
    () => applyExplorerFilters(dataset, filters, chip),
    [dataset, filters, chip],
  );

  const recentVerificationISO = useMemo(() => {
    const stamps = filtered
      .map((cafe) => cafe.lastVerifiedAt)
      .filter((value): value is string => Boolean(value))
      .sort();
    return stamps.at(-1) ?? null;
  }, [filtered]);

  const sortedForMap = filtered;
  const ssrSubset = useMemo(
    () => sortedForMap.slice(0, SSR_CAP),
    [sortedForMap],
  );

  const selectedCafe: Cafe | null = useMemo(() => {
    if (!selectedId) return null;
    return dataset.find((cafe) => cafe.id === selectedId) ?? null;
  }, [dataset, selectedId]);

  const handleSelect = (cafeId: string) => {
    setSelectedId(cafeId);
  };

  const handleCloseModal = () => setSelectedId(null);

  return (
    <main className="cw" data-testid="cafe-explorer-view">
      <header className="cw-brand" data-testid="brand-header">
        <a href="/" className="cw-brand-logo" aria-label="Cafework 首頁">
          Cafework
        </a>
        <nav aria-label="主導覽">
          <a href="#explorer">探索</a>
          <a href="#truth">為什麼這頁不給你滿分</a>
          <a href="/landing" rel="nofollow">
            Pilot
          </a>
        </nav>
      </header>

      <section className="cw-hero" aria-labelledby="hero-title" data-testid="hero">
        <p className="cw-eyebrow">v4 · 公開版 · 免登入</p>
        <h1 id="hero-title">
          找到真的能工作的地方,
          <br />
          而不是被寫得很漂亮的地方
        </h1>
        <p className="cw-hero-note">
          從 OpenStreetMap 的 {seedCafes.length.toLocaleString('zh-TW')} 間咖啡廳出發,
          用 Wi-Fi / 安靜 / 插座 / 友善度等條件交叉比對。
          沒有驗證的資料預設不顯示數字。
        </p>
      </section>

      <StatsStrip
        cafes={dataset}
        cities={cities}
        contributionCount={contributions.length}
        latestVerificationISO={recentVerificationISO}
      />

      <div id="explorer" className="cw-explorer" data-testid="explorer" data-mobile-tab={mobileTab}>
        <ExplorerToolbar
          toolbar={{ ...filters, chipId: chip }}
          cities={cities}
          matchCount={filtered.length}
          totalCount={dataset.length}
          onQueryChange={(value) => setFilters({ ...filters, query: value })}
          onCityChange={(value) => setFilters({ ...filters, cityId: value })}
          onSortChange={(sort) => setFilters({ ...filters, sortBy: sort })}
          onClearAll={() => {
            setFilters(DEFAULT_FILTERS);
            setChip(null);
          }}
        />

        <QuickFilters
          activeChip={chip}
          onToggle={(id) => setChip((current) => (current === id ? null : id))}
        />

        <MobileTabs active={mobileTab} onChange={setMobileTab} />

        <div className="cw-workspace" data-mobile-tab={mobileTab}>
          <section className="cw-workspace-list" aria-label="咖啡廳列表">
            <header className="cw-workspace-list-head">
              <h2>結果 ({filtered.length.toLocaleString('zh-TW')})</h2>
              <p className="cw-workspace-list-hint">
                點選卡片或地圖上的 marker 都可以開啟詳細資料, 細節會在這頁用 dialog 顯示,
                不會被推到外部網址。
              </p>
            </header>
            <CafeList
              cafes={filtered}
              onSelect={handleSelect}
              selectedId={selectedId}
              emptyHint={chip
                ? '這顆快速條件目前沒有任何一間咖啡廳達到門檻, 試著取消勾選或擴大縣市範圍。'
                : '縮小搜尋範圍或清除篩選條件'}
            />
          </section>

          <section className="cw-workspace-map" aria-label="地圖">
            <WorkspaceMap
              cafes={ssrSubset}
              selectedId={selectedId}
              onSelect={handleSelect}
            />
          </section>
        </div>

        <div id="truth">
          <TruthNote />
        </div>

        <p className="cw-server-meta" data-testid="server-meta">
          {/* server-side subset hint; safe HTML */}
          目前頁面渲染前 {SSR_CAP} 間（總計 {dataset.length.toLocaleString('zh-TW')} 間）
        </p>
      </div>

      <DetailModal cafe={selectedCafe} onClose={handleCloseModal} onClosed={handleCloseModal} />
    </main>
  );
}
