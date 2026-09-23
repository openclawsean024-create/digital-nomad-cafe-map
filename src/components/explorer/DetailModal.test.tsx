// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, fireEvent, cleanup, act } from '@testing-library/react';
import type { Cafe } from '@/domain/types';
import { DetailModal } from './DetailModal';

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

describe('DetailModal — SPEC §4 modal close + focus', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders nothing when cafe is null', () => {
    const { container } = render(
      <DetailModal cafe={null} onClose={() => {}} onClosed={() => {}} />,
    );
    expect(container.querySelector('[data-testid=detail-modal]')).toBeNull();
  });

  it('renders the dialog with five metric tiles and a clear local-only callout', () => {
    render(
      <DetailModal cafe={baseCafe()} onClose={() => {}} onClosed={() => {}} />,
    );
    expect(document.body.querySelector('[role=dialog]')).not.toBeNull();
    const tiles = document.body.querySelectorAll('.cw-modal-metrics article');
    expect(tiles.length).toBe(5);
    expect(document.body.textContent).toContain('local-only');
  });

  it('pressing Escape closes the dialog (SPEC §4.6 accessibility)', () => {
    const onClose = vi.fn();
    render(
      <DetailModal cafe={baseCafe()} onClose={onClose} onClosed={() => {}} />,
    );
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('clicking the close button calls onClose + onClosed', () => {
    const onClose = vi.fn();
    const onClosed = vi.fn();
    render(
      <DetailModal cafe={baseCafe()} onClose={onClose} onClosed={onClosed} />,
    );
    const btn = document.body.querySelector(
      '[data-testid=detail-modal-close]',
    ) as HTMLButtonElement;
    fireEvent.click(btn);
    expect(onClose).toHaveBeenCalled();
    expect(onClosed).toHaveBeenCalled();
  });

  it('clicking the backdrop closes the dialog', () => {
    const onClose = vi.fn();
    render(
      <DetailModal cafe={baseCafe()} onClose={onClose} onClosed={() => {}} />,
    );
    const backdrop = document.body.querySelector(
      '[data-testid=detail-modal]',
    ) as HTMLDivElement;
    fireEvent.mouseDown(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it('marks the body as modal open while shown', () => {
    render(
      <DetailModal cafe={baseCafe()} onClose={() => {}} onClosed={() => {}} />,
    );
    expect(document.body.dataset['modalOpen']).toBe('true');
    cleanup();
    expect(document.body.dataset['modalOpen']).toBe('false');
  });
});
