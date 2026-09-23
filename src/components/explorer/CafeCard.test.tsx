// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import type { Cafe } from '@/domain/types';
import { CafeCard } from './CafeCard';

function baseCafe(overrides: Partial<Cafe> = {}): Cafe {
  return {
    id: 'cafe-1',
    name: '光點咖啡',
    address: '台北市信義區市民大道 1 號',
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
    hours: '08:00-22:00',
    tags: [],
    reviews: [],
    createdAt: '2026-01-01T00:00:00Z',
    lastVerifiedAt: null,
    ...overrides,
  } as Cafe;
}

describe('CafeCard — SPEC §1.4 / UI-SPEC §4 evidence invariants', () => {
  beforeEach(() => cleanup());
  afterEach(() => cleanup());

  it('renders "— 未驗證" for every metric when no data is known', () => {
    render(
      <CafeCard cafe={baseCafe()} onSelect={() => {}} isSelected={false} />,
    );
    // 4 metric tiles, each "— 未驗證"
    expect(document.body.textContent).toContain('— 未驗證');
    // Score is "— 未驗證" because all five metrics are null
    expect(document.body.querySelector('[data-testid=work-score]')?.textContent).toBe(
      '— 未驗證',
    );
  });

  it('renders a numeric score when at least one metric is known', () => {
    render(
      <CafeCard
        cafe={baseCafe({ wifiMbps: 50 })}
        onSelect={() => {}}
        isSelected={false}
      />,
    );
    const score = document.body.querySelector('[data-testid=work-score]')?.textContent;
    expect(score).toMatch(/\/100$/);
  });

  it('shows the imported evidence status badge with the dashed visual', () => {
    const { container } = render(
      <CafeCard cafe={baseCafe()} onSelect={() => {}} isSelected={false} />,
    );
    const pill = container.querySelector('.cw-evidence-pill--imported');
    expect(pill).not.toBeNull();
    expect(document.body.textContent).toContain('未驗證');
  });

  it('shows the verified evidence status when every metric known + verifier ≥ 1', () => {
    render(
      <CafeCard
        cafe={baseCafe({
          wifiMbps: 80,
          quietScore: 4,
          outletRate: 80,
          priceMedian: 150,
          friendliness: 4,
          verifierCount: 1,
        })}
        onSelect={() => {}}
        isSelected={false}
      />,
    );
    expect(document.body.querySelector('.cw-evidence-pill--verified')).not.toBeNull();
    expect(document.body.textContent).toContain('已驗證');
  });

  it('calls onSelect with the cafe id when the card button is pressed', () => {
    const onSelect = vi.fn();
    render(
      <CafeCard cafe={baseCafe({ id: 'cafe-99' })} onSelect={onSelect} isSelected={false} />,
    );
    const btn = document.body.querySelector('.cw-card-btn') as HTMLButtonElement;
    fireEvent.click(btn);
    expect(onSelect).toHaveBeenCalledWith('cafe-99');
    cleanup();
  });
});
