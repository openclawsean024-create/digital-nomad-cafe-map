import { describe, expect, it } from 'vitest';
import type { Cafe } from './types';
import {
  DEFAULT_FILTERS,
  QUICK_CHIPS,
  applyExplorerFilters,
  applyQuickFilter,
  applyQuickFilters,
  evidenceLabel,
  evidenceMarker,
  formatLastVerified,
  formatMetric,
  formatWorkScore,
  isUnknownBelowThreshold,
  quickFilterChipMatches,
  sortByMode,
} from './filter';

function baseCafe(overrides: Partial<Cafe> = {}): Cafe {
  return {
    id: 'cafe-1',
    name: '測試咖啡',
    address: '台北市信義區測試路 1 號',
    cityId: 'taipei',
    cityName: '台北',
    country: '台灣',
    countryCode: 'TW',
    lat: 25.04,
    lng: 121.56,
    wifiMbps: null,
    quietScore: null,
    outletRate: null,
    priceMedian: null,
    friendliness: null,
    verifierCount: 0,
    status: 'active',
    hours: '08:00-20:00',
    tags: [],
    reviews: [],
    createdAt: '2026-01-01T00:00:00Z',
    lastVerifiedAt: null,
    ...overrides,
  } as Cafe;
}

describe('SPEC §1.4 — nullable metrics stay nullable', () => {
  it('formatMetric returns "— 未驗證" for null / unknown / non-positive values', () => {
    expect(formatMetric(null, 'Mbps')).toBe('— 未驗證');
    expect(formatMetric(0, '%')).toBe('— 未驗證');
    expect(formatMetric(-10, '/5')).toBe('— 未驗證');
  });

  it('formatMetric renders known numbers with their unit', () => {
    expect(formatMetric(50, 'Mbps')).toBe('50 Mbps');
    expect(formatMetric(80, '%')).toBe('80%');
    expect(formatMetric(120, '$')).toBe('$120');
    expect(formatMetric(4.2, '/5')).toBe('4.2/5');
  });

  it('formatWorkScore shows "— 未驗證" when every metric is unknown (no fake score)', () => {
    const cafe = baseCafe();
    expect(formatWorkScore(cafe)).toBe('— 未驗證');
  });

  it('formatWorkScore shows partial scores when at least one metric is known', () => {
    const cafe = baseCafe({ wifiMbps: 50 });
    expect(formatWorkScore(cafe)).toBe('15/100'); // 50/100 * 30 = 15
  });

  it('isUnknownBelowThreshold distinguishes unknown from below-threshold', () => {
    expect(isUnknownBelowThreshold(null, 50)).toBe(false); // unknown -> does not satisfy
    expect(isUnknownBelowThreshold(0, 50)).toBe(false); // 0 is "unknown" (per isKnownMetric), not below
    expect(isUnknownBelowThreshold(20, 50)).toBe(true); // actually below
    expect(isUnknownBelowThreshold(80, 50)).toBe(false); // satisfies
  });
});

describe('SPEC §4.5 — quick chips never let unknown satisfy the threshold', () => {
  it('imported cafe with no metrics fails all numeric chips', () => {
    const cafe = baseCafe();
    expect(applyQuickFilter(cafe, 'wifi-50')).toBe(false);
    expect(applyQuickFilter(cafe, 'outlet-rich')).toBe(false);
    expect(applyQuickFilter(cafe, 'quiet-4')).toBe(false);
  });

  it('wifi 50+ chip only matches when wifi Mbps ≥ 50', () => {
    expect(applyQuickFilter(baseCafe({ wifiMbps: 49 }), 'wifi-50')).toBe(false);
    expect(applyQuickFilter(baseCafe({ wifiMbps: 50 }), 'wifi-50')).toBe(true);
    expect(applyQuickFilter(baseCafe({ wifiMbps: 200 }), 'wifi-50')).toBe(true);
  });

  it('outlet chip relies on outletRate and ignores other dimensions', () => {
    expect(applyQuickFilter(baseCafe({ outletRate: 60 }), 'outlet-rich')).toBe(true);
    expect(applyQuickFilter(baseCafe({ outletRate: 59 }), 'outlet-rich')).toBe(false);
    // brand known wifi unrelated — should NOT pass via other fields
    const fast = baseCafe({ wifiMbps: 200, outletRate: 0 });
    expect(applyQuickFilter(fast, 'outlet-rich')).toBe(false);
  });

  it('quiet-4 chip relies on quietScore', () => {
    expect(applyQuickFilter(baseCafe({ quietScore: 4 }), 'quiet-4')).toBe(true);
    expect(applyQuickFilter(baseCafe({ quietScore: 3.9 }), 'quiet-4')).toBe(false);
    expect(applyQuickFilter(baseCafe({ quietScore: 5 }), 'quiet-4')).toBe(true);
  });

  it('applyQuickFilters preserves the seed list shape', () => {
    const list = [
      baseCafe({ id: 'c1', wifiMbps: 80 }),
      baseCafe({ id: 'c2' }),
      baseCafe({ id: 'c3', wifiMbps: 49 }),
    ];
    expect(applyQuickFilters(list, 'wifi-50').map((c) => c.id)).toEqual(['c1']);
    expect(applyQuickFilters(list, null).map((c) => c.id)).toEqual(['c1', 'c2', 'c3']);
  });

  it('QUICK_CHIPS exposes the four chip ids SPEC §4.5 enumerates', () => {
    const ids = QUICK_CHIPS.map((c) => c.id);
    expect(ids).toEqual(['wifi-50', 'outlet-rich', 'quiet-4', 'no-time-limit']);
  });
});

describe('SPEC §4.5 — no-time-limit chip uses tags + hours text', () => {
  it('returns true only when the cafe text says unlimited / 24 / 久坐', () => {
    expect(applyQuickFilter(baseCafe({ hours: '24 小時營業' }), 'no-time-limit')).toBe(true);
    expect(applyQuickFilter(baseCafe({ tags: ['不限時'] }), 'no-time-limit')).toBe(true);
    expect(applyQuickFilter(baseCafe({ hours: '08:00-22:00' }), 'no-time-limit')).toBe(false);
  });
});

describe('SPEC §1.4 — evidence status badge + marker', () => {
  it('imported: no metrics, no verifiers', () => {
    const cafe = baseCafe();
    expect(evidenceLabel(cafe)).toBe('— 未驗證');
    expect(evidenceMarker(cafe).status).toBe('imported');
    expect(evidenceMarker(cafe).dashed).toBe(true);
  });

  it('partial: at least one known metric but not all five', () => {
    const cafe = baseCafe({ wifiMbps: 40 });
    expect(evidenceLabel(cafe)).toBe('部分驗證');
    expect(evidenceMarker(cafe).status).toBe('partial');
    expect(evidenceMarker(cafe).dashed).toBe(false);
  });

  it('verified: every metric known and ≥1 verifier', () => {
    const cafe = baseCafe({
      wifiMbps: 80,
      quietScore: 4,
      outletRate: 80,
      priceMedian: 150,
      friendliness: 4,
      verifierCount: 1,
    });
    expect(evidenceLabel(cafe)).toBe('已驗證');
    expect(evidenceMarker(cafe).status).toBe('verified');
    expect(evidenceMarker(cafe).dashed).toBe(false);
  });

  it('quickFilterChipMatches agrees with applyQuickFilter (re-export sanity)', () => {
    expect(quickFilterChipMatches(baseCafe({ wifiMbps: 50 }), 'wifi-50')).toBe(true);
    expect(quickFilterChipMatches(baseCafe({ wifiMbps: 10 }), 'wifi-50')).toBe(false);
  });
});

describe('SPEC §4.4 — sort modes', () => {
  it('workScore sort puts all-unknown last (null-floors)', () => {
    const list = [
      baseCafe({ id: 'a', wifiMbps: 100 }), // known
      baseCafe({ id: 'b' }), // all unknown
      baseCafe({ id: 'c', wifiMbps: 60, quietScore: 4 }), // known
    ];
    const sorted = sortByMode(list, 'workScore').map((c) => c.id);
    expect(sorted).toContain('b');
    expect(sorted[sorted.length - 1]).toBe('b');
  });

  it('wifi sort puts unknown Mbps last', () => {
    const list = [
      baseCafe({ id: 'fast', wifiMbps: 200 }),
      baseCafe({ id: 'u' }), // all unknown
      baseCafe({ id: 'mid', wifiMbps: 80 }),
    ];
    const sorted = sortByMode(list, 'wifi').map((c) => c.id);
    expect(sorted).toEqual(['fast', 'mid', 'u']);
  });

  it('verified sort prefers most recently lastVerifiedAt', () => {
    const list = [
      baseCafe({ id: 'old', lastVerifiedAt: '2026-01-01T00:00:00Z' }),
      baseCafe({ id: 'new', lastVerifiedAt: '2026-09-01T00:00:00Z' }),
    ];
    expect(sortByMode(list, 'verified').map((c) => c.id)).toEqual(['new', 'old']);
    expect(sortByMode([list[1], list[0]], 'verified').map((c) => c.id)).toEqual(['new', 'old']);
  });
});

describe('SPEC §4.4 — applyExplorerFilters combines city + query + chip + sort', () => {
  const dataset: Cafe[] = [
    baseCafe({ id: 't1', cityId: 'taipei', name: '光點', wifiMbps: 80 }),
    baseCafe({
      id: 'k1',
      cityId: 'kaohsiung',
      name: '高雄好窩',
      wifiMbps: 30,
      outletRate: 80,
    }),
    baseCafe({ id: 'all-imported' }),
  ];

  it('clears chip filter with null chip', () => {
    const list = applyExplorerFilters(dataset, DEFAULT_FILTERS, null);
    expect(new Set(list.map((c) => c.id))).toEqual(new Set(['t1', 'k1', 'all-imported']));
  });

  it('chips remove cafes that fail the threshold (imported without hasWifi=true is filtered out)', () => {
    // SPEC §4.5: "unknown does NOT pass the threshold". The wifi-50 chip
    // only matches cafes with a recorded Mbps ≥ 50 OR the OSM wifi=yes
    // flag. An imported cafe without wifi metadata is excluded.
    const list = applyExplorerFilters(dataset, DEFAULT_FILTERS, 'wifi-50');
    expect(list.map((c) => c.id)).toEqual(['t1']);
  });

  it('but if an imported cafe carries the OSM wifi=yes flag, it passes the chip', () => {
    const datasetWithHasWifi: Cafe[] = [
      ...dataset,
      baseCafe({ id: 'osm-wifi', hasWifi: true } as Partial<Cafe>),
    ];
    const list = applyExplorerFilters(datasetWithHasWifi, DEFAULT_FILTERS, 'wifi-50');
    expect(new Set(list.map((c) => c.id))).toEqual(new Set(['t1', 'osm-wifi']));
  });

  it('combines city + chip', () => {
    const onlyTaipei = applyExplorerFilters(
      dataset,
      { ...DEFAULT_FILTERS, cityId: 'taipei' },
      'wifi-50',
    );
    expect(onlyTaipei.map((c) => c.id)).toEqual(['t1']);
  });

  it('combines query (case insensitive, multi-language) + sort', () => {
    const list = applyExplorerFilters(
      dataset,
      { ...DEFAULT_FILTERS, query: '光點' },
      null,
    );
    expect(list.map((c) => c.id)).toEqual(['t1']);
  });
});

describe('formatLastVerified', () => {
  const now = new Date('2026-09-21T00:00:00Z');
  it('renders "— 待驗證" for null', () => {
    expect(formatLastVerified(null, now)).toBe('— 待驗證');
  });
  it('renders "今天驗證" for the same day', () => {
    expect(formatLastVerified('2026-09-21T00:00:00Z', now)).toBe('今天驗證');
  });
  it('renders "N 天前驗證" for older timestamps', () => {
    expect(formatLastVerified('2026-09-18T00:00:00Z', now)).toBe('3 天前驗證');
  });
});
