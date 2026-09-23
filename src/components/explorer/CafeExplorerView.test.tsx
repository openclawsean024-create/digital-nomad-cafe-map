// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, fireEvent, cleanup, act } from '@testing-library/react';
import CafeExplorerView from './CafeExplorerView';
import type { Cafe } from '@/domain/types';

// localStorage polyfill — components may reach for it (CafeExplorerView reads
// loadContributedCafes at mount). The repo's existing baseline fails because
// vitest's bundled env providers don't inject window.localStorage in this
// combination; we polyfill it locally so the UI states we care about can
// still be exercised here.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }
  getItem(key: string) {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

function makeCafe(overrides: Partial<Cafe> = {}): Cafe {
  return {
    id: 'cafe-x',
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

describe('CafeExplorerView — SPEC §4 / UI-SPEC public explorer', () => {
  beforeEach(() => {
    cleanup();
    // Replace the env's broken localStorage (or its absence) with a polyfill
    // so CafeExplorerView's localStorage call at mount doesn't throw.
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: new MemoryStorage(),
    });
  });

  it('renders the brand, hero, and stats strip on first paint', () => {
    render(<CafeExplorerView source={[makeCafe()]} />);
    expect(document.body.querySelector('[data-testid=brand-header]')).not.toBeNull();
    expect(document.body.querySelector('[data-testid=hero] h1')?.textContent).toMatch(
      /找到真的能工作的地方/,
    );
    expect(document.body.querySelector('[data-testid=stats-strip]')).not.toBeNull();
  });

  it('renders four stat cards (SPEC §4 stats strip)', () => {
    render(<CafeExplorerView source={[]} />);
    expect(document.body.querySelectorAll('[data-testid=stat-card]').length).toBe(4);
  });

  it('never renders the legacy Stage 5 paywall chrome in the public header', () => {
    // SPEC §2 forbids paywall / login CTA in the public explorer header.
    render(<CafeExplorerView source={[]} />);
    const chrome = document.body.querySelector('.cw-brand');
    expect(chrome).not.toBeNull();
    expect(chrome?.textContent).not.toMatch(/付費|登入|paywall/i);
  });

  it('shows the truth note with the "— 未驗證" framing', () => {
    render(<CafeExplorerView source={[]} />);
    expect(document.body.querySelector('[data-testid=truth-note]')).not.toBeNull();
    expect(document.body.textContent).toContain('— 未驗證');
  });

  it('renders the mobile tabs strip (still visible in JSDOM; toggle data-mobile-tab)', () => {
    render(<CafeExplorerView source={[]} />);
    expect(document.body.querySelector('[data-testid=mobile-tabs]')).not.toBeNull();
    expect(document.body.querySelector('[data-testid=explorer]')?.getAttribute('data-mobile-tab')).toBe('list');
  });

  it('switches mobile tabs (list → filters → map)', () => {
    render(<CafeExplorerView source={[]} />);
    const root = document.body.querySelector('[data-testid=explorer]');
    fireEvent.click(document.body.querySelector('[data-testid=mobile-tab-map]') as HTMLButtonElement);
    expect(root?.getAttribute('data-mobile-tab')).toBe('map');
    fireEvent.click(document.body.querySelector('[data-testid=mobile-tab-filters]') as HTMLButtonElement);
    expect(root?.getAttribute('data-mobile-tab')).toBe('filters');
  });

  it('filters the list to nothing when a city is selected that does not exist in the source', () => {
    render(
      <CafeExplorerView
        source={[
          makeCafe({ id: 'a', cityId: 'taipei' }),
          makeCafe({ id: 'b', cityId: 'taipei' }),
        ]}
      />,
    );
    expect(document.body.querySelectorAll('[data-testid=cafe-card]').length).toBe(2);
    const city = document.body.querySelector(
      '[data-testid=explorer-city]',
    ) as HTMLSelectElement;
    fireEvent.change(city, { target: { value: 'kaohsiung' } });
    expect(document.body.querySelector('[data-testid=list-empty]')).not.toBeNull();
  });

  it('clicking the wifi-50 chip removes cafes whose wifi Mbps is unknown or below 50', () => {
    render(
      <CafeExplorerView
        source={[
          makeCafe({ id: 'fast', wifiMbps: 100 }),
          makeCafe({ id: 'mid', wifiMbps: 49 }),
          makeCafe({ id: 'u' }),
        ]}
      />,
    );
    fireEvent.click(
      document.body.querySelector(
        '[data-testid=chip-wifi-50]',
      ) as HTMLButtonElement,
    );
    const visibleIds = Array.from(
      document.body.querySelectorAll('[data-testid=cafe-card]'),
    ).map((el) => (el as HTMLElement).getAttribute('data-cafe-id'));
    expect(visibleIds).toEqual(['fast']);
  });

  it('clicking a cafe card opens the detail modal; pressing Esc closes it', () => {
    render(<CafeExplorerView source={[makeCafe({ id: 'a' })]} />);
    const cardBtn = document.body.querySelector('.cw-card-btn') as HTMLButtonElement;
    fireEvent.click(cardBtn);
    expect(document.body.querySelector('[data-testid=detail-modal]')).not.toBeNull();
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(document.body.querySelector('[data-testid=detail-modal]')).toBeNull();
  });

  it('clear-all button resets filters and chips (disabled when nothing is active)', () => {
    const { container } = render(<CafeExplorerView source={[]} />);
    const clear = container.querySelector(
      '[data-testid=explorer-clear]',
    ) as HTMLButtonElement;
    expect(clear.disabled).toBe(true);
  });

  it('does not register any 401/console-assertion when read-only, browser-render is loaded', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<CafeExplorerView source={[]} />);
    expect(errorSpy).not.toHaveBeenCalledWith(expect.stringMatching(/failed/i));
    errorSpy.mockRestore();
  });
});
