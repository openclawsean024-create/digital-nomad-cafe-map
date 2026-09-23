import type { City, SortMode } from '@/domain/types';
import { SORT_OPTIONS } from '@/domain/filter';

export interface ToolbarState {
  query: string;
  cityId: string;
  sortBy: SortMode;
  chipId: string | null;
}

interface ExplorerToolbarProps {
  toolbar: ToolbarState;
  cities: City[];
  /** Number of cafes currently visible after filters. */
  matchCount: number;
  /** Total cafes available before filtering. */
  totalCount: number;
  onQueryChange: (value: string) => void;
  onCityChange: (cityId: string) => void;
  onSortChange: (sort: SortMode) => void;
  onClearAll: () => void;
}

export function ExplorerToolbar({
  toolbar,
  cities,
  matchCount,
  totalCount,
  onQueryChange,
  onCityChange,
  onSortChange,
  onClearAll,
}: ExplorerToolbarProps) {
  const activeCount = (toolbar.query ? 1 : 0) +
    (toolbar.cityId !== 'all' ? 1 : 0) +
    (toolbar.sortBy !== 'workScore' ? 1 : 0) +
    (toolbar.chipId ? 1 : 0);

  return (
    <section className="cw-toolbar" aria-label="搜尋與篩選" data-testid="toolbar">
      <div className="cw-toolbar-row cw-toolbar-row--primary">
        <label className="cw-search">
          <span className="cw-search-label">搜尋店名、地址、品牌</span>
          <input
            type="search"
            value={toolbar.query}
            placeholder="例如：不限時、台北車站、星巴克"
            onInput={(event) =>
              onQueryChange((event.target as HTMLInputElement).value)
            }
            onChange={(event) =>
              onQueryChange((event.target as HTMLInputElement).value)
            }
            aria-label="搜尋店名、地址或品牌"
            data-testid="explorer-search"
          />
        </label>

        <label className="cw-select">
          <span className="cw-select-label">縣市</span>
          <select
            value={toolbar.cityId}
            onChange={(event) => onCityChange(event.target.value)}
            aria-label="選擇縣市"
            data-testid="explorer-city"
          >
            <option value="all">全部縣市</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </label>

        <label className="cw-select">
          <span className="cw-select-label">排序</span>
          <select
            value={toolbar.sortBy}
            onChange={(event) => onSortChange(event.target.value as SortMode)}
            aria-label="選擇排序"
            data-testid="explorer-sort"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="cw-btn cw-btn--ghost"
          onClick={onClearAll}
          disabled={activeCount === 0}
          data-testid="explorer-clear"
        >
          清除條件 ({activeCount})
        </button>
      </div>

      <div className="cw-toolbar-row cw-toolbar-row--meta" data-testid="toolbar-result">
        <span>
          顯示 <strong>{matchCount.toLocaleString('zh-TW')}</strong> / {totalCount.toLocaleString('zh-TW')} 間
        </span>
        <span className="cw-toolbar-hint">
          {SORT_OPTIONS.find((option) => option.id === toolbar.sortBy)?.description}
        </span>
      </div>
    </section>
  );
}
