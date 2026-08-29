// @vitest-environment jsdom
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import VerifyPage from './page';
import { VERIFICATIONS_KEY } from '@/components/VerifyForm';

// Stub next/navigation's useSearchParams so we can drive the gating
const mockSearchParams = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams(),
  usePathname: () => '/verify',
}));

function withQuery(value: string | null): URLSearchParams {
  if (value === null) return new URLSearchParams('');
  return new URLSearchParams(value);
}

describe('/verify page (SPEC §15.13 founder-only verification flow)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockSearchParams.mockReset();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => {
    cleanup();
  });

  it('non-founder (no ?founder=1, no env match) sees access denied + the ?founder=1 hint', () => {
    mockSearchParams.mockReturnValue(withQuery(''));
    render(<VerifyPage />);
    expect(screen.getByRole('heading', { name: /founder-only access|僅限 founder/i })).toBeTruthy();
    // Hint mentions the query flag
    expect(screen.getAllByText(/founder=1/i).length).toBeGreaterThanOrEqual(1);
    // No 5-dim form labels should be visible
    expect(screen.queryByLabelText(/WiFi/i)).toBeNull();
  });

  it('?founder=1 query-flag unlocks the verification form (5-dim + speedtest + photo + submit)', () => {
    mockSearchParams.mockReturnValue(withQuery('founder=1'));
    render(<VerifyPage />);
    // No access-denied banner
    expect(screen.queryByRole('heading', { name: /founder-only access|僅限 founder/i })).toBeNull();
    // Speedtest mock visible
    expect(screen.getByRole('button', { name: /run speedtest|開始測速/i })).toBeTruthy();
    // All five 5-dim labels rendered (legend for WiFi + rating groups for the other 4)
    for (const label of ['WiFi', '安靜', '插座', '價格', '友善']) {
      expect(screen.getAllByText(new RegExp(label)).length).toBeGreaterThanOrEqual(1);
    }
    // Photo upload input
    const photo = screen.getByLabelText(/座位照片|photo/i) as HTMLInputElement;
    expect(photo.type).toBe('file');
    expect(photo.accept).toMatch(/image/i);
  });

  it('renders exactly 4 rating groups with 5 options each (1-5); WiFi uses Mbps input not rating', () => {
    mockSearchParams.mockReturnValue(withQuery('founder=1'));
    render(<VerifyPage />);
    const radios = screen.getAllByRole('radio');
    // 4 dims × 5 options = 20 (WiFi is the Mbps input, not a rating group)
    expect(radios.length).toBe(20);
  });

  it('photo input shows selected filename (data URL preview, no real upload)', async () => {
    mockSearchParams.mockReturnValue(withQuery('founder=1'));
    render(<VerifyPage />);
    const file = new File(['fake-image-bytes'], 'cafe-photo.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/座位照片|photo/i) as HTMLInputElement;
    // jsdom does not implement FileList assignment, so stub it
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    fireEvent.change(input);
    await waitFor(() => {
      expect(screen.getAllByText(/cafe-photo\.jpg/).length).toBeGreaterThanOrEqual(1);
    });
    // No fetch was issued (mock-only boundary preserved)
  });

  it('speedtest result populates the WiFi Mbps input', async () => {
    mockSearchParams.mockReturnValue(withQuery('founder=1'));
    render(<VerifyPage />);
    fireEvent.click(screen.getByRole('button', { name: /run speedtest|開始測速/i }));
    // speedtest default 1500ms — waitFor up to 3000ms for the result to appear
    await waitFor(
      () => {
        expect(screen.queryByTestId('speedtest-result')).toBeTruthy();
      },
      { timeout: 3000 }
    );
    // After speedtest completes, WiFi input should be filled (state propagates via parent → form effect)
    const wifi = screen.getByLabelText(/WiFi Mbps/i) as HTMLInputElement;
    await waitFor(
      () => {
        expect(wifi.value).toMatch(/^\d+(\.\d+)?$/);
      },
      { timeout: 3000 }
    );
    const n = Number(wifi.value);
    expect(n).toBeGreaterThanOrEqual(30);
    expect(n).toBeLessThanOrEqual(150);
  });

  it('submit writes a verification payload to localStorage and shows success state', async () => {
    mockSearchParams.mockReturnValue(withQuery('founder=1'));
    render(<VerifyPage />);
    // Run speedtest
    fireEvent.click(screen.getByRole('button', { name: /run speedtest|開始測速/i }));
    await waitFor(
      () => {
        expect(screen.queryByTestId('speedtest-result')).toBeTruthy();
      },
      { timeout: 3000 }
    );
    // Pick rating 3 for every dim (4 rating groups × 5 options = 20 radios)
    const radios = screen.getAllByRole('radio') as HTMLInputElement[];
    for (let g = 0; g < 4; g += 1) {
      fireEvent.click(radios[g * 5 + 2]); // index 2 = value 3
    }
    // Add a photo
    const file = new File(['x'], 'seat.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/座位照片|photo/i) as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    fireEvent.change(input);
    // Submit
    const submitBtn = screen.getByRole('button', { name: /submit|送出|提交/i });
    fireEvent.click(submitBtn);
    await waitFor(
      () => {
        const raw = window.localStorage.getItem(VERIFICATIONS_KEY);
        expect(raw).toBeTruthy();
        const parsed = JSON.parse(raw ?? '[]') as Array<Record<string, unknown>>;
        expect(parsed.length).toBe(1);
        const v = parsed[0];
        expect(v.photoName).toBe('seat.jpg');
        expect(typeof v.wifiMbps).toBe('number');
        expect(typeof v.quietScore).toBe('number');
        expect(typeof v.outletRate).toBe('number');
        expect(typeof v.friendliness).toBe('number');
        expect(typeof v.ts).toBe('string');
      },
      { timeout: 3000 }
    );
    // Success message visible
    expect(screen.getAllByText(/verification saved|驗證已儲存|已送出/i).length).toBeGreaterThanOrEqual(1);
  });
});
