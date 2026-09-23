/**
 * MobileTabs — only visible <768px. SPEC §4 / UI-SPEC §4.7 calls for a
 * list-first layout on small screens with a tab strip to switch between
 * "探索 / 篩選 / 地圖". We default to "探索" so the user lands on the
 * list (the card list remains usable when the map fails to load).
 */
export type MobileTab = 'list' | 'filters' | 'map';

interface MobileTabsProps {
  active: MobileTab;
  onChange: (tab: MobileTab) => void;
  listLabel?: string;
  filterLabel?: string;
  mapLabel?: string;
}

export function MobileTabs({
  active,
  onChange,
  listLabel = '探索',
  filterLabel = '篩選',
  mapLabel = '地圖',
}: MobileTabsProps) {
  return (
    <nav className="cw-tabs" aria-label="行動版切換頁籤" data-testid="mobile-tabs">
      <button
        type="button"
        className={`cw-tab${active === 'list' ? ' cw-tab--active' : ''}`}
        aria-pressed={active === 'list'}
        onClick={() => onChange('list')}
        data-testid="mobile-tab-list"
      >
        {listLabel}
      </button>
      <button
        type="button"
        className={`cw-tab${active === 'filters' ? ' cw-tab--active' : ''}`}
        aria-pressed={active === 'filters'}
        onClick={() => onChange('filters')}
        data-testid="mobile-tab-filters"
      >
        {filterLabel}
      </button>
      <button
        type="button"
        className={`cw-tab${active === 'map' ? ' cw-tab--active' : ''}`}
        aria-pressed={active === 'map'}
        onClick={() => onChange('map')}
        data-testid="mobile-tab-map"
      >
        {mapLabel}
      </button>
    </nav>
  );
}
