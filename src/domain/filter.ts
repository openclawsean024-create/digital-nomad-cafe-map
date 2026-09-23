import type {
  Cafe,
  CafeFilters,
  CafeMetric,
  EvidenceStatus,
  SortMode,
} from './types';
import {
  calculateWorkScore,
  getEvidenceStatus,
  isKnownMetric,
} from './cafes';

/**
 * Pure filter + formatter helpers for the public explorer (SPEC §4 / UI-SPEC).
 *
 * Lives under src/domain so unit tests run under `environment: 'node'` —
 * importing it from a React component never forces a jsdom upgrade and
 * never collides with the legacy `domain/cafes.test.ts` suite.
 */

export type QuickChipId =
  | 'wifi-50'
  | 'outlet-rich'
  | 'quiet-4'
  | 'no-time-limit';

export interface QuickChip {
  id: QuickChipId;
  label: string;
  /** Human-readable hint shown beside the chip on the page. */
  description: string;
}

export const QUICK_CHIPS: readonly QuickChip[] = [
  {
    id: 'wifi-50',
    label: 'Wi-Fi 50+ Mbps',
    description: '速度足夠長時間視訊或多人連線',
  },
  {
    id: 'outlet-rich',
    label: '插座較多',
    description: '多人實測至少有 60% 座位旁有插座',
  },
  {
    id: 'quiet-4',
    label: '安靜 4+',
    description: '平均環境噪音低於 4/5',
  },
  {
    id: 'no-time-limit',
    label: '不限時',
    description: '註明可久坐、不趕人（社群補充）',
  },
] as const;

export const SORT_OPTIONS: readonly { id: SortMode; label: string; description: string }[] = [
  {
    id: 'workScore',
    label: '工作條件優先',
    description: 'Wi-Fi / 安靜 / 插座 / 友善度 加權,未知值自動墊底',
  },
  {
    id: 'wifi',
    label: 'Wi-Fi 最快',
    description: '依實測 Wi-Fi 速度排序',
  },
  {
    id: 'verified',
    label: '最近更新',
    description: '依最近被驗證或評論時間',
  },
] as const;

/**
 * A fast check on whether a metric should be treated as "unknown" for the
 * chip filters. Centralised so any future threshold chips reuse the same
 * "null/unknown does NOT satisfy the threshold" semantics that SPEC §4.5
 * requires (and that the existing `filterAndSortCafes` already enforces for
 * the sliders).
 */
export function isUnknownBelowThreshold(
  value: CafeMetric,
  threshold: number,
): boolean {
  if (!isKnownMetric(value)) return false;
  return value < threshold;
}

/**
 * Returns the highest-quality chip match. We pick at most one so that the
 * chips remain visually scannable; if no chip matches an unknown/imported
 * cafe the UI still renders it in the list with an "— (未驗證)" badge.
 */
export function quickFilterChipMatches(
  cafe: Cafe,
  chip: QuickChipId,
): boolean {
  switch (chip) {
    case 'wifi-50':
      // Either ≥ 50 Mbps recorded, or has the OSM wifi=yes flag stub.
      // Communities may flag wifi=unknown but OSM says wifi available.
      if (isKnownMetric(cafe.wifiMbps)) return cafe.wifiMbps >= 50;
      return Boolean((cafe as Cafe & { hasWifi?: boolean | null }).hasWifi);
    case 'outlet-rich':
      // ≥ 60% seats with outlets.
      return isKnownMetric(cafe.outletRate) && cafe.outletRate >= 60;
    case 'quiet-4':
      // Avg env noise ≤ 4 / 5 (the metric is "quiet score"; 5 = silent).
      return isKnownMetric(cafe.quietScore) && cafe.quietScore >= 4;
    case 'no-time-limit':
      // No OSM hours info → cannot infer; only matches when community
      // contributed tags explicitly mention "不限時" or hours include
      // "24" — both signals are deliberately conservative.
      if (cafe.hours && /24|不限時|久坐/i.test(cafe.hours)) return true;
      return cafe.tags?.some((t) => /不限時|久坐/i.test(t)) ?? false;
    default:
      return false;
  }
}

/**
 * Apply a chip filter against a cafe. If the cafe's required dimension is
 * "unknown", it does NOT match — same semantics as the existing
 * `domain/cafes.filterAndSortCafes` for sliders.
 */
export function applyQuickFilter(cafe: Cafe, chip: QuickChipId): boolean {
  return quickFilterChipMatches(cafe, chip);
}

/**
 * Filter a list of cafes by a chip id. Useful for the "apply a chip quickly
 * without touching the rest of the toolbar state" gesture the UI-SPEC
 * mockup shows below the toolbar.
 */
export function applyQuickFilters(
  cafes: Cafe[],
  chip: QuickChipId | null,
): Cafe[] {
  if (!chip) return cafes;
  return cafes.filter((cafe) => applyQuickFilter(cafe, chip));
}

/**
 * The marker color and outline style for the map. Spec calls for evidence
 * status (imported / partial / verified) — not a score. Returning an object
 * keeps the renderer decoupled from CSS naming.
 */
export interface EvidenceMarker {
  status: EvidenceStatus;
  cssClass: string;
  /** Hex / Tailwind-style ring colour for the Leaflet markerDivIcon. */
  ring: string;
  /** Whether the marker is drawn dashed — true for "imported" only. */
  dashed: boolean;
}

export function evidenceMarker(cafe: Cafe): EvidenceMarker {
  const status = getEvidenceStatus(cafe);
  switch (status) {
    case 'verified':
      return {
        status,
        cssClass: 'cafe-marker cafe-marker--verified',
        ring: '#8FA463',
        dashed: false,
      };
    case 'partial':
      return {
        status,
        cssClass: 'cafe-marker cafe-marker--partial',
        ring: '#E6B36A',
        dashed: false,
      };
    case 'stale':
      return {
        status,
        cssClass: 'cafe-marker cafe-marker--stale',
        ring: '#B0848C',
        dashed: true,
      };
    case 'imported':
    default:
      return {
        status,
        cssClass: 'cafe-marker cafe-marker--imported',
        ring: '#A4928B',
        dashed: true,
      };
  }
}

/**
 * Single source of truth for the "display this metric to a user" string.
 * Returns '— 未驗證' for null/unknown (UI-SPEC §4 forbids calling unknown
 * values `0` or any made-up number). Numeric values are clamped to one
 * decimal place for readability.
 */
export function formatMetric(
  value: CafeMetric,
  unit: 'Mbps' | '/5' | '%' | '$',
): string {
  if (!isKnownMetric(value)) return '— 未驗證';
  if (unit === '%') return `${Math.round(value)}%`;
  if (unit === '$') return `$${Math.round(value)}`;
  if (unit === '/5') return `${(Math.round(value * 10) / 10).toFixed(1)}/5`;
  return `${Math.round(value)} Mbps`;
}

/**
 * Convenience for the explorer list / modal: a one-line string for any
 * metric plus its unit, defaulting to 'Mbps' for Wi-Fi.
 */
export function formatMetricLine(value: CafeMetric, unit = 'Mbps'): string {
  return formatMetric(value, unit as 'Mbps');
}

/**
 * Display the work score, or '— 未驗證' if every metric is unknown (which
 * `calculateWorkScore` reports as 0 — see SPEC §4 evidence invariants).
 */
export function formatWorkScore(cafe: Cafe): string {
  const score = calculateWorkScore(cafe);
  if (score === 0) {
    // Distinguish "all metrics unknown" from "partial metrics giving 0
    // by weight coincidence" — partial should still show a number.
    const allUnknown =
      !isKnownMetric(cafe.wifiMbps) &&
      !isKnownMetric(cafe.quietScore) &&
      !isKnownMetric(cafe.outletRate) &&
      !isKnownMetric(cafe.friendliness) &&
      !isKnownMetric(cafe.priceMedian);
    return allUnknown ? '— 未驗證' : `${score}/100`;
  }
  return `${score}/100`;
}

const MILLISECONDS_PER_DAY = 86_400_000;

/**
 * "今天驗證" / "12 天前驗證" / "— 待驗證" — same as formatRelativeDate in
 * src/domain/cafes.ts but returns '— 待驗證' instead of '尚無資料' so the
 * explorer card can consistently display the waiting state. Kept here so
 * we don't have to keep two near-identical formatters.
 */
export function formatLastVerified(value: string | null, now = new Date()): string {
  if (!value) return '— 待驗證';
  const days = Math.max(
    0,
    Math.floor((now.getTime() - new Date(value).getTime()) / MILLISECONDS_PER_DAY),
  );
  return days === 0 ? '今天驗證' : `${days} 天前驗證`;
}

/**
 * Sort cafes by a `SortMode`. Returning a new array (no mutation) keeps
 * callers safe to keep around the original list — required because the
 * data layer already returns a frozen round-robin ordered list.
 *
 * Sort semantics (SPEC §4.5):
 * - workScore: items with score 0 (all-null metrics) sink to the bottom.
 * - wifi: items with unknown Mbps sink to the bottom.
 * - verified: most recently lastVerifiedAt first; ties broken by verifierCount.
 */
export function sortByMode(cafes: Cafe[], sortBy: SortMode): Cafe[] {
  const out = [...cafes];
  out.sort((left, right) => compareByMode(left, right, sortBy));
  return out;
}

function compareByMode(left: Cafe, right: Cafe, sortBy: SortMode): number {
  if (sortBy === 'wifi') {
    const lKnown = isKnownMetric(left.wifiMbps);
    const rKnown = isKnownMetric(right.wifiMbps);
    if (!lKnown && !rKnown) return 0;
    if (!lKnown) return 1;
    if (!rKnown) return -1;
    return right.wifiMbps! - left.wifiMbps!;
  }
  if (sortBy === 'verified') {
    const leftTs = left.lastVerifiedAt ? Date.parse(left.lastVerifiedAt) : 0;
    const rightTs = right.lastVerifiedAt ? Date.parse(right.lastVerifiedAt) : 0;
    if (leftTs !== rightTs) return rightTs - leftTs;
    return right.verifierCount - left.verifierCount;
  }
  // workScore
  const ls = calculateWorkScore(left);
  const rs = calculateWorkScore(right);
  if (ls === 0 && rs === 0) return 0;
  if (ls === 0) return 1;
  if (rs === 0) return -1;
  return rs - ls;
}

/**
 * Apply CafeFilters (the legacy slider shape) plus an optional chip +
 * free-text query. Returns a fresh array. Pure function so React useMemo
 * callers can rely on referential identity across renders.
 */
export function applyExplorerFilters(
  cafes: Cafe[],
  filters: CafeFilters,
  chip: QuickChipId | null,
): Cafe[] {
  const query = filters.query.trim().toLocaleLowerCase();
  const filtered = cafes
    .filter((cafe) => cafe.status !== 'closed')
    .filter((cafe) => filters.cityId === 'all' || cafe.cityId === filters.cityId)
    .filter((cafe) => {
      if (!query) return true;
      const brand = (cafe as Cafe & { brand?: string | null }).brand ?? '';
      const haystack = `${cafe.name} ${cafe.address} ${cafe.cityName} ${brand}`.toLocaleLowerCase();
      return haystack.includes(query);
    })
    .filter((cafe) => {
      if (chip) return applyQuickFilter(cafe, chip);
      if (filters.minWifi === 0) return true;
      return isKnownMetric(cafe.wifiMbps) && cafe.wifiMbps >= filters.minWifi;
    });

  return sortByMode(filtered, filters.sortBy);
}

/**
 * Default public filters — "no thresholds, show everything" per SPEC §4.4.
 */
export const DEFAULT_FILTERS: CafeFilters = {
  cityId: 'all',
  query: '',
  minWifi: 0,
  minQuiet: 0,
  minOutlets: 0,
  sortBy: 'workScore',
};

/**
 * Evidence status badge label for cards / list rows.
 */
export function evidenceLabel(cafe: Cafe): string {
  switch (getEvidenceStatus(cafe)) {
    case 'verified':
      return '已驗證';
    case 'partial':
      return '部分驗證';
    case 'stale':
      return '資料過期';
    case 'imported':
    default:
      return '— 未驗證';
  }
}
